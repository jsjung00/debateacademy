import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

export async function POST(request) {
  try {
    const { query_text } = await request.json();

    const response = getCEXQuestions(query_text);

    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate CEX questions" },
      { status: 500 }
    );
  }
}
