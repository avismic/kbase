"use client"; // This tells Next.js this is a Client Component (interactive)

import { useEffect, useState } from "react";

export default function Home() {
  // These are our "State" variables (memory for the page)
  const [file, setFile] = useState<File | null>(null);
  const [fileUri, setFileUri] = useState<string>("");
  const [mimeType, setMimeType] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [files, setFiles] = useState<
    {
      name: string;
      fileUri: string;
      mimeType: string;
      timelineEvents?: {
        date: string;
        event: string;
      }[];
    }[]
  >([]);
  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedFileUri = localStorage.getItem("fileUri");
    const savedMimeType = localStorage.getItem("mimeType");
    const savedUploadStatus = localStorage.getItem("uploadStatus");
    const savedAnswer = localStorage.getItem("answer");

    if (savedFileUri) setFileUri(savedFileUri);
    if (savedMimeType) setMimeType(savedMimeType);
    if (savedUploadStatus) setUploadStatus(savedUploadStatus);
    if (savedAnswer) setAnswer(savedAnswer);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    localStorage.setItem("fileUri", fileUri);
    localStorage.setItem("mimeType", mimeType);
    localStorage.setItem("uploadStatus", uploadStatus);
    localStorage.setItem("answer", answer);
    localStorage.setItem("files", JSON.stringify(files));
  }, [fileUri, mimeType, uploadStatus, answer, files, isLoaded]);

  useEffect(() => {
    const savedFiles = localStorage.getItem("files");

    if (savedFiles) {
      setFiles(JSON.parse(savedFiles));
    }

    setIsLoaded(true);
  }, []);

  // 1. This function handles the file upload
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setUploadStatus("Uploading to Gemini...");

    // We create a data package to send
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Send to our backend API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const newFile = {
          name: file.name,
          fileUri: data.fileUri,
          mimeType: data.mimeType,
        };

        setFiles((prev) => [...prev, newFile]);

        setFileUri(data.fileUri);
        setMimeType(data.mimeType);
        setUploadStatus("✅ Upload Complete! Gemini has read your file.");
      } else {
        setUploadStatus("❌ Upload Failed.");
      }
    } catch (error) {
      console.error(error);
      setUploadStatus("❌ Error uploading file.");
    }
  };

  // 2. This function handles asking the question
  const handleAsk = async () => {
    if (!question) return;
    if (!fileUri) {
      alert("Please upload a file first so I have context!");
      return;
    }

    setIsThinking(true);
    setAnswer(""); // Clear previous answer

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          files: files,
        }),
      });

      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      setAnswer("Sorry, something went wrong trying to get an answer.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8 flex gap-8">
      {/* LEFT COLUMN: UPLOADER */}
      <div className="w-1/3 bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit">
        <h2 className="text-xl font-bold mb-4 text-blue-400">
          1. Knowledge Base
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Upload a .txt file (Resume, Data, etc.)
        </p>

        {/* File Input */}
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-400 mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Upload to Brain
        </button>

        {/* Status Message */}
        {uploadStatus && (
          <p className="mt-4 text-sm font-mono text-yellow-300">
            {uploadStatus}
          </p>
        )}
        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-300 mb-2">
              Stored Documents
            </h3>

            <div className="space-y-2">
              {files.map((storedFile, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setFileUri(storedFile.fileUri);
                    setMimeType(storedFile.mimeType);
                  }}
                  className="w-full text-left p-2 rounded bg-gray-700 hover:bg-gray-600 text-sm"
                >
                  {storedFile.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: CHAT */}
      <div className="w-2/3 bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col">
        <h2 className="text-xl font-bold mb-4 text-blue-400">
          2. Ask Questions
        </h2>

        {/* Answer Area */}
        <div className="flex-grow bg-gray-900 rounded p-4 mb-4 min-h-[300px] border border-gray-700 overflow-y-auto whitespace-pre-wrap">
          {answer ? (
            <p className="text-gray-200">{answer}</p>
          ) : (
            <p className="text-gray-600 italic">Answers will appear here...</p>
          )}
          {isThinking && (
            <p className="text-blue-400 mt-2 animate-pulse">Thinking...</p>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask something about your file..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-grow p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          />
          <button
            onClick={handleAsk}
            disabled={isThinking || !fileUri}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition disabled:opacity-50"
          >
            Ask
          </button>
        </div>
      </div>
    </main>
  );
}
