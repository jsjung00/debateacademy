import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

async function getConstructive(userSpeech, fileDatas) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", //TODO: change to flash
    systemInstruction: `Generate a counter Lincoln-Douglas debate speech that systematically challenges the provided speech using well-reasoned logic and supporting evidence. The speech should embody the tone and tactics of a competitive Lincoln-Douglas debater, with the goal of emphasizing sharp reasoning and persuasive articulation.

    You will be given a debate speech, along with relevant pieces of evidence. Your task is to create a counter speech that clearly undermines the arguments in the given speech, employing effective refutations based on logical reasoning as well as details from the supplied evidence. The response should roughly mirror the length of the original speech, maintaining balance while presenting strong counterpoints.
    
    # Steps
    
    1. **Understand the Given Speech**: Carefully read through the original debate speech. Identify the core arguments that need to be countered.
    2. **Analyze the Provided Evidence**: Examine the evidence given, identifying any relevant pieces that help refute or weaken the claims in the original speech.
    3. **Construct a Counter Argument**:
        - Create clear, well-reasoned counter-arguments targeting the key points from the original speech.
        - Make direct use of the provided evidence, incorporating specific facts or statements to negate or weaken the speaker's arguments.
        - Adopt an assertive and competitive tone, in line with the style of a skilled Lincoln-Douglas debater.
    4. **Focus on Sound Reasoning**: Build logical chains that explain why each argument of your opponent is incorrect, irrelevant, exaggerated, or otherwise flawed. Use factual rebuttals where possible.
    5. **Ensure Debate Tone**: Maintain an authoritative and persuasive tone throughout the counter-speech, characteristic of high-level Lincoln-Douglas debate style.
    6. **Match Length Proportionally**: Ensure the counter-speech reflects a length comparable to the original, ideally kept within a range of **5-10 paragraphs**, with the content and depth that corresponds to the original arguments and evidence.
    
    # Output Format
    
    - The output should be a **cohesive counter-speech** in paragraph form.
    - Use complete sentences. The speech should be **5-10 paragraphs**, aligning roughly with the length of the original speech.
    - Use **quotations or specific references** to provided evidence where applicable to solidify your arguments.
    
    # Notes
    
    - **Balance the refutation**: Be sure each counter-argument directly addresses a corresponding point from the original speech—avoid generalizations.
    - **Logical Progression**: Maintain a clear and logical order as you transition from one point to another.
    - **Use Evidence Thoughtfully**: Ensure every use of evidence explicitly links to an argument to strengthen your refutation effectively.
    - **Competitive Delivery**: The speech should reflect a competitive yet respectful debater's approach, emphasizing sharp logic, effective rhetoric, and a confident demeanor.`,
  });

  const prompt = `Please generate a counter speech based on the given speech and additional evidence files relating to the speech. Speech: ${userSpeech}`;

  const fileParts = fileDatas.map((fileData) => ({ fileData }));

  const result = await model.generateContent([{ text: prompt }, ...fileParts]);

  return result.response.text();
}

export async function POST(request) {
  try {
    const { userSpeech, fileDatas } = await request.json();
    const response = await getConstructive(userSpeech, fileDatas);

    return NextResponse.json({ constructiveText: response });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate constructiveText" },
      { status: 500 }
    );
  }
}
