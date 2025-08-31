"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
// import { useVoiceManager } from "../../lib/vapi/hooks"; // TODO: Integrate for full functionality

// Simple status indicator component
function StatusIndicator({ status, message }: { status: "idle" | "connecting" | "connected" | "speaking" | "listening" | "error"; message: string }) {
  const statusColors = {
    idle: "bg-gray-100 text-gray-800",
    connecting: "bg-yellow-100 text-yellow-800",
    connected: "bg-green-100 text-green-800",
    speaking: "bg-blue-100 text-blue-800",
    listening: "bg-purple-100 text-purple-800",
    error: "bg-red-100 text-red-800",
  };

  const statusIcons = {
    idle: "⚪",
    connecting: "🔄",
    connected: "✅",
    speaking: "🗣️",
    listening: "👂",
    error: "❌",
  };

  return (
    <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${statusColors[status]}`}>
      <span className="mr-2">{statusIcons[status]}</span>
      {message}
    </div>
  );
}

// Simple candidate form component
function CandidateForm({ onSubmit, isLoading }: {
  onSubmit: (email: string, position: string) => void;
  isLoading: boolean;
}) {
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && position.trim()) {
      onSubmit(email.trim(), position.trim());
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Voice Interview</h2>
        <p className="text-gray-600">Please provide your details to begin the screening</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="your.email@example.com"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
            Position Applied For
          </label>
          <input
            type="text"
            id="position"
            required
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Electrician, Welder, Construction Worker"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !email.trim() || !position.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Starting Interview..." : "Start Voice Interview"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Make sure you have a microphone and are in a quiet environment
        </p>
      </div>
    </div>
  );
}

// Simplified voice interface component (MVP version)
function VoiceInterface({ candidateEmail, position, onEnd }: {
  candidateEmail: string;
  position: string;
  onEnd: () => void;
}) {
  const [status, setStatus] = useState<"connecting" | "connected" | "speaking" | "listening">("connecting");
  const [transcripts, setTranscripts] = useState<Array<{id: string, text: string, role: "assistant" | "user", timestamp: number}>>([]);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const createSession = useMutation(api.sessions.createSession);
  const getCandidateByEmail = useQuery(api.candidates.getCandidateByEmail, { email: candidateEmail });

  // Sample questions for demo
  const sampleQuestions = [
    "Hello! Thank you for joining our voice screening. Can you tell me about your experience in " + position.toLowerCase() + "?",
    "What safety protocols do you follow in your work?",
    "Can you describe a challenging project you've worked on?",
    "How do you handle working in a team environment?",
    "Do you have any questions about this position?"
  ];

  // Simulate voice session progression
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    // Simulate connection and first question
    const connectionTimer = setTimeout(() => {
      setStatus("connected");
      setTimeout(() => {
        setStatus("speaking");
        setTranscripts([{
          id: "1",
          text: sampleQuestions[0],
          role: "assistant",
          timestamp: Date.now()
        }]);
        
        setTimeout(() => {
          setStatus("listening");
        }, 3000);
      }, 1000);
    }, 2000);

    return () => {
      clearInterval(timer);
      clearTimeout(connectionTimer);
    };
  }, []);

  const handleSimulateResponse = () => {
    if (status === "listening" && currentQuestion < sampleQuestions.length) {
      // Add user response
      const userResponse = "Thank you for the question. I have several years of experience and always prioritize safety in my work.";
      setTranscripts(prev => [...prev, {
        id: `user_${currentQuestion}`,
        text: userResponse,
        role: "user",
        timestamp: Date.now()
      }]);

      // Move to next question after a delay
      setTimeout(() => {
        if (currentQuestion + 1 < sampleQuestions.length) {
          setStatus("speaking");
          setTranscripts(prev => [...prev, {
            id: `assistant_${currentQuestion + 1}`,
            text: sampleQuestions[currentQuestion + 1],
            role: "assistant",
            timestamp: Date.now()
          }]);
          setCurrentQuestion(prev => prev + 1);
          
          setTimeout(() => {
            setStatus("listening");
          }, 3000);
        } else {
          // Interview complete
          setTimeout(() => {
            handleEndSession();
          }, 2000);
        }
      }, 1000);
    }
  };

  const handleEndSession = async () => {
    if (getCandidateByEmail) {
      try {
        // Create session record
        await createSession({
          candidateId: getCandidateByEmail._id,
          sessionId: `session_${Date.now()}`,
        });
      } catch (error) {
        console.error("Failed to create session record:", error);
      }
    }
    onEnd();
  };

  const getStatusMessage = () => {
    switch (status) {
      case "connecting":
        return "Connecting to voice system...";
      case "speaking":
        return "AI is speaking - Please listen";
      case "listening":
        return "Please speak your answer";
      default:
        return "Connected and ready";
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Voice Interview in Progress</h2>
        <p className="text-gray-600 mb-4">Speak clearly and answer the questions naturally</p>
        
        <StatusIndicator 
          status={getStatus() as any}
          message={getStatusMessage()}
        />
      </div>

      {/* Transcripts Display */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 h-64 overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Conversation</h3>
        {transcripts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Conversation will appear here...
          </p>
        ) : (
          <div className="space-y-3">
            {transcripts.map((transcript, index) => (
              <div
                key={transcript.id || index}
                className={`p-3 rounded-lg ${
                  transcript.role === "assistant"
                    ? "bg-blue-100 text-blue-900"
                    : "bg-green-100 text-green-900"
                }`}
              >
                <div className="text-xs font-medium mb-1">
                  {transcript.role === "assistant" ? "🤖 Interviewer" : "👤 You"}
                </div>
                <div className="text-sm">{transcript.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        {status === "listening" && (
          <button
            onClick={handleSimulateResponse}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Simulate Answer
          </button>
        )}
        <button
          onClick={handleEndSession}
          className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          End Interview
        </button>
      </div>

      {/* Session Info */}
      <div className="text-center mt-4 text-sm text-gray-500">
        Session time: {Math.floor(sessionTime / 60)}:{(sessionTime % 60).toString().padStart(2, '0')} | 
        Question {currentQuestion + 1} of {sampleQuestions.length}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 MVP Demo Mode:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click "Simulate Answer" to progress through the interview</li>
          <li>• This demonstrates the voice interview workflow</li>
          <li>• In production, candidates would speak their actual responses</li>
          <li>• Sessions are recorded and scored automatically</li>
        </ul>
      </div>
    </div>
  );
}

// Main interview page component
export default function InterviewPage() {
  const [step, setStep] = useState<"form" | "interview" | "completed">("form");
  const [candidateInfo, setCandidateInfo] = useState<{ email: string; position: string } | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Mutations for creating candidate and session
  const createCandidate = useMutation(api.candidates.createCandidate);
  const createSession = useMutation(api.sessions.createSession);

  const handleStartInterview = async (email: string, position: string) => {
    setIsStarting(true);
    
    try {
      // Try to create candidate - if it fails (already exists), that's fine
      try {
        await createCandidate({
          email,
          position,
          tradeCategory: "general", // Default for MVP
          consentGiven: true, // Assumed for MVP
        });
      } catch (error) {
        // Candidate probably already exists, continue anyway
        console.log("Candidate may already exist, continuing...");
      }

      setCandidateInfo({ email, position });
      setStep("interview");
    } catch (error) {
      console.error("Failed to start interview:", error);
      alert("Failed to start interview. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndInterview = () => {
    setStep("completed");
  };

  const handleRestart = () => {
    setStep("form");
    setCandidateInfo(null);
  };

  if (step === "completed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-green-500 text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Completed</h2>
          <p className="text-gray-600 mb-6">
            Thank you for completing the voice screening. Your responses have been recorded and will be reviewed by our team.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            You will receive an email with next steps within 1-2 business days.
          </p>
          <button
            onClick={handleRestart}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start New Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {step === "form" ? (
        <CandidateForm 
          onSubmit={handleStartInterview}
          isLoading={isStarting}
        />
      ) : (
        candidateInfo && (
          <VoiceInterface
            candidateEmail={candidateInfo.email}
            position={candidateInfo.position}
            onEnd={handleEndInterview}
          />
        )
      )}
    </div>
  );
}
