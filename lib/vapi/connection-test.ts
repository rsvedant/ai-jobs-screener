"use client";

import { VapiClient } from './client';
import { 
  AudioQuality, 
  MicTestResult
} from './types';

/**
 * WebRTC connection test results
 */
export interface WebRTCTestResult {
  isSupported: boolean;
  canConnect: boolean;
  iceConnectionState?: RTCIceConnectionState;
  latency?: number;
  bandwidth?: number;
  error?: string;
}

/**
 * Network connectivity test results
 */
export interface NetworkTestResult {
  isOnline: boolean;
  downloadSpeed?: number; // Mbps
  uploadSpeed?: number; // Mbps
  latency?: number; // ms
  jitter?: number; // ms
  packetLoss?: number; // percentage
}

/**
 * Comprehensive connection test results
 */
export interface ConnectionTestSuite {
  overall: {
    isReady: boolean;
    score: number; // 0-100
    issues: string[];
    recommendations: string[];
  };
  microphone: MicTestResult;
  webrtc: WebRTCTestResult;
  network: NetworkTestResult;
  vapi: {
    canInitialize: boolean;
    canConnect: boolean;
    latency?: number;
    error?: string;
  };
}

/**
 * Voice connection tester with comprehensive WebRTC and network validation
 */
export class VoiceConnectionTester {
  private vapiClient: VapiClient | null = null;

  constructor(private publicKey: string, private assistantId: string) {}

  /**
   * Run comprehensive connection test suite
   */
  public async runFullTestSuite(): Promise<ConnectionTestSuite> {
    const results: ConnectionTestSuite = {
      overall: {
        isReady: false,
        score: 0,
        issues: [],
        recommendations: []
      },
      microphone: await this.testMicrophone(),
      webrtc: await this.testWebRTC(),
      network: await this.testNetwork(),
      vapi: await this.testVapiConnection()
    };

    // Calculate overall readiness and score
    this.calculateOverallResults(results);

    return results;
  }

  /**
   * Test microphone functionality with enhanced validation
   */
  public async testMicrophone(): Promise<MicTestResult> {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          isWorking: false,
          volume: 0,
          quality: 'poor',
          latency: 0,
          error: 'getUserMedia not supported in this browser'
        };
      }

      // Request microphone access with optimal settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      });

      return new Promise((resolve) => {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        microphone.connect(analyser);
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;

        let volumeSum = 0;
        let maxVolume = 0;
        let sampleCount = 0;
        const startTime = performance.now();

        // Test for 3 seconds for more accurate results
        const testInterval = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          
          const volume = dataArray.reduce((sum, value) => sum + value) / dataArray.length;
          volumeSum += volume;
          maxVolume = Math.max(maxVolume, volume);
          sampleCount++;

          if (performance.now() - startTime > 3000) {
            clearInterval(testInterval);
            
            const averageVolume = volumeSum / sampleCount;
            const latency = performance.now() - startTime;
            
            // Clean up resources
            stream.getTracks().forEach(track => track.stop());
            audioContext.close();

            const result: MicTestResult = {
              isWorking: averageVolume > 5 && maxVolume > 20,
              volume: averageVolume,
              quality: this.calculateAudioQuality(averageVolume, maxVolume),
              latency
            };

            resolve(result);
          }
        }, 50); // More frequent sampling for better accuracy
      });

    } catch (error) {
      return {
        isWorking: false,
        volume: 0,
        quality: 'poor',
        latency: 0,
        error: error instanceof Error ? error.message : 'Microphone test failed'
      };
    }
  }

  /**
   * Test WebRTC connectivity and capabilities
   */
  public async testWebRTC(): Promise<WebRTCTestResult> {
    try {
      // Check WebRTC support
      if (!window.RTCPeerConnection) {
        return {
          isSupported: false,
          canConnect: false,
          error: 'WebRTC not supported in this browser'
        };
      }

      const startTime = performance.now();
      
      // Create test peer connection
      const pc1 = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      const pc2 = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      return new Promise((resolve) => {
        let iceConnectionState: RTCIceConnectionState = 'new';
        let connectionEstablished = false;

        // Set up connection state monitoring
        pc1.oniceconnectionstatechange = () => {
          iceConnectionState = pc1.iceConnectionState;
          if (iceConnectionState === 'connected' || iceConnectionState === 'completed') {
            connectionEstablished = true;
            const latency = performance.now() - startTime;
            
            resolve({
              isSupported: true,
              canConnect: true,
              iceConnectionState,
              latency
            });
            
            // Clean up
            pc1.close();
            pc2.close();
          } else if (iceConnectionState === 'failed' || iceConnectionState === 'disconnected') {
            resolve({
              isSupported: true,
              canConnect: false,
              iceConnectionState,
              error: `ICE connection failed: ${iceConnectionState}`
            });
            
            pc1.close();
            pc2.close();
          }
        };

        // Set up ICE candidate exchange
        pc1.onicecandidate = (event) => {
          if (event.candidate) {
            pc2.addIceCandidate(event.candidate);
          }
        };

        pc2.onicecandidate = (event) => {
          if (event.candidate) {
            pc1.addIceCandidate(event.candidate);
          }
        };

        // Create data channel for testing (helps establish connection)
        pc1.createDataChannel('test');
        
        // Start connection process
        pc1.createOffer()
          .then(offer => pc1.setLocalDescription(offer))
          .then(() => pc2.setRemoteDescription(pc1.localDescription!))
          .then(() => pc2.createAnswer())
          .then(answer => pc2.setLocalDescription(answer))
          .then(() => pc1.setRemoteDescription(pc2.localDescription!))
          .catch(error => {
            resolve({
              isSupported: true,
              canConnect: false,
              error: error.message
            });
            
            pc1.close();
            pc2.close();
          });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!connectionEstablished) {
            resolve({
              isSupported: true,
              canConnect: false,
              iceConnectionState,
              error: 'Connection timeout'
            });
            
            pc1.close();
            pc2.close();
          }
        }, 10000);
      });

    } catch (error) {
      return {
        isSupported: false,
        canConnect: false,
        error: error instanceof Error ? error.message : 'WebRTC test failed'
      };
    }
  }

  /**
   * Test network connectivity and performance
   */
  public async testNetwork(): Promise<NetworkTestResult> {
    const result: NetworkTestResult = {
      isOnline: navigator.onLine
    };

    if (!navigator.onLine) {
      return result;
    }

    try {
      // Test latency with multiple endpoints
      const latencies = await Promise.all([
        this.pingEndpoint('https://www.google.com/favicon.ico'),
        this.pingEndpoint('https://www.cloudflare.com/favicon.ico'),
        this.pingEndpoint('https://api.vapi.ai/health')
      ]);

      const validLatencies = latencies.filter(l => l > 0);
      if (validLatencies.length > 0) {
        result.latency = validLatencies.reduce((sum, l) => sum + l, 0) / validLatencies.length;
        
        // Calculate jitter (variation in latency)
        if (validLatencies.length > 1) {
          const avgLatency = result.latency;
          const variance = validLatencies.reduce((sum, l) => sum + Math.pow(l - avgLatency, 2), 0) / validLatencies.length;
          result.jitter = Math.sqrt(variance);
        }
      }

      // Estimate connection quality based on latency
      if (result.latency) {
        if (result.latency < 100) {
          result.downloadSpeed = 10; // Estimate for good connection
        } else if (result.latency < 300) {
          result.downloadSpeed = 5; // Estimate for fair connection
        } else {
          result.downloadSpeed = 1; // Estimate for poor connection
        }
      }

    } catch {
      // Network test failed, but we're online
      result.latency = 999;
    }

    return result;
  }

  /**
   * Test Vapi service connectivity
   */
  public async testVapiConnection(): Promise<ConnectionTestSuite['vapi']> {
    try {
      // Test if we can initialize Vapi client
      this.vapiClient = new VapiClient({
        publicKey: this.publicKey,
        assistantId: this.assistantId
      });

      await this.vapiClient.initialize();

      const startTime = performance.now();
      
      // Test connection without starting full session
      const connectionStatus = this.vapiClient.getConnectionStatus();
      const latency = performance.now() - startTime;

      return {
        canInitialize: true,
        canConnect: connectionStatus.isConnected,
        latency
      };

    } catch (error) {
      return {
        canInitialize: false,
        canConnect: false,
        error: error instanceof Error ? error.message : 'Vapi connection test failed'
      };
    }
  }

  /**
   * Calculate overall readiness score and provide recommendations
   */
  private calculateOverallResults(results: ConnectionTestSuite): void {
    let score = 0;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Microphone test (25 points)
    if (results.microphone.isWorking) {
      if (results.microphone.quality === 'excellent') score += 25;
      else if (results.microphone.quality === 'good') score += 20;
      else if (results.microphone.quality === 'fair') score += 15;
      else score += 10;
    } else {
      issues.push('Microphone not working or not accessible');
      recommendations.push('Please allow microphone access and check your microphone settings');
    }

    // WebRTC test (25 points)
    if (results.webrtc.canConnect) {
      if (results.webrtc.latency && results.webrtc.latency < 200) score += 25;
      else if (results.webrtc.latency && results.webrtc.latency < 500) score += 20;
      else score += 15;
    } else {
      issues.push('WebRTC connection failed');
      recommendations.push('Check firewall settings and try a different network');
    }

    // Network test (25 points)
    if (results.network.isOnline) {
      if (results.network.latency && results.network.latency < 100) score += 25;
      else if (results.network.latency && results.network.latency < 300) score += 20;
      else if (results.network.latency && results.network.latency < 500) score += 15;
      else score += 10;
    } else {
      issues.push('No internet connection');
      recommendations.push('Please check your internet connection');
    }

    // Vapi connection test (25 points)
    if (results.vapi.canInitialize) {
      score += 25;
    } else {
      issues.push('Cannot connect to Vapi service');
      recommendations.push('Check API keys and network connectivity');
    }

    results.overall = {
      isReady: score >= 70, // 70% threshold for readiness
      score,
      issues,
      recommendations
    };
  }

  /**
   * Calculate audio quality based on volume metrics
   */
  private calculateAudioQuality(averageVolume: number, maxVolume: number): AudioQuality {
    // Consider both average and peak volume for quality assessment
    const volumeScore = (averageVolume * 0.7) + (maxVolume * 0.3);
    
    if (volumeScore > 60) return 'excellent';
    if (volumeScore > 40) return 'good';
    if (volumeScore > 20) return 'fair';
    return 'poor';
  }

  /**
   * Ping an endpoint to measure latency
   */
  private async pingEndpoint(url: string): Promise<number> {
    try {
      const startTime = performance.now();
      await fetch(url, { 
        method: 'HEAD', 
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return performance.now() - startTime;
    } catch {
      return -1; // Failed to reach endpoint
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.vapiClient) {
      this.vapiClient.stopSession().catch(() => {
        // Ignore cleanup errors
      });
    }
  }
}

/**
 * Factory function to create connection tester with environment variables
 */
export function createConnectionTester(): VoiceConnectionTester {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || '';
  
  return new VoiceConnectionTester(publicKey, assistantId);
}
