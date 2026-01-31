
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UIMode, UserProfile, ActiveTab, OnboardingLevel } from './types';
import SaathiConversationalUI from './components/Sathi/SaathiConversationalUI';
import HomeModule from './components/Modules/HomeModule';
import WorkModule from './components/Modules/WorkModule';
import SchemesModule from './components/Modules/SchemesModule';
import GrievanceModule from './components/Modules/GrievanceModule';
import SkillsModule from './components/Modules/SkillsModule';
import WellbeingModule from './components/Modules/WellbeingModule';
import AdminModule from './components/Modules/AdminModule';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import { saathiCore, EmotionalState, ConnectionStatus, SaathiAction } from './services/saathiCore';
import { logSetupStatus } from './services/configChecker';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ActiveTab>('home');
  const [uiMode, setUiMode] = useState<UIMode>(UIMode.STANDARD);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [user, setUser] = useState<UserProfile>({
    id: '123',
    name: 'Ramesh Singh',
    village: 'Piparia',
    block: 'Ashta',
    district: 'Sehore',
    state: 'Madhya Pradesh',
    preferredLanguage: 'hi-IN',
    uiMode: UIMode.STANDARD,
    daysWorked: 45,
    onboardingLevel: 3,
    aadhaarLinked: true,
    phoneNumber: '9876543210',
    isLiterate: true,
    bankAccountLinked: true,
    registeredSchemes: ['mgnrega', 'pmjdy'],
    pendingPayments: 2880,
    lastActiveDate: new Date().toISOString()
  });

  const [isSathiActive, setIsSathiActive] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [aiTranscription, setAiTranscription] = useState('');
  const [userTranscription, setUserTranscription] = useState('');
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('neutral');
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const wakeWordRecognitionRef = useRef<any>(null);

  // Log setup status on mount
  useEffect(() => {
    logSetupStatus();
  }, []);

  // Initialize SAATHI Core with user
  useEffect(() => {
    saathiCore.setUser(user);
    saathiCore.setCurrentScreen(currentScreen);
  }, [user, currentScreen]);

  // Wake Word Detection
  const startWakeWordListener = useCallback(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition || wakeWordRecognitionRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN';

    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const text = lastResult[0].transcript.toLowerCase();
      
      // Keywords for "Sathi" in various dialects
      if (text.includes('sathi') || text.includes('साथी') || text.includes('saathi')) {
        if (!isLive) {
          handleStartLive();
        }
      }
    };

    recognition.onerror = () => {
        // Silently restart on error to keep listening
        setTimeout(() => {
            try { recognition.start(); } catch(e) {}
        }, 1000);
    };

    recognition.onend = () => {
        if (!isLive) {
            try { recognition.start(); } catch(e) {}
        }
    };

    try {
        recognition.start();
        wakeWordRecognitionRef.current = recognition;
    } catch(e) {}
  }, [isLive]);

  useEffect(() => {
    startWakeWordListener();
    return () => wakeWordRecognitionRef.current?.stop();
  }, [startWakeWordListener]);

  const handleStartLive = async () => {
    setIsSathiActive(true);
    setConnectionError(null);
    setConnectionStatus('connecting');
    wakeWordRecognitionRef.current?.stop();

    // Use unified saathiCore for everything
    const session = await saathiCore.connect({
      onConnecting: () => {
        setConnectionStatus('connecting');
      },
      onConnected: () => {
        setIsLive(true);
        setConnectionStatus('connected');
      },
      onTranscription: (text, isUser) => {
        if (isUser) {
          setUserTranscription(text);
          setIsUserSpeaking(true);
          setIsSpeaking(false);
        } else {
          setAiTranscription(text);
          setIsUserSpeaking(false);
          setIsSpeaking(true);
        }
      },
      onNavigate: (screen: ActiveTab) => {
        setCurrentScreen(screen);
        console.log('[APP] Navigation to:', screen);
      },
      onActionDetected: (action: SaathiAction) => {
        console.log('[APP] Action detected:', action.type);
        if (action.type === 'navigate') {
          setCurrentScreen(action.payload.screen);
        }
      },
      onEmotionChange: (emotion: EmotionalState) => {
        setEmotionalState(emotion);
      },
      onGrievanceFiled: (grievance) => {
        console.log('[APP] Grievance filed:', grievance.ticketNo);
        // Could show toast notification here
      },
      onInterrupted: () => {
        setIsUserSpeaking(true);
        setIsSpeaking(false);
      },
      onError: (error) => {
        console.error('[SAATHI] Connection error:', error);
        const errorMsg = error.message || 'Unknown connection error';
        setConnectionError(errorMsg);
        setConnectionStatus('error');
        setIsLive(false);
        setIsSathiActive(false);
        
        // Show error for 5 seconds then allow retry
        setTimeout(() => {
          setConnectionError(null);
          startWakeWordListener();
        }, 5000);
      },
      onClose: () => {
        setIsLive(false);
        setIsSathiActive(false);
        setIsSpeaking(false);
        setConnectionStatus('disconnected');
        startWakeWordListener();
      }
    });

    // If connection failed immediately (no session returned)
    if (!session) {
      setIsSathiActive(false);
      setIsLive(false);
      startWakeWordListener();
    }
  };

  const handleStopLive = () => {
    saathiCore.disconnect();
    setIsLive(false);
    setIsSathiActive(false);
    setIsSpeaking(false);
    setAiTranscription('');
    setUserTranscription('');
    setSuggestedReplies([]);
    startWakeWordListener();
  };

  const handleNavigate = (screen: ActiveTab) => {
    setCurrentScreen(screen);
    saathiCore.setCurrentScreen(screen);
  };

  const renderModule = () => {
    switch (currentScreen) {
      case 'work': return <WorkModule uiMode={uiMode} user={user} />;
      case 'schemes': return <SchemesModule uiMode={uiMode} />;
      case 'grievance': return <GrievanceModule uiMode={uiMode} />;
      case 'skills': return <SkillsModule uiMode={uiMode} />;
      case 'wellbeing': return <WellbeingModule uiMode={uiMode} />;
      case 'admin': return <AdminModule />;
      default: return <HomeModule user={user} uiMode={uiMode} onTabChange={setCurrentScreen} />;
    }
  };

  const handleOnboardingComplete = (profile: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...profile }));
    setShowOnboarding(false);
  };

  // Show onboarding for new users
  if (showOnboarding) {
    return (
      <OnboardingFlow 
        onComplete={handleOnboardingComplete}
        uiMode={uiMode}
      />
    );
  }

  return (
    <div className={`min-h-screen pb-20 md:pb-24 transition-colors duration-500 ${uiMode === UIMode.HIGH_CONTRAST ? 'bg-black text-yellow-400' : 'bg-slate-50 text-slate-900'} ${isLive ? 'ring-4 md:ring-8 ring-blue-500/20 ring-inset' : ''}`}>
      {/* Header - Responsive */}
      <header className={`px-3 py-3 md:px-6 md:py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm transition-all ${uiMode === UIMode.HIGH_CONTRAST ? 'bg-black border-b-2 border-yellow-400' : 'bg-white/80 backdrop-blur-md'}`}>
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold transition-all ${isLive ? 'bg-blue-600 scale-110 shadow-lg' : 'bg-slate-800'}`}>S</div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight">SAHAYOG</h1>
            <p className="text-[8px] md:text-[10px] uppercase font-bold opacity-60 tracking-widest hidden sm:block">Village Sathi Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {isLive && <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>}
            <button 
              onClick={() => handleNavigate('admin')}
              className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all ${
                currentScreen === 'admin' 
                  ? 'bg-orange-600 text-white' 
                  : uiMode === UIMode.HIGH_CONTRAST 
                    ? 'border-2 border-yellow-400' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
              }`}
            >
              🛡️ ADMIN
            </button>
            <button 
              onClick={() => setUiMode(uiMode === UIMode.STANDARD ? UIMode.PICTURE : UIMode.STANDARD)}
              className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all ${uiMode === UIMode.HIGH_CONTRAST ? 'border-2 border-yellow-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'}`}
            >
              {uiMode === UIMode.PICTURE ? 'TEXT' : 'PICTURE'}
            </button>
        </div>
      </header>

      {/* Main Content - Responsive Container */}
      <main className="w-full max-w-4xl mx-auto px-3 md:px-6 py-4 md:py-6">
        {renderModule()}
      </main>

      {/* SATHI Conversational UI - Full Screen Overlay */}
      <SaathiConversationalUI 
        isActive={isSathiActive} 
        onClose={handleStopLive}
        onNavigate={handleNavigate}
        aiTranscription={aiTranscription}
        userTranscription={userTranscription}
        isListening={isUserSpeaking}
        isSpeaking={isSpeaking}
        uiMode={uiMode}
        suggestedReplies={suggestedReplies}
        currentScreen={currentScreen}
        emotionalState={emotionalState}
        connectionStatus={connectionStatus}
        connectionError={connectionError}
      />

      {/* Bottom Nav - Responsive */}
      <nav className={`fixed bottom-0 left-0 right-0 h-16 md:h-20 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] border-t flex justify-around items-center z-30 transition-all ${uiMode === UIMode.HIGH_CONTRAST ? 'bg-black border-yellow-400' : 'bg-white/95 backdrop-blur-md border-slate-100'}`}>
        <NavItem icon="fa-house" label="Home" active={currentScreen === 'home'} onClick={() => handleNavigate('home')} uiMode={uiMode} />
        <NavItem icon="fa-briefcase" label="Work" active={currentScreen === 'work'} onClick={() => handleNavigate('work')} uiMode={uiMode} />
        
        {/* Central Mic Button */}
        <div 
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full -mt-8 md:-mt-12 flex items-center justify-center text-white shadow-2xl cursor-pointer transition-all active:scale-95 touch-manipulation ${isLive ? 'bg-red-500 rotate-45' : 'bg-gradient-to-br from-orange-400 to-orange-600 sathi-pulse'}`}
            onClick={isLive ? handleStopLive : handleStartLive}
        >
           <i className={`fa-solid ${isLive ? 'fa-xmark' : 'fa-microphone'} text-xl md:text-2xl`}></i>
        </div>

        <NavItem icon="fa-landmark" label="Schemes" active={currentScreen === 'schemes'} onClick={() => handleNavigate('schemes')} uiMode={uiMode} />
        <NavItem icon="fa-circle-exclamation" label="Report" active={currentScreen === 'grievance'} onClick={() => handleNavigate('grievance')} uiMode={uiMode} />
      </nav>
      
      {/* Wake Word Hint - Only on non-mobile */}
      {!isLive && (
          <div className="hidden sm:block fixed bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-1 rounded-full text-[10px] font-bold text-slate-400 shadow-sm border border-slate-100">
             Say "SATHI" to start
          </div>
      )}
    </div>
  );
};

const NavItem: React.FC<{icon: string, label: string, active: boolean, onClick: () => void, uiMode: UIMode}> = ({icon, label, active, onClick, uiMode}) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-0.5 md:gap-1 p-2 md:p-3 transition-all touch-manipulation ${active ? (uiMode === UIMode.HIGH_CONTRAST ? 'text-white' : 'text-orange-600') : 'opacity-40 hover:opacity-100 active:opacity-80'}`}>
    <i className={`fa-solid ${icon} text-lg md:text-xl`}></i>
    {uiMode !== UIMode.PICTURE && <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider">{label}</span>}
  </button>
);

export default App;
