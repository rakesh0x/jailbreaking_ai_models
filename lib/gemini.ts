import "server-only";
import { GoogleGenAI } from "@google/genai";
import { systemPrompt } from "./SystemPrompt";
import { confidentialContext } from "./confidentialContext";
import {
  detectConfidentialLeak,
  detectInjectionTechniques,
  scoreAttempt,
  scoreLeak,
  type SecurityReport,
} from "./promptSecurity";

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

function buildPolicyBlockedReport(userMessage: string): SecurityReport {
  const techniques = detectInjectionTechniques(userMessage);
  return {
    detectedTechniques: techniques,
    attemptScore: scoreAttempt(techniques),
    leakScore: 0,
    confidentialLeakDetected: false,
    blockedByPolicy: true,
  };
}

export type ChatGenerationResult = {
  reply: string;
  securityReport: SecurityReport;
};

export async function generateChatReply(userMessage: string): Promise<ChatGenerationResult> {
  if (!userMessage.trim()) {
    throw new Error("Message cannot be empty.");
  }

  if (isPromptProbe(userMessage)) {
    return {
      reply: promptProtectionReply,
      securityReport: buildPolicyBlockedReport(userMessage),
    };
  }

  const techniques = detectInjectionTechniques(userMessage);

  const ai = getClient();
  const response = await ai.models.generateContent({
    model: modelName,
    config: {
      systemInstruction: `${systemPrompt}\n\n${confidentialContext}`,
    },
    contents: userMessage,
  });

  const rawText = response.text?.trim() || "I could not generate a response right now.";
  const confidentialLeakDetected = detectConfidentialLeak(rawText);
  const reply = sanitizeReply(rawText);

  return {
    reply,
    securityReport: {
      detectedTechniques: techniques,
      attemptScore: scoreAttempt(techniques),
      leakScore: scoreLeak(confidentialLeakDetected),
      confidentialLeakDetected,
      blockedByPolicy: confidentialLeakDetected,
    },
  };
}
