"use client";

import Vapi from '@vapi-ai/web';
import { v4 as uuidv4 } from 'uuid';
import {
  VoiceState,
  ConnectionStatus,
  TranscriptMessage,
  SessionMetadata,
  VoiceError,
  VoiceEvents,
  MicTestResult,
  VapiClientOptions,
  SessionControls
} from './types';
import { VoiceConnectionTester, ConnectionTestSuite } from './connection-test';

/**
 * Enhanced Vapi client wrapper with TypeScript support and error handling
 */
export class VapiClient {
  private vapi: Vapi | null = null;
  private sessionId: string;
  private state: VoiceState = 'idle';
  private connectionStatus: ConnectionStatus = { isConnected: false };
  private transcripts: TranscriptMessage[] = [];
  private sessionMetadata: SessionMetadata;
  private eventHandlers: Partial<VoiceEvents> = {};

  constructor(private options: VapiClientOptions) {
    this.sessionId = uuidv4();
    this.sessionMetadata = {
      sessionId: this.sessionId,
      startTime: Date.now(),
      status: 'active'
    };
    
    if (options.onEvents) {
      this.eventHandlers = options.onEvents;
    }
  }

  /**
   * Initialize Vapi client with environment variables
   */
  public async initialize(): Promise<void> {
    try {
      if (!this.options.publicKey) {
        const error: VoiceError = {
          code: 'MISSING_CONFIG',
          message: 'Vapi public key is required',
          timestamp: Date.now()
        };
        throw error;
      }

      if (!this.options.assistantId) {
        const error: VoiceError = {
          code: 'MISSING_CONFIG',
          message: 'Vapi assistant ID is required',
          timestamp: Date.now()
        };
        throw error;
      }

      this.vapi = new Vapi(this.options.publicKey);
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.setState('idle');
      
    } catch (error) {
      const voiceError: VoiceError = {
        code: 'INIT_FAILED',
        message: error instanceof Error ? error.message : 'Failed to initialize Vapi client',
        timestamp: Date.now(),
        details: { error }
      };
      
      this.handleError(voiceError);
      throw voiceError;
    }
  }

  /**
   * Start voice session
   */
  public async startSession(): Promise<SessionControls> {
    try {
      if (!this.vapi) {
        const error: VoiceError = {
          code: 'NOT_INITIALIZED',
          message: 'Vapi client not initialized',
          timestamp: Date.now()
        };
        throw error;
      }

      this.setState('connecting');
      this.connectionStatus = { isConnected: false, isConnecting: true };

      // Start with the assistant ID - Vapi SDK will handle transcriber/voice config
      await this.vapi.start(this.options.assistantId);
      
      // Try to capture the session ID immediately after starting
      this.tryCapturingSessionId();
      
      // If we didn't get the session ID immediately, try polling for it
      if (!this.sessionId || this.sessionId.includes('temp-')) {
        const pollAttempts = 10;
        let attempts = 0;
        
        const pollForSessionId = () => {
          this.tryCapturingSessionId();
          attempts++;
          
          if ((!this.sessionId || this.sessionId.includes('temp-')) && attempts < pollAttempts) {
            setTimeout(pollForSessionId, 100); // Try again in 100ms
          }
        };
        
        setTimeout(pollForSessionId, 100);
      }
      
      this.setState('connected');
      this.connectionStatus = { isConnected: true, isConnecting: false };
      this.sessionMetadata.status = 'active';

      return this.getSessionControls();

    } catch (error) {
      const voiceError: VoiceError = {
        code: 'SESSION_START_FAILED',
        message: error instanceof Error ? error.message : 'Failed to start voice session',
        timestamp: Date.now(),
        details: { error }
      };
      
      this.handleError(voiceError);
      throw voiceError;
    }
  }

  /**
   * Stop voice session
   */
  public async stopSession(): Promise<void> {
    try {
      if (this.vapi) {
        await this.vapi.stop();
      }
      
      this.setState('disconnected');
      this.connectionStatus = { isConnected: false };
      this.sessionMetadata.endTime = Date.now();
      this.sessionMetadata.duration = this.sessionMetadata.endTime - this.sessionMetadata.startTime;
      this.sessionMetadata.status = 'completed';

    } catch (error) {
      const voiceError: VoiceError = {
        code: 'SESSION_STOP_FAILED',
        message: error instanceof Error ? error.message : 'Failed to stop voice session',
        timestamp: Date.now(),
        details: { error }
      };
      
      this.handleError(voiceError);
    }
  }

  /**
   * Test microphone functionality (basic test)
   */
  public async testMicrophone(): Promise<MicTestResult> {
    const tester = new VoiceConnectionTester(this.options.publicKey, this.options.assistantId);
    return await tester.testMicrophone();
  }

  /**
   * Run comprehensive connection test suite
   */
  public async runConnectionTests(): Promise<ConnectionTestSuite> {
    const tester = new VoiceConnectionTester(this.options.publicKey, this.options.assistantId);
    try {
      return await tester.runFullTestSuite();
    } finally {
      tester.cleanup();
    }
  }

  /**
   * Quick connection readiness check
   */
  public async isConnectionReady(): Promise<{ ready: boolean; score: number; issues: string[] }> {
    const results = await this.runConnectionTests();
    return {
      ready: results.overall.isReady,
      score: results.overall.score,
      issues: results.overall.issues
    };
  }

  /**
   * Get current session status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get current voice state
   */
  public getVoiceState(): VoiceState {
    return this.state;
  }

  /**
   * Get session metadata
   */
  public getSessionMetadata(): SessionMetadata {
    return { ...this.sessionMetadata };
  }

  /**
   * Get current session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get all transcripts
   */
  public getTranscripts(): TranscriptMessage[] {
    return [...this.transcripts];
  }

  /**
   * Clear session data
   */
  public clearSession(): void {
    this.transcripts = [];
    this.sessionId = uuidv4();
    this.sessionMetadata = {
      sessionId: this.sessionId,
      startTime: Date.now(),
      status: 'active'
    };
  }

  /**
   * Try to capture the session ID from VAPI
   */
  private tryCapturingSessionId(): void {
    if (!this.vapi) return;
    
    // Try multiple ways to get the session ID
    let capturedId = null;
    
    if ((this.vapi as any).call?.id) {
      capturedId = (this.vapi as any).call.id;
    } else if ((this.vapi as any).callId) {
      capturedId = (this.vapi as any).callId;
    } else if ((this.vapi as any).id) {
      capturedId = (this.vapi as any).id;
    }
    
    if (capturedId && capturedId !== this.sessionId) {
      this.sessionId = capturedId;
      this.sessionMetadata.sessionId = capturedId;
      console.log('Captured VAPI session ID:', capturedId);
    }
  }

  /**
   * Set up Vapi event listeners
   */
  private setupEventListeners(): void {
    if (!this.vapi) return;

    this.vapi.on('speech-start', () => {
      this.setState('speaking');
      this.eventHandlers.onSpeechStart?.();
    });

    this.vapi.on('speech-end', () => {
      this.setState('listening');
      this.eventHandlers.onSpeechEnd?.();
    });

    this.vapi.on('call-start', () => {
      this.setState('connected');
      this.connectionStatus = { isConnected: true, isConnecting: false };
      
      // Try to get the session ID from the VAPI instance
      this.tryCapturingSessionId();
      
      this.eventHandlers.onConnected?.();
    });

    this.vapi.on('call-end', () => {
      this.setState('disconnected');
      this.connectionStatus = { isConnected: false, isConnecting: false };
      this.sessionMetadata.endTime = Date.now();
      this.sessionMetadata.duration = this.sessionMetadata.endTime - this.sessionMetadata.startTime;
      this.sessionMetadata.status = 'completed';
      this.eventHandlers.onDisconnected?.();
    });

    this.vapi.on('message', (message: { type?: string; transcript?: string; role?: string; confidence?: number; isFinal?: boolean }) => {
      if (message.type === 'transcript') {
        const transcript: TranscriptMessage = {
          id: uuidv4(),
          text: message.transcript || '',
          role: (message.role === 'user' || message.role === 'assistant') ? message.role : 'user',
          timestamp: Date.now(),
          confidence: message.confidence,
          isFinal: message.isFinal || false
        };

        this.transcripts.push(transcript);
        this.eventHandlers.onTranscript?.(transcript);
      }
    });

    this.vapi.on('error', (error: { message?: string; [key: string]: unknown }) => {
      const voiceError: VoiceError = {
        code: 'VAPI_ERROR',
        message: error.message || 'Unknown Vapi error',
        timestamp: Date.now(),
        details: error
      };
      
      this.handleError(voiceError);
    });
  }

  /**
   * Set voice state and trigger events
   */
  private setState(newState: VoiceState): void {
    this.state = newState;
    
    if (newState === 'error') {
      this.connectionStatus = { isConnected: false, error: 'Voice state error' };
    }
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: VoiceError): void {
    this.setState('error');
    this.connectionStatus = { isConnected: false, error: error.message };
    this.sessionMetadata.status = 'failed';
    
    console.error('VapiClient Error:', error);
    this.eventHandlers.onError?.(error);
  }

  /**
   * Get session controls object
   */
  private getSessionControls(): SessionControls {
    return {
      start: () => this.startSession().then(() => {}),
      stop: () => this.stopSession(),
      pause: () => {
        // Implementation depends on Vapi SDK capabilities
        this.setState('idle');
      },
      resume: () => {
        this.setState('listening');
      },
      mute: () => {
        if (this.vapi) {
          this.vapi.setMuted(true);
        }
      },
      unmute: () => {
        if (this.vapi) {
          this.vapi.setMuted(false);
        }
      },
      getStatus: () => this.getConnectionStatus()
    };
  }
}

/**
 * Factory function to create VapiClient with environment variables
 */
export function createVapiClient(options?: Partial<VapiClientOptions>): VapiClient {
  const defaultConfig: VapiClientOptions = {
    publicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '',
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || '',
    ...options
  };

  return new VapiClient(defaultConfig);
}

// Export types and classes for external use
export type { VoiceError } from './types';
export { VoiceConnectionTester, createConnectionTester } from './connection-test';
export type { 
  WebRTCTestResult, 
  NetworkTestResult, 
  ConnectionTestSuite 
} from './connection-test';
