/**
 * SAHAYOG - Unified SAATHI Core Service
 * =====================================
 * Single source of truth for all AI-powered features:
 * - Gemini Live API for voice conversations
 * - Automatic grievance filing
 * - User data extraction and updates
 * - Navigation and actions
 * - Emotional intelligence
 */

import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ActiveTab, UserProfile, Grievance } from '../types';
import { grievanceService } from './grievanceService';
import { userDataService } from './userDataService';
import { schemeService } from './schemeService';

// ============================================
// API CONFIGURATION
// ============================================

const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || '';
console.log('[SAATHI] API Key Status:', API_KEY ? `Loaded (${API_KEY.substring(0, 8)}...)` : 'NOT LOADED - Set VITE_GEMINI_API_KEY in .env.local');

// ============================================
// COMPREHENSIVE SYSTEM PROMPT
// ============================================

const SAATHI_SYSTEM_PROMPT = `
You are SAATHI (साथी), the AI companion for SAHAYOG - a platform helping rural Indian workers access government employment schemes, especially MGNREGA.

═══════════════════════════════════════════════════════════════════
🎯 YOUR CORE RESPONSIBILITIES (You MUST handle these automatically):
═══════════════════════════════════════════════════════════════════

1. **GRIEVANCE DETECTION & FILING** 🚨
   When user mentions ANY of these problems, you MUST:
   - Immediately acknowledge their issue with empathy
   - Say "Main aapki shikayat darj kar raha hoon" (I am filing your complaint)
   - Generate a ticket number format: SAH-XXXX-YYYY
   - Assure them of 5-day resolution promise
   
   TRIGGER KEYWORDS (Hindi/English):
   - "paise nahi aaye" / "payment nahi mila" / "money not received" → wage_delay grievance
   - "kaam nahi mila" / "work nahi diya" / "no work available" → work_denial grievance  
   - "rishwat maanga" / "bribe" / "corruption" / "paisa maanga" → corruption grievance
   - "job card problem" / "card nahi mila" / "card issue" → documentation grievance
   - "galat attendance" / "wrong days" / "attendance fraud" → attendance_fraud grievance
   - "kuch bhi problem" / "mushkil hai" / "pareshani" → other grievance

   RESPONSE FORMAT when filing grievance:
   "Hum samajhte hain aapki pareshani. Main abhi aapki shikayat darj kar raha hoon...
   [ACTION:FILE_GRIEVANCE category=wage_delay description="User's issue in their words"]
   Aapka ticket number hai SAH-XXXX-YYYY. 5 din mein zaroor sunavai hogi."

2. **INFORMATION EXTRACTION** 📊
   Listen carefully and extract these details when mentioned:
   - Phone number (10 digits starting with 6-9)
   - Family members count
   - Village/Block/District names
   - Income information
   - Aadhaar/Job Card status
   - Skills and occupations
   - Category (SC/ST/OBC/General)
   
   When you extract info, confirm: "Maine note kar liya ki aapke [X] hain"
   [ACTION:UPDATE_USER field=phone value=9876543210]

3. **SCHEME ENROLLMENT** 📋
   When user asks about or wants to enroll in schemes:
   - Explain eligibility simply
   - If eligible, say "Main aapka naam darj kar raha hoon"
   [ACTION:ENROLL_SCHEME scheme_id=mgnrega]

4. **NAVIGATION** 🧭
   When user wants to see something:
   - "kaam dikhao" / "work" → [ACTION:NAVIGATE screen=work]
   - "shikayat" / "complaint" → [ACTION:NAVIGATE screen=grievance]
   - "yojana" / "schemes" → [ACTION:NAVIGATE screen=schemes]
   - "ghar" / "home" → [ACTION:NAVIGATE screen=home]
   - "seekho" / "skills" → [ACTION:NAVIGATE screen=skills]

═══════════════════════════════════════════════════════════════════
🗣️ VOICE & PERSONALITY GUIDELINES:
═══════════════════════════════════════════════════════════════════

TONE:
- Use "Hum" (we) not "Main" (I) - builds trust
- Speak like a helpful village elder, not a robot
- Be patient, never show frustration
- Keep responses under 20 seconds
- Use simple Hindi with common English words (passbook, status, payment)

EMPATHY PATTERNS:
- "Main samajh sakta hoon yeh kitna mushkil hai..."
- "Chinta mat karo, hum milkar solve karenge..."
- "Aap akele nahi hain, hum hain na..."

NOISE HANDLING (rural environments):
- If unclear: "Thoda shor hai, kya aap phir se bata sakte hain?"
- Never blame user for audio quality

═══════════════════════════════════════════════════════════════════
📍 CURRENT USER CONTEXT:
═══════════════════════════════════════════════════════════════════
- Name: Ramesh Singh
- Village: Rampur, Block: Ashta, District: Sehore, Madhya Pradesh
- Job Card: MP23-SEH-234567 (Active)
- Days Worked: 45/100 this year, 55 remaining
- Pending Wages: ₹2,880
- MGNREGA Wage Rate: ₹352/day (Madhya Pradesh)
- Category: OBC, BPL Family
- Language: Hindi (Bundelkhandi dialect understood)
- Enrolled Schemes: MGNREGA, PM-JDY, PMSBY

═══════════════════════════════════════════════════════════════════
⚡ CRITICAL RULES:
═══════════════════════════════════════════════════════════════════
1. ALWAYS respond in Hindi primarily (mix simple English terms)
2. NEVER say "I cannot help" - always offer an alternative
3. ALWAYS acknowledge emotions before solutions
4. When in doubt, ask clarifying questions
5. End conversations with "Aur kuch madad chahiye?"
6. For ANY complaint/problem → FILE A GRIEVANCE IMMEDIATELY
7. Use action tags [ACTION:...] for system actions

Remember: You are their TRUSTED COMPANION. They may have traveled far, waited long, faced bureaucratic hurdles. Be the friend who finally helps them.
`;

// ============================================
// TYPE DEFINITIONS
// ============================================

export type EmotionalState = 'neutral' | 'frustrated' | 'confused' | 'hopeful' | 'distressed' | 'happy' | 'urgent' | 'empathetic' | 'encouraging';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SaathiAction {
  type: 'navigate' | 'highlight' | 'fill_form' | 'speak' | 'show_modal' | 'file_grievance' | 'update_user' | 'enroll_scheme';
  payload: any;
}

export interface SaathiResponse {
  spokenText: string;
  spokenTextHindi: string;
  intent: string;
  emotion: EmotionalState;
  actions: SaathiAction[];
  suggestedReplies?: string[];
}

export interface SaathiCallbacks {
  onTranscription?: (text: string, isUser: boolean) => void;
  onActionDetected?: (action: SaathiAction) => void;
  onEmotionChange?: (emotion: EmotionalState) => void;
  onGrievanceFiled?: (grievance: Grievance) => void;
  onInterrupted?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onConnecting?: () => void;
  onNavigate?: (screen: ActiveTab) => void;
}

export interface SaathiContext {
  currentScreen: ActiveTab;
  user: UserProfile | null;
  conversationHistory: Array<{ speaker: 'user' | 'saathi'; text: string; timestamp: Date }>;
  emotionalState: EmotionalState;
  sessionId: string;
  lastGrievanceId?: string;
}

// ============================================
// UNIFIED SAATHI CORE CLASS
// ============================================

export class SaathiCore {
  // Gemini Live API - lazy initialized
  private ai: GoogleGenAI | null = null;
  private session: any = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private stream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  
  // State
  private connectionStatus: ConnectionStatus = 'disconnected';
  private callbacks: SaathiCallbacks = {};
  private context: SaathiContext;
  
  // Processing
  private lastProcessedText: string = '';
  private processingTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Don't initialize GoogleGenAI here - do it lazily when connecting
    this.context = {
      currentScreen: 'home',
      user: null,
      conversationHistory: [],
      emotionalState: 'neutral',
      sessionId: `session-${Date.now()}`
    };
    
    console.log('[SAATHI] ✅ Unified SaathiCore initialized (API client will initialize on connect)');
  }

  // Initialize AI client lazily
  private initializeAI(): boolean {
    if (this.ai) return true;
    
    if (!API_KEY) {
      console.warn('[SAATHI] ⚠️ Cannot initialize AI - API key not set');
      return false;
    }
    
    try {
      this.ai = new GoogleGenAI({ apiKey: API_KEY });
      console.log('[SAATHI] ✅ GoogleGenAI client initialized');
      return true;
    } catch (error) {
      console.error('[SAATHI] ❌ Failed to initialize GoogleGenAI:', error);
      return false;
    }
  }

  // ============================================
  // PUBLIC API - CONFIGURATION
  // ============================================

  setUser(user: UserProfile): void {
    this.context.user = user;
    console.log('[SAATHI] 👤 User set:', user.name);
  }

  setCurrentScreen(screen: ActiveTab): void {
    this.context.currentScreen = screen;
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isApiKeyConfigured(): boolean {
    return Boolean(API_KEY);
  }

  // ============================================
  // PUBLIC API - LIVE CONNECTION
  // ============================================

  async connect(callbacks: SaathiCallbacks): Promise<any> {
    this.callbacks = callbacks;
    this.connectionStatus = 'connecting';
    callbacks.onConnecting?.();

    console.log('[SAATHI] 🔄 Starting unified connection...');

    if (!API_KEY) {
      const error = new Error('❌ Gemini API key not found!\n\n📝 Please create .env.local file in Sahyog folder with:\nVITE_GEMINI_API_KEY=your_api_key\n\n🔑 Get your key from: https://aistudio.google.com/app/apikey');
      console.error('[SAATHI] ❌', error.message);
      this.connectionStatus = 'error';
      callbacks.onError?.(error);
      return null;
    }

    // Initialize AI client lazily
    if (!this.initializeAI()) {
      const error = new Error('Failed to initialize Gemini AI client. Check API key validity.');
      this.connectionStatus = 'error';
      callbacks.onError?.(error);
      return null;
    }

    try {
      // Check for microphone permission
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support microphone access. Please use Chrome, Edge, or Safari.');
      }

      // Request microphone
      console.log('[SAATHI] 🎤 Requesting microphone...');
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      console.log('[SAATHI] ✅ Microphone granted');

      // Initialize audio contexts
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Resume audio contexts (required by browsers for user interaction)
      if (this.inputAudioContext.state === 'suspended') {
        await this.inputAudioContext.resume();
        console.log('[SAATHI] 🔊 Input audio context resumed');
      }
      if (this.outputAudioContext.state === 'suspended') {
        await this.outputAudioContext.resume();
        console.log('[SAATHI] 🔊 Output audio context resumed');
      }

      console.log('[SAATHI] 🌐 Connecting to Gemini Live API...');

      const sessionPromise = this.ai!.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('[SAATHI] ✅ WebSocket opened');
            this.connectionStatus = 'connected';
            callbacks.onConnected?.();
            this.setupAudioInput(sessionPromise);
          },
          onmessage: async (message: LiveServerMessage) => {
            await this.handleServerMessage(message);
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
            console.error('[SAATHI] ❌ API Error:', e);
            this.connectionStatus = 'error';
            
            // Cleanup audio processing on error
            if (this.scriptProcessor) {
              this.scriptProcessor.onaudioprocess = null;
              this.scriptProcessor.disconnect();
              this.scriptProcessor = null;
            }
            
            callbacks.onError?.(new Error(e?.message || 'Unknown error'));
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SAATHI_SYSTEM_PROMPT,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        }
      });

      this.session = await sessionPromise;
      
      if (!this.session) {
        throw new Error('Failed to establish Gemini Live session');
      }
      
      console.log('[SAATHI] ✅ Session established successfully');
      return this.session;

    } catch (error: any) {
      console.error('[SAATHI] ❌ Connection failed:', error);
      this.connectionStatus = 'error';
      
      // Cleanup on error
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
      }
      if (this.inputAudioContext) {
        try { this.inputAudioContext.close(); } catch (e) {}
        this.inputAudioContext = null;
      }
      if (this.outputAudioContext) {
        try { this.outputAudioContext.close(); } catch (e) {}
        this.outputAudioContext = null;
      }
      
      // Provide user-friendly error message
      let userMessage = error.message;
      if (error.name === 'NotAllowedError') {
        userMessage = '🎤 Microphone permission denied. Please allow microphone access and try again.';
      } else if (error.name === 'NotFoundError') {
        userMessage = '🎤 No microphone found. Please connect a microphone and try again.';
      } else if (error.message?.includes('API key')) {
        // Keep the API key error as is (already user-friendly)
      } else {
        userMessage = `Connection failed: ${error.message || 'Unknown error'}`;
      }
      
      callbacks.onError?.(new Error(userMessage));
      return null;
    }
  }

  disconnect(): void {
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
    this.lastProcessedText = '';
    
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
    
    console.log('[SAATHI] ✅ Disconnected');
  }

  // ============================================
  // PRIVATE - AUDIO HANDLING
  // ============================================

  private setupAudioInput(sessionPromise: Promise<any>): void {
    if (!this.inputAudioContext || !this.stream) {
      console.error('[SAATHI] ❌ Audio context or stream unavailable');
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
  }

  private async handleServerMessage(message: LiveServerMessage): Promise<void> {
    // Handle AI transcription
    if (message.serverContent?.outputTranscription) {
      const text = message.serverContent.outputTranscription.text;
      console.log('[SAATHI] 🤖 AI:', text);
      this.callbacks.onTranscription?.(text, false);
      
      // Parse AI response for action tags
      this.parseAndExecuteActions(text);
    }

    // Handle user transcription
    if (message.serverContent?.inputTranscription) {
      const text = message.serverContent.inputTranscription.text;
      console.log('[SAATHI] 👤 User:', text);
      this.callbacks.onTranscription?.(text, true);
      
      // Process user input with debouncing
      this.processUserInputDebounced(text);
    }

    // Handle audio output
    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio && this.outputAudioContext) {
      await this.playAudio(base64Audio);
    }

    // Handle interruption
    if (message.serverContent?.interrupted) {
      console.log('[SAATHI] ⏸️ Interrupted');
      this.stopAllAudio();
      this.callbacks.onInterrupted?.();
    }
  }

  private async playAudio(base64Audio: string): Promise<void> {
    if (!this.outputAudioContext) return;
    
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

  private stopAllAudio(): void {
    this.sources.forEach(s => { try { s.stop(); } catch (e) { } });
    this.sources.clear();
    this.nextStartTime = 0;
  }

  // ============================================
  // PRIVATE - INTELLIGENT PROCESSING
  // ============================================

  private processUserInputDebounced(text: string): void {
    // Clear pending timeout
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
    }

    // Debounce - wait for user to finish speaking
    this.processingTimeout = setTimeout(() => {
      // Skip if already processed
      if (text === this.lastProcessedText) {
        console.log('[SAATHI] ⏭️ Skipping duplicate:', text.substring(0, 30));
        return;
      }
      this.lastProcessedText = text;

      // Process the input
      this.processUserInput(text);
    }, 300);
  }

  private processUserInput(text: string): void {
    console.log('[SAATHI] 🔍 Processing input:', text.substring(0, 50));

    // Add to conversation history
    this.context.conversationHistory.push({
      speaker: 'user',
      text,
      timestamp: new Date()
    });

    // Detect emotion
    const emotion = this.detectEmotion(text);
    if (emotion !== this.context.emotionalState) {
      this.context.emotionalState = emotion;
      this.callbacks.onEmotionChange?.(emotion);
    }

    // Extract user data
    this.extractUserData(text);

    // Detect grievance intent
    const grievanceInfo = this.detectGrievanceIntent(text);
    if (grievanceInfo) {
      this.autoFileGrievance(grievanceInfo.category, grievanceInfo.description);
    }

    // Detect navigation intent
    const navScreen = this.detectNavigationIntent(text);
    if (navScreen) {
      this.callbacks.onNavigate?.(navScreen);
      this.callbacks.onActionDetected?.({
        type: 'navigate',
        payload: { screen: navScreen }
      });
    }

    // Detect scheme enrollment intent
    const schemeId = this.detectSchemeEnrollmentIntent(text);
    if (schemeId) {
      this.autoEnrollScheme(schemeId);
    }
  }

  private parseAndExecuteActions(aiText: string): void {
    // Parse action tags from AI response
    const actionRegex = /\[ACTION:(\w+)(?:\s+([^\]]+))?\]/g;
    let match;

    while ((match = actionRegex.exec(aiText)) !== null) {
      const actionType = match[1];
      const params = match[2] || '';

      console.log('[SAATHI] 🎯 Action detected:', actionType, params);

      switch (actionType) {
        case 'FILE_GRIEVANCE': {
          const categoryMatch = params.match(/category=(\w+)/);
          const descMatch = params.match(/description="([^"]+)"/);
          if (categoryMatch) {
            this.autoFileGrievance(
              categoryMatch[1] as any,
              descMatch?.[1] || 'Grievance filed via voice'
            );
          }
          break;
        }
        case 'UPDATE_USER': {
          const fieldMatch = params.match(/field=(\w+)/);
          const valueMatch = params.match(/value=([^\s]+)/);
          if (fieldMatch && valueMatch) {
            userDataService.updateField(fieldMatch[1], valueMatch[1]);
            console.log('[SAATHI] 📝 Updated user:', fieldMatch[1], '=', valueMatch[1]);
          }
          break;
        }
        case 'ENROLL_SCHEME': {
          const schemeMatch = params.match(/scheme_id=(\w+)/);
          if (schemeMatch) {
            this.autoEnrollScheme(schemeMatch[1]);
          }
          break;
        }
        case 'NAVIGATE': {
          const screenMatch = params.match(/screen=(\w+)/);
          if (screenMatch) {
            const screen = screenMatch[1] as ActiveTab;
            this.callbacks.onNavigate?.(screen);
            this.callbacks.onActionDetected?.({
              type: 'navigate',
              payload: { screen }
            });
          }
          break;
        }
      }
    }
  }

  // ============================================
  // PRIVATE - DETECTION METHODS
  // ============================================

  private detectEmotion(text: string): EmotionalState {
    const lower = text.toLowerCase();

    // Frustrated/Angry
    if (/nahi\s*(aaya|mila|diya)|problem|pareshani|galat|cheating|dhokha|gussa/i.test(lower)) {
      return 'frustrated';
    }
    // Distressed/Urgent
    if (/emergency|urgent|jaldi|bahut\s*zaroor|help|madad|please/i.test(lower)) {
      return 'urgent';
    }
    // Confused
    if (/samajh\s*nahi|kaise|kya\s*karu|pata\s*nahi|confused/i.test(lower)) {
      return 'confused';
    }
    // Happy
    if (/shukriya|thank|mila|aa\s*gaya|bahut\s*accha|khushi/i.test(lower)) {
      return 'happy';
    }
    // Hopeful
    if (/umeed|hope|milega|hoga|please.*help/i.test(lower)) {
      return 'hopeful';
    }

    return 'neutral';
  }

  private detectGrievanceIntent(text: string): { category: string; description: string } | null {
    const lower = text.toLowerCase();

    // Payment/Wage issues
    if (/pais[ea]\s*(nahi|nahin)\s*(aay[ea]|mil[ea])|payment\s*(nahi|delay|pending)|majduri\s*nahi|wage/i.test(lower)) {
      return { category: 'payment_delay', description: text };
    }
    // Work denial
    if (/kaam\s*(nahi|nahin)\s*(mil[ea]|diy[ea])|work\s*(nahi|not)|rojgar\s*nahi/i.test(lower)) {
      return { category: 'work_not_available', description: text };
    }
    // Corruption
    if (/rishwat|bribe|corruption|paisa\s*maang[ea]|ghoos/i.test(lower)) {
      return { category: 'corruption', description: text };
    }
    // Job card issues
    if (/job\s*card|card\s*(nahi|problem|issue)|documentation/i.test(lower)) {
      return { category: 'job_card_issue', description: text };
    }
    // Attendance fraud
    if (/attendance\s*(galat|fraud|wrong)|haziri\s*(galat|kam)/i.test(lower)) {
      return { category: 'attendance_fraud', description: text };
    }
    // General complaint keywords
    if (/shikayat|complaint|problem|mushkil|pareshani/i.test(lower)) {
      return { category: 'other', description: text };
    }

    return null;
  }

  private detectNavigationIntent(text: string): ActiveTab | null {
    const lower = text.toLowerCase();

    if (/\b(kaam|work|rojgar|job)\b/i.test(lower) && /\b(dikha|show|dekhna|batao)\b/i.test(lower)) {
      return 'work';
    }
    if (/\b(shikayat|complaint|grievance)\b/i.test(lower)) {
      return 'grievance';
    }
    if (/\b(yojana|scheme|sarkari)\b/i.test(lower)) {
      return 'schemes';
    }
    if (/\b(ghar|home|main)\b/i.test(lower) && /\b(jao|chalo|back)\b/i.test(lower)) {
      return 'home';
    }
    if (/\b(seekh|skill|training|sikhna)\b/i.test(lower)) {
      return 'skills';
    }

    return null;
  }

  private detectSchemeEnrollmentIntent(text: string): string | null {
    const lower = text.toLowerCase();
    const enrollKeywords = /\b(enroll|register|apply|naam\s*likhao|darz\s*karo|join)\b/i;

    if (!enrollKeywords.test(lower)) return null;

    if (/mgnrega|manrega|nrega|मनरेगा/i.test(lower)) return 'mgnrega';
    if (/awas|pmay|housing|ghar|आवास/i.test(lower)) return 'pmay';
    if (/kisan|pm-kisan|farmer/i.test(lower)) return 'pmkisan';
    if (/ayushman|health|bima|insurance/i.test(lower)) return 'pmjay';
    if (/jan\s*dhan|jdy|bank/i.test(lower)) return 'pmjdy';

    return null;
  }

  // ============================================
  // PRIVATE - DATA EXTRACTION
  // ============================================

  private extractUserData(text: string): void {
    // Phone number
    const phoneMatch = text.match(/\b([6-9]\d{9})\b/);
    if (phoneMatch) {
      userDataService.updateField('phoneNumber', phoneMatch[1]);
      console.log('[SAATHI] 📱 Extracted phone:', phoneMatch[1]);
    }

    // Family members
    const familyMatch = text.match(/(\d+)\s*(log|member|sadasya|bhai|behen|bacche)/i);
    if (familyMatch) {
      userDataService.updateField('familyMembers', parseInt(familyMatch[1]));
      console.log('[SAATHI] 👨‍👩‍👧‍👦 Extracted family:', familyMatch[1]);
    }

    // Income
    const incomeMatch = text.match(/(\d+)\s*(rupay|rupees|rs|₹)\s*(mahina|month|kamate)/i);
    if (incomeMatch) {
      userDataService.updateField('familyIncome', parseInt(incomeMatch[1]));
      console.log('[SAATHI] 💰 Extracted income:', incomeMatch[1]);
    }

    // Category
    const categories = ['sc', 'st', 'obc', 'general'];
    for (const cat of categories) {
      if (text.toLowerCase().includes(cat)) {
        userDataService.updateField('category', cat.toUpperCase());
        console.log('[SAATHI] 🏷️ Extracted category:', cat.toUpperCase());
        break;
      }
    }

    // Skills
    const skillPatterns = [
      { pattern: /mason|mistry|राजमिस्त्री|rajmistri/i, skill: 'Masonry' },
      { pattern: /carpenter|badhai|बढ़ई/i, skill: 'Carpentry' },
      { pattern: /tailor|darzi|सिलाई/i, skill: 'Tailoring' },
      { pattern: /weld|welding|वेल्डिंग/i, skill: 'Welding' },
      { pattern: /farm|kheti|किसान/i, skill: 'Agriculture' }
    ];

    for (const sp of skillPatterns) {
      if (sp.pattern.test(text)) {
        userDataService.addSkill(sp.skill, 'intermediate', false);
        console.log('[SAATHI] 🛠️ Extracted skill:', sp.skill);
      }
    }

    // Village/Location
    const villageMatch = text.match(/\b(village|gaon|गाँव)\s+(\w+)/i);
    if (villageMatch) {
      userDataService.updateField('location.village', villageMatch[2]);
      console.log('[SAATHI] 📍 Extracted village:', villageMatch[2]);
    }
  }

  // ============================================
  // PRIVATE - AUTO ACTIONS
  // ============================================

  private async autoFileGrievance(category: string, description: string): Promise<void> {
    try {
      console.log('[SAATHI] 📝 Auto-filing grievance:', category);
      
      const grievance = await grievanceService.registerGrievance(
        category as any,
        description,
        undefined
      );

      this.context.lastGrievanceId = grievance.id;
      userDataService.incrementGrievances();

      this.callbacks.onGrievanceFiled?.(grievance);
      this.callbacks.onActionDetected?.({
        type: 'file_grievance',
        payload: { grievance }
      });

      console.log('[SAATHI] ✅ Grievance filed:', grievance.ticketNo);
    } catch (error) {
      console.error('[SAATHI] ❌ Failed to file grievance:', error);
    }
  }

  private autoEnrollScheme(schemeId: string): void {
    try {
      const user = userDataService.getCurrentUser();
      if (!user) return;

      const scheme = schemeService.getSchemeById(schemeId);
      if (!scheme) return;

      schemeService.enrollInScheme(user.userId, schemeId, scheme.name);
      userDataService.addEnrolledScheme(schemeId, 'pending');

      this.callbacks.onActionDetected?.({
        type: 'enroll_scheme',
        payload: { schemeId, schemeName: scheme.name }
      });

      console.log('[SAATHI] ✅ Enrolled in scheme:', schemeId);
    } catch (error) {
      console.error('[SAATHI] ❌ Failed to enroll:', error);
    }
  }

  // ============================================
  // AUDIO UTILITIES
  // ============================================

  private createBlob(data: Float32Array): any {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return {
      data: this.encodeBase64(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  private encodeBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  private decodeBase64(base64: string): Uint8Array {
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

  // ============================================
  // TEST METHODS
  // ============================================

  static testApiKey(): { success: boolean; message: string; keyPreview?: string } {
    if (!API_KEY) {
      return { success: false, message: 'API key not found. Set VITE_GEMINI_API_KEY in .env.local' };
    }
    return { success: true, message: 'API key configured', keyPreview: `${API_KEY.substring(0, 8)}...` };
  }

  static async testMicrophone(): Promise<{ success: boolean; message: string }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return { success: true, message: 'Microphone access granted' };
    } catch (error: any) {
      return { success: false, message: `Microphone denied: ${error.message}` };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; details: string[] }> {
    const details: string[] = [];

    const apiTest = SaathiCore.testApiKey();
    details.push(`API Key: ${apiTest.success ? '✅' : '❌'} ${apiTest.message}`);
    if (!apiTest.success) return { success: false, message: 'API key not configured', details };

    const micTest = await SaathiCore.testMicrophone();
    details.push(`Microphone: ${micTest.success ? '✅' : '❌'} ${micTest.message}`);
    if (!micTest.success) return { success: false, message: 'Microphone denied', details };

    details.push('✅ Ready to connect');
    return { success: true, message: 'All tests passed', details };
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const saathiCore = new SaathiCore();
export default saathiCore;
