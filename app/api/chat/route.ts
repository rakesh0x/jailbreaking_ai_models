import { NextResponse } from "next/server";
import { generateChatReply } from "@/lib/gemini";

type ChatRequest = {
  message?: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const MAX_MESSAGE_LENGTH = 1000;
const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();
  return ip || "unknown-client";
}

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const existing = rateLimitStore.get(clientId);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(clientId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  existing.count += 1;
  rateLimitStore.set(clientId, existing);
  return false;
}

export async function POST(request: Request) {
  try {
    const clientId = getClientIdentifier(request);
    if (isRateLimited(clientId)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait and try again." },
        { status: 429, headers: { "Cache-Control": "no-store" } }
      );
    }

    const body = (await request.json()) as ChatRequest;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "Please provide a message." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: "Message is too long. Please keep it under 1000 characters." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const result = await generateChatReply(message);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const description =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json(
      { error: `Failed to generate response: ${description}` },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
