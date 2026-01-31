# ⚡ QUICK FIX - SAATHI Not Connecting

## The #1 Most Common Issue: Missing API Key

### 📋 Quick Steps (2 minutes):

1. **Get API Key**
   - Go to: https://aistudio.google.com/app/apikey
   - Sign in with Google
   - Click "Create API Key"
   - Copy the key

2. **Create Config File**
   - Open folder: `Sahyog/`
   - Create new file: `.env.local`
   - Add this line:
   ```
   VITE_GEMINI_API_KEY=paste_your_key_here
   ```

3. **Restart Server**
   - Press `Ctrl+C` in terminal
   - Run: `npm run dev`
   - Refresh browser

4. **Test**
   - Click SAATHI button
   - Allow microphone
   - Should connect! ✅

### 🎤 Second Most Common: Microphone Permission

If you see "Microphone permission denied":

1. Click the microphone icon in browser address bar (or lock icon)
2. Change from "Block" to "Allow"  
3. Refresh the page
4. Try again

### ✅ How to Know It's Working

You should see in browser console (F12):
```
✅ All systems ready!
[SAATHI] ✅ Microphone granted
[SAATHI] ✅ Session established successfully
```

UI should show: "Connected" status and SAATHI speaking

---

**Still stuck?** Read full guide: `TESTING_GUIDE.md`
