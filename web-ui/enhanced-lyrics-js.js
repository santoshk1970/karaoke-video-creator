// Enhanced Lyrics Timing JavaScript for SeamlessM4T Integration

let currentTimingMethod = 'manual';
let aiTranscriptionResult = null;
let hybridTimingResult = null;

// Initialize timing method selection
document.addEventListener('DOMContentLoaded', function() {
    const timingRadios = document.querySelectorAll('input[name="timingMethod"]');
    timingRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            switchTimingMethod(this.value);
        });
    });
    
    // Default to manual
    switchTimingMethod('manual');
});

function switchTimingMethod(method) {
    currentTimingMethod = method;
    
    // Hide all control sections
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
    
    updateButtonStates();
}

function uploadLyrics() {
    document.getElementById('lyricsFile').click();
}

document.getElementById('lyricsFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const lyrics = e.target.result;
            displayLyricsPreview(lyrics);
            updateButtonStates();
            log('Lyrics uploaded successfully', 'success');
        };
        reader.readAsText(file);
    }
});

function displayLyricsPreview(lyrics) {
    const preview = document.getElementById('lyrics-preview');
    const previewText = document.getElementById('lyrics-preview-text');
    
    preview.classList.remove('hidden');
    previewText.textContent = lyrics.substring(0, 500) + (lyrics.length > 500 ? '...' : '');
}

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
            aiTranscriptionResult = result.transcription;
            displayAITranscriptionEditor(result.transcription);
            log('AI transcription completed successfully', 'success');
        } else {
            throw new Error(result.error || 'Transcription failed');
        }
        
    } catch (error) {
        log('AI transcription failed: ' + error.message, 'error');
    }
}

function displayAITranscriptionEditor(transcription) {
    const editor = document.getElementById('ai-transcription-editor');
    const textarea = document.getElementById('ai-transcription-text');
    
    // Format transcription for editing
    let editableText = '';
    if (transcription.segments) {
        transcription.segments.forEach(segment => {
            editableText += segment.text + '\n';
        });
    }
    
    textarea.value = editableText.trim();
    editor.classList.remove('hidden');
}

function saveEditedTranscription() {
    const textarea = document.getElementById('ai-transcription-text');
    const editedText = textarea.value;
    
    if (aiTranscriptionResult && aiTranscriptionResult.segments) {
        // Update the transcription with edited text while preserving timing
        const lines = editedText.split('\n').filter(line => line.trim());
        
        lines.forEach((line, index) => {
            if (index < aiTranscriptionResult.segments.length) {
                aiTranscriptionResult.segments[index].text = line;
            }
        });
        
        log('Transcription edited and saved', 'success');
        updateButtonStates();
    }
}

async function generateAITiming() {
    if (!vocalFile) {
        log('Please separate vocals first', 'error');
        return;
    }
    
    if (!aiTranscriptionResult) {
        log('Please transcribe with AI first', 'error');
        return;
    }
    
    showAIProgress('Generating AI timing...');
    
    try {
        const response = await fetch('/api/generate-ai-timing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audioFile: vocalFile,
                transcription: aiTranscriptionResult,
                language: 'hi'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            aiTranscriptionResult = result.timing;
            hideAIProgress();
            log('AI timing generated successfully', 'success');
            document.getElementById('btn-preview-ai-timing').disabled = false;
            updateStepStatus(1, 'green');
        } else {
            throw new Error(result.error || 'AI timing generation failed');
        }
        
    } catch (error) {
        hideAIProgress();
        log('AI timing generation failed: ' + error.message, 'error');
    }
}

async function generateHybridTiming() {
    if (!vocalFile) {
        log('Please separate vocals first', 'error');
        return;
    }
    
    const lyricsFile = document.getElementById('lyricsFile').files[0];
    if (!lyricsFile) {
        log('Please upload lyrics file for hybrid approach', 'error');
        return;
    }
    
    showAIProgress('Generating hybrid timing...');
    
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
            hybridTimingResult = result.timing;
            hideAIProgress();
            log('Hybrid timing generated successfully', 'success');
            document.getElementById('btn-preview-hybrid-timing').disabled = false;
            updateStepStatus(1, 'green');
        } else {
            throw new Error(result.error || 'Hybrid timing generation failed');
        }
        
    } catch (error) {
        hideAIProgress();
        log('Hybrid timing generation failed: ' + error.message, 'error');
    }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function showAIProgress(message) {
    const progress = document.getElementById('ai-progress');
    const progressBar = document.getElementById('ai-progress-bar');
    const progressText = document.getElementById('ai-progress-text');
    
    progress.classList.remove('hidden');
    progressText.textContent = message;
    
    // Simulate progress
    let progressValue = 0;
    const interval = setInterval(() => {
        progressValue += Math.random() * 10;
        if (progressValue > 90) progressValue = 90;
        progressBar.style.width = progressValue + '%';
    }, 500);
    
    progress.dataset.interval = interval;
}

function hideAIProgress() {
    const progress = document.getElementById('ai-progress');
    const progressBar = document.getElementById('ai-progress-bar');
    const interval = progress.dataset.interval;
    
    if (interval) {
        clearInterval(interval);
    }
    
    progressBar.style.width = '100%';
    setTimeout(() => {
        progress.classList.add('hidden');
        progressBar.style.width = '0%';
    }, 500);
}

function previewAITiming() {
    if (!aiTranscriptionResult) {
        log('No AI timing available for preview', 'error');
        return;
    }
    
    openTimingPreview(aiTranscriptionResult, 'AI Generated Timing');
}

function previewHybridTiming() {
    if (!hybridTimingResult) {
        log('No hybrid timing available for preview', 'error');
        return;
    }
    
    openTimingPreview(hybridTimingResult, 'Hybrid Timing (Your Lyrics + AI)');
}

function openTimingPreview(timingData, title) {
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    previewWindow.document.write(`
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .timing-line { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
                .time { color: #666; font-size: 0.9em; }
                .speaker { color: #0066cc; font-weight: bold; margin-right: 10px; }
                .words { margin-top: 5px; font-size: 0.9em; color: #333; }
            </style>
        </head>
        <body>
            <h2>${title}</h2>
            <div id="timing-content"></div>
        </body>
        </html>
    `);
    
    let content = '';
    if (timingData.segments) {
        timingData.segments.forEach((segment, index) => {
            const speaker = segment.speaker ? `<span class="speaker">[${segment.speaker}]</span>` : '';
            const words = segment.words ? 
                `<div class="words">${segment.words.map(w => `${w.word}(${w.start.toFixed(2)}-${w.end.toFixed(2)})`).join(' ')}</div>` : '';
            
            content += `
                <div class="timing-line">
                    <div class="time">${index + 1}. [${segment.start.toFixed(2)} - ${segment.end.toFixed(2)}]</div>
                    <div>${speaker}${segment.text}</div>
                    ${words}
                </div>
            `;
        });
    }
    
    previewWindow.document.getElementById('timing-content').innerHTML = content;
    previewWindow.document.close();
}

function updateButtonStates() {
    const hasVocals = !!vocalFile;
    const hasLyrics = !!document.getElementById('lyricsFile').files[0];
    const hasAITranscription = !!aiTranscriptionResult;
    const hasHybridTiming = !!hybridTimingResult;
    
    // Update button states based on current method
    switch(currentTimingMethod) {
        case 'manual':
            document.getElementById('btn-time').disabled = !hasVocals || !hasLyrics;
            break;
        case 'seamless':
            document.getElementById('btn-generate-ai-timing').disabled = !hasVocals || !hasAITranscription;
            break;
        case 'hybrid':
            document.getElementById('btn-generate-hybrid-timing').disabled = !hasVocals || !hasLyrics;
            break;
    }
}

// Enhanced separate vocals function to use Demucs
async function separateVocals() {
    if (!audioFile) {
        log('Please upload an audio file first', 'error');
        return;
    }

    try {
        // Check if no-vocal file already exists
        const checkResponse = await fetch(`/api/check-audio-files?project=${encodeURIComponent(projectName)}`);
        const checkResult = await checkResponse.json();

        if (checkResult.success && checkResult.hasNoVocal) {
            if (!confirm('Instrumental audio already exists. Regenerating will invalidate any existing karaoke video. Continue?')) {
                return;
            }
            disableButton('btn-play-karaoke');
        }

        log('🎵 Starting vocal separation with Demucs AI (this may take 1-2 minutes)...', 'info');

        // Show progress UI
        const progressDiv = document.getElementById('separation-progress');
        const progressBar = document.getElementById('separation-progress-bar');
        const timeSpan = document.getElementById('separation-time');
        progressDiv.classList.remove('hidden');

        // Disable button
        const btn = document.getElementById('btn-separate-vocals');
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');

        // Start timer
        let startTime = Date.now();
        const timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            timeSpan.textContent = `${elapsed}s`;
            // Fake progress (since we can't get real progress from Demucs)
            const fakeProgress = Math.min(95, elapsed * 0.8);
            progressBar.style.width = `${fakeProgress}%`;
        }, 1000);

        // Call API with Demucs method
        const response = await fetch('/api/separate-vocals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                projectName,
                method: 'demucs',
                quality: 'high'
            })
        });

        const result = await response.json();

        // Stop timer
        clearInterval(timerInterval);
        progressBar.style.width = '100%';

        if (result.success) {
            vocalFile = result.vocalFile;
            noVocalFile = result.noVocalFile;
            
            log('✅ Vocal separation completed!', 'success');
            log(`🎤 Vocal file: ${result.vocalFile}`, 'info');
            log(`🎵 Instrumental file: ${result.noVocalFile}`, 'info');
            
            // Update UI
            document.getElementById('audio-vocal-status').textContent = '🟢';
            document.getElementById('audio-novocal-status').textContent = '🟢';
            
            updateButtonStates();
            updateStepStatus(0, 'green');
            
            // Auto-enable timing buttons if we have lyrics
            if (document.getElementById('lyricsFile').files[0]) {
                updateButtonStates();
            }
            
        } else {
            throw new Error(result.error || 'Vocal separation failed');
        }

    } catch (error) {
        log('❌ Vocal separation failed: ' + error.message, 'error');
    } finally {
        // Reset UI
        const progressDiv = document.getElementById('separation-progress');
        const progressBar = document.getElementById('separation-progress-bar');
        const btn = document.getElementById('btn-separate-vocals');
        
        setTimeout(() => {
            progressDiv.classList.add('hidden');
            progressBar.style.width = '0%';
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }, 1000);
    }
}
