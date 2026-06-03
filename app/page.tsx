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
  const [questionCount, setQuestionCount] = useState(0);
  const [lastUploadTime, setLastUploadTime] = useState<string>("");
  const [selectedTimelineFile, setSelectedTimelineFile] = useState<
    string | null
  >(null);
  const [connections, setConnections] = useState<
    {
      fileA: string;
      fileB: string;
      reason: string;
    }[]
  >([]);
  const [isFindingConnections, setIsFindingConnections] = useState(false);
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
        setLastUploadTime(new Date().toLocaleTimeString());
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
    setQuestionCount((prev) => prev + 1);
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

  const generateTimeline = async (storedFileName: string) => {
    const targetFile = files.find((f) => f.name === storedFileName);

    if (!targetFile) return;

    try {
      const response = await fetch("/api/timeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUri: targetFile.fileUri,
          mimeType: targetFile.mimeType,
        }),
      });

      const data = await response.json();

      console.log("Timeline Response:", data);
    } catch (error) {
      console.error("Timeline generation failed:", error);
    }
  };

  const findConnections = async () => {
    setIsFindingConnections(true);

    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files,
        }),
      });

      const data = await response.json();

      if (!data.connections) {
        console.error("Connections API Error:", data);
        return;
      }

      const cleaned = data.connections
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleaned);

      setConnections(parsed);
      alert(`Found ${parsed.length} connections`);

      console.log(parsed);
    } catch (error) {
      console.error("Connection discovery failed:", error);
    } finally {
      setIsFindingConnections(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="border-b border-gray-800 px-8 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-400">
            Knowledge Platform
          </h1>

          <div className="flex items-center gap-6 text-sm">
            <a href="/" className="text-gray-300 hover:text-white">
              Knowledge Base
            </a>

            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white"
            >
              Low-Code Studio ↗
            </a>
            <button
              onClick={findConnections}
              disabled={isFindingConnections}
              className="text-gray-300 hover:text-white disabled:opacity-50"
            >
              {isFindingConnections ? "Finding..." : "Find Connections"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Documents</p>
            <p className="text-2xl font-bold text-blue-400">{files.length}</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Questions Asked</p>
            <p className="text-2xl font-bold text-green-400">{questionCount}</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Timeline Events</p>
            <p className="text-2xl font-bold text-purple-400">
              {files.reduce(
                (total, file) => total + (file.timelineEvents?.length || 0),
                0,
              )}
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Last Upload</p>
            <p className="text-sm font-semibold text-yellow-400">
              {lastUploadTime || "—"}
            </p>
          </div>
        </div>

        {connections.length > 0 && (
          <div className="mb-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-bold text-cyan-400">
              🧠 Brain Connections
            </h2>

            <p className="text-sm text-gray-400 mt-1 mb-4">
              AI-discovered relationships across your knowledge vault
            </p>

            <div className="space-y-3">
              {connections.map((connection, index) => (
                <div
                  key={index}
                  className="bg-gray-900 border border-cyan-900/40 rounded-xl p-4 hover:border-cyan-700/40 transition"
                >
                  <div className="text-sm font-semibold text-white">
                    {connection.fileA}
                  </div>

                  <div className="text-cyan-400 text-sm my-2">
                    ↕ Connected To
                  </div>

                  <div className="text-sm font-semibold text-white">
                    {connection.fileB}
                  </div>

                  <p className="text-gray-400 text-sm mt-3">
                    {connection.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-8">
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
                    <div
                      key={index}
                      className="w-full p-2 rounded bg-gray-700 flex justify-between items-center"
                    >
                      <button
                        onClick={() => {
                          setFileUri(storedFile.fileUri);
                          setMimeType(storedFile.mimeType);
                        }}
                        className="text-left flex-1"
                      >
                        <div>{storedFile.name}</div>

                        {storedFile.timelineEvents && (
                          <div className="text-xs text-green-400 mt-1">
                            {storedFile.timelineEvents.length} timeline events
                          </div>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTimelineFile(storedFile.name);
                          generateTimeline(storedFile.name);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 ml-3"
                      >
                        Timeline
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedTimelineFile && (
            <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 shadow-lg">
              <p className="text-sm text-gray-300">
                Timeline selected:{" "}
                <span className="text-blue-400">{selectedTimelineFile}</span>
              </p>
            </div>
          )}

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
                <p className="text-gray-600 italic">
                  Answers will appear here...
                </p>
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
        </div>
      </div>
    </main>
  );
}
