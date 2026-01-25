# 🚀 Quick Start: OpenAI TTS

## 30-Second Setup

```bash
# 1. Install OpenAI SDK
npm install openai

# 2. Set your API key (get from https://platform.openai.com/api-keys)
export OPENAI_API_KEY='sk-your-key-here'

# 3. Generate audio
node generate-demo-audio-openai.js

# 4. Create video
node create-demo-video.js

# Done! 🎉
```

---

## 🎤 Voice Quick Reference

| Voice | Use For | Style |
|-------|---------|-------|
| **nova** ⭐ | Demos, tutorials | Warm, engaging female |
| **alloy** | Technical docs | Neutral, balanced |
| **echo** | Professional | Clear male voice |

**Recommendation:** Use `nova` for your demo video!

---

## 💰 Cost

- **Demo video:** ~$0.08 (2,500 characters)
- **Model:** tts-1-hd (best quality)
- **Very affordable!**

---

## 🔧 Customize

Edit `generate-demo-audio-openai.js`:

```javascript
const VOICE = 'nova';      // Change voice
const MODEL = 'tts-1-hd';  // tts-1 or tts-1-hd
const SPEED = 1.0;         // 0.25 to 4.0
```

---

## 🎧 Test Voices First

```bash
# Generate samples of all voices
node test-voices.js

# Listen and compare
open voice-samples/
```

---

## ❓ Troubleshooting

**"API key not set"**
```bash
export OPENAI_API_KEY='your-key'
```

**"Cannot find module 'openai'"**
```bash
npm install openai
```

**"Insufficient quota"**
- Add payment method at https://platform.openai.com/account/billing
- Demo costs less than $0.10

---

## 📚 Full Documentation

See `OPENAI_TTS_GUIDE.md` for complete details.

---

**That's it! Simple and powerful. 🎉**
