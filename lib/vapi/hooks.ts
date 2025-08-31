"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { VapiClient, createVapiClient } from './client';
import {
  VoiceState,
  ConnectionStatus,
  TranscriptMessage,
  SessionMetadata,
  VoiceError,
  MicTestResult,
  VapiClientOptions
} from './types';
import { ConnectionTestSuite } from './connection-test';

/**
 * Hook return types
 */
export interface UseVapiClientReturn {
  client: VapiClient | null;
  isInitialized: boolean;
  error: VoiceError | null;
  initialize: () => Promise<void>;
  cleanup: () => void;
}

export interface UseVoiceStateReturn {
  voiceState: VoiceState;
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  isActive: boolean;
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  error: VoiceError | null;
}

export interface UseTranscriptsReturn {
  transcripts: TranscriptMessage[];
  latestTranscript: TranscriptMessage | null;
  clearTranscripts: () => void;
  isReceivingTranscripts: boolean;
}

export interface UseConnectionTestReturn {
  testResults: ConnectionTestSuite | null;
  isRunningTest: boolean;
  lastTestTime: Date | null;
  runConnectionTest: () => Promise<ConnectionTestSuite>;
  isConnectionReady: boolean;
  connectionScore: number;
  connectionIssues: string[];
}

export interface UseSessionManagerReturn {
  sessionMetadata: SessionMetadata | null;
  sessionDuration: number;
  startTime: Date | null;
  endTime: Date | null;
  isSessionActive: boolean;
  createNewSession: () => void;
  endCurrentSession: () => void;
}

export interface UseMicrophoneTestReturn {
  micTestResult: MicTestResult | null;
  isTestingMic: boolean;
  testMicrophone: () => Promise<MicTestResult>;
  isMicReady: boolean;
}

/**
 * Main Vapi client management hook
 */
export function useVapiClient(options?: Partial<VapiClientOptions>): UseVapiClientReturn {
  const [client, setClient] = useState<VapiClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<VoiceError | null>(null);
  const initPromise = useRef<Promise<void> | null>(null);

  const initialize = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (initPromise.current) {
      return initPromise.current;
    }

    initPromise.current = (async () => {
      try {
        setError(null);
        
        const newClient = createVapiClient({
          ...options,
          onEvents: {
            onError: (error: VoiceError) => {
              setError(error);
              console.error('Vapi client error:', error);
            },
            ...options?.onEvents
          }
        });

        await newClient.initialize();
        setClient(newClient);
        setIsInitialized(true);
      } catch (err) {
        const voiceError = err as VoiceError;
        setError(voiceError);
        setIsInitialized(false);
        throw voiceError;
      } finally {
        initPromise.current = null;
      }
    })();

    return initPromise.current;
  }, [options]);

  const cleanup = useCallback(() => {
    if (client) {
      client.stopSession().catch(() => {
        // Ignore cleanup errors
      });
      setClient(null);
      setIsInitialized(false);
      setError(null);
    }
  }, [client]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    client,
    isInitialized,
    error,
    initialize,
    cleanup
  };
}

/**
 * Voice state management hook
 */
export function useVoiceState(client: VapiClient | null): UseVoiceStateReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ isConnected: false });
  const [error, setError] = useState<VoiceError | null>(null);

  const startSession = useCallback(async () => {
    if (!client) {
      const err: VoiceError = {
        code: 'NO_CLIENT',
        message: 'Vapi client not initialized',
        timestamp: Date.now()
      };
      setError(err);
      throw err;
    }

    try {
      setError(null);
      await client.startSession();
    } catch (err) {
      const voiceError = err as VoiceError;
      setError(voiceError);
      throw voiceError;
    }
  }, [client]);

  const stopSession = useCallback(async () => {
    if (!client) return;

    try {
      setError(null);
      await client.stopSession();
    } catch (err) {
      const voiceError = err as VoiceError;
      setError(voiceError);
      throw voiceError;
    }
  }, [client]);

  // Poll for state changes
  useEffect(() => {
    if (!client) {
      setVoiceState('idle');
      setConnectionStatus({ isConnected: false });
      return;
    }

    const interval = setInterval(() => {
      const currentState = client.getVoiceState();
      const currentStatus = client.getConnectionStatus();
      
      setVoiceState(currentState);
      setConnectionStatus(currentStatus);
    }, 100); // Poll every 100ms for responsive UI

    return () => clearInterval(interval);
  }, [client]);

  const isConnected = connectionStatus.isConnected;
  const isActive = voiceState === 'speaking' || voiceState === 'listening' || voiceState === 'connected';

  return {
    voiceState,
    connectionStatus,
    isConnected,
    isActive,
    startSession,
    stopSession,
    error
  };
}

/**
 * Transcript management hook
 */
export function useTranscripts(client: VapiClient | null): UseTranscriptsReturn {
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  const [latestTranscript, setLatestTranscript] = useState<TranscriptMessage | null>(null);
  const [isReceivingTranscripts, setIsReceivingTranscripts] = useState(false);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setLatestTranscript(null);
    setIsReceivingTranscripts(false);
    if (client) {
      client.clearSession();
    }
  }, [client]);

  // Poll for new transcripts
  useEffect(() => {
    if (!client) {
      setTranscripts([]);
      setLatestTranscript(null);
      setIsReceivingTranscripts(false);
      return;
    }

    const interval = setInterval(() => {
      const currentTranscripts = client.getTranscripts();
      
      if (currentTranscripts.length !== transcripts.length) {
        setTranscripts(currentTranscripts);
        
        if (currentTranscripts.length > 0) {
          const latest = currentTranscripts[currentTranscripts.length - 1];
          setLatestTranscript(latest);
          setIsReceivingTranscripts(true);
        }
      }
    }, 100); // Poll every 100ms for real-time feeling

    return () => clearInterval(interval);
  }, [client, transcripts.length]);

  // Reset receiving status after inactivity
  useEffect(() => {
    if (isReceivingTranscripts) {
      const timeout = setTimeout(() => {
        setIsReceivingTranscripts(false);
      }, 2000); // 2 seconds of no new transcripts

      return () => clearTimeout(timeout);
    }
  }, [latestTranscript, isReceivingTranscripts]);

  return {
    transcripts,
    latestTranscript,
    clearTranscripts,
    isReceivingTranscripts
  };
}

/**
 * Connection testing hook
 */
export function useConnectionTest(client: VapiClient | null): UseConnectionTestReturn {
  const [testResults, setTestResults] = useState<ConnectionTestSuite | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);

  const runConnectionTest = useCallback(async (): Promise<ConnectionTestSuite> => {
    if (!client) {
      throw new Error('Vapi client not initialized');
    }

    setIsRunningTest(true);
    try {
      const results = await client.runConnectionTests();
      setTestResults(results);
      setLastTestTime(new Date());
      return results;
    } finally {
      setIsRunningTest(false);
    }
  }, [client]);

  // Auto-run test when client is first available
  useEffect(() => {
    if (client && !testResults && !isRunningTest) {
      runConnectionTest().catch((error) => {
        console.warn('Auto connection test failed:', error);
      });
    }
  }, [client, testResults, isRunningTest, runConnectionTest]);

  const isConnectionReady = testResults?.overall.isReady ?? false;
  const connectionScore = testResults?.overall.score ?? 0;
  const connectionIssues = testResults?.overall.issues ?? [];

  return {
    testResults,
    isRunningTest,
    lastTestTime,
    runConnectionTest,
    isConnectionReady,
    connectionScore,
    connectionIssues
  };
}

/**
 * Session metadata management hook
 */
export function useSessionManager(client: VapiClient | null): UseSessionManagerReturn {
  const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);

  const createNewSession = useCallback(() => {
    if (client) {
      client.clearSession();
      setSessionMetadata(null);
      setSessionDuration(0);
    }
  }, [client]);

  const endCurrentSession = useCallback(() => {
    if (client && sessionMetadata) {
      const endTime = Date.now();
      const updatedMetadata: SessionMetadata = {
        ...sessionMetadata,
        endTime,
        duration: endTime - sessionMetadata.startTime,
        status: 'completed'
      };
      setSessionMetadata(updatedMetadata);
    }
  }, [client, sessionMetadata]);

  // Poll for session metadata updates
  useEffect(() => {
    if (!client) {
      setSessionMetadata(null);
      setSessionDuration(0);
      return;
    }

    const interval = setInterval(() => {
      const metadata = client.getSessionMetadata();
      setSessionMetadata(metadata);

      if (metadata.startTime && !metadata.endTime) {
        setSessionDuration(Date.now() - metadata.startTime);
      } else if (metadata.duration) {
        setSessionDuration(metadata.duration);
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [client]);

  const startTime = sessionMetadata?.startTime ? new Date(sessionMetadata.startTime) : null;
  const endTime = sessionMetadata?.endTime ? new Date(sessionMetadata.endTime) : null;
  const isSessionActive = sessionMetadata?.status === 'active';

  return {
    sessionMetadata,
    sessionDuration,
    startTime,
    endTime,
    isSessionActive,
    createNewSession,
    endCurrentSession
  };
}

/**
 * Microphone testing hook
 */
export function useMicrophoneTest(client: VapiClient | null): UseMicrophoneTestReturn {
  const [micTestResult, setMicTestResult] = useState<MicTestResult | null>(null);
  const [isTestingMic, setIsTestingMic] = useState(false);

  const testMicrophone = useCallback(async (): Promise<MicTestResult> => {
    if (!client) {
      throw new Error('Vapi client not initialized');
    }

    setIsTestingMic(true);
    try {
      const result = await client.testMicrophone();
      setMicTestResult(result);
      return result;
    } finally {
      setIsTestingMic(false);
    }
  }, [client]);

  // Auto-test microphone when client is first available
  useEffect(() => {
    if (client && !micTestResult && !isTestingMic) {
      testMicrophone().catch((error) => {
        console.warn('Auto microphone test failed:', error);
      });
    }
  }, [client, micTestResult, isTestingMic, testMicrophone]);

  const isMicReady = !!(micTestResult?.isWorking && micTestResult.quality !== 'poor');

  return {
    micTestResult,
    isTestingMic,
    testMicrophone,
    isMicReady
  };
}

/**
 * Comprehensive voice management hook that combines all functionality
 */
export function useVoiceManager(options?: Partial<VapiClientOptions>) {
  const vapiClient = useVapiClient(options);
  const voiceState = useVoiceState(vapiClient.client);
  const transcripts = useTranscripts(vapiClient.client);
  const connectionTest = useConnectionTest(vapiClient.client);
  const sessionManager = useSessionManager(vapiClient.client);
  const microphoneTest = useMicrophoneTest(vapiClient.client);

  const isFullyReady = vapiClient.isInitialized && 
                      connectionTest.isConnectionReady && 
                      microphoneTest.isMicReady;

  const hasErrors = !!(vapiClient.error || voiceState.error);

  const allErrors = [vapiClient.error, voiceState.error].filter(Boolean) as VoiceError[];

  return {
    // Client management
    ...vapiClient,
    
    // Voice state
    ...voiceState,
    
    // Transcripts
    ...transcripts,
    
    // Connection testing
    ...connectionTest,
    
    // Session management
    ...sessionManager,
    
    // Microphone testing
    ...microphoneTest,
    
    // Combined status
    isFullyReady,
    hasErrors,
    allErrors
  };
}

/**
 * Simplified hook for basic VAPI functionality (alias for useVoiceManager)
 */
export function useVapi(options?: Partial<VapiClientOptions>) {
  const manager = useVoiceManager(options);
  
  return {
    // Core functionality
    isConnected: manager.isConnected,
    isConnecting: manager.connectionStatus.isConnecting || false,
    isListening: manager.voiceState === 'listening',
    isSpeaking: manager.voiceState === 'speaking',
    error: manager.allErrors[0] || null,
    
    // Initialization
    isInitialized: manager.isInitialized,
    initialize: manager.initialize,
    
    // Actions
    connect: manager.startSession,
    disconnect: manager.stopSession,
    
    // Data
    transcripts: manager.transcripts,
    sessionId: manager.client?.getSessionId() || null,
    callId: manager.client?.getCallId() || null,
  };
}
