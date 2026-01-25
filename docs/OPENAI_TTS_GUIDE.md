# 🎙️ OpenAI TTS Guide for Demo Video

Complete guide to using OpenAI's Text-to-Speech API instead of macOS `say` command for much higher quality audio.

---

## 🚀 Quick Start

### Step 1: Install OpenAI SDK

```bash
cd /Users/santosh/development/pointless-game/lyric-sync
npm install openai
```

### Step 2: Get Your API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

### Step 3: Set Your API Key

**Option A: Temporary (current session only)**
```bash
export OPENAI_API_KEY='sk-your-key-here'
```

**Option B: Permanent (recommended)**
```bash
# Add to your shell config file
echo 'export OPENAI_API_KEY="sk-your-key-here"' >> ~/.zshrc

# Reload your shell
source ~/.zshrc
```

**Option C: Verify it's set**
```bash
echo $OPENAI_API_KEY
```

### Step 4: Generate Audio

```bash
node generate-demo-audio-openai.js
```

### Step 5: Create Video

```bash
node create-demo-video.js
```

---

## 🎤 Voice Options

OpenAI provides 6 different voices. Choose based on your preference:

### Available Voices

| Voice | Gender | Style | Best For |
|-------|--------|-------|----------|
| **nova** ⭐ | Female | Warm, engaging | **Recommended for demos** |
| **alloy** | Neutral | Balanced, clear | Technical content |
| **echo** | Male | Direct, confident | Professional narration |
| **fable** | Male | British, expressive | Storytelling |
| **onyx** | Male | Deep, authoritative | Serious content |
| **shimmer** | Female | Soft, friendly | Casual content |

### Change Voice

Edit `generate-demo-audio-openai.js` line 115:

```javascript
const VOICE = 'nova';  // Change to: alloy, echo, fable, onyx, shimmer
```

---

## 🎚️ Model Options

### tts-1 (Standard Quality)
- **Cost:** $0.015 per 1,000 characters
- **Speed:** Faster generation
- **Quality:** Good for most uses
- **Use when:** Budget-conscious or quick iterations

### tts-1-hd (High Definition) ⭐
- **Cost:** $0.030 per 1,000 characters
- **Speed:** Slightly slower
- **Quality:** Noticeably better, more natural
- **Use when:** Final production, professional output

### Change Model

Edit `generate-demo-audio-openai.js` line 116:

```javascript
const MODEL = 'tts-1-hd';  // Change to: tts-1 or tts-1-hd
```

---

## ⚡ Speed Control

Adjust narration speed from 0.25x to 4.0x:

```javascript
const SPEED = 1.0;  // Normal speed
```

**Examples:**
- `0.9` - Slightly slower, clearer
- `1.0` - Normal speed (recommended)
- `1.1` - Slightly faster, more energetic
- `1.2` - Faster, for shorter videos

Edit line 117 in `generate-demo-audio-openai.js`

---

## 💰 Cost Estimation

### For This Demo Video

**Text Statistics:**
- Total characters: ~2,500 characters
- 10 scenes

**Cost Breakdown:**

| Model | Cost per 1K chars | Total Cost |
|-------|-------------------|------------|
| tts-1 | $0.015 | ~$0.04 |
| tts-1-hd | $0.030 | ~$0.08 |

**Conclusion:** Very affordable! Less than $0.10 for professional quality.

### Cost Calculation

```
Cost = (Total Characters / 1000) × Price per 1K
```

Example:
```
2,500 chars / 1000 × $0.030 = $0.075
```

---

## 📊 Comparison: OpenAI TTS vs macOS Say

| Feature | macOS Say | OpenAI TTS |
|---------|-----------|------------|
| **Quality** | Good | Excellent ⭐ |
| **Naturalness** | Robotic | Very natural ⭐ |
| **Voices** | Limited | 6 professional voices ⭐ |
| **Cost** | Free | ~$0.08 for demo ⭐ |
| **Speed** | Fast | Fast |
| **Customization** | Limited | High ⭐ |
| **Platform** | macOS only | Cross-platform ⭐ |
| **Setup** | None | Requires API key |

**Recommendation:** Use OpenAI TTS for final production videos. The quality difference is significant and the cost is minimal.

---

## 🛠️ Advanced Usage

### Custom Scene Text

Edit the `scenes` array in `generate-demo-audio-openai.js`:

```javascript
const scenes = [
    {
        id: 1,
        name: 'intro',
        duration: 8,
        text: 'Your custom narration text here...'
    },
    // Add more scenes...
];
```

### Generate Single Scene

Modify the script to generate only one scene:

```javascript
// In main() function, replace the loop:
const sceneToGenerate = scenes.find(s => s.id === 5);
await generateAudio(sceneToGenerate, 0, 1);
```

### Different Voice Per Scene

```javascript
async function generateAudio(scene, index, total) {
    // Choose voice based on scene
    const voice = scene.id <= 5 ? 'nova' : 'alloy';
    
    const mp3 = await openai.audio.speech.create({
        model: MODEL,
        voice: voice,  // Use dynamic voice
        input: scene.text,
        speed: SPEED
    });
    // ...
}
```

---

## 🔧 Troubleshooting

### Error: "OPENAI_API_KEY not set"

**Solution:**
```bash
export OPENAI_API_KEY='your-key-here'
```

Verify:
```bash
echo $OPENAI_API_KEY
```

### Error: "Cannot find module 'openai'"

**Solution:**
```bash
npm install openai
```

### Error: "Incorrect API key"

**Solutions:**
1. Check your API key at https://platform.openai.com/api-keys
2. Make sure you copied the entire key (starts with `sk-`)
3. Regenerate a new key if needed
4. Check for extra spaces: `echo "$OPENAI_API_KEY" | wc -c`

### Error: "Rate limit exceeded"

**Solution:**
The script includes a 500ms delay between requests. If you still hit limits:

```javascript
// Increase delay in main() function
await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second
```

### Error: "Insufficient quota"

**Solution:**
1. Check your OpenAI account balance
2. Add payment method at https://platform.openai.com/account/billing
3. The demo costs less than $0.10

### Audio sounds too fast/slow

**Solution:**
Adjust the SPEED constant:

```javascript
const SPEED = 1.0;  // Try 0.9 for slower, 1.1 for faster
```

---

## 📝 Complete Workflow

### Using OpenAI TTS

```bash
# 1. Install dependencies
npm install openai

# 2. Set API key (one time)
export OPENAI_API_KEY='your-key-here'

# 3. Generate audio with OpenAI
node generate-demo-audio-openai.js

# 4. Create video
node create-demo-video.js

# 5. Review output
open demo-output/karaoke-creator-demo.mp4
```

### Using macOS Say (Free)

```bash
# 1. Generate audio with macOS
node generate-demo-audio.js

# 2. Create video
node create-demo-video.js

# 3. Review output
open demo-output/karaoke-creator-demo.mp4
```

---

## 🎯 Best Practices

### For Professional Videos

1. **Use tts-1-hd model** for best quality
2. **Choose 'nova' voice** for engaging demos
3. **Keep speed at 1.0** for clarity
4. **Test with one scene first** before generating all
5. **Review audio files** before creating video

### For Quick Iterations

1. **Use tts-1 model** for faster/cheaper
2. **Use macOS say** for free testing
3. **Increase speed to 1.1** for shorter videos
4. **Generate only changed scenes**

### Script Optimization

```javascript
// Test with one scene first
const TEST_MODE = true;
const scenes = TEST_MODE ? [scenes[0]] : scenes;
```

---

## 📚 API Reference

### OpenAI TTS Parameters

```javascript
await openai.audio.speech.create({
    model: 'tts-1-hd',        // Required: tts-1 or tts-1-hd
    voice: 'nova',             // Required: alloy, echo, fable, onyx, nova, shimmer
    input: 'Text to speak',    // Required: max 4096 characters
    speed: 1.0,                // Optional: 0.25 to 4.0
    response_format: 'mp3'     // Optional: mp3, opus, aac, flac
});
```

### Response

```javascript
const mp3 = await openai.audio.speech.create({...});
const buffer = Buffer.from(await mp3.arrayBuffer());
await fs.promises.writeFile('output.mp3', buffer);
```

---

## 🔗 Useful Links

- **OpenAI TTS Documentation:** https://platform.openai.com/docs/guides/text-to-speech
- **API Keys:** https://platform.openai.com/api-keys
- **Pricing:** https://openai.com/pricing
- **Usage Dashboard:** https://platform.openai.com/usage
- **Node.js SDK:** https://github.com/openai/openai-node

---

## 💡 Tips & Tricks

### 1. Preview Voices

Create a test script to hear all voices:

```javascript
const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
const testText = 'Welcome to Karaoke Video Creator';

for (const voice of voices) {
    const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: testText
    });
    // Save as voice-name.mp3
}
```

### 2. Batch Processing

Generate multiple versions with different settings:

```javascript
const configs = [
    { voice: 'nova', speed: 1.0 },
    { voice: 'alloy', speed: 1.1 },
];

for (const config of configs) {
    // Generate with each config
}
```

### 3. Error Recovery

Add retry logic for network issues:

```javascript
async function generateWithRetry(scene, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await generateAudio(scene);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
}
```

---

## ✅ Checklist

Before generating:
- [ ] OpenAI SDK installed (`npm install openai`)
- [ ] API key set in environment
- [ ] Voice selected (recommend: `nova`)
- [ ] Model selected (recommend: `tts-1-hd`)
- [ ] Speed adjusted if needed (default: `1.0`)
- [ ] Tested with one scene first

After generating:
- [ ] All audio files created successfully
- [ ] Audio quality is acceptable
- [ ] File sizes are reasonable
- [ ] Ready to create video

---

**Happy narrating! 🎉**
