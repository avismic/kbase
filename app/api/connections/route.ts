import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(req: Request) {
  try {
    const { files } = await req.json();

    const promptContent: any[] = [];

    for (const file of files || []) {
      promptContent.push({
        fileData: {
          mimeType: file.mimeType,
          fileUri: file.fileUri,
        },
      });
    }

    promptContent.push({
      text: `
Find meaningful relationships between these documents.

Return ONLY valid JSON.

Format:

[
  {
    "fileA": "document name",
    "fileB": "document name",
    "reason": "short explanation"
  }
]

Return at most 5 connections.
`,
    });
    console.log("FILES SENT TO GEMINI:", files.length);
    console.log(promptContent);
    const result = await model.generateContent(promptContent);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      connections: text,
    });
  } catch (error) {
    console.error("Connections Error:", error);

    return NextResponse.json(
      { error: "Failed to find connections" },
      { status: 500 },
    );
  }
}
