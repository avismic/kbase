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
Extract important events from this document.

Return ONLY valid JSON.

Format:
[
  {
    "date": "YYYY or date",
    "event": "short event description"
  }
]

If no dates exist, return [].
`,
      },
    ]);

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      timeline: text,
    });
  } catch (error) {
    console.error("Timeline Error:", error);

    return NextResponse.json(
      { error: "Timeline generation failed" },
      { status: 500 }
    );
  }
}