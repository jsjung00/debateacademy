import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { input, speed } = req.query;
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Transfer-Encoding", "chunked");

  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "echo",
    input: input,
    response_format: "mp3",
    speed: speed,
  });

  const readableStream = response.body;
  readableStream.pipe(res);

  response.body.on("end", () => {
    res.end();
  });

  readableStream.on("error", (e) => {
    console.error(e);
    res.status(500).end();
  });
}
