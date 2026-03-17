"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { DM_Sans } from "next/font/google";
import styles from "./page.module.css";

const bodyFont = DM_Sans({ subsets: ["latin"] });

type TechniqueId =
    | "role_override"
    | "instruction_override"
    | "prompt_exfiltration"
    | "secret_request"
    | "jailbreak_intent"
    | "encoding_obfuscation"
    | "data_exfiltration"
    | "multi_step_extraction";

type SecurityReport = {
    detectedTechniques: TechniqueId[];
    attemptScore: number;
    leakScore: number;
    confidentialLeakDetected: boolean;
    blockedByPolicy: boolean;
};

type ChatMessage = {
    role: "user" | "assistant";
    content: string;
};

const techniqueLabel: Record<TechniqueId, string> = {
    role_override: "Role override",
    instruction_override: "Instruction override",
    prompt_exfiltration: "Prompt exfiltration",
    secret_request: "Secret request",
    jailbreak_intent: "Jailbreak intent",
    encoding_obfuscation: "Encoding obfuscation",
    data_exfiltration: "Data exfiltration",
    multi_step_extraction: "Multi-step extraction",
};

export default function ChatPage() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: "assistant",
            content:
                "Rakesh Grocery Store. Hello! Ask me about vegetables, fruits, stationery, or current stock details.",
        },
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [securityReport, setSecurityReport] = useState<SecurityReport | null>(null);

    async function sendMessage() {
        setError("");

        if (!message.trim()) {
            setError("Please type a message.");
            return;
        }

        const userText = message.trim();
        setMessage("");
        setMessages((prev) => [...prev, { role: "user", content: userText }]);

        try {
            setLoading(true);
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userText }),
            });

            const data = (await response.json()) as {
                reply?: string;
                error?: string;
                securityReport?: SecurityReport;
            };

            if (!response.ok) {
                throw new Error(data.error || "Request failed.");
            }

            setSecurityReport(data.securityReport ?? null);

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.reply || "No response text returned." },
            ]);
        } catch (submitError) {
            const messageText =
                submitError instanceof Error
                    ? submitError.message
                    : "An unknown error occurred.";
            setError(messageText);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "I ran into an error while generating a reply. Please try again.",
                },
            ]);
            setSecurityReport(null);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await sendMessage();
    }

    async function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            await sendMessage();
        }
    }

    return (
        <main className={`${styles.app} ${bodyFont.className}`}>
            <aside className={styles.sidebar}>
                <button className={styles.newChatButton} type="button">
                    + New chat
                </button>
                <div className={styles.sideSectionLabel}>Recent</div>
                <ul className={styles.chatList}>
                    <li className={styles.chatListItemActive}>Grocery inventory support</li>
                    <li className={styles.chatListItem}>Store assistant prompt test</li>
                </ul>
            </aside>

            <section className={styles.panel}>
                <header className={styles.topBar}>
                    <h1 className={styles.topTitle}>Grocery Assistant</h1>
                    <span className={styles.badge}>Gemini</span>
                </header>

                <div className={styles.thread}>
                    {messages.map((entry, index) => (
                        <article
                            key={`${entry.role}-${index}`}
                            className={
                                entry.role === "user" ? styles.messageUserRow : styles.messageAssistantRow
                            }
                        >
                            <div
                                className={
                                    entry.role === "user" ? styles.userBubble : styles.assistantBubble
                                }
                            >
                                {entry.content}
                            </div>
                        </article>
                    ))}

                    {loading ? (
                        <article className={styles.messageAssistantRow}>
                            <div className={styles.typingBubble}>
                                <span />
                                <span />
                                <span />
                            </div>
                        </article>
                    ) : null}
                </div>

                <form className={styles.composer} onSubmit={handleSubmit}>
                    <textarea
                        rows={1}
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        onKeyDown={handleComposerKeyDown}
                        placeholder="Message Grocery Assistant"
                        className={styles.composerInput}
                    />
                    <button type="submit" disabled={loading} className={styles.sendButton}>
                        {loading ? "..." : "Send"}
                    </button>
                </form>

                {securityReport ? (
                    <section className={styles.securityPanel}>
                        <div className={styles.securityHeader}>Prompt Injection Report</div>
                        <div className={styles.securityGrid}>
                            <div>
                                <span className={styles.metricLabel}>Attempt Score</span>
                                <p className={styles.metricValue}>{securityReport.attemptScore}/100</p>
                            </div>
                            <div>
                                <span className={styles.metricLabel}>Leak Score</span>
                                <p className={styles.metricValue}>{securityReport.leakScore}/100</p>
                            </div>
                            <div>
                                <span className={styles.metricLabel}>Leak Detected</span>
                                <p className={styles.metricValue}>
                                    {securityReport.confidentialLeakDetected ? "Yes" : "No"}
                                </p>
                            </div>
                        </div>

                        <div className={styles.techniquesWrap}>
                            <span className={styles.metricLabel}>Detected Techniques</span>
                            {securityReport.detectedTechniques.length ? (
                                <div className={styles.techniquesList}>
                                    {securityReport.detectedTechniques.map((technique) => (
                                        <span key={technique} className={styles.techniqueBadge}>
                                            {techniqueLabel[technique]}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.noTechniques}>None detected</p>
                            )}
                        </div>
                    </section>
                ) : null}

                {error ? <p className={styles.errorText}>{error}</p> : null}
            </section>
        </main>
    );
}