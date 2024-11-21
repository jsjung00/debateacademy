import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

async function getCEXQuestions(userSpeech, fileDatas) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log("speech", userSpeech);
  console.log("fileDatas", fileDatas);

  //first log the list of files
  const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-8b", //TODO: change to flash
    systemInstruction:
      "You are an expert debater. You thorougly investigate speeches and their relevant evidence and come up cross examination questions designed to pick apart the logical or factual intactness of their claims.",
  });

  const prompt = `Please generate three cross examination questions based on the given speech and additional evidence files relating to the speech. Speech: ${userSpeech}`;

  const fileParts = fileDatas.map((fileData) => ({ fileData }));

  const result = await model.generateContent([{ text: prompt }, ...fileParts]);

  console.log(`Cross examination questions: ${result.response.text()}`);

  return result.response.text();
}

export async function POST(request) {
  try {
    const { userSpeech, fileDatas } = await request.json();
    const response = await getCEXQuestions(userSpeech, fileDatas);

    return NextResponse.json({ crossExaminationText: response });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate CEX questions" },
      { status: 500 }
    );
  }
}
