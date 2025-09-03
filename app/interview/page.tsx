"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import VoiceInterface from "./components/VoiceInterface";



export default function InterviewPage() {
  const [currentStep, setCurrentStep] = useState<"setup" | "interview" | "complete">("setup");
  const [candidateInfo, setCandidateInfo] = useState({
    email: "",
    firstName: "",
    lastName: "",
    position: "",
    tradeCategory: "general" as const
  });

  const [sessionId, setSessionId] = useState<Id<"sessions"> | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Convex mutations
  const createSession = useMutation(api.sessions.createSession);
  const completeSession = useMutation(api.sessions.completeSession);
  const createCandidate = useMutation(api.candidates.createCandidate);
  const processVapiSession = useMutation(api.vapiIntegration.processVapiSession);
  const addTranscript = useMutation(api.sessions.addTranscript);
  const updateVapiCallId = useMutation(api.sessions.updateVapiCallId);

  const handleStartInterview = () => {
    if (!candidateInfo.position) {
      alert("Please fill in the position before starting.");
      return;
    }
    setCurrentStep("interview");
  };



  const handleSessionStart = async (vapiSessionId: string, vapiCallId?: string) => {
    console.log("Session starting with VAPI session ID:", vapiSessionId);
    console.log("Session starting with VAPI call ID:", vapiCallId);
    try {
      // Create candidate record - use email or generate one
      const email = candidateInfo.email || `candidate_${Date.now()}@temporary.com`;
      
      const candidateId = await createCandidate({
        email,
        firstName: candidateInfo.firstName,
        lastName: candidateInfo.lastName,
        position: candidateInfo.position,
        tradeCategory: candidateInfo.tradeCategory,
        consentGiven: true,
        source: "voice_interview_portal"
      });
      
      console.log("Created candidate:", candidateId);

      // Create session record using the actual VAPI session ID and call ID
      const newSessionId = await createSession({
        candidateId,
        sessionId: vapiSessionId, // Use the real VAPI session ID
        vapiSessionId: vapiSessionId, // Store VAPI session ID for reference
        vapiCallId: vapiCallId, // Store VAPI call ID for API queries
      });
      
      console.log("✅ Created session with ID:", newSessionId);
      console.log("🔗 Linked to VAPI session:", vapiSessionId);
      console.log("📞 Linked to VAPI call:", vapiCallId);
      console.log("👤 For candidate:", candidateId);
      setSessionId(newSessionId);
    } catch (error) {
      console.error("Failed to create session records:", error);
    }
  };

  const handleSessionEnd = async (voiceSessionId: string, duration: number, vapiCallId?: string) => {
    console.log("Session ending:", { voiceSessionId, duration, sessionId, vapiCallId });
    setSessionDuration(duration);
    
    if (sessionId) {
      try {
        // Update call ID if we have one and it wasn't set during creation
        if (vapiCallId && vapiCallId !== voiceSessionId) {
          try {
            await updateVapiCallId({
              sessionId,
              vapiCallId: vapiCallId,
            });
            console.log("✅ Updated session with VAPI call ID:", vapiCallId);
          } catch (updateError) {
            console.warn("⚠️ Failed to update call ID:", updateError);
          }
        }

        // Note: VAPI API calls with private keys should be handled by backend/Convex actions only
        // Frontend should never expose private API keys for security reasons
        // The assessment creation will be handled by the dashboard's "Create Assessment" button
        
        console.log("✅ Session completed. Assessment can be created from dashboard.");
      } catch (error) {
        console.error("❌ Failed to fetch VAPI data:", error);
        console.log("🔄 Falling back to basic session completion");
        
        // Fallback: Just mark the session as completed without VAPI data
        try {
          console.log("🔄 Calling completeSession for sessionId:", sessionId);
          const result = await completeSession({
            sessionId,
            // Optional fields can be omitted - completeSession will handle them
          });
          console.log("✅ Session marked as completed (fallback):", result);
        } catch (fallbackError) {
          console.error("❌ Failed to mark session as completed:", fallbackError);
          console.error("❌ Error details:", fallbackError);
        }
      }
    } else {
      console.log("❌ No sessionId available - cannot update session");
      console.log("⚠️ This means the session was never created properly");
    }
    
    // Extra safety: Force session completion after a delay
    setTimeout(async () => {
      if (sessionId) {
        try {
          console.log("🔒 Safety check: Ensuring session is marked as completed");
          await completeSession({ sessionId });
          console.log("✅ Safety check: Session completion confirmed");
        } catch (safetyError) {
          console.error("❌ Safety check failed:", safetyError);
        }
      }
    }, 2000); // Wait 2 seconds then force completion
    
    console.log("🎬 Moving to complete step");
    setCurrentStep("complete");
  };

  const handleTranscript = async (transcript: string, role: 'user' | 'assistant') => {
    console.log(`${role}: ${transcript}`);
    
    // Store transcript in real-time if we have a session
    if (sessionId && transcript.trim()) {
      try {
        await addTranscript({
          sessionId,
          transcript: {
            id: `transcript_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: transcript,
            role,
            timestamp: Date.now(),
            confidence: 1.0,
            isFinal: true,
          },
        });
        console.log("✅ Stored transcript:", { role, text: transcript.substring(0, 50) + "..." });
      } catch (error) {
        console.error("❌ Failed to store transcript:", error);
      }
    }
  };

  // Cleanup: Ensure session is completed when component unmounts
  useEffect(() => {
    return () => {
      if (sessionId && currentStep === "interview") {
        console.log("🧹 Cleanup: Component unmounting, ensuring session is completed");
        completeSession({ sessionId }).catch((error) => {
          console.error("❌ Cleanup failed:", error);
        });
      }
    };
  }, [sessionId, currentStep, completeSession]);

  if (currentStep === "setup") {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Voice Interview Setup</h1>
              <p className="text-gray-600 mt-2">
                Please provide some basic information before we begin your voice screening interview.
              </p>
            </div>

            <form className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address (optional)
                </label>
                <input
                  type="email"
                  id="email"
                  value={candidateInfo.email}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={candidateInfo.firstName}
                    onChange={(e) => setCandidateInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={candidateInfo.lastName}
                    onChange={(e) => setCandidateInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                  Position Applied For *
                </label>
                <input
                  type="text"
                  id="position"
                  required
                  value={candidateInfo.position}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, position: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Electrician, Plumber, Construction Worker"
                />
              </div>

              <div>
                <label htmlFor="tradeCategory" className="block text-sm font-medium text-gray-700">
                  Trade Category
                </label>
                <select
                  id="tradeCategory"
                  value={candidateInfo.tradeCategory}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, tradeCategory: e.target.value as any }))}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="general">General</option>
                  <option value="construction">Construction</option>
                  <option value="electrical">Electrical</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="welding">Welding</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </form>

            <div className="mt-8">
              <button
                onClick={handleStartInterview}
                disabled={!candidateInfo.position}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Start Voice Interview
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By proceeding, you consent to voice recording for screening purposes.
                The interview typically takes 5-10 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }



  if (currentStep === "interview") {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Voice Interview</h1>
            <p className="text-gray-600">
              Your interviewer will guide you through the screening process.
            </p>
          </div>

          <VoiceInterface
            onSessionStart={handleSessionStart}
            onSessionEnd={handleSessionEnd}
            onTranscript={handleTranscript}
            candidateEmail={candidateInfo.email}
            candidatePosition={candidateInfo.position}
          />


        </div>
      </div>
    );
  }

  if (currentStep === "complete") {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Interview Complete!</h1>
              <p className="text-gray-600">
                Thank you for taking the time to complete your voice screening interview.
              </p>
            </div>

            {sessionDuration > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  Interview Duration: {Math.floor(sessionDuration / 60000)}:{Math.floor((sessionDuration % 60000) / 1000).toString().padStart(2, '0')}
                </p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li>• Your responses will be reviewed by our team</li>
                <li>• You'll receive feedback within 2-3 business days</li>
                <li>• If selected, we'll contact you for the next steps</li>
              </ul>
            </div>

            <div className="text-center">
              <button
                onClick={() => window.location.href = "/dashboard/"}
                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
              >
                See how your interview went and how your score was calculated
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}