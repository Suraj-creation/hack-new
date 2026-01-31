# 🌾 SAHAYOG - Village Sathi Platform

**Empowering Rural India with AI-Powered Government Scheme Access**

SAHAYOG is a comprehensive digital platform designed to bridge the gap between rural workers and government employment schemes (primarily MGNREGA). It features SAATHI (साथी), an AI-powered voice assistant that understands Hindi and English, providing accessible support to workers with varying literacy levels.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5%20Flash-orange.svg)](https://ai.google.dev/)

---

## 🎯 Vision

Making government schemes and employment opportunities accessible to every rural worker in India, regardless of literacy level, through intuitive voice-based AI assistance in their native language.

## ✨ Key Features

### 🎤 SAATHI - AI Voice Assistant
- **Multilingual Support**: Hindi, English, and regional dialects
- **Voice-First Interface**: Natural conversation using Gemini Live API
- **Emotion Detection**: Context-aware responses based on user sentiment
- **Wake Word Activation**: Hands-free "Saathi" voice trigger
- **Real-time Transcription**: Both user input and AI responses

### 📋 Core Modules

#### 🏠 Home Dashboard
- Personalized user profile
- Quick access to all features
- Work status and pending payments
- Scheme enrollment overview

#### 💼 Work Management
- Available MGNREGA projects
- Work application and tracking
- Attendance management
- Payment status and history
- Days worked counter

#### 📊 Automated Attendance System
- **Geofencing**: Location-based check-in/check-out
- **Face Recognition**: Biometric verification (ML-powered)
- **Fraud Detection**: AI algorithms to prevent proxy attendance
- **Smart Scheduling**: Automated work assignment

#### 🗳️ Grievance Management
- Voice-based complaint filing
- Automatic ticket generation (SAH-XXXX-YYYY format)
- 5-day resolution promise tracking
- Status updates and escalation
- Multi-category support (wage delays, corruption, documentation, etc.)

#### 🎓 Skills & Training
- Available courses and certifications
- Progress tracking
- Video tutorials (offline capable)
- Skill assessment
- Job matching based on skills

#### 💚 Wellbeing Support
- Mental health resources
- Healthcare access
- Emergency contacts
- Community support

#### 🛡️ Admin Panel
- User management
- Analytics dashboard
- ML model monitoring
- System configuration
- Fraud alert management

### 🤖 Machine Learning Features

- **Attendance Fraud Detection**: Pattern recognition for proxy attendance
- **Wage Prediction**: ML models for payment estimation
- **Scheme Recommendations**: Personalized eligibility matching
- **Risk Assessment**: Vulnerability scoring for targeted support
- **Fairness Algorithms**: Equitable work distribution

### 📱 Accessibility

- **Picture Mode**: Large icons for low-literacy users
- **High Contrast Mode**: Enhanced visibility
- **Text-to-Speech**: Audio feedback for all actions
- **Offline Capability**: Critical features work without internet
- **Responsive Design**: Mobile-first, works on any device

---

## 🛠️ Technology Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript 5.6** - Type safety
- **Vite 6.4** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Font Awesome** - Icons

### AI & Voice
- **Google Gemini 2.5 Flash** - Conversational AI
- **Gemini Live API** - Real-time voice interaction
- **Web Speech API** - Wake word detection
- **Web Audio API** - Audio processing

### Backend & Database
- **MongoDB Atlas** - Cloud database
- **Mongoose** - ODM for MongoDB
- **Node.js** - Runtime environment

### Machine Learning
- **TensorFlow.js** - Browser-based ML
- **Custom ML Models** - Fraud detection, predictions
- **Feature Engineering** - Data preprocessing pipelines

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **Gemini API Key** ([Get it here](https://aistudio.google.com/app/apikey))
- **Modern Browser** (Chrome, Edge, or Safari)
- **Microphone** (for voice features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Suraj-creation/hack-new.git
cd hack-new
```

2. **Install dependencies**
```bash
cd Sahyog
npm install
```

3. **Configure API Key**

Create `.env.local` file in the `Sahyog` folder:

```bash
# Gemini API Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Configuration (Optional)
VITE_MONGODB_URI=your_mongodb_connection_string_here
```

**Get your Gemini API key:**
- Visit: https://aistudio.google.com/app/apikey
- Sign in with Google account
- Click "Create API Key"
- Copy and paste into `.env.local`

4. **Start development server**
```bash
npm run dev
```

5. **Open in browser**
```
http://localhost:3000
```

### First Time Setup

1. **Allow microphone access** when prompted
2. **Click SAATHI button** or say "Saathi" to activate voice assistant
3. **Complete onboarding** if prompted
4. **Explore the platform!**

---

## 📖 Usage Guide

### Activating SAATHI

**Method 1: Wake Word**
- Simply say "Saathi" or "साथी"
- Works continuously in the background

**Method 2: Manual**
- Click the SAATHI button in the UI
- Press and hold to speak

### Voice Commands Examples

```
Hindi:
- "मुझे काम चाहिए" (I need work)
- "मेरी शिकायत दर्ज करो" (File my complaint)
- "पैसे कब आएंगे?" (When will payment come?)
- "योजना दिखाओ" (Show schemes)

English:
- "Show available work"
- "File a grievance"
- "Check my payment status"
- "Enroll in scheme"
```

### Module Navigation

```javascript
// Voice commands
"काम दिखाओ"    → Work Module
"शिकायत"       → Grievance Module
"योजना"        → Schemes Module
"घर"           → Home
"स्किल"        → Skills Module
```

---

## 🏗️ Architecture

### Project Structure

```
Sahyog/
├── components/           # React components
│   ├── Modules/         # Feature modules
│   │   ├── HomeModule.tsx
│   │   ├── WorkModule.tsx
│   │   ├── GrievanceModule.tsx
│   │   ├── SchemesModule.tsx
│   │   ├── SkillsModule.tsx
│   │   ├── WellbeingModule.tsx
│   │   ├── AdminModule.tsx
│   │   ├── AttendanceManagementModule.tsx
│   │   └── WorkerAttendanceModule.tsx
│   ├── Onboarding/      # User onboarding flow
│   └── Sathi/           # SAATHI AI components
│       ├── SaathiConversationalUI.tsx
│       └── SathiFloatingWidget.tsx
├── services/            # Business logic & APIs
│   ├── saathiCore.ts           # Main SAATHI service
│   ├── liveService.ts          # Gemini Live API wrapper
│   ├── geminiService.ts        # Gemini integration
│   ├── grievanceService.ts     # Grievance handling
│   ├── schemeService.ts        # Scheme management
│   ├── skillService.ts         # Skills & training
│   ├── authService.ts          # Authentication
│   ├── geoService.ts           # Geolocation
│   ├── mlEngine.ts             # ML model inference
│   ├── automatedAttendance.ts  # Attendance automation
│   ├── fairnessService.ts      # Fair work distribution
│   ├── attendanceScheduler.ts  # Scheduling logic
│   └── database/               # Database services
│       ├── mongoService.ts
│       ├── mlModels_comprehensive.ts
│       ├── fraudDetection.ts
│       ├── featureEngineering.ts
│       └── schemas.ts
├── types.ts             # TypeScript definitions
├── constants.ts         # App constants & prompts
├── App.tsx             # Main application
└── index.tsx           # Entry point
```

### Data Flow

```
User Input (Voice/Touch)
    ↓
SAATHI AI Processing (Gemini Live API)
    ↓
Intent Recognition & Action Parsing
    ↓
Service Layer (Business Logic)
    ↓
Database Operations (MongoDB)
    ↓
ML Processing (if applicable)
    ↓
UI Update & Voice Response
```

### SAATHI Integration Flow

```typescript
// 1. User activates SAATHI
saathiCore.connect({
  onConnected: () => { /* Connected */ },
  onTranscription: (text, isUser) => { /* Handle speech */ },
  onNavigate: (screen) => { /* Navigate to screen */ },
  onActionDetected: (action) => { /* Execute action */ }
});

// 2. SAATHI listens and responds
// 3. Actions are automatically executed
// 4. UI updates in real-time
```

---

## 🧪 Testing

### Configuration Check

The app automatically checks configuration on startup. Look for:

```
============================================================
SAHAYOG SAATHI - Configuration Status
============================================================
✓ Configuration Checks:
  ✅ API Key Present
  ✅ API Key Valid Format
  ✅ Microphone Support
  ✅ Browser Support
  ✅ Audio Context Support

✅ All systems ready!
============================================================
```

### Manual Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Browser Console Tests

```javascript
// Test API key
console.log('API Key:', import.meta.env.VITE_GEMINI_API_KEY ? 'Loaded ✅' : 'Missing ❌');

// Test microphone
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('✅ Microphone working'))
  .catch(err => console.error('❌ Microphone error:', err));
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "API key not found"**
```bash
# Solution: Create .env.local file
echo "VITE_GEMINI_API_KEY=your_key" > Sahyog/.env.local
npm run dev
```

**2. "Microphone permission denied"**
- Click microphone icon in browser address bar
- Select "Allow"
- Refresh page

**3. Connection disconnects immediately**
- Verify API key is correct
- Check API quota at Google AI Studio
- Try in incognito mode
- Click on page before connecting

**4. No audio output**
- Check system volume
- Click on page (browsers require user interaction)
- Check browser audio settings

### Debug Logs

All SAATHI operations are logged with emoji prefixes:
- 🔄 Connection starting
- 🎤 Microphone operations
- 🌐 Network operations
- ✅ Success
- ❌ Errors

Open browser console (F12) to view logs.

---

## 📚 Documentation

- **[Setup Guide](SETUP_GUIDE.md)** - Detailed installation instructions
- **[Testing Guide](TESTING_GUIDE.md)** - Comprehensive debugging guide
- **[Quick Fix](QUICK_FIX.md)** - Common issues and solutions
- **[Fix Summary](FIX_SUMMARY.md)** - Recent bug fixes and improvements

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Add comments for complex logic
- Test voice interactions thoroughly
- Ensure accessibility standards
- Update documentation

---

## 🔒 Security & Privacy

- **Data Encryption**: All sensitive data encrypted
- **Local Processing**: Voice processing happens locally where possible
- **Minimal Data Collection**: Only essential information stored
- **GDPR Compliant**: User data rights respected
- **No Tracking**: No third-party analytics
- **Secure API Keys**: Never commit `.env.local` to version control

### Environment Variables

**Never commit these files:**
- `.env.local`
- `.env.production`
- Any file containing API keys

Add to `.gitignore`:
```
.env.local
.env.*.local
```

---

## 📊 Performance

- **First Load**: ~2-3 seconds
- **Voice Response**: <1 second (network dependent)
- **Bundle Size**: ~500KB (gzipped)
- **Lighthouse Score**: 90+ (Performance, Accessibility, Best Practices)
- **Mobile Optimized**: Touch-friendly, responsive design

---

## 🌍 Localization

Currently Supported:
- 🇮🇳 Hindi (Primary)
- 🇬🇧 English
- Regional dialect support in progress

---

## 📱 Browser Support

| Browser | Voice Input | Voice Output | Status |
|---------|-------------|--------------|--------|
| Chrome 100+ | ✅ | ✅ | Fully Supported |
| Edge 100+ | ✅ | ✅ | Fully Supported |
| Safari 15+ | ✅ | ✅ | Supported |
| Firefox 100+ | ⚠️ | ✅ | Limited (Speech Recognition) |

**Mobile:**
- Android: Chrome recommended
- iOS: Safari (Chrome uses Safari engine)

---

## 🎯 Roadmap

### Phase 1 (Current) ✅
- [x] Core platform with modules
- [x] SAATHI voice assistant
- [x] Grievance management
- [x] Basic ML features
- [x] Automated attendance

### Phase 2 (In Progress) 🚧
- [ ] Advanced ML fraud detection
- [ ] Offline mode
- [ ] Regional language expansion
- [ ] Mobile app (React Native)
- [ ] SMS integration

### Phase 3 (Planned) 📋
- [ ] Blockchain for transparency
- [ ] IoT integration (biometric devices)
- [ ] Advanced analytics dashboard
- [ ] Inter-state worker migration support
- [ ] Bank integration for payments

---

## 👥 Team

- **Project Lead**: Suraj
- **Repository**: [Suraj-creation/hack-new](https://github.com/Suraj-creation/hack-new)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini Team** - For the amazing Conversational AI API
- **MGNREGA Workers** - For inspiration and feedback
- **Rural India** - Our motivation and purpose
- **Open Source Community** - For tools and libraries

---

## 📞 Support

### Issues & Bugs
- Open an issue: [GitHub Issues](https://github.com/Suraj-creation/hack-new/issues)

### Questions
- Check documentation first
- Review [TESTING_GUIDE.md](TESTING_GUIDE.md)
- Review [QUICK_FIX.md](QUICK_FIX.md)

### API Support
- Gemini API Docs: https://ai.google.dev/docs
- Google AI Studio: https://aistudio.google.com/

---

## 🌟 Star This Project

If you find SAHAYOG helpful, please consider giving it a star ⭐ on GitHub!

---

<div align="center">

**Built with ❤️ for Rural India**

*Making government schemes accessible to everyone, everywhere*

</div>
