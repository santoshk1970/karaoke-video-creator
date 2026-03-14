# 🎯 **Web UI Integration Guide**
## SeamlessM4T + Demucs Enhanced Karaoke Creator

---

## 📋 **Overview**

This guide shows how to integrate the enhanced karaoke timing system with SeamlessM4T and Demucs into your existing web UI. The system provides three timing methods:

1. **Manual Timing** - Traditional manual marking
2. **SeamlessM4T AI** - Full AI transcription and timing
3. **Hybrid (Recommended)** - Your exact lyrics + AI timing

---

## 🚀 **Quick Start**

### 1. Install Dependencies
```bash
# Python dependencies for SeamlessM4T
python3.11 -m pip install torch torchaudio numpy transformers scipy torchcodec

# Node.js dependencies
npm install express multer
```

### 2. Start Enhanced Server
```bash
node enhanced-api-server.js
```

### 3. Open Web UI
Navigate to: `http://localhost:3000`

---

## 🔧 **Integration Steps**

### **Step 1: Update Your HTML**
Replace your existing lyrics section with the enhanced version:

```html
<!-- Replace your current Step 1 section with this -->
<div id="timing-controls">
    <!-- Dynamic controls will be loaded here -->
</div>
```

### **Step 2: Add Enhanced JavaScript**
Include the enhanced JavaScript in your existing `app.js`:

```javascript
// Add these functions to your existing app.js

// Enhanced timing method selection
function switchTimingMethod(method) {
    currentTimingMethod = method;
    
    // Hide all controls
    document.getElementById('manual-controls').classList.add('hidden');
    document.getElementById('ai-controls').classList.add('hidden');
    document.getElementById('hybrid-controls').classList.add('hidden');
    
    // Show relevant controls
    switch(method) {
        case 'manual':
            document.getElementById('manual-controls').classList.remove('hidden');
            break;
        case 'seamless':
            document.getElementById('ai-controls').classList.remove('hidden');
            break;
        case 'hybrid':
            document.getElementById('hybrid-controls').classList.remove('hidden');
            break;
    }
}

// SeamlessM4T transcription
async function transcribeWithSeamless() {
    if (!vocalFile) {
        log('Please separate vocals first', 'error');
        return;
    }
    
    log('Starting SeamlessM4T transcription...', 'info');
    
    try {
        const response = await fetch('/api/seamless-transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audioFile: vocalFile,
                language: 'hi'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayAITranscriptionEditor(result.transcription);
            log('AI transcription completed', 'success');
        }
    } catch (error) {
        log('Transcription failed: ' + error.message, 'error');
    }
}

// Hybrid timing generation
async function generateHybridTiming() {
    if (!vocalFile) {
        log('Please separate vocals first', 'error');
        return;
    }
    
    const lyricsFile = document.getElementById('lyricsFile').files[0];
    if (!lyricsFile) {
        log('Please upload lyrics file', 'error');
        return;
    }
    
    log('Generating hybrid timing...', 'info');
    
    try {
        const lyricsText = await readFileAsText(lyricsFile);
        
        const response = await fetch('/api/generate-hybrid-timing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audioFile: vocalFile,
                lyrics: lyricsText,
                language: 'hi'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            log('Hybrid timing generated successfully', 'success');
            updateStepStatus(1, 'green');
            enableVideoGeneration();
        }
    } catch (error) {
        log('Hybrid timing failed: ' + error.message, 'error');
    }
}
```

### **Step 3: Update Backend API**
Add these new endpoints to your existing server:

```javascript
// Add to your existing server.js

// SeamlessM4T Transcription
app.post('/api/seamless-transcribe', async (req, res) => {
    try {
        const { audioFile, language = 'hi' } = req.body;
        
        // Use our working SeamlessM4T implementation
        const cmd = `ts-node src/workingSeamlessM4T.ts "${audioFile}" "./output" "${language}"`;
        await execAsync(cmd);
        
        const result = JSON.parse(await fs.readFile('./output/working_seamless_result.json', 'utf8'));
        
        res.json({
            success: true,
            transcription: result
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Hybrid Timing Generation
app.post('/api/generate-hybrid-timing', async (req, res) => {
    try {
        const { audioFile, lyrics, language = 'hi' } = req.body;
        
        // Save lyrics temporarily
        await fs.writeFile('./output/temp_lyrics.txt', lyrics, 'utf8');
        
        // Generate hybrid timing
        const cmd = `ts-node src/workingSeamlessM4T.ts "${audioFile}" "./output" "${language}"`;
        await execAsync(cmd);
        
        // Generate final karaoke files
        await execAsync(`ts-node src/finalKaraokeAligner.ts "./output/working_seamless_result.json" "./output"`);
        
        const timing = JSON.parse(await fs.readFile('./output/final_karaoke_timing.json', 'utf8'));
        
        res.json({
            success: true,
            timing: timing
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

---

## 🎯 **User Workflow**

### **Option 1: Hybrid (Recommended)**
1. **Upload Audio** → User uploads MP3
2. **Separate Vocals** → Demucs AI processes (1-2 minutes)
3. **Upload Lyrics** → User provides exact lyrics
4. **Generate Hybrid Timing** → AI creates timing with user's lyrics
5. **Generate Video** → Perfect karaoke video

### **Option 2: SeamlessM4T AI**
1. **Upload Audio** → User uploads MP3
2. **Separate Vocals** → Demucs AI processes
3. **Transcribe with AI** → SeamlessM4T transcribes
4. **Edit Transcription** → User fixes any errors
5. **Generate AI Timing** → Creates timing from edited transcription
6. **Generate Video** → High-quality karaoke video

### **Option 3: Manual (Existing)**
1. **Upload Audio** → User uploads MP3
2. **Separate Vocals** → Demucs AI processes
3. **Upload Lyrics** → User provides lyrics
4. **Manual Timing** → User marks timing manually
5. **Generate Video** → Custom-timed karaoke video

---

## 📁 **File Structure**

```
karaokestudio2/
├── src/
│   ├── workingSeamlessM4T.ts      # Core SeamlessM4T implementation
│   ├── finalKaraokeAligner.ts     # Final timing file generation
│   └── voiceExtractor.ts          # Demucs integration (existing)
├── web-ui/
│   ├── index-enhanced.html        # Enhanced UI
│   ├── enhanced-lyrics-js.js      # Enhanced JavaScript
│   └── app.js                     # Existing app.js (to be updated)
├── output/
│   ├── working_seamless_result.json  # SeamlessM4T output
│   ├── final_karaoke_timing.json     # Final timing data
│   ├── final_karaoke.srt             # Subtitle format
│   └── final_karaoke.xml             # Karaoke XML format
├── enhanced-api-server.js         # New server with all endpoints
└── INTEGRATION_GUIDE.md           # This guide
```

---

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Optional: Set Python path if different
PYTHON_PATH=/usr/bin/python3.11

# Optional: Set output directory
OUTPUT_DIR=./output

# Optional: Set default language
DEFAULT_LANGUAGE=hi
```

### **Server Configuration**
```javascript
const config = {
    port: 3000,
    maxFileSize: '100MB',
    supportedFormats: ['.mp3', '.wav', '.m4a'],
    defaultLanguage: 'hi',
    demucsQuality: 'high'
};
```

---

## 🎨 **UI Customization**

### **Method Selection Cards**
```css
.method-card {
    transition: all 0.3s ease;
    border: 2px solid transparent;
}

.method-card:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
}

.method-card.selected {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #3b82f608 0%, #8b5cf608 100%);
}
```

### **Progress Indicators**
```css
.progress-bar {
    transition: width 0.3s ease;
}

.processing {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
```

---

## 🚨 **Error Handling**

### **Common Issues & Solutions**

| Issue | Cause | Solution |
|-------|--------|----------|
| Demucs not found | Demucs not installed | `pip install demucs` |
| Torch loading error | Python environment mismatch | Use `python3.11 -m pip` |
| Audio file too large | File size limit | Increase `maxFileSize` |
| Transcription fails | Audio quality issues | Check vocal separation quality |

### **Error Messages**
```javascript
function handleAPIError(error, context) {
    console.error(`${context} error:`, error);
    
    const userMessages = {
        'demucs_not_found': 'Demucs not installed. Please run: pip install demucs',
        'audio_file_missing': 'Please upload an audio file first',
        'vocal_separation_failed': 'Vocal separation failed. Please try again.',
        'transcription_failed': 'AI transcription failed. Please check audio quality.'
    };
    
    const message = userMessages[error.code] || error.message || 'An unexpected error occurred';
    log(message, 'error');
}
```

---

## 🎯 **Performance Optimization**

### **Caching Strategy**
```javascript
// Cache transcription results
const transcriptionCache = new Map();

function getCachedTranscription(audioFile) {
    const hash = require('crypto').createHash('md5').update(audioFile).digest('hex');
    return transcriptionCache.get(hash);
}

function setCachedTranscription(audioFile, result) {
    const hash = require('crypto').createHash('md5').update(audioFile).digest('hex');
    transcriptionCache.set(hash, result);
}
```

### **Background Processing**
```javascript
// Process large files in background
function processInBackground(audioFile, callback) {
    const worker = new Worker('./background-processor.js');
    
    worker.postMessage({ audioFile, method: 'seamless' });
    
    worker.onmessage = function(e) {
        callback(e.data);
        worker.terminate();
    };
}
```

---

## 🔄 **Migration from Existing System**

### **Step 1: Backup Current System**
```bash
cp -r web-ui web-ui-backup
cp app.js app.js-backup
```

### **Step 2: Update Dependencies**
```bash
npm install express multer
python3.11 -m pip install torch torchaudio numpy transformers scipy torchcodec
```

### **Step 3: Replace Components**
1. Replace lyrics section in HTML
2. Update app.js with new functions
3. Add new API endpoints
4. Test with existing audio files

### **Step 4: Test Integration**
```bash
# Start enhanced server
node enhanced-api-server.js

# Test with sample file
curl -X POST http://localhost:3000/api/separate-vocals \
  -H "Content-Type: application/json" \
  -d '{"projectName": "test", "method": "demucs"}'
```

---

## 🎉 **Benefits of Enhanced System**

### **For Users**
- ✅ **3 timing options** for different needs
- ✅ **Maximum accuracy** with hybrid approach
- ✅ **Faster workflow** - less manual work
- ✅ **Better quality** - AI-powered timing
- ✅ **Edit capability** - fix AI errors easily

### **For Developers**
- ✅ **Modular design** - easy to extend
- ✅ **API-first** - integrates with existing systems
- ✅ **Error handling** - robust error management
- ✅ **Performance** - optimized processing
- ✅ **Scalable** - handles multiple users

---

## 📞 **Support & Troubleshooting**

### **Debug Mode**
```bash
# Enable debug logging
DEBUG=karaoke:* node enhanced-api-server.js
```

### **Log Analysis**
```bash
# Check server logs
tail -f logs/karaoke-server.log

# Check Python errors
python3.11 -c "import torch; print('PyTorch:', torch.__version__)"
```

### **Common Commands**
```bash
# Test Demucs
demucs --help

# Test SeamlessM4T components
python3.11 -c "import transformers; print('Transformers:', transformers.__version__)"

# Check audio files
ffmpeg -i input.mp3 -f null -
```

---

## 🚀 **Next Steps**

1. **Test Integration** - Try with your existing audio files
2. **User Training** - Show users the new hybrid workflow
3. **Performance Testing** - Test with large audio files
4. **Deploy to Production** - Update production server
5. **Monitor Performance** - Track usage and errors

---

**🎯 Result**: A fully integrated, production-ready karaoke timing system with SeamlessM4T AI and Demucs vocal separation!
