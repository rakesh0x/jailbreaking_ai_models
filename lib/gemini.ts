import "server-only";
import { GoogleGenAI } from "@google/genai";
import { systemPrompt } from "./SystemPrompt";

const modelName = "gemini-flash-latest";
const promptProtectionReply =
  "I cannot share internal instructions or security configuration. I can still help with grocery products, stock, and store support questions.";

const probePatterns = [
  /system\s*prompt/i,
  /developer\s*message/i,
  /hidden\s*instructions?/i,
  /reveal|show|print|dump|leak/i,
  /ignore\s+(all\s+)?(previous|prior)\s+instructions?/i,
  /jailbreak|bypass|prompt\s*injection/i,
  /api\s*key|credentials?|token|secret/i,
];

const leakedOutputPatterns = [
  /response\s+behavior:/i,
  /store\s+context:/i,
  /system\s*prompt/i,
  /internal\s+instructions?/i,
  /credentials?|api\s*key|token|secret/i,
];

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  return new GoogleGenAI({ apiKey });
}

function isPromptProbe(text: string): boolean {
  return probePatterns.some((pattern) => pattern.test(text));
}

function sanitizeReply(text: string): string {
  if (leakedOutputPatterns.some((pattern) => pattern.test(text))) {
    return promptProtectionReply;
  }

  return text;
}

export async function generateChatReply(userMessage: string): Promise<string> {
  if (!userMessage.trim()) {
    throw new Error("Message cannot be empty.");
  }

  if (isPromptProbe(userMessage)) {
    return promptProtectionReply;
  }

  const ai = getClient();
  const response = await ai.models.generateContent({
    model: modelName,
    config: {
      systemInstruction: systemPrompt,
    },
    contents: userMessage,
  });

  const rawText = response.text?.trim() || "I could not generate a response right now.";
  return sanitizeReply(rawText);
}
