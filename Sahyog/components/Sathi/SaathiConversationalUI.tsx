import React, { useState, useEffect, useRef } from 'react';
import { SaathiResponse, EmotionalState, SaathiAction } from '../../services/saathiCore';
import { ActiveTab, UIMode } from '../../types';
import { ConnectionStatus } from '../../services/liveService';

// ============================================
// TYPES
// ============================================

interface SaathiConversationalUIProps {
  isActive: boolean;
  onClose: () => void;
  onNavigate: (screen: ActiveTab) => void;
  aiTranscription: string;
  userTranscription: string;
  isListening: boolean;
  isSpeaking: boolean;
  uiMode: UIMode;
  suggestedReplies?: string[];
  currentScreen: ActiveTab;
  emotionalState: EmotionalState;
  connectionStatus?: ConnectionStatus;
  connectionError?: string | null;
}

interface ConversationBubble {
  id: string;
  speaker: 'user' | 'saathi';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}

// ============================================
// AUDIO VISUALIZER COMPONENT
// ============================================

const AudioVisualizer: React.FC<{ 
  isActive: boolean; 
  isSpeaking: boolean;
  color?: string;
}> = ({ isActive, isSpeaking, color = '#FF6B35' }) => {
  const [bars, setBars] = useState<number[]>([0.3, 0.5, 0.7, 0.5, 0.3]);

  useEffect(() => {
    if (!isActive) {
      setBars([0.3, 0.3, 0.3, 0.3, 0.3]);
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => 
        isSpeaking ? 0.3 + Math.random() * 0.7 : 0.2 + Math.random() * 0.3
      ));
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, isSpeaking]);

  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-1 rounded-full transition-all duration-100"
          style={{
            height: `${height * 32}px`,
            backgroundColor: color,
            opacity: isActive ? 1 : 0.3
          }}
        />
      ))}
    </div>
  );
};

// ============================================
// SAATHI AVATAR COMPONENT
// ============================================

const SaathiAvatar: React.FC<{
  emotionalState: EmotionalState;
  isSpeaking: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ emotionalState, isSpeaking, size = 'lg' }) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24 md:w-28 md:h-28'
  };

  const emotionColors: Record<EmotionalState, string> = {
    neutral: 'from-orange-400 to-orange-600',
    frustrated: 'from-red-400 to-orange-500',
    confused: 'from-yellow-400 to-orange-500',
    hopeful: 'from-green-400 to-emerald-500',
    distressed: 'from-purple-400 to-indigo-500',
    happy: 'from-emerald-400 to-green-500',
    urgent: 'from-red-500 to-red-700',
    empathetic: 'from-blue-400 to-indigo-500',
    encouraging: 'from-teal-400 to-cyan-500'
  };

  const emotionEmojis: Record<EmotionalState, string> = {
    neutral: '🙂',
    frustrated: '😔',
    confused: '🤔',
    hopeful: '😊',
    distressed: '🤗',
    happy: '😄',
    urgent: '⚡',
    empathetic: '💙',
    encouraging: '💪'
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Animated rings when speaking */}
      {isSpeaking && (
        <>
          <div className="absolute inset-0 rounded-full bg-orange-400 opacity-20 animate-ping" />
          <div 
            className="absolute inset-0 rounded-full border-2 border-orange-400 opacity-30"
            style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}
          />
        </>
      )}
      
      {/* Main avatar */}
      <div 
        className={`
          relative w-full h-full rounded-full 
          bg-gradient-to-br ${emotionColors[emotionalState]}
          flex items-center justify-center
          shadow-lg border-4 border-white
          transition-all duration-300
          ${isSpeaking ? 'scale-110' : 'scale-100'}
        `}
      >
        <span className="text-4xl md:text-5xl">{emotionEmojis[emotionalState]}</span>
        
        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status badge */}
      <div className={`
        absolute -top-1 -right-1 w-6 h-6 rounded-full
        flex items-center justify-center text-xs
        ${isSpeaking ? 'bg-green-500' : 'bg-orange-500'}
        text-white shadow-md
      `}>
        <i className={`fas ${isSpeaking ? 'fa-volume-up' : 'fa-microphone'}`} />
      </div>
    </div>
  );
};

// ============================================
// QUICK ACTIONS COMPONENT
// ============================================

const QuickActions: React.FC<{
  currentScreen: ActiveTab;
  onSpeak: (text: string) => void;
  uiMode: UIMode;
}> = ({ currentScreen, onSpeak, uiMode }) => {
  const quickActions: Record<ActiveTab, Array<{ icon: string; label: string; labelHindi: string; command: string }>> = {
    home: [
      { icon: 'fa-briefcase', label: 'Find Work', labelHindi: 'काम दिखाओ', command: 'मुझे काम दिखाओ' },
      { icon: 'fa-money-bill', label: 'My Payments', labelHindi: 'भुगतान', command: 'मेरे पैसे दिखाओ' },
      { icon: 'fa-exclamation-circle', label: 'Complaint', labelHindi: 'शिकायत', command: 'शिकायत करनी है' },
    ],
    work: [
      { icon: 'fa-map-marker-alt', label: 'Nearby', labelHindi: 'पास में', command: 'पास का काम दिखाओ' },
      { icon: 'fa-hand-holding-usd', label: 'Best Pay', labelHindi: 'ज्यादा पैसे', command: 'ज्यादा पैसे वाला काम' },
      { icon: 'fa-check-circle', label: 'Apply', labelHindi: 'आवेदन', command: 'यह काम चाहिए' },
    ],
    schemes: [
      { icon: 'fa-question-circle', label: 'Eligible?', labelHindi: 'पात्रता', command: 'मैं किस योजना के लिए पात्र हूं' },
      { icon: 'fa-file-alt', label: 'Apply', labelHindi: 'आवेदन', command: 'आवेदन कैसे करूं' },
      { icon: 'fa-history', label: 'Status', labelHindi: 'स्थिति', command: 'मेरे आवेदन की स्थिति' },
    ],
    grievance: [
      { icon: 'fa-microphone', label: 'Voice', labelHindi: 'बोलो', command: 'शिकायत लिखो' },
      { icon: 'fa-list', label: 'My Complaints', labelHindi: 'शिकायतें', command: 'मेरी शिकायतें दिखाओ' },
      { icon: 'fa-phone', label: 'Call Officer', labelHindi: 'कॉल करो', command: 'अधिकारी से बात करो' },
    ],
    skills: [
      { icon: 'fa-graduation-cap', label: 'Courses', labelHindi: 'कोर्स', command: 'कोर्स दिखाओ' },
      { icon: 'fa-certificate', label: 'Certificates', labelHindi: 'सर्टिफिकेट', command: 'मेरे सर्टिफिकेट' },
      { icon: 'fa-play', label: 'Continue', labelHindi: 'जारी रखें', command: 'पिछला कोर्स जारी रखो' },
    ],
    wellbeing: [
      { icon: 'fa-heart', label: 'Talk', labelHindi: 'बात करो', command: 'मुझे बात करनी है' },
      { icon: 'fa-hospital', label: 'Health', labelHindi: 'स्वास्थ्य', command: 'डॉक्टर से मिलना है' },
      { icon: 'fa-hands-helping', label: 'Help', labelHindi: 'मदद', command: 'मुझे मदद चाहिए' },
    ],
    admin: [
      { icon: 'fa-database', label: 'Data', labelHindi: 'डेटा', command: 'डेटा दिखाओ' },
      { icon: 'fa-chart-bar', label: 'Analytics', labelHindi: 'विश्लेषण', command: 'विश्लेषण दिखाओ' },
      { icon: 'fa-cogs', label: 'Settings', labelHindi: 'सेटिंग्स', command: 'सेटिंग्स खोलो' },
    ],
  };

  const actions = quickActions[currentScreen] || quickActions.home;
  const isPictureMode = uiMode === 'picture';

  return (
    <div className="grid grid-cols-3 gap-2 p-2">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={() => onSpeak(action.command)}
          className={`
            flex flex-col items-center justify-center 
            p-3 rounded-xl transition-all duration-200
            ${isPictureMode 
              ? 'bg-orange-100 hover:bg-orange-200 active:bg-orange-300' 
              : 'bg-gray-50 hover:bg-orange-50 active:bg-orange-100'
            }
            shadow-sm hover:shadow-md
            touch-manipulation
          `}
        >
          <i className={`fas ${action.icon} text-xl md:text-2xl text-orange-500 mb-1`} />
          <span className={`text-xs md:text-sm text-center font-medium text-gray-700 ${isPictureMode ? 'text-base' : ''}`}>
            {action.labelHindi}
          </span>
        </button>
      ))}
    </div>
  );
};

// ============================================
// SUGGESTED REPLIES COMPONENT
// ============================================

const SuggestedReplies: React.FC<{
  replies: string[];
  onSelect: (reply: string) => void;
}> = ({ replies, onSelect }) => {
  if (!replies || replies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl">
      {replies.map((reply, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(reply)}
          className="
            px-4 py-2 bg-white border-2 border-orange-200 
            rounded-full text-sm font-medium text-orange-600
            hover:bg-orange-50 hover:border-orange-400
            active:bg-orange-100
            transition-all duration-200
            touch-manipulation
          "
        >
          {reply}
        </button>
      ))}
    </div>
  );
};

// ============================================
// CONVERSATION BUBBLE COMPONENT
// ============================================

const ConversationBubbleComponent: React.FC<{
  bubble: ConversationBubble;
  uiMode: UIMode;
}> = ({ bubble, uiMode }) => {
  const isUser = bubble.speaker === 'user';
  const isPictureMode = uiMode === 'picture';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mr-2 flex-shrink-0">
          <span className="text-sm">🙂</span>
        </div>
      )}
      <div
        className={`
          max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl
          ${isUser 
            ? 'bg-blue-500 text-white rounded-br-md' 
            : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
          }
          ${isPictureMode ? 'text-lg' : 'text-sm md:text-base'}
        `}
      >
        {bubble.isTyping ? (
          <div className="flex gap-1 py-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        ) : (
          <p className="leading-relaxed">{bubble.text}</p>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center ml-2 flex-shrink-0">
          <i className="fas fa-user text-white text-xs" />
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const SaathiConversationalUI: React.FC<SaathiConversationalUIProps> = ({
  isActive,
  onClose,
  onNavigate,
  aiTranscription,
  userTranscription,
  isListening,
  isSpeaking,
  uiMode,
  suggestedReplies = [],
  currentScreen,
  emotionalState,
  connectionStatus = 'disconnected',
  connectionError = null,
}) => {
  const [conversation, setConversation] = useState<ConversationBubble[]>([]);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Add welcome message on first open
  useEffect(() => {
    if (isActive && conversation.length === 0 && connectionStatus === 'connected') {
      setConversation([{
        id: 'welcome',
        speaker: 'saathi',
        text: 'नमस्ते! मैं साथी हूं। मैं आपकी क्या मदद करूं? बोलिए या नीचे के बटन दबाइए।',
        timestamp: new Date()
      }]);
    }
  }, [isActive, connectionStatus]);

  // Add AI response to conversation
  useEffect(() => {
    if (aiTranscription && aiTranscription.trim()) {
      setConversation(prev => {
        // Check if this message already exists
        const exists = prev.some(b => b.text === aiTranscription && b.speaker === 'saathi');
        if (exists) return prev;
        
        return [...prev, {
          id: `saathi-${Date.now()}`,
          speaker: 'saathi',
          text: aiTranscription,
          timestamp: new Date()
        }];
      });
    }
  }, [aiTranscription]);

  // Add user message to conversation
  useEffect(() => {
    if (userTranscription && userTranscription.trim()) {
      setConversation(prev => {
        const exists = prev.some(b => b.text === userTranscription && b.speaker === 'user');
        if (exists) return prev;
        
        return [...prev, {
          id: `user-${Date.now()}`,
          speaker: 'user',
          text: userTranscription,
          timestamp: new Date()
        }];
      });
      setShowQuickActions(false);
    }
  }, [userTranscription]);

  // Auto-scroll to bottom
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleQuickAction = (command: string) => {
    // Add user message immediately
    setConversation(prev => [...prev, {
      id: `user-${Date.now()}`,
      speaker: 'user',
      text: command,
      timestamp: new Date()
    }]);
    setShowQuickActions(false);
    
    // This would trigger the Live API in a real implementation
    console.log('Quick action:', command);
  };

  if (!isActive) return null;

  const isPictureMode = uiMode === 'picture';
  const isHighContrast = uiMode === 'high_contrast';

  return (
    <div className={`
      fixed inset-0 z-50 
      flex flex-col
      ${isHighContrast ? 'bg-black' : 'bg-gradient-to-b from-orange-50 to-white'}
      transition-all duration-300
    `}>
      {/* Header */}
      <header className={`
        relative flex items-center justify-between 
        px-4 py-3 md:py-4
        ${isHighContrast ? 'bg-black border-b-2 border-yellow-400' : 'bg-white/80 backdrop-blur-sm shadow-sm'}
      `}>
        <button
          onClick={onClose}
          className={`
            p-2 md:p-3 rounded-full
            ${isHighContrast 
              ? 'bg-yellow-400 text-black' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }
            transition-colors touch-manipulation
          `}
        >
          <i className="fas fa-arrow-left text-lg" />
        </button>
        
        <div className="flex items-center gap-3">
          <SaathiAvatar 
            emotionalState={emotionalState} 
            isSpeaking={isSpeaking} 
            size="sm" 
          />
          <div>
            <h1 className={`
              font-bold text-lg md:text-xl
              ${isHighContrast ? 'text-yellow-400' : 'text-gray-800'}
            `}>
              साथी
            </h1>
            <p className={`
              text-xs md:text-sm
              ${isHighContrast ? 'text-yellow-200' : 'text-gray-500'}
            `}>
              {connectionStatus === 'connecting' ? '🔄 जुड़ रहा है...' :
               connectionStatus === 'error' ? '❌ कनेक्शन त्रुटि' :
               isListening ? 'सुन रहा हूं...' : 
               isSpeaking ? 'बोल रहा हूं...' : 'तैयार हूं'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`
            p-2 md:p-3 rounded-full
            ${isHighContrast 
              ? 'bg-red-600 text-white' 
              : 'bg-red-100 hover:bg-red-200 text-red-600'
            }
            transition-colors touch-manipulation
          `}
        >
          <i className="fas fa-times text-lg" />
        </button>
      </header>

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="bg-red-500 text-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <i className="fas fa-exclamation-triangle text-lg" />
              <div className="text-sm">
                <div className="font-bold">Connection Error</div>
                <div className="text-xs opacity-90 whitespace-pre-line">{connectionError}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Connecting Status */}
      {connectionStatus === 'connecting' && (
        <div className="bg-blue-500 text-white px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            <span className="text-sm font-medium">साथी से जुड़ रहे हैं... / Connecting to SAATHI...</span>
          </div>
        </div>
      )}

      {/* Main Conversation Area */}
      <main className={`
        flex-1 overflow-y-auto 
        px-3 md:px-6 py-4
        ${isHighContrast ? 'bg-black' : ''}
      `}>
        {/* Large centered avatar when no conversation */}
        {conversation.length <= 1 && showQuickActions && connectionStatus === 'connected' && (
          <div className="flex flex-col items-center justify-center py-6 md:py-10">
            <SaathiAvatar 
              emotionalState={emotionalState} 
              isSpeaking={isSpeaking} 
              size="lg" 
            />
            <h2 className={`
              mt-4 text-xl md:text-2xl font-bold text-center
              ${isHighContrast ? 'text-yellow-400' : 'text-gray-800'}
            `}>
              नमस्ते! मैं साथी हूं
            </h2>
            <p className={`
              mt-2 text-center
              ${isPictureMode ? 'text-lg' : 'text-sm md:text-base'}
              ${isHighContrast ? 'text-yellow-200' : 'text-gray-600'}
            `}>
              आपकी मदद के लिए हमेशा तैयार
            </p>
            
            {/* Audio Visualizer */}
            <div className="mt-6">
              <AudioVisualizer 
                isActive={isActive} 
                isSpeaking={isSpeaking}
                color={isHighContrast ? '#FBBF24' : '#FF6B35'}
              />
            </div>
          </div>
        )}

        {/* Conversation bubbles */}
        <div className="space-y-2">
          {conversation.map(bubble => (
            <ConversationBubbleComponent 
              key={bubble.id} 
              bubble={bubble} 
              uiMode={uiMode}
            />
          ))}
        </div>
        
        {/* Typing indicator */}
        {isSpeaking && (
          <ConversationBubbleComponent
            bubble={{
              id: 'typing',
              speaker: 'saathi',
              text: '',
              timestamp: new Date(),
              isTyping: true
            }}
            uiMode={uiMode}
          />
        )}
        
        <div ref={conversationEndRef} />
      </main>

      {/* Suggested Replies */}
      {suggestedReplies.length > 0 && (
        <div className="px-3 md:px-6 pb-2">
          <SuggestedReplies 
            replies={suggestedReplies} 
            onSelect={handleQuickAction}
          />
        </div>
      )}

      {/* Quick Actions Grid */}
      {showQuickActions && (
        <div className={`
          px-3 md:px-6 pb-2
          ${isHighContrast ? 'bg-black' : ''}
        `}>
          <QuickActions 
            currentScreen={currentScreen}
            onSpeak={handleQuickAction}
            uiMode={uiMode}
          />
        </div>
      )}

      {/* Bottom Action Bar */}
      <footer className={`
        px-4 py-4 md:py-6
        ${isHighContrast ? 'bg-black border-t-2 border-yellow-400' : 'bg-white border-t border-gray-100'}
      `}>
        <div className="flex items-center justify-center gap-4 max-w-lg mx-auto">
          {/* Type button */}
          <button
            className={`
              p-4 rounded-full
              ${isHighContrast 
                ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
              transition-colors touch-manipulation
            `}
          >
            <i className="fas fa-keyboard text-xl" />
          </button>

          {/* Main Mic Button */}
          <button
            className={`
              relative w-20 h-20 md:w-24 md:h-24 rounded-full
              flex items-center justify-center
              transition-all duration-300 transform
              ${isListening 
                ? 'bg-red-500 scale-110 shadow-xl shadow-red-500/30' 
                : isHighContrast
                  ? 'bg-yellow-400 hover:bg-yellow-300'
                  : 'bg-gradient-to-br from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 shadow-lg'
              }
              touch-manipulation
            `}
          >
            {isListening && (
              <div className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-30" />
            )}
            <i className={`
              fas ${isListening ? 'fa-stop' : 'fa-microphone'} 
              text-3xl md:text-4xl text-white
            `} />
          </button>

          {/* End Call button */}
          <button
            onClick={onClose}
            className={`
              p-4 rounded-full
              ${isHighContrast 
                ? 'bg-red-600 text-white' 
                : 'bg-red-100 text-red-600 hover:bg-red-200'
              }
              transition-colors touch-manipulation
            `}
          >
            <i className="fas fa-phone-slash text-xl" />
          </button>
        </div>

        {/* Status text */}
        <p className={`
          text-center mt-3
          ${isPictureMode ? 'text-base' : 'text-sm'}
          ${isHighContrast ? 'text-yellow-400' : 'text-gray-500'}
        `}>
          {isListening ? '🎤 बोलिए, मैं सुन रहा हूं...' : '👆 माइक दबाकर बोलें'}
        </p>
      </footer>
    </div>
  );
};

export default SaathiConversationalUI;
