import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(req: Request) {
  try {
    const { fileUri, mimeType } = await req.json();

    const result = await model.generateContent([
      {
        fileData: {
          fileUri,
          mimeType,
        },
      },
      {
        text: `
Analyze this document.

Return ONLY valid JSON.

{
  "summary": "one paragraph summary",
  "entities": [
    "entity1",
    "entity2",
    "entity3",
    "entity4",
    "entity5"
  ]
}
`,
      },
    ]);

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      context: text,
    });
  } catch (error) {
    console.error("Context Error:", error);

    return NextResponse.json(
      { error: "Context generation failed" },
      { status: 500 }
    );
  }
}