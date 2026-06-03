import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 1. Setup the AI Model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(req: Request) {
  try {
    // 2. Get the user's message and the list of file URIs
    const { message, files } = await req.json();

    let promptContent = [];

    // 3. Add all uploaded files to the prompt
    for (const file of files || []) {
      promptContent.push({
        fileData: {
          mimeType: file.mimeType || "text/plain",
          fileUri: file.fileUri,
        },
      });
    }

    // 4. Add the user's text question
    const fileNames = (files || []).map((file: any) => file.name).join(", ");

    promptContent.push({
      text: `
Available documents:
${fileNames}

User Question:
${message}

At the end of your answer, add:

Sources:
- relevant file names used

Only cite files from the available documents list.
`,
    });

    // 5. Generate the answer
    const result = await model.generateContent(promptContent);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ answer: text });
  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json(
      { error: "Failed to generate answer" },
      { status: 500 },
    );
  }
}
