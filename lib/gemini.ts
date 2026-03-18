import "server-only";
import { GoogleGenAI } from "@google/genai";
import { systemPrompt } from "./SystemPrompt";

const modelName = "gemini-2.5-flash";

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  return new GoogleGenAI({ apiKey });
}

export async function generateChatReply(userMessage: string): Promise<string> {
  if (!userMessage.trim()) {
    throw new Error("Message cannot be empty.");
  }

  const ai = getClient();

  const response = await ai.models.generateContent({
    model: modelName,
    config: {
      systemInstruction: systemPrompt,
    },
    contents: userMessage,
  });

  return response.text?.trim() || "I could not generate a response right now.";
}