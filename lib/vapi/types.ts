// TypeScript types for Vapi AI SDK integration

/**
 * Voice states during conversation
 */
export type VoiceState = 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'disconnected' | 'error';

/**
 * Audio quality levels
 */
export type AudioQuality = 'poor' | 'fair' | 'good' | 'excellent';

/**
 * Connection status
 */
export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting?: boolean;
  latency?: number;
  audioQuality?: AudioQuality;
  error?: string;
}

/**
 * Voice session configuration
 */
export interface VoiceSessionConfig {
  assistantId: string;
  publicKey: string;
}

/**
 * Real-time transcript message
 */
export interface TranscriptMessage {
  id: string;
  text: string;
  role: 'user' | 'assistant';
  timestamp: number;
  confidence?: number;
  isFinal: boolean;
}

/**
 * Voice analysis metadata
 */
export interface VoiceAnalysis {
  confidence: number;
  fluency: number;
  hesitationCount: number;
  fillerWords: string[];
  speakingRate: number; // words per minute
  pauseDuration: number; // total pause time in ms
}

/**
 * Session metadata
 */
export interface SessionMetadata {
  sessionId: string;
  candidateId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  recordingUrl?: string;
}

/**
 * Error types for voice interactions
 */
export interface VoiceError {
  code: string;
  message: string;
  timestamp: number;
  details?: Record<string, unknown>;
}

/**
 * Vapi client events
 */
export interface VoiceEvents {
  onConnected: () => void;
  onDisconnected: () => void;
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
  onTranscript: (transcript: TranscriptMessage) => void;
  onError: (error: VoiceError) => void;
  onVoiceAnalysis?: (analysis: VoiceAnalysis) => void;
}

/**
 * Microphone test results
 */
export interface MicTestResult {
  isWorking: boolean;
  volume: number;
  quality: AudioQuality;
  latency: number;
  error?: string;
}

/**
 * Call configuration for phone access
 */
export interface CallConfig {
  phoneNumber?: string;
  callbackUrl?: string;
  maxDuration?: number; // in minutes
}

/**
 * Vapi client initialization options
 */
export interface VapiClientOptions extends VoiceSessionConfig {
  onEvents?: Partial<VoiceEvents>;
}

/**
 * Response from Vapi assistant
 */
export interface AssistantResponse {
  text: string;
  audio?: ArrayBuffer;
  metadata?: Record<string, unknown>;
}

/**
 * Session controls
 */
export interface SessionControls {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  mute: () => void;
  unmute: () => void;
  getStatus: () => ConnectionStatus;
}
