import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

export const maxDuration = 20;

const schema = {
  description: "List of questions",
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      questionName: {
        type: SchemaType.STRING,
        description: "Crossex question",
        nullable: false,
      },
    },
    required: ["questionName"],
  },
};

async function getCEXQuestions(userSpeech, fileDatas) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log("speech", userSpeech);
  console.log("fileDatas", fileDatas);

  //first log the list of files
  const model = genAI.getGenerativeModel({
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
    model: "gemini-1.5-flash", //TODO: change to flash
    systemInstruction: `Generate three cross-examination questions aimed at undermining a user-provided Lincoln Douglas debate speech. The model already has access to relevant evidence blocks for the topic.

    The questions should be concise, carefully designed to challenge the validity or weaknesses in the user's argument, and when possible, should refer to specific evidence blocks as support.
    
    # Steps
    
    1. **Analyze the Debate Speech**: Carefully read and understand the key points made in the user's Lincoln Douglas debate speech. Identify vulnerabilities in reasoning, evidence gaps, or inconsistencies.
    2. **Formulate Questions**: Develop three questions that aim to expose weaknesses in the user's argument or challenge the underlying values. The questions should be framed in a way that will make it difficult for the user to defend against, directly targeting flaws or omissions in the debate.
    3. **Cite Evidence**: Where applicable, include references to relevant evidence blocks to make the questions more powerful and give them credible backing. 
    
    # Examples
    
    **User Input:**  
    [User provides a Lincoln Douglas debate speech on the topic of "Privacy vs. Security"]
    
    **Generated Output:**
    
    {
      "questionName": "How do you reconcile your emphasis on personal privacy with the evidence presented in Block A that clearly demonstrates a correlation between increased surveillance and lower crime rates?",
      "questionName": "You argue for the primacy of individual rights, but doesn't the data in Evidence Block B indicate that prioritizing public safety benefits a greater number of individuals?",
      "questionName": "If we accept your argument for limiting government oversight, how do we address the exponential rise in cyber warfare incidents, as highlighted in Block C?"
    }
    
    # Notes
    
    - The questions should be challenging enough to undermine the user's position while remaining respectful.
    - Each question should directly relate to a point made in the user's speech and utilize available evidence where appropriate.
    - You must tailor each question specifically to the speech's content, ensuring relevance and logical consistency.`,
  });

  const prompt = `Please generate three cross examination questions based on the given speech and attached evidence files relating to the speech. This is the speech: ${userSpeech}`;

  const fileParts = fileDatas.map((fileData) => ({ fileData }));

  const result = await model.generateContent([...fileParts, { text: prompt }]);

  const jsonText = result.response.text();

  console.log(`Cross examination questions: ${jsonText}`);

  return jsonText;
}

export async function POST(request) {
  try {
    const { userSpeech, fileDatas } = await request.json();
    const response = await getCEXQuestions(userSpeech, fileDatas);

    return NextResponse.json({ jsonText: response });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate CEX questions" },
      { status: 500 }
    );
  }
}
