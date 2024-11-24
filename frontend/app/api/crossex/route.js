import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

export const maxDuration = 20;

async function getCEXQuestions(userSpeech, fileDatas) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log("speech", userSpeech);
  console.log("fileDatas", fileDatas);

  //first log the list of files
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", //TODO: change to flash
    systemInstruction: `Generate cross-examination questions for a Lincoln Douglas debate speech using provided evidence.

    Use the provided debate speech and relevant evidence blocks to create three cross-examination questions that effectively challenge the arguments presented. The questions should aim to weaken the core reasoning of the speech, target inconsistencies, highlight weaknesses, or unsettle the speaker's stance. The tone should reflect that of a competitive debate, focusing on strategic clarity and intent.
    
    # Steps
    
    1. **Review Arguments**: Carefully review the main points and key claims in the given debate speech. Identify the central arguments and their supporting evidence.
    2. **Assess Evidence**: Examine the provided evidence blocks and files. Identify anything that conflicts with the speech's claims or undermines the logic presented.
    3. **Formulate Questions**:
       - Craft questions with the goal of exposing weaknesses, contradictions, or logical gaps in the original argument.
       - Ensure each question demands a response that could either reveal a flaw in reasoning or require significant justification from the speaker.
    
    # Output Format
    
    - Each output should include three questions.
    - Use a list format with numbered items for each question.
    - Each question should be phrased as if asked by an experienced competitive debater, using a strategic and concise tone.
    
    # Examples
    
    **Example 1:**
    
    *Speech Summary*: "[Placeholder - Overview of given speech highlighting a stance on economic justice and supporting arguments.]"
    
    *Evidence Supplied*: "[Placeholder - Relevant evidence highlighting inconsistencies of the claim.]"
    
    **Questions**:
    1. Based on the evidence provided, isn't it true that [specific inconsistency from the supplied evidence] directly contradicts your claim that [specific claim related to economic justice]?
    2. How do you reconcile the claim that [argument from speaker] with the data provided in [specific file/evidence block] which suggests [contradictory evidence]?
    3. Considering your emphasis on [main argument or value], why does your reasoning not account for [specific counterpoint derived from evidence]?
    
    **Example 2**:
    
    *Speech Summary*: "[Placeholder – Overview of an argument for universal healthcare based on moral obligations]" 
    
    *Evidence Supplied*: "[Placeholder – Relevant evidence that emphasizes economic burdens of universal healthcare.]"
    
    **Questions**:
    1. Given your position on moral obligations, how would you address the economic evidence suggesting significant financial strain if [specific healthcare policy] is implemented?
    2. If the economic impact is as severe as presented in [specific evidence file], wouldn’t that undermine the feasibility of your moral argument, especially in a struggling economy?
    3. Can you clarify how your model deals with the practical constraints implied in [evidence], specifically regarding funding allocation and sustainability?
    
    # Notes
    
    - Ensure the questions target core parts of the speech.
    - Phrase the questions to require detailed answers, making it difficult for the speaker to provide only superficial responses.
    - Keep the tone and structure consistent with an experienced competitive debate setting.`,
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
