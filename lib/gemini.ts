import "server-only";
import OpenAI from "openai";
import { systemPrompt } from "./SystemPrompt";

const modelName = "llama-3.3-70b-versatile";

function getClient(): OpenAI {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY environment variable.");
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

export async function generateChatReply(userMessage: string): Promise<string> {
  if (!userMessage.trim()) {
    throw new Error("Message cannot be empty.");
  }

  const client = getClient();

  const response = await client.chat.completions.create({
    model: modelName,
    max_tokens: 1024,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return "I could not generate a response right now.";
  }

  return content.trim();
}