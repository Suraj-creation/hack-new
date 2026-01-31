# SAATHI Connection Testing & Debugging Guide

## ✅ Pre-Flight Checklist

Before testing SAATHI, ensure:

- [ ] `.env.local` file exists in `Sahyog/` folder
- [ ] API key is added: `VITE_GEMINI_API_KEY=your_key`
- [ ] Dev server restarted after adding .env.local
- [ ] Using Chrome, Edge, or Safari (latest version)
- [ ] Microphone connected and working
- [ ] Internet connection active

## 🧪 Testing Steps

### Step 1: Open Browser Console
1. Open app in browser: `http://localhost:3000`
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Look for configuration status logs

### Step 2: Check Configuration Status

You should see:
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

### Step 3: Test Connection

1. **Say "Saathi"** or click SAATHI button
2. **Allow microphone** when prompted
3. Watch console for connection messages:

**Expected Flow:**
```
[SAATHI] 🔄 Starting unified connection...
[SAATHI] 🎤 Requesting microphone...
[SAATHI] ✅ Microphone granted
[SAATHI] 🔊 Input audio context resumed
[SAATHI] 🔊 Output audio context resumed
[SAATHI] 🌐 Connecting to Gemini Live API...
[SAATHI] ✅ WebSocket opened
[SAATHI] ✅ Session established successfully
```

## 🐛 Common Issues & Solutions

### Issue 1: "API key not found"

**Console shows:**
```
[SAATHI] ❌ Gemini API key not found!
```

**Solution:**
1. Create file: `Sahyog/.env.local`
2. Add line: `VITE_GEMINI_API_KEY=your_actual_key`
3. Get key from: https://aistudio.google.com/app/apikey
4. Restart dev server: `Ctrl+C` then `npm run dev`

### Issue 2: "Microphone permission denied"

**UI shows:** 🎤 Microphone permission denied

**Solution:**
1. Click microphone icon in browser address bar
2. Select "Allow"
3. Refresh page
4. Try connecting again

**Alternative:**
- Go to browser settings → Privacy → Microphone
- Ensure localhost is allowed

### Issue 3: Connection closes immediately

**Console shows:**
```
[SAATHI] ✅ Session established
[SAATHI] 🔴 Connection closed
```

**Possible causes:**
1. **Invalid API key** - Verify key is correct and active
2. **API quota exceeded** - Check at https://aistudio.google.com/
3. **Network issue** - Check internet connection
4. **Browser audio suspended** - Click on page to interact first

**Solutions:**
- Verify API key at Google AI Studio
- Check API usage/quota
- Try in incognito mode
- Click anywhere on page before connecting

### Issue 4: No audio output

**SAATHI connects but you don't hear voice:**

**Solutions:**
1. Check system volume
2. Click on the page (browsers block audio without user interaction)
3. Check browser audio settings
4. Try refreshing and clicking before connecting

### Issue 5: WebSocket errors spam console

**Console shows repeated:**
```
WebSocket is already in CLOSING or CLOSED state
```

**This is now FIXED** in latest version! If you still see this:
1. Pull latest code: `git pull`
2. Restart dev server

## 🔍 Debugging Tools

### Check Configuration Programmatically

Open browser console and run:

```javascript
// Check if API key is loaded
console.log('API Key:', import.meta.env.VITE_GEMINI_API_KEY ? 'Loaded ✅' : 'Missing ❌');

// Check microphone support
console.log('Microphone:', navigator.mediaDevices ? 'Supported ✅' : 'Not supported ❌');

// Check audio context
console.log('AudioContext:', (window.AudioContext || window.webkitAudioContext) ? 'Supported ✅' : 'Not supported ❌');
```

### Test Microphone Manually

```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Microphone working!');
    stream.getTracks().forEach(t => t.stop());
  })
  .catch(err => console.error('❌ Microphone error:', err));
```

## 📊 Expected Network Activity

When connected, you should see in Network tab (F12):
1. WebSocket connection to `generativelanguage.googleapis.com`
2. Status: `101 Switching Protocols` (successful)
3. Connection stays open (not closing immediately)

## 🎯 Testing Checklist

After fixing issues, verify:

- [ ] Configuration check shows all green ✅
- [ ] Connection establishes without errors
- [ ] Microphone permission granted
- [ ] Can see "Connected" status in UI
- [ ] Can hear SAATHI's voice response
- [ ] SAATHI hears and transcribes your speech
- [ ] No WebSocket spam errors in console
- [ ] Connection stays active (doesn't drop immediately)

## 🆘 Still Having Issues?

### Collect Debug Info

Run in console:
```javascript
console.log({
  apiKey: !!import.meta.env.VITE_GEMINI_API_KEY,
  userAgent: navigator.userAgent,
  microphone: !!navigator.mediaDevices,
  audioContext: !!(window.AudioContext || window.webkitAudioContext),
  url: window.location.href
});
```

### Check Gemini API Status

1. Visit: https://aistudio.google.com/
2. Check API key is valid
3. Check usage limits not exceeded
4. Try creating test request in AI Studio

### Browser-Specific Issues

**Chrome/Edge:**
- Usually works best
- Check chrome://settings/content/microphone

**Safari:**
- May need to enable microphone in System Preferences
- Check Safari → Settings → Websites → Microphone

**Firefox:**
- Speech recognition may have limited support
- Try Chrome instead

## 🔧 Advanced Debugging

### Enable Verbose Logging

In `saathiCore.ts`, all operations are already logged with emoji prefixes:
- 🔄 Connection starting
- 🎤 Microphone operations
- 🔊 Audio context operations
- 🌐 Network operations
- ✅ Success
- ❌ Errors
- 🔴 Disconnection

### Check Error Stack Traces

Errors now include full context. Check console for:
```
[SAATHI] ❌ Connection failed: Error
  at <stack trace>
```

This shows exactly where the failure occurred.

---

**Remember:** Most issues are due to missing API key or microphone permissions! ✅
