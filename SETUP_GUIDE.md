# SAHAYOG SAATHI - Setup Guide

## 🚀 Quick Start

### 1. Get Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the API key

### 2. Configure API Key

Create a file named `.env.local` in the `Sahyog` folder:

```bash
# Sahyog/.env.local
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

**Important:** Replace `your_actual_api_key_here` with your actual API key from step 1.

### 3. Install Dependencies

```bash
cd Sahyog
npm install
```

### 4. Run the Application

```bash
npm run dev
```

The app will open at `http://localhost:3000` (or `http://localhost:3001` if 3000 is busy)

## 🎤 Using SAATHI Voice Assistant

### Prerequisites
- **Microphone:** Required for voice interaction
- **Browser:** Chrome, Edge, or Safari (latest version)
- **Permissions:** Allow microphone access when prompted

### Activation Methods

1. **Say "Saathi" or "साथी"** - Wake word detection
2. **Click the SAATHI button** - Manual activation

### First Time Connection

When you first connect:
1. Browser will ask for microphone permission - **Click "Allow"**
2. You'll see "Connecting to SAATHI..." 
3. Once connected, SAATHI avatar will appear
4. Start speaking in Hindi or English

## 🔧 Troubleshooting

### Error: "API key not found"
- Create `.env.local` file in `Sahyog` folder
- Add: `VITE_GEMINI_API_KEY=your_key`
- Restart the dev server (`npm run dev`)

### Error: "Microphone permission denied"
- Click the microphone icon in browser address bar
- Select "Allow" for microphone
- Refresh the page

### Error: "No microphone found"
- Check if microphone is connected
- Check system sound settings
- Try a different browser

### Connection Disconnects Immediately
- Check browser console (F12) for errors
- Verify API key is correct
- Check internet connection
- Try refreshing the page

### Audio Not Working
- Check system volume
- Check browser permissions
- Try clicking on the page first (browsers require user interaction for audio)

## 🌐 Browser Support

| Browser | Voice Input | Voice Output | Status |
|---------|-------------|--------------|--------|
| Chrome  | ✅          | ✅           | Recommended |
| Edge    | ✅          | ✅           | Recommended |
| Safari  | ✅          | ✅           | Supported |
| Firefox | ⚠️          | ✅           | Limited |

## 📱 Mobile Support

- **Android:** Chrome browser recommended
- **iOS:** Safari browser only (Chrome uses Safari engine)
- Wake word may not work on mobile - use manual activation

## 💡 Tips

1. **Speak clearly** in Hindi or English
2. **Wait for SAATHI** to finish speaking before responding
3. **Use wake word** "Saathi" to activate hands-free
4. **Check connection status** in the UI (connecting/connected/error)

## 🛠️ Development

### Environment Variables

```bash
# Required
VITE_GEMINI_API_KEY=your_gemini_api_key

# Optional (for production)
VITE_MONGODB_URI=your_mongodb_connection_string
```

### Build for Production

```bash
npm run build
npm run preview
```

## 📞 Support

For issues or questions:
1. Check browser console for detailed errors
2. Verify all setup steps completed
3. Check Gemini API quota at [Google AI Studio](https://aistudio.google.com/)

---

**Made with ❤️ for rural India**
