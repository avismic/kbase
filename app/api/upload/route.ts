import { GoogleAIFileManager } from "@google/generative-ai/server";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

// 1. Setup the File Manager with your API Key
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // 2. Get the file from the frontend
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file found" }, { status: 400 });
    }

    // 3. Convert the file to a buffer (computer readable format)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Save it temporarily to a specific temp folder so we can upload it
    // (Next.js requires files to be on disk before uploading to Gemini)
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, file.name);
    fs.writeFileSync(tempFilePath, buffer);

    // 5. Upload to Gemini
    const uploadResponse = await fileManager.uploadFile(tempFilePath, {
      mimeType: file.type || "text/plain",
      displayName: file.name,
    });

    // 6. Clean up: Delete the temp file from your computer
    fs.unlinkSync(tempFilePath);

    // 7. Return the "URI" (The ID/Address of the file on Google's server)
    return NextResponse.json({ 
      success: true, 
      fileUri: uploadResponse.file.uri,
      mimeType: uploadResponse.file.mimeType 
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}