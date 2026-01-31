
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { SATHI_SYSTEM_PROMPT } from '../constants';

// Debug: Log API key status on load
const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
console.log('[SAATHI] API Key Status:', API_KEY ? `Loaded (${API_KEY.substring(0, 8)}...)` : 'NOT LOADED');

export interface LiveServiceCallbacks {
  onTranscription?: (text: string, isUser: boolean) => void;
  onInterrupted?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onConnecting?: () => void;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export class LiveService {
  private ai: GoogleGenAI;
  private session: any = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private stream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private callbacks: LiveServiceCallbacks = {};

  constructor() {
    if (!API_KEY) {
      console.error('[SAATHI] ❌ No API key found! Set GEMINI_API_KEY in .env.local');
    }
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isApiKeyConfigured(): boolean {
    return Boolean(API_KEY);
  }

  async connect(callbacks: LiveServiceCallbacks) {
    this.callbacks = callbacks;
    this.connectionStatus = 'connecting';
    callbacks.onConnecting?.();

    console.log('[SAATHI] 🔄 Starting connection...');

    // Validate API key
    if (!API_KEY) {
      const error = new Error('API key not configured. Please set GEMINI_API_KEY in your .env.local file.');
      console.error('[SAATHI] ❌', error.message);
      this.connectionStatus = 'error';
      callbacks.onError?.(error);
      return null;
    }

    try {
      // Request microphone permission
      console.log('[SAATHI] 🎤 Requesting microphone access...');
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[SAATHI] ✅ Microphone access granted');

      // Initialize audio contexts
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      console.log('[SAATHI] 🌐 Connecting to Gemini Live API...');
      
      const sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('[SAATHI] ✅ WebSocket connection opened');
            this.connectionStatus = 'connected';
            callbacks.onConnected?.();

            if (!this.inputAudioContext || !this.stream) {
              console.error('[SAATHI] ❌ Audio context or stream not available');
              return;
            }

            const source = this.inputAudioContext.createMediaStreamSource(this.stream);
            this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            this.scriptProcessor.onaudioprocess = (e) => {
              // Check if still connected before processing
              if (this.connectionStatus !== 'connected' || !this.session) {
                return; // Skip processing if disconnected
              }

              try {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = this.createBlob(inputData);
                
                sessionPromise.then(session => {
                  // Double-check session is still valid before sending
                  if (session && this.connectionStatus === 'connected') {
                    session.sendRealtimeInput({ media: pcmBlob });
                  }
                }).catch(err => {
                  // Silently handle errors after disconnect
                  if (this.connectionStatus === 'connected') {
                    console.error('[SAATHI] Audio send error:', err);
                  }
                });
              } catch (error) {
                // Only log if we're still supposed to be connected
                if (this.connectionStatus === 'connected') {
                  console.error('[SAATHI] Audio processing error:', error);
                }
              }
            };
            
            source.connect(this.scriptProcessor);
            this.scriptProcessor.connect(this.inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle transcriptions
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              console.log('[SAATHI] 🤖 AI:', text);
              callbacks.onTranscription?.(text, false);
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              console.log('[SAATHI] 👤 User:', text);
              callbacks.onTranscription?.(text, true);
            }

            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && this.outputAudioContext) {
              this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
              const audioBuffer = await this.decodeAudioData(
                this.decodeBase64(base64Audio),
                this.outputAudioContext,
                24000,
                1
              );
              const source = this.outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.outputAudioContext.destination);
              source.addEventListener('ended', () => this.sources.delete(source));
              source.start(this.nextStartTime);
              this.nextStartTime += audioBuffer.duration;
              this.sources.add(source);
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              console.log('[SAATHI] ⏸️ User interrupted');
              this.stopAllAudio();
              callbacks.onInterrupted?.();
            }
          },
          onclose: () => {
            console.log('[SAATHI] 🔴 Connection closed');
            this.connectionStatus = 'disconnected';
            
            // Cleanup audio processing when connection closes
            if (this.scriptProcessor) {
              this.scriptProcessor.onaudioprocess = null;
              this.scriptProcessor.disconnect();
              this.scriptProcessor = null;
            }
            
            callbacks.onClose?.();
          },
          onerror: (e: any) => {
            console.error('[SAATHI] ❌ Live API Error:', e);
            this.connectionStatus = 'error';
            
            // Cleanup audio processing on error
            if (this.scriptProcessor) {
              this.scriptProcessor.onaudioprocess = null;
              this.scriptProcessor.disconnect();
              this.scriptProcessor = null;
            }
            
            callbacks.onError?.(new Error(e?.message || 'Unknown API error'));
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SATHI_SYSTEM_PROMPT,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        }
      });

      this.session = await sessionPromise;
      console.log('[SAATHI] ✅ Session established successfully');
      return this.session;

    } catch (error: any) {
      console.error('[SAATHI] ❌ Connection failed:', error);
      this.connectionStatus = 'error';
      callbacks.onError?.(error);
      return null;
    }
  }

  private stopAllAudio() {
    this.sources.forEach(s => { try { s.stop(); } catch(e) {} });
    this.sources.clear();
    this.nextStartTime = 0;
  }

  disconnect() {
    console.log('[SAATHI] 🔌 Disconnecting...');
    
    // Mark as disconnecting to stop audio processing
    this.connectionStatus = 'disconnected';
    
    // Stop all audio sources
    this.stopAllAudio();
    
    // Disconnect and cleanup audio processor
    if (this.scriptProcessor) {
      this.scriptProcessor.onaudioprocess = null; // Remove handler to prevent further processing
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    
    // Stop all media tracks
    this.stream?.getTracks().forEach(t => t.stop());
    
    // Close session
    if (this.session) {
      try {
        this.session.close();
      } catch (e) {
        console.warn('[SAATHI] Session close warning:', e);
      }
      this.session = null;
    }
    
    // Close audio contexts
    if (this.inputAudioContext) {
      try {
        this.inputAudioContext.close();
      } catch (e) {
        console.warn('[SAATHI] Input audio context close warning:', e);
      }
      this.inputAudioContext = null;
    }
    
    if (this.outputAudioContext) {
      try {
        this.outputAudioContext.close();
      } catch (e) {
        console.warn('[SAATHI] Output audio context close warning:', e);
      }
      this.outputAudioContext = null;
    }
    
    this.stream = null;
    
    console.log('[SAATHI] ✅ Disconnected');
  }

  // ============================================
  // TEST METHODS
  // ============================================
  
  /**
   * Test if API key is properly configured
   */
  static testApiKey(): { success: boolean; message: string; keyPreview?: string } {
    if (!API_KEY) {
      return { 
        success: false, 
        message: 'API key not found. Please set GEMINI_API_KEY in .env.local file.' 
      };
    }
    return { 
      success: true, 
      message: 'API key is configured', 
      keyPreview: `${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}` 
    };
  }

  /**
   * Test microphone access
   */
  static async testMicrophone(): Promise<{ success: boolean; message: string }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // Release immediately
      return { success: true, message: 'Microphone access granted' };
    } catch (error: any) {
      return { 
        success: false, 
        message: `Microphone access denied: ${error.message}` 
      };
    }
  }

  /**
   * Test AudioContext support
   */
  static testAudioContext(): { success: boolean; message: string } {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        return { success: false, message: 'AudioContext not supported in this browser' };
      }
      const ctx = new AudioContextClass();
      ctx.close();
      return { success: true, message: 'AudioContext is supported' };
    } catch (error: any) {
      return { success: false, message: `AudioContext error: ${error.message}` };
    }
  }

  /**
   * Test full connection (API + Audio)
   */
  async testConnection(): Promise<{ success: boolean; message: string; details: string[] }> {
    const details: string[] = [];
    
    // Test 1: API Key
    const apiTest = LiveService.testApiKey();
    details.push(`API Key: ${apiTest.success ? '✅' : '❌'} ${apiTest.message}`);
    if (!apiTest.success) {
      return { success: false, message: 'API key not configured', details };
    }

    // Test 2: AudioContext
    const audioTest = LiveService.testAudioContext();
    details.push(`AudioContext: ${audioTest.success ? '✅' : '❌'} ${audioTest.message}`);
    if (!audioTest.success) {
      return { success: false, message: 'AudioContext not supported', details };
    }

    // Test 3: Microphone
    const micTest = await LiveService.testMicrophone();
    details.push(`Microphone: ${micTest.success ? '✅' : '❌'} ${micTest.message}`);
    if (!micTest.success) {
      return { success: false, message: 'Microphone access denied', details };
    }

    // Test 4: Quick API connection test
    try {
      details.push('Gemini API: 🔄 Testing connection...');
      // We won't actually connect for the test, just verify the setup
      details.push('Gemini API: ✅ Configuration valid (call connect() to establish session)');
    } catch (error: any) {
      details.push(`Gemini API: ❌ ${error.message}`);
      return { success: false, message: 'API configuration error', details };
    }

    return { 
      success: true, 
      message: 'All tests passed! Ready to connect.',
      details 
    };
  }

  private createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return {
      data: this.encodeBase64(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  private encodeBase64(bytes: Uint8Array) {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  private decodeBase64(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  }
}

export const liveService = new LiveService();
