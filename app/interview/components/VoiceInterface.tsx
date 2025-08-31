"use client";

import { useState, useEffect, useRef } from "react";
import { useVapi } from "../../../lib/vapi/hooks";

interface VoiceInterfaceProps {
  onSessionStart?: (sessionId: string, callId?: string) => void;
  onSessionEnd?: (sessionId: string, duration: number, callId?: string) => void;
  onTranscript?: (transcript: string, role: 'user' | 'assistant') => void;
  candidateEmail?: string;
  candidatePosition?: string;
}

export default function VoiceInterface({ 
  onSessionStart, 
  onSessionEnd, 
  onTranscript,
  candidateEmail,
  candidatePosition 
}: VoiceInterfaceProps) {
  const { isConnected, isConnecting, isListening, isSpeaking, error, connect, disconnect, transcripts, sessionId, callId, initialize, isInitialized } = useVapi({
    // For testing - replace with your actual VAPI keys
    publicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || 'demo-key',
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || 'demo-assistant',
  });
  
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', text: string, timestamp: number}>>([]);
  const [hasCalledSessionStart, setHasCalledSessionStart] = useState(false);
  
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize VAPI client on mount
  useEffect(() => {
    if (!isInitialized && initialize) {
      initialize().catch((err: Error) => {
        console.error("Failed to initialize VAPI client:", err);
      });
    }
  }, [isInitialized, initialize]);

  // Update session duration
  useEffect(() => {
    if (isConnected && sessionStartTime) {
      durationIntervalRef.current = setInterval(() => {
        setSessionDuration(Date.now() - sessionStartTime);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isConnected, sessionStartTime]);

  // Handle transcript updates
  useEffect(() => {
    if (transcripts.length > 0) {
      const latestTranscript = transcripts[transcripts.length - 1];
      setCurrentTranscript(latestTranscript.text);
      
      // Add to conversation history if it's a final transcript
      if (latestTranscript.isFinal) {
        setConversationHistory(prev => [...prev, {
          role: latestTranscript.role,
          text: latestTranscript.text,
          timestamp: Date.now()
        }]);
        onTranscript?.(latestTranscript.text, latestTranscript.role);
        setCurrentTranscript("");
      }
    }
  }, [transcripts, onTranscript]);

  const startInterview = async () => {
    try {
      await connect();
      setSessionStartTime(Date.now());
      setHasCalledSessionStart(false); // Reset flag
    } catch (err) {
      console.error("Failed to start interview:", err);
    }
  };

  // Watch for VAPI session ID to become available after connection
  useEffect(() => {
    if (isConnected && sessionId && sessionStartTime && !hasCalledSessionStart) {
      console.log('🎯 Real VAPI session ID captured:', sessionId);
      console.log('📞 Real VAPI call ID captured:', callId);
      console.log('📞 Calling onSessionStart with real VAPI session/call IDs');
      onSessionStart?.(sessionId, callId || sessionId);
      setHasCalledSessionStart(true);
    }
  }, [isConnected, sessionId, callId, sessionStartTime, hasCalledSessionStart, onSessionStart]);

  const endInterview = async () => {
    if (sessionStartTime && sessionId) {
      const duration = Date.now() - sessionStartTime;
      
      console.log("🔚 Ending interview with VAPI session ID:", sessionId);
      console.log("🔚 Ending interview with VAPI call ID:", callId);
      console.log("⏱️ Interview duration:", Math.round(duration / 1000), "seconds");
      onSessionEnd?.(sessionId, duration, callId || sessionId);
    } else {
      console.warn("⚠️ No valid session to end - sessionStartTime:", sessionStartTime, "sessionId:", sessionId);
      
      // Even if we don't have a proper session, still call onSessionEnd with a fallback
      if (sessionStartTime) {
        const duration = Date.now() - sessionStartTime;
        console.log("🔄 Using fallback session end with duration:", Math.round(duration / 1000), "seconds");
        onSessionEnd?.("fallback-session", duration);
      }
    }
    
    await disconnect();
    setSessionStartTime(null);
    setSessionDuration(0);
    setConversationHistory([]);
    setCurrentTranscript("");
    setHasCalledSessionStart(false);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getConnectionStatusIcon = () => {
    if (isConnecting) return "🔄";
    if (isConnected) return "🟢";
    if (error) return "🔴";
    return "⚪";
  };

  const getConnectionStatusText = () => {
    if (isConnecting) return "Connecting...";
    if (isConnected) return "Connected";
    if (error) return "Connection Error";
    return "Disconnected";
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Voice Interview</h2>
            <p className="text-blue-100 text-sm">
              {candidatePosition ? `Position: ${candidatePosition}` : "Blue-collar screening interview"}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-sm">
              <span>{getConnectionStatusIcon()}</span>
              <span>{getConnectionStatusText()}</span>
            </div>
            {sessionDuration > 0 && (
              <div className="text-lg font-mono">{formatDuration(sessionDuration)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="p-6">
        {!isConnected && !isConnecting && (
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🎤</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Start?</h3>
              <p className="text-gray-600 text-sm mb-6">
                Your interview will begin once you click the start button. 
                Make sure you're in a quiet environment.
              </p>
              
              {!isInitialized && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                  <div className="flex">
                    <span className="text-yellow-400">⚠️</span>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Initializing Voice System</h3>
                      <p className="text-sm text-yellow-700 mt-1">Setting up voice connection...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <span className="text-red-400">⚠️</span>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error?.message || 'Unknown error occurred'}</p>
                    <p className="text-xs text-red-600 mt-2">Make sure VAPI keys are configured in environment variables</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={startInterview}
              disabled={isConnecting || !isInitialized}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isConnecting ? "Connecting..." : !isInitialized ? "Initializing..." : "Start Interview"}
            </button>
          </div>
        )}

        {isConnected && (
          <div>
            {/* Voice Status Indicator */}
            <div className="text-center mb-6">
              <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                isSpeaking 
                  ? "bg-green-100 animate-pulse" 
                  : isListening 
                    ? "bg-blue-100 animate-pulse" 
                    : "bg-gray-100"
              }`}>
                <span className="text-4xl">
                  {isSpeaking ? "🗣️" : isListening ? "👂" : "💬"}
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                {isSpeaking && <p className="text-green-600 font-medium">Assistant is speaking...</p>}
                {isListening && !isSpeaking && <p className="text-blue-600 font-medium">Listening for your response...</p>}
                {!isSpeaking && !isListening && <p>Interview in progress</p>}
              </div>
            </div>

            {/* Current Transcript */}
            {currentTranscript && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">You're saying:</p>
                <p className="text-gray-900 italic">"{currentTranscript}"</p>
              </div>
            )}

            {/* Conversation History */}
            {conversationHistory.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Conversation:</h4>
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {conversationHistory.slice(-6).map((entry, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        entry.role === 'assistant' 
                          ? "bg-blue-50 border-l-4 border-blue-400" 
                          : "bg-green-50 border-l-4 border-green-400"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          {entry.role === 'assistant' ? 'Interviewer' : 'You'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{entry.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* End Interview Button */}
            <div className="flex justify-center">
              <button
                onClick={endInterview}
                className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                End Interview
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Speak clearly and at a normal pace</li>
          <li>• Wait for the assistant to finish before responding</li>
          <li>• Be honest about your experience and skills</li>
          <li>• The interview typically takes 5-10 minutes</li>
        </ul>
      </div>
    </div>
  );
}
