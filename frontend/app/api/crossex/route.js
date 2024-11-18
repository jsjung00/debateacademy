import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";


function getCEXQuestions(query_text) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const uploadResponse = await fileManager.uploadFile()

  return "Hello world";
}

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
