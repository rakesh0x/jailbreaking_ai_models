"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { DM_Sans } from "next/font/google";
import styles from "./page.module.css";

const bodyFont = DM_Sans({ subsets: ["latin"] });

type ChatMessage = {
    role: "user" | "assistant";
    content: string;
};

type SemanticClassification = {
    label:
        | "benign"
        | "prompt_exfiltration"
        | "instruction_override"
        | "secret_request"
        | "jailbreak_intent"
        | "data_exfiltration"
        | "unknown";
    confidence: number;
    riskLevel: "low" | "medium" | "high";
    explanation: string;
};

type InjectionScore = {
    totalScore: number;
    maxScore: number;
    percentage: number;
    category: "harmless" | "low" | "moderate" | "high" | "critical";
    breakdown: {
        typeScore: number;
        confidenceBonus: number;
        riskBonus: number;
    };
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
    const [classification, setClassification] = useState<SemanticClassification | null>(null);
    const [injectionScore, setInjectionScore] = useState<InjectionScore | null>(null);

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
                classification?: SemanticClassification;
                injectionScore?: InjectionScore;
            };

            if (!response.ok) {
                throw new Error(data.error || "Request failed.");
            }

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.reply || "No response text returned." },
            ]);
            setClassification(data.classification ?? null);
            setInjectionScore(data.injectionScore ?? null);
        } catch (submitError) {
            const messageText =
                submitError instanceof Error
                    ? submitError.message
                    : "An unknown error occurred.";
            setError(messageText);
            setClassification(null);
            setInjectionScore(null);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "I ran into an error while generating a reply. Please try again.",
                },
            ]);
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

                {classification ? (
                    <section className={styles.securityPanel}>
                        <div className={styles.securityHeader}>Semantic Classifier</div>
                        <div className={styles.securityGrid}>
                            <div>
                                <span className={styles.metricLabel}>Label</span>
                                <p className={styles.metricValue}>{classification.label}</p>
                            </div>
                            <div>
                                <span className={styles.metricLabel}>Risk</span>
                                <p className={styles.metricValue}>{classification.riskLevel}</p>
                            </div>
                            <div>
                                <span className={styles.metricLabel}>Confidence</span>
                                <p className={styles.metricValue}>{classification.confidence}%</p>
                            </div>
                        </div>

                        <div className={styles.techniquesWrap}>
                            <span className={styles.metricLabel}>Explanation</span>
                            <p className={styles.noTechniques}>{classification.explanation}</p>
                        </div>

                        {injectionScore ? (
                            <div className={styles.injectionScoreSection}>
                                <div className={styles.securityHeader} style={{ marginTop: "16px" }}>
                                    Prompt Injection Score
                                </div>
                                <div className={styles.securityGrid}>
                                    <div>
                                        <span className={styles.metricLabel}>Score</span>
                                        <p className={styles.metricValue}>
                                            {injectionScore.totalScore}/{injectionScore.maxScore}
                                        </p>
                                    </div>
                                    <div>
                                        <span className={styles.metricLabel}>Category</span>
                                        <p
                                            className={styles.metricValue}
                                            style={{
                                                color:
                                                    injectionScore.category === "harmless"
                                                        ? "#10b981"
                                                        : injectionScore.category === "low"
                                                          ? "#3b82f6"
                                                          : injectionScore.category === "moderate"
                                                            ? "#f59e0b"
                                                            : injectionScore.category === "high"
                                                              ? "#ef4444"
                                                              : "#7f1d1d",
                                            }}
                                        >
                                            {injectionScore.category}
                                        </p>
                                    </div>
                                    <div>
                                        <span className={styles.metricLabel}>Percentage</span>
                                        <p className={styles.metricValue}>{injectionScore.percentage}%</p>
                                    </div>
                                </div>

                                <div className={styles.techniquesWrap}>
                                    <span className={styles.metricLabel}>Score Breakdown</span>
                                    <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                                        <p>Type Score: {injectionScore.breakdown.typeScore}</p>
                                        <p>Confidence Bonus: +{injectionScore.breakdown.confidenceBonus}</p>
                                        <p>Risk Bonus: +{injectionScore.breakdown.riskBonus}</p>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </section>
                ) : null}

                {error ? <p className={styles.errorText}>{error}</p> : null}
            </section>
        </main>
    );
}