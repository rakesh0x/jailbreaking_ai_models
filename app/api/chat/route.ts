import { NextResponse } from "next/server";
import { generateChatReply } from "@/lib/gemini";

type ChatRequest = {
  message?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Please provide a message." }, { status: 400 });
    }

    const reply = await generateChatReply(message);
    return NextResponse.json({ reply });
  } catch (error) {
    const description =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json(
      { error: `Failed to generate response: ${description}` },
      { status: 500 }
    );
  }
}
