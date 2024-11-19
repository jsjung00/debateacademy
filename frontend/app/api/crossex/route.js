import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

async function getCEXQuestions(userSpeech, fileUrls) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-8b", //TODO: change to flash
    systemInstruction:
      "You are an expert debater. You thorougly investigate speeches and their relevant evidence and come up cross examination questions designed to pick apart the logical or factual intactness of their claims.",
  });

  // upload all files to gemini
  const uploadReponses = await Promise.all(
    fileUrls.map((url, index) =>
      fileManager.uploadFile(url, {
        mimeType: "application/pdf",
        displayName: `some_file_${index}`,
      })
    )
  );

  const prompt = `Please generate three cross examination questions based on the given speech and additional evidence files relating to the speech. Speech: ${userSpeech}`;

  const fileParts = uploadReponses.map((response) => {
    const return_part = {
      fileData: {
        mimeType: response.file.mimeType,
        fileUri: response.file.uri,
      },
    };
    return return_part;
  });

  const result = await model.generateContent([{ text: prompt }, ...fileParts]);

  console.log(`Cross examination questions: ${result.response.text()}`);

  return result.response.text;
}

export async function POST(request) {
  try {
    const { userSpeech, fileUrls } = await request.json();

    const response = getCEXQuestions(userSpeech, fileUrls);

    return NextResponse.json({ crossExaminationText: response });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate CEX questions" },
      { status: 500 }
    );
  }
}
