"use client";

import { useState } from "react";

interface Transcript {
  id: string;
  text: string;
  role: "user" | "assistant";
  timestamp: number;
  confidence?: number;
  isFinal: boolean;
}

interface TranscriptViewerProps {
  transcripts: Transcript[];
  sessionId: string;
}

export default function TranscriptViewer({ transcripts, sessionId }: TranscriptViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!transcripts || transcripts.length === 0) {
    return <span className="text-gray-500">No transcript</span>;
  }

  const finalTranscripts = transcripts.filter(t => t.isFinal);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-blue-600 cursor-pointer hover:text-blue-800 text-sm"
      >
        View Transcript ({finalTranscripts.length} entries)
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Interview Transcript</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {finalTranscripts.map((transcript, index) => (
                  <div
                    key={transcript.id}
                    className={`p-3 rounded-lg ${
                      transcript.role === "assistant" 
                        ? "bg-blue-50 border-l-4 border-blue-400" 
                        : "bg-green-50 border-l-4 border-green-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          transcript.role === "assistant" 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {transcript.role === "assistant" ? "Interviewer" : "Candidate"}
                        </span>
                        <span className="text-xs text-gray-500">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {transcript.confidence && (
                          <span className="text-xs text-gray-500">
                            Confidence: {Math.round(transcript.confidence * 100)}%
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(transcript.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-800">{transcript.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
