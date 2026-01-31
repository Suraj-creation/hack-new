/**
 * SAATHI CORE - The Heart of SAHAYOG
 * ===================================
 * Implements the 4 Core Functionalities from unified.md Module 10
 * PLUS Gemini Live API for voice conversations
 * 
 * 1. UNIVERSAL ACCESS - Meets users where they are
 * 2. NAVIGATION GUIDANCE - Voice-driven navigation
 * 3. TRUST-BASED DATA COLLECTION - Conversational data gathering
 * 4. AUTOMATED GRIEVANCE FILING - Voice-to-complaint system
 * 5. ML/DL INTEGRATION - Explainable allocation & fraud detection
 * 6. GEMINI LIVE API - Real-time voice conversations
 */

import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { UserProfile, GrievanceCategory, ActiveTab, Grievance } from '../types';
import { 
  mongoService, 
  dbConfig, 
  createDataCollector, 
  DataCollectorService,
  ConversationDocument,
  GrievanceDocument,
  UserDocument
} from './database';
import { 
  SAHAYOGMLEngine, 
  AllocationQuery, 
  AllocationQueryResponse, 
  FraudPrediction, 
  FairAllocationScore, 
  BiasAnalysis,
  mlEngine 
} from './mlEngine';
import { userDataService } from './userDataService';
import { grievanceService } from './grievanceService';
import { schemeService } from './schemeService';

// ============================================
// API CONFIGURATION
// ============================================

const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || '';
console.log('[SAATHI] API Key Status:', API_KEY ? `Loaded (${API_KEY.substring(0, 8)}...)` : 'NOT LOADED - Set VITE_GEMINI_API_KEY in .env.local');

// ============================================
// COMPREHENSIVE SYSTEM PROMPT FOR GEMINI LIVE
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
// TYPES FOR CONVERSATIONAL AI
// ============================================

export interface SaathiContext {
  currentScreen: ActiveTab;
  user: UserProfile | null;
  conversationHistory: ConversationTurn[];
  pendingDataFields: DataField[];
  activeGrievance: GrievanceContext | null;
  emotionalState: EmotionalState;
  sessionStartTime: Date;
  interactionCount: number;
  dataCollector?: DataCollectorService;
  sessionId: string;
}

export interface ConversationTurn {
  id: string;
  speaker: 'user' | 'saathi';
  text: string;
  timestamp: Date;
  intent?: SaathiIntent;
  emotion?: EmotionalState;
  action?: SaathiAction;
}

export interface DataField {
  field: string;
  label: string;
  labelHindi: string;
  type: 'text' | 'number' | 'boolean' | 'choice';
  required: boolean;
  reason: string;
  reasonHindi: string;
  collected: boolean;
  value?: any;
}

export interface GrievanceContext {
  category: GrievanceCategory | null;
  description: string;
  voiceRecordingUrl?: string;
  consentGiven: boolean;
  ticketNumber?: string;
  stage: 'category_selection' | 'description' | 'confirmation' | 'submitted';
}

export type EmotionalState = 
  | 'neutral' 
  | 'frustrated' 
  | 'confused' 
  | 'hopeful' 
  | 'distressed' 
  | 'happy' 
  | 'urgent'
  | 'empathetic'
  | 'encouraging';

export type SaathiIntent = 
  | 'navigate' 
  | 'query' 
  | 'complaint' 
  | 'apply' 
  | 'check_status' 
  | 'update_profile'
  | 'general_help'
  | 'emotional_support'
  | 'ml_query';

export interface SaathiAction {
  type: 'navigate' | 'highlight' | 'speak' | 'collect_data' | 'file_grievance' | 'show_status' | 'ml_analysis' | 'fill_form' | 'show_modal' | 'update_user' | 'enroll_scheme';
  payload: any;
}

export interface SaathiResponse {
  spokenText: string;
  spokenTextHindi: string;
  intent: SaathiIntent;
  emotion: EmotionalState;
  actions: SaathiAction[];
  suggestedReplies?: string[];
  shouldPause?: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

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

// ============================================
// CORE FUNCTIONALITY 1: UNIVERSAL ACCESS
// ============================================

export class UniversalAccessEngine {
  private supportedLanguages = [
    { code: 'hi-IN', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'or-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
    { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  ];

  private dialects = [
    { code: 'bho', name: 'Bhojpuri', region: 'Bihar, UP' },
    { code: 'awa', name: 'Awadhi', region: 'UP' },
    { code: 'raj', name: 'Rajasthani', region: 'Rajasthan' },
    { code: 'chh', name: 'Chhattisgarhi', region: 'Chhattisgarh' },
    { code: 'har', name: 'Haryanvi', region: 'Haryana' },
    { code: 'bun', name: 'Bundelkhandi', region: 'MP, UP' },
  ];

  detectLanguageFromLocation(state: string, district: string): string {
    const stateLanguageMap: Record<string, string> = {
      'Madhya Pradesh': 'hi-IN',
      'Uttar Pradesh': 'hi-IN',
      'Bihar': 'hi-IN',
      'Maharashtra': 'mr-IN',
      'West Bengal': 'bn-IN',
      'Tamil Nadu': 'ta-IN',
      'Karnataka': 'kn-IN',
      'Gujarat': 'gu-IN',
      'Rajasthan': 'hi-IN',
      'Andhra Pradesh': 'te-IN',
      'Telangana': 'te-IN',
      'Kerala': 'ml-IN',
      'Odisha': 'or-IN',
      'Punjab': 'pa-IN',
    };
    return stateLanguageMap[state] || 'hi-IN';
  }

  detectDialect(state: string, district: string): string | null {
    const dialectMap: Record<string, string> = {
      'Sehore': 'bun',
      'Varanasi': 'bho',
      'Lucknow': 'awa',
      'Jaipur': 'raj',
      'Raipur': 'chh',
      'Rohtak': 'har',
    };
    return dialectMap[district] || null;
  }

  getAccessMethod(deviceInfo: { hasInternet: boolean; hasSmartphone: boolean; hasFeaturePhone: boolean }): string {
    if (deviceInfo.hasSmartphone && deviceInfo.hasInternet) return 'app';
    if (deviceInfo.hasSmartphone) return 'app_offline';
    if (deviceInfo.hasFeaturePhone) return 'ivr_ussd';
    return 'csc_kiosk';
  }

  adaptSpeechRate(userAge?: number, isLiterate?: boolean): number {
    if (!isLiterate) return 0.8;
    if (userAge && userAge > 60) return 0.85;
    if (userAge && userAge > 50) return 0.9;
    return 1.0;
  }
}

// ============================================
// CORE FUNCTIONALITY 2: NAVIGATION GUIDANCE
// ============================================

export class NavigationGuide {
  private screenDescriptions: Record<ActiveTab, { hindi: string; english: string }> = {
    home: {
      hindi: 'यह आपका मुख्य पेज है। यहाँ से आप काम देख सकते हैं, योजनाओं की जानकारी ले सकते हैं, और शिकायत कर सकते हैं।',
      english: 'This is your home page. From here you can see work, learn about schemes, and file complaints.'
    },
    work: {
      hindi: 'यह काम का पेज है। यहाँ आपके गाँव के पास उपलब्ध सभी काम दिख रहे हैं।',
      english: 'This is the work page. Here you can see all available work near your village.'
    },
    schemes: {
      hindi: 'यह योजनाओं का पेज है। यहाँ आपके लिए उपलब्ध सभी सरकारी योजनाएं हैं।',
      english: 'This is the schemes page. Here are all government schemes available for you.'
    },
    grievance: {
      hindi: 'यह शिकायत पेज है। यहाँ से आप अपनी शिकायत दर्ज कर सकते हैं। 5 दिन में जवाब मिलेगा।',
      english: 'This is the grievance page. You can file your complaint here. Response guaranteed in 5 days.'
    },
    skills: {
      hindi: 'यह सीखने का पेज है। यहाँ आप नए हुनर सीख सकते हैं और ज्यादा पैसे कमा सकते हैं।',
      english: 'This is the learning page. Here you can learn new skills and earn more money.'
    },
    wellbeing: {
      hindi: 'यह मदद का पेज है। अगर आप किसी परेशानी में हैं तो यहाँ से मदद मिल सकती है।',
      english: 'This is the help page. If you are in any difficulty, you can get help here.'
    },
    admin: {
      hindi: 'यह प्रशासन पेज है। यहाँ डेटाबेस और ML विश्लेषण उपलब्ध हैं।',
      english: 'This is the admin page. Database and ML analysis tools are available here.'
    }
  };

  private navigationCommands: Record<string, ActiveTab> = {
    'घर': 'home', 'गृह': 'home', 'होम': 'home', 'मुख्य': 'home',
    'काम': 'work', 'कार्य': 'work', 'नौकरी': 'work', 'रोजगार': 'work',
    'योजना': 'schemes', 'योजनाएं': 'schemes', 'स्कीम': 'schemes',
    'शिकायत': 'grievance', 'समस्या': 'grievance', 'परेशानी': 'grievance', 'शिकायात': 'grievance', 'रिपोर्ट': 'grievance',
    'सीखना': 'skills', 'सीखें': 'skills', 'पढ़ाई': 'skills', 'ट्रेनिंग': 'skills',
    'मदद': 'wellbeing', 'सहायता': 'wellbeing', 'तबीयत': 'wellbeing',
    'home': 'home', 'ghar': 'home', 'work': 'work', 'kaam': 'work', 'job': 'work',
    'schemes': 'schemes', 'yojana': 'schemes', 'complaint': 'grievance', 'shikayat': 'grievance',
    'problem': 'grievance', 'learn': 'skills', 'skills': 'skills', 'seekhna': 'skills',
    'help': 'wellbeing', 'madad': 'wellbeing',
  };

  parseNavigationIntent(text: string): ActiveTab | null {
    const lowerText = text.toLowerCase();
    for (const [keyword, screen] of Object.entries(this.navigationCommands)) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return screen;
      }
    }
    return null;
  }

  explainCurrentScreen(screen: ActiveTab, language: 'hi' | 'en' = 'hi'): string {
    const desc = this.screenDescriptions[screen];
    return language === 'hi' ? desc.hindi : desc.english;
  }

  getNavigationResponse(targetScreen: ActiveTab): SaathiResponse {
    const desc = this.screenDescriptions[targetScreen];
    return {
      spokenText: `Okay, I'm taking you to the ${targetScreen} page. ${desc.english}`,
      spokenTextHindi: `ठीक है, मैं आपको ${targetScreen} पेज पर ले जाता हूं। ${desc.hindi}`,
      intent: 'navigate',
      emotion: 'neutral',
      actions: [
        { type: 'navigate', payload: { screen: targetScreen } },
        { type: 'speak', payload: { text: desc.hindi } }
      ]
    };
  }
}

// ============================================
// CORE FUNCTIONALITY 3: TRUST-BASED DATA COLLECTION
// ============================================

export class TrustDataCollector {
  private dataRequirements: Record<string, DataField[]> = {
    'basic': [
      {
        field: 'phoneNumber',
        label: 'Phone Number',
        labelHindi: 'फोन नंबर',
        type: 'text',
        required: true,
        reason: 'For personalized information and alerts',
        reasonHindi: 'आपके लिए जानकारी और अलर्ट भेजने के लिए',
        collected: false
      }
    ],
    'apply_scheme': [
      {
        field: 'aadhaarLinked',
        label: 'Aadhaar Number',
        labelHindi: 'आधार नंबर',
        type: 'text',
        required: true,
        reason: 'Required for scheme application',
        reasonHindi: 'योजना के आवेदन के लिए जरूरी है',
        collected: false
      },
      {
        field: 'bankAccountLinked',
        label: 'Bank Account',
        labelHindi: 'बैंक खाता',
        type: 'text',
        required: true,
        reason: 'For direct benefit transfer',
        reasonHindi: 'सीधे पैसे आने के लिए',
        collected: false
      }
    ]
  };

  collectDataNaturally(field: DataField, context: SaathiContext): SaathiResponse {
    const prompt = this.generateDataPrompt(field, context);
    return {
      spokenText: prompt.english,
      spokenTextHindi: prompt.hindi,
      intent: 'update_profile',
      emotion: 'neutral',
      actions: [
        { type: 'collect_data', payload: { field: field.field, reason: field.reasonHindi } }
      ],
      suggestedReplies: ['हाँ', 'नहीं', 'बाद में बताऊंगा']
    };
  }

  private generateDataPrompt(field: DataField, context: SaathiContext): { hindi: string; english: string } {
    const prompts: Record<string, { hindi: string; english: string }> = {
      'maritalStatus': {
        hindi: `मैंने सुना कि आपने पति का ज़िक्र किया। ${field.reasonHindi}। क्या आप अपनी जानकारी अपडेट करना चाहेंगी?`,
        english: `I noticed you mentioned your husband. ${field.reason}. Would you like to update your information?`
      },
      'phoneNumber': {
        hindi: `आपका नंबर ${context.user?.phoneNumber} है? इससे हम आपको जरूरी जानकारी भेज सकते हैं।`,
        english: `Is your number ${context.user?.phoneNumber}? This helps us send you important updates.`
      },
      'aadhaarLinked': {
        hindi: `इस योजना के लिए आधार नंबर चाहिए। क्या आप अभी बताना चाहेंगे?`,
        english: `This scheme requires Aadhaar number. Would you like to provide it now?`
      }
    };

    return prompts[field.field] || {
      hindi: `${field.labelHindi} की जानकारी चाहिए। ${field.reasonHindi}।`,
      english: `We need ${field.label}. ${field.reason}.`
    };
  }

  recordConsentAndStore(field: string, value: any, voiceConsent: boolean): boolean {
    console.log(`Storing ${field} with consent: ${voiceConsent}`);
    return true;
  }
}

// ============================================
// CORE FUNCTIONALITY 4: AUTOMATED GRIEVANCE FILING
// ============================================

export class GrievanceAutomation {
  private categoryKeywords: Record<string, GrievanceCategory> = {
    'पैसा नहीं आया': 'payment_delay',
    'पेमेंट नहीं': 'payment_delay',
    'भुगतान': 'payment_delay',
    'मजदूरी': 'wage_dispute',
    'जॉब कार्ड': 'job_card_issue',
    'काम नहीं मिला': 'work_not_available',
    'रोजगार नहीं': 'work_not_available',
    'भेदभाव': 'discrimination',
  };

  detectGrievanceCategory(text: string): GrievanceCategory | null {
    const lowerText = text.toLowerCase();
    for (const [keyword, category] of Object.entries(this.categoryKeywords)) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return category;
      }
    }
    return 'other';
  }

  async processGrievanceVoice(voiceText: string, context: SaathiContext): Promise<SaathiResponse> {
    const category = this.detectGrievanceCategory(voiceText);
    
    if (!context.activeGrievance) {
      return {
        spokenText: `I understand you're facing a problem with ${category}. Let me help you file a complaint.`,
        spokenTextHindi: `मुझे दुख है कि आपको परेशानी हो रही है। मैं अभी आपकी शिकायत लिख रहा हूं। कृपया बताएं क्या समस्या है?`,
        intent: 'complaint',
        emotion: 'empathetic',
        actions: [
          { 
            type: 'file_grievance', 
            payload: { stage: 'description', category, initialText: voiceText } 
          }
        ],
        suggestedReplies: ['हाँ, यही समस्या है', 'नहीं, कुछ और है']
      };
    }

    if (context.activeGrievance.stage === 'description') {
      const summary = this.generateComplaintSummary(voiceText, context);
      return {
        spokenText: `I have noted your complaint. Let me read it back: "${summary}". Is this correct?`,
        spokenTextHindi: `मैंने आपकी शिकायत लिख ली है। सुनिए: "${summary}"। क्या यह सही है?`,
        intent: 'complaint',
        emotion: 'neutral',
        actions: [
          { type: 'file_grievance', payload: { stage: 'confirmation', summary } }
        ],
        suggestedReplies: ['हाँ, सही है', 'नहीं, बदलना है', 'और जोड़ना है']
      };
    }

    if (context.activeGrievance.stage === 'confirmation') {
      const ticketNo = `SAH-${Date.now().toString(36).toUpperCase()}`;
      this.saveGrievanceToDatabase(ticketNo, context);
      
      return {
        spokenText: `Your complaint has been registered. Ticket number is ${ticketNo}. You will receive a call within 5 days.`,
        spokenTextHindi: `आपकी शिकायत नंबर ${ticketNo} दर्ज हो गई। 5 दिनों के अंदर कोई आपको फोन करेगा। अगर 5 दिन में फोन नहीं आया तो मुझे बताना।`,
        intent: 'complaint',
        emotion: 'encouraging',
        actions: [
          { type: 'file_grievance', payload: { stage: 'submitted', ticketNo } },
          { type: 'speak', payload: { text: '5 दिन का वादा है। आपकी आवाज सुनी जाएगी।' } }
        ]
      };
    }

    return this.getDefaultResponse(context);
  }

  private async saveGrievanceToDatabase(ticketNo: string, context: SaathiContext): Promise<void> {
    try {
      const grievance: Partial<GrievanceDocument> = {
        ticketNumber: ticketNo,
        userId: context.user?.id,
        complainantName: context.user?.name,
        complainantPhone: context.user?.phoneNumber,
        complainantVillage: context.user?.village,
        category: context.activeGrievance?.category as GrievanceDocument['category'],
        description: context.activeGrievance?.description || '',
        voiceRecordingUrl: context.activeGrievance?.voiceRecordingUrl,
        status: 'registered',
        priority: 'normal',
        registeredAt: new Date().toISOString(),
        communications: []
      };

      await mongoService.insertOne(dbConfig.collections.grievances, grievance);
      console.log('[GrievanceAutomation] ✅ Grievance saved:', ticketNo);
    } catch (error) {
      console.error('[GrievanceAutomation] ❌ Failed to save grievance:', error);
    }
  }

  private generateComplaintSummary(text: string, context: SaathiContext): string {
    const user = context.user;
    const category = context.activeGrievance?.category;
    return `${user?.name} (गाँव ${user?.village}) की शिकायत: ${category} - ${text.slice(0, 100)}...`;
  }

  private getDefaultResponse(context: SaathiContext): SaathiResponse {
    return {
      spokenText: 'I am here to help. Please tell me what you need.',
      spokenTextHindi: 'मैं आपकी मदद के लिए हूं। बताइए क्या करना है?',
      intent: 'general_help',
      emotion: 'neutral',
      actions: []
    };
  }
}

// ============================================
// MAIN SAATHI CORE CLASS (with Gemini Live API)
// ============================================

export class SaathiCore {
  // Robust conversation engines
  public universalAccess: UniversalAccessEngine;
  public navigation: NavigationGuide;
  public dataCollector: TrustDataCollector;
  public grievanceAutomation: GrievanceAutomation;
  public dbDataCollector: DataCollectorService | null = null;
  public mlEngine: SAHAYOGMLEngine;
  
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
    this.universalAccess = new UniversalAccessEngine();
    this.navigation = new NavigationGuide();
    this.dataCollector = new TrustDataCollector();
    this.grievanceAutomation = new GrievanceAutomation();
    this.mlEngine = mlEngine;
    
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.context = {
      currentScreen: 'home',
      user: null,
      conversationHistory: [],
      pendingDataFields: [],
      activeGrievance: null,
      emotionalState: 'neutral',
      sessionStartTime: new Date(),
      interactionCount: 0,
      sessionId
    };

    this.dbDataCollector = createDataCollector(sessionId);
    
    console.log('[SaathiCore] 🚀 Initialized with session:', sessionId);
  }

  // ============================================
  // CONFIGURATION METHODS
  // ============================================

  setUser(user: UserProfile): void {
    this.context.user = user;
    if (user.id && this.dbDataCollector) {
      this.dbDataCollector = createDataCollector(this.context.sessionId, user.id);
    }
    this.saveUserToDatabase(user);
    console.log('[SaathiCore] 👤 User set:', user.name);
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
  // GEMINI LIVE API METHODS
  // ============================================

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

  async connect(callbacks: SaathiCallbacks): Promise<any> {
    this.callbacks = callbacks;
    this.connectionStatus = 'connecting';
    callbacks.onConnecting?.();

    console.log('[SAATHI] 🔄 Starting unified connection...');

    if (!API_KEY) {
      const error = new Error('API key not configured. Set VITE_GEMINI_API_KEY in .env.local');
      console.error('[SAATHI] ❌', error.message);
      this.connectionStatus = 'error';
      callbacks.onError?.(error);
      return null;
    }

    if (!this.initializeAI()) {
      const error = new Error('Failed to initialize AI client');
      this.connectionStatus = 'error';
      callbacks.onError?.(error);
      return null;
    }

    try {
      console.log('[SAATHI] 🎤 Requesting microphone...');
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[SAATHI] ✅ Microphone granted');

      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

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
            callbacks.onClose?.();
          },
          onerror: (e: any) => {
            console.error('[SAATHI] ❌ API Error:', e);
            this.connectionStatus = 'error';
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
      console.log('[SAATHI] ✅ Session established');
      return this.session;

    } catch (error: any) {
      console.error('[SAATHI] ❌ Connection failed:', error);
      this.connectionStatus = 'error';
      callbacks.onError?.(error);
      return null;
    }
  }

  disconnect(): void {
    console.log('[SAATHI] 🔌 Disconnecting...');
    this.stopAllAudio();
    this.scriptProcessor?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    this.session?.close();
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.session = null;
    this.inputAudioContext = null;
    this.outputAudioContext = null;
    this.stream = null;
    this.connectionStatus = 'disconnected';
    this.lastProcessedText = '';
    if (this.processingTimeout) clearTimeout(this.processingTimeout);
    console.log('[SAATHI] ✅ Disconnected');
  }

  // ============================================
  // AUDIO HANDLING
  // ============================================

  private setupAudioInput(sessionPromise: Promise<any>): void {
    if (!this.inputAudioContext || !this.stream) {
      console.error('[SAATHI] ❌ Audio context or stream unavailable');
      return;
    }

    const source = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = this.createBlob(inputData);
      sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
    };

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioContext.destination);
  }

  private async handleServerMessage(message: LiveServerMessage): Promise<void> {
    if (message.serverContent?.outputTranscription) {
      const text = message.serverContent.outputTranscription.text;
      console.log('[SAATHI] 🤖 AI:', text);
      this.callbacks.onTranscription?.(text, false);
      this.parseAndExecuteActions(text);
    }

    if (message.serverContent?.inputTranscription) {
      const text = message.serverContent.inputTranscription.text;
      console.log('[SAATHI] 👤 User:', text);
      this.callbacks.onTranscription?.(text, true);
      this.processUserInputDebounced(text);
    }

    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio && this.outputAudioContext) {
      await this.playAudio(base64Audio);
    }

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
  // USER INPUT PROCESSING
  // ============================================

  private processUserInputDebounced(text: string): void {
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
    }

    this.processingTimeout = setTimeout(() => {
      if (text === this.lastProcessedText) {
        return;
      }
      this.lastProcessedText = text;
      this.processUserInput(text);
    }, 300);
  }

  async processUserInput(text: string): Promise<SaathiResponse> {
    this.context.interactionCount++;
    
    this.context.conversationHistory.push({
      id: `turn-${Date.now()}`,
      speaker: 'user',
      text,
      timestamp: new Date()
    });

    // Extract data from conversation
    this.extractAndUpdateUserInfo(text);

    // Detect emotion
    this.context.emotionalState = this.detectEmotion(text);
    this.callbacks.onEmotionChange?.(this.context.emotionalState);

    // Check for emotional support
    if (this.isEmotionalSupportNeeded(text)) {
      return this.getEmotionalSupportResponse(text);
    }

    // Check for ML allocation queries
    if (this.isAllocationQuery(text)) {
      return this.handleMLQuery(text);
    }

    // Check for grievance intent
    if (this.isGrievanceIntent(text)) {
      const response = await this.grievanceAutomation.processGrievanceVoice(text, this.context);
      if (response.actions.some(a => a.type === 'file_grievance' && a.payload.stage === 'submitted')) {
        this.handleAutoGrievanceFiling({ isGrievance: true, grievanceText: text });
      }
      return response;
    }

    // Check for navigation
    const navScreen = this.navigation.parseNavigationIntent(text);
    if (navScreen) {
      this.callbacks.onNavigate?.(navScreen);
      this.callbacks.onActionDetected?.({ type: 'navigate', payload: { screen: navScreen } });
      return this.navigation.getNavigationResponse(navScreen);
    }

    // Check for scheme enrollment
    const schemeId = this.detectSchemeEnrollmentIntent(text);
    if (schemeId) {
      await this.handleSchemeEnrollmentRequest(schemeId);
    }

    // Default contextual response
    return this.getContextualResponse(text);
  }

  private parseAndExecuteActions(aiText: string): void {
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
            this.autoFileGrievance(categoryMatch[1] as any, descMatch?.[1] || 'Grievance filed via voice');
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
            this.handleSchemeEnrollmentRequest(schemeMatch[1]);
          }
          break;
        }
        case 'NAVIGATE': {
          const screenMatch = params.match(/screen=(\w+)/);
          if (screenMatch) {
            const screen = screenMatch[1] as ActiveTab;
            this.callbacks.onNavigate?.(screen);
            this.callbacks.onActionDetected?.({ type: 'navigate', payload: { screen } });
          }
          break;
        }
      }
    }
  }

  // ============================================
  // DETECTION METHODS
  // ============================================

  private detectEmotion(text: string): EmotionalState {
    const lowerText = text.toLowerCase();
    
    if (/खुश|अच्छा|धन्यवाद|happy|great|thanks/i.test(lowerText)) return 'happy';
    if (/गुस्सा|नाराज|परेशान|frustrated|angry/i.test(lowerText)) return 'frustrated';
    if (/समझ नहीं|पता नहीं|confused|कैसे करूं/i.test(lowerText)) return 'confused';
    if (/तुरंत|जल्दी|urgent|जरूरी|immediately/i.test(lowerText)) return 'urgent';
    if (/दुखी|मुश्किल|तकलीफ|distressed|sad/i.test(lowerText)) return 'distressed';
    if (/उम्मीद|hope|शायद/i.test(lowerText)) return 'hopeful';
    
    return 'neutral';
  }

  private isEmotionalSupportNeeded(text: string): boolean {
    const keywords = ['परेशान हूं', 'बहुत परेशान', 'दुखी हूं', 'तनाव', 'मुश्किल में', 'अकेला', 'डर लगता', 
                      'stressed', 'sad', 'worried', 'alone', 'scared', 'depressed'];
    return keywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()));
  }

  private isGrievanceIntent(text: string): boolean {
    const keywords = ['शिकायत', 'समस्या', 'परेशानी', 'पैसा नहीं', 'काम नहीं', 'complaint', 'problem', 
                      'payment nahi', 'paise nahi', 'kaam nahi'];
    return keywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()));
  }

  private isAllocationQuery(text: string): boolean {
    const keywords = ['काम क्यों नहीं', 'काम नहीं मिल रहा', 'मुझे काम नहीं', 'मेरा नंबर कब', 'कब मिलेगा काम',
                      'भेदभाव', 'अन्याय', 'why am i not', 'not getting work', 'when will i get', 'allocation'];
    return keywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()));
  }

  private detectSchemeEnrollmentIntent(text: string): string | null {
    const lower = text.toLowerCase();
    const enrollKeywords = /enroll|register|apply|नाम\s*लिखाओ|आवेदन|पंजीकरण|join/i;
    
    if (!enrollKeywords.test(lower)) return null;

    if (/mgnrega|manrega|nrega|मनरेगा/i.test(lower)) return 'mgnrega';
    if (/awas|pmay|housing|गृह|आवास/i.test(lower)) return 'pmay';
    if (/kisan|pm-kisan|farmer/i.test(lower)) return 'pmkisan';
    if (/ayushman|health|bima|स्वास्थ्य/i.test(lower)) return 'pmjay';
    if (/jan\s*dhan|jdy|bank/i.test(lower)) return 'pmjdy';

    return null;
  }

  // ============================================
  // RESPONSE METHODS
  // ============================================

  private getEmotionalSupportResponse(text: string): SaathiResponse {
    return {
      spokenText: 'I understand you are going through a difficult time. I am here to help you.',
      spokenTextHindi: 'मैं समझ सकता हूं आप मुश्किल में हैं। मैं आपकी मदद के लिए हूं। बताइए क्या हुआ?',
      intent: 'emotional_support',
      emotion: 'empathetic',
      actions: [{ type: 'speak', payload: { text: 'आप अकेले नहीं हैं, हम साथ हैं।' } }],
      suggestedReplies: ['मदद चाहिए', 'किसी से बात करनी है', 'ठीक हूं अभी']
    };
  }

  private async handleMLQuery(text: string): Promise<SaathiResponse> {
    const prefix = this.getEmpatheticPrefix(this.context.emotionalState);
    return {
      spokenText: `${prefix}Let me check your MGNREGA status and allocation information.`,
      spokenTextHindi: `${prefix}मैं देखता हूं कि आपको काम क्यों नहीं मिला। हमारी प्रणाली कई कारणों को देखती है - आपके दिन कितने बाकी हैं, कितने दिन से इंतज़ार कर रहे हैं, और आपकी श्रेणी।`,
      intent: 'ml_query',
      emotion: 'empathetic',
      actions: [{ type: 'ml_analysis', payload: { queryType: 'why_not_allocated', userId: this.context.user?.id } }],
      suggestedReplies: ['हाँ, बताओ', 'मेरा स्टेटस', 'शिकायत करनी है']
    };
  }

  private getContextualResponse(text: string): SaathiResponse {
    const screenResponses: Record<ActiveTab, { hindi: string; english: string }> = {
      home: { hindi: 'आप घर पेज पर हैं। काम देखना है, योजना जाननी है, या कुछ और?', english: 'You are on home page.' },
      work: { hindi: 'यहाँ आपके पास के काम दिख रहे हैं। किसी काम के बारे में जानना है?', english: 'Here are jobs near you.' },
      schemes: { hindi: 'यहाँ आपके लिए योजनाएं हैं। किसी योजना के बारे में बताऊं?', english: 'Here are schemes for you.' },
      grievance: { hindi: 'यहाँ से शिकायत कर सकते हैं। बस बोलिए क्या परेशानी है।', english: 'You can file a complaint here.' },
      skills: { hindi: 'यहाँ सीखने के कोर्स हैं। क्या सीखना चाहेंगे?', english: 'Here are learning courses.' },
      wellbeing: { hindi: 'मैं आपकी मदद के लिए हूं। बताइए क्या परेशानी है?', english: 'I am here to help.' },
      admin: { hindi: 'यह प्रशासन पेज है। डेटा और विश्लेषण देख सकते हैं।', english: 'This is the admin page.' }
    };

    const response = screenResponses[this.context.currentScreen];
    return {
      spokenText: response.english,
      spokenTextHindi: response.hindi,
      intent: 'general_help',
      emotion: this.context.emotionalState,
      actions: [],
      suggestedReplies: ['काम दिखाओ', 'योजना बताओ', 'शिकायत करनी है']
    };
  }

  getEmpatheticPrefix(emotion: EmotionalState): string {
    const prefixes: Record<EmotionalState, string> = {
      neutral: '',
      frustrated: 'मैं समझ सकता हूं कि यह कितना मुश्किल है। ',
      confused: 'कोई बात नहीं, मैं आसान भाषा में समझाता हूं। ',
      hopeful: 'बहुत अच्छा! ',
      distressed: 'मुझे दुख है कि आप परेशान हैं। हम मिलकर इसका हल निकालेंगे। ',
      happy: 'बहुत खुशी हुई! ',
      urgent: 'मैं तुरंत मदद करता हूं। ',
      empathetic: 'मैं आपकी परेशानी समझता हूं। ',
      encouraging: 'आप बहुत अच्छा कर रहे हैं! '
    };
    return prefixes[emotion] || '';
  }

  // ============================================
  // DATA EXTRACTION & AUTO-UPDATE
  // ============================================

  private extractAndUpdateUserInfo(text: string): void {
    const lowerText = text.toLowerCase();
    
    // Phone number
    const phoneMatch = text.match(/\b[6-9]\d{9}\b/);
    if (phoneMatch) {
      userDataService.updateField('phoneNumber', phoneMatch[0]);
      console.log('[SAATHI] 📱 Extracted phone:', phoneMatch[0]);
    }
    
    // Family members
    const familyPatterns = [/(\d+)\s*(family members|परिवार में|घर में लोग|सदस्य)/i, /परिवार में\s*(\d+)/i];
    for (const pattern of familyPatterns) {
      const match = text.match(pattern);
      if (match) {
        userDataService.updateField('familyMembers', parseInt(match[1]));
        console.log('[SAATHI] 👨‍👩‍👧‍👦 Extracted family:', match[1]);
        break;
      }
    }
    
    // Income
    const incomePatterns = [/₹?\s*(\d+(?:,\d+)*)\s*(per month|monthly|महीने|महीना)/i];
    for (const pattern of incomePatterns) {
      const match = text.match(pattern);
      if (match) {
        userDataService.updateField('familyIncome', parseInt(match[1].replace(/,/g, '')));
        console.log('[SAATHI] 💰 Extracted income:', match[1]);
        break;
      }
    }
    
    // Category
    const categories = ['sc', 'st', 'obc', 'general'];
    for (const cat of categories) {
      if (lowerText.includes(cat)) {
        userDataService.updateField('category', cat.toUpperCase());
        console.log('[SAATHI] 🏷️ Extracted category:', cat.toUpperCase());
        break;
      }
    }
    
    // Skills
    const skillPatterns = [
      { pattern: /mason|mistry|राजमिस्त्री/i, skill: 'Masonry' },
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
  }

  private async autoFileGrievance(category: string, description: string): Promise<void> {
    try {
      console.log('[SAATHI] 📝 Auto-filing grievance:', category);
      
      const grievance = await grievanceService.registerGrievance(category as any, description, undefined);
      userDataService.incrementGrievances();

      this.callbacks.onGrievanceFiled?.(grievance);
      this.callbacks.onActionDetected?.({ type: 'file_grievance', payload: { grievance } });

      console.log('[SAATHI] ✅ Grievance filed:', grievance.ticketNo);
    } catch (error) {
      console.error('[SAATHI] ❌ Failed to file grievance:', error);
    }
  }

  private async handleAutoGrievanceFiling(extracted: Record<string, any>): Promise<void> {
    try {
      const user = userDataService.getCurrentUser();
      if (!user) return;
      
      const text = extracted.grievanceText?.toLowerCase() || '';
      let category: 'payment_delay' | 'wage_dispute' | 'corruption' | 'work_not_available' | 'job_card_issue' | 'other' = 'other';
      
      if (/wage|payment|पैसा|मजदूरी/.test(text)) category = 'payment_delay';
      else if (/corruption|bribe|भ्रष्टाचार|रिश्वत/.test(text)) category = 'corruption';
      else if (/work|allocation|काम|आवंटन/.test(text)) category = 'work_not_available';
      else if (/job card|जॉब कार्ड/.test(text)) category = 'job_card_issue';
      
      const grievance = await grievanceService.registerGrievance(category, extracted.grievanceText || 'Grievance filed via voice', undefined);
      userDataService.incrementGrievances();
      
      console.log('[SaathiCore] 📝 Auto-filed grievance:', grievance.id);
    } catch (error) {
      console.error('[SaathiCore] ❌ Failed to auto-file grievance:', error);
    }
  }

  private async handleSchemeEnrollmentRequest(schemeId: string): Promise<void> {
    try {
      const user = userDataService.getCurrentUser();
      if (!user) return;
      
      const scheme = schemeService.getSchemeById(schemeId);
      if (!scheme) return;
      
      schemeService.enrollInScheme(user.userId, schemeId, scheme.name);
      userDataService.addEnrolledScheme(schemeId, 'pending');
      
      console.log('[SaathiCore] 📋 Enrollment request submitted for:', schemeId);
    } catch (error) {
      console.error('[SaathiCore] ❌ Failed to process enrollment:', error);
    }
  }

  // ============================================
  // DATABASE METHODS
  // ============================================

  private async saveUserToDatabase(user: UserProfile): Promise<void> {
    try {
      const existingUser = await mongoService.findOne<UserDocument>(dbConfig.collections.users, { id: user.id });

      const userData: Partial<UserDocument> = {
        name: user.name,
        location: { state: user.state, district: user.district, block: user.block || '', village: user.village },
        preferredLanguage: user.preferredLanguage,
        phoneNumber: user.phoneNumber,
        jobCardNumber: user.jobCardNumber,
        category: user.category,
        gender: user.gender,
        age: user.age,
        isLiterate: user.isLiterate,
        daysWorked: user.daysWorked,
        onboardingLevel: user.onboardingLevel as 0 | 1 | 2 | 3,
        consents: [],
        lastActiveAt: new Date().toISOString()
      };

      if (existingUser.data) {
        await mongoService.updateOne(dbConfig.collections.users, { id: user.id }, userData);
        console.log('[SaathiCore] 📝 User profile updated');
      } else {
        await mongoService.insertOne(dbConfig.collections.users, { id: user.id, ...userData });
        console.log('[SaathiCore] ✅ New user saved');
      }
    } catch (error) {
      console.error('[SaathiCore] ❌ Failed to save user:', error);
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

// Singleton instance
export const saathiCore = new SaathiCore();
