"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { DM_Sans } from "next/font/google";
import styles from "./page.module.css";

const bodyFont = DM_Sans({ subsets: ["latin"] });

type ChatMessage = {
    role: "user" | "assistant";
    content: string;
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
            };

            if (!response.ok) {
                throw new Error(data.error || "Request failed.");
            }

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

                {error ? <p className={styles.errorText}>{error}</p> : null}
            </section>
        </main>
    );
}