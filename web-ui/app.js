let projectPath = '';
let audioFileName = '';
let lyricsFileName = '';

// Utility functions
function log(message, type = 'info') {
    const output = document.getElementById('output');
    const line = document.createElement('div');
    line.className = `log-line log-${type}`;
    
    const icon = {
        'info': 'fa-info-circle',
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle'
    }[type] || 'fa-info-circle';
    
    const timestamp = new Date().toLocaleTimeString();
    line.innerHTML = `<span class="text-gray-500">[${timestamp}]</span> <i class="fas ${icon} mr-2"></i>${message}`;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function clearOutput() {
    document.getElementById('output').innerHTML = '';
    log('Console cleared', 'info');
}

function updateStatus(step, status) {
    const statusEmoji = {
        'pending': '⚪',
        'running': '🔵',
        'success': '✅',
        'error': '❌'
    };
    document.getElementById(`status-${step}`).textContent = statusEmoji[status];
}

function enableButton(buttonId) {
    const btn = document.getElementById(buttonId);
    if (btn) btn.disabled = false;
}

function disableButton(buttonId) {
    const btn = document.getElementById(buttonId);
    if (btn) btn.disabled = true;
}

// Step 1: Setup Project
async function setupProject() {
    const audioFile = document.getElementById('audioFile').files[0];
    const lyricsFile = document.getElementById('lyricsFile').files[0];
    const projectName = document.getElementById('projectName').value.trim();

    if (!audioFile || !lyricsFile || !projectName) {
        log('Please select audio file, lyrics file, and enter project name', 'error');
        return;
    }

    updateStatus(1, 'running');
    log('Setting up project...', 'info');

    try {
        // Create project directory structure
        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('lyrics', lyricsFile);
        formData.append('projectName', projectName);

        const response = await fetch('/api/setup', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            projectPath = result.projectPath;
            audioFileName = audioFile.name;
            lyricsFileName = lyricsFile.name;
            
            log(`✓ Project created: ${projectName}`, 'success');
            log(`✓ Audio file: ${audioFile.name}`, 'success');
            log(`✓ Lyrics file: ${lyricsFile.name} (${result.lineCount} lines)`, 'success');
            log(`✓ Project path: ${result.projectPath}`, 'info');
            
            updateStatus(1, 'success');
            enableButton('btn-time');
            enableButton('btn-check-timing');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        updateStatus(1, 'error');
    }
}

// Step 2: Time Lyrics
async function timeLyrics() {
    if (!projectPath) {
        log('Please setup project first', 'error');
        return;
    }

    updateStatus(2, 'running');
    log('Opening timing tool in new window...', 'info');
    log('💡 Press SPACE when you hear each line (auto-adjusts -1s for reaction time)', 'info');
    
    // Enable kill button while timing is active
    enableButton('btn-kill-audio');

    try {
        const response = await fetch('/api/time-lyrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectPath })
        });

        const result = await response.json();

        if (result.success) {
            log('✓ Opening timing interface...', 'success');
            
            // Open timing page in new window
            const timingWindow = window.open(result.timingUrl, 'timing', 'width=1200,height=900');
            
            // Poll for completion
            const checkInterval = setInterval(() => {
                if (timingWindow.closed) {
                    clearInterval(checkInterval);
                    checkTimingComplete();
                }
            }, 1000);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        updateStatus(2, 'error');
        disableButton('btn-kill-audio');
    }
}

async function checkTimingComplete() {
    log('Checking if timing was saved...', 'info');
    
    // Check if timing files exist
    try {
        const response = await fetch('/api/check-timing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectPath })
        });

        const result = await response.json();

        if (result.success && result.hasTimingFiles) {
            log('✓ Timing completed!', 'success');
            log(`✓ Marked ${result.marksCount} lines`, 'success');
            log(`✓ Total segments: ${result.totalLines}`, 'info');
            
            updateStatus(2, 'success');
            enableButton('btn-images');
            disableButton('btn-kill-audio');
        } else {
            log('⚠️ Timing window closed but no data saved', 'warning');
            updateStatus(2, 'pending');
            disableButton('btn-kill-audio');
        }
    } catch (error) {
        log(`Error checking timing: ${error.message}`, 'error');
        updateStatus(2, 'error');
        disableButton('btn-kill-audio');
    }
}

// Kill audio playback
async function killAudio() {
    log('🛑 Killing audio playback...', 'warning');
    
    try {
        const response = await fetch('/api/kill-audio', {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            log('✓ Audio playback stopped', 'success');
            disableButton('btn-kill-audio');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
    }
}

// Emergency kill all processes
async function emergencyKillAll() {
    if (!confirm('⚠️ This will kill ALL audio playback and running processes. Continue?')) {
        return;
    }
    
    log('🚨 EMERGENCY STOP - Killing all processes...', 'error');
    
    try {
        const response = await fetch('/api/emergency-kill', {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            log('✓ All processes stopped', 'success');
            log(`✓ Killed: ${result.killed.join(', ')}`, 'info');
            disableButton('btn-kill-audio');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
    }
}

// Step 3: Generate Images
async function generateImages() {
    if (!projectPath) {
        log('Please complete previous steps first', 'error');
        return;
    }

    updateStatus(3, 'running');
    log('Generating lyric images...', 'info');
    disableButton('btn-images');

    try {
        const response = await fetch('/api/generate-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectPath })
        });

        // Stream the output
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split('\n').filter(l => l.trim());
            
            lines.forEach(line => {
                if (line.includes('Progress:')) {
                    log(line, 'info');
                } else if (line.includes('✓') || line.includes('✅')) {
                    log(line, 'success');
                } else if (line.includes('Error') || line.includes('❌')) {
                    log(line, 'error');
                } else {
                    log(line, 'info');
                }
            });
        }

        log('✓ All images generated successfully!', 'success');
        updateStatus(3, 'success');
        enableButton('btn-timing');
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        updateStatus(3, 'error');
        enableButton('btn-images');
    }
}

// Step 4: Apply Timing
async function applyTiming() {
    if (!projectPath) {
        log('Please complete previous steps first', 'error');
        return;
    }

    updateStatus(4, 'running');
    log('Applying manual timing to images...', 'info');
    disableButton('btn-timing');

    try {
        const response = await fetch('/api/apply-timing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectPath })
        });

        const result = await response.json();

        if (result.success) {
            log('✓ Timing applied successfully!', 'success');
            log(`✓ Processed ${result.segmentCount} segments`, 'success');
            log('✓ Backup saved: timestamps.backup.json', 'info');
            
            updateStatus(4, 'success');
            enableButton('btn-video');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        updateStatus(4, 'error');
        enableButton('btn-timing');
    }
}

// Step 5: Create Video
async function createVideo() {
    if (!projectPath) {
        log('Please complete previous steps first', 'error');
        return;
    }

    const purgeMode = document.getElementById('purgeMode').checked;
    
    updateStatus(5, 'running');
    log('Creating video...', 'info');
    if (purgeMode) {
        log('🗑️ Purge mode: Will overwrite without backup', 'warning');
    }
    disableButton('btn-video');

    try {
        const response = await fetch('/api/create-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectPath, purge: purgeMode })
        });

        // Stream the output
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split('\n').filter(l => l.trim());
            
            lines.forEach(line => {
                if (line.includes('Backup')) {
                    log(line, 'info');
                } else if (line.includes('Purge')) {
                    log(line, 'warning');
                } else if (line.includes('✓') || line.includes('✅')) {
                    log(line, 'success');
                } else if (line.includes('Error') || line.includes('❌')) {
                    log(line, 'error');
                } else if (line.includes('Encoding')) {
                    log(line, 'info');
                } else {
                    log(line, 'info');
                }
            });
        }

        log('✓ Video created successfully!', 'success');
        log('📹 Video saved to: output/output.mp4', 'success');
        
        updateStatus(5, 'success');
        enableButton('btn-play');
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        updateStatus(5, 'error');
        enableButton('btn-video');
    }
}

// Step 6: Play Video
async function playVideo() {
    if (!projectPath) {
        log('Please complete previous steps first', 'error');
        return;
    }

    updateStatus(6, 'running');
    log('Opening video...', 'info');

    try {
        const response = await fetch('/api/play-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectPath })
        });

        const result = await response.json();

        if (result.success) {
            log('✓ Video opened in default player', 'success');
            log('🎵 Enjoy your karaoke video!', 'success');
            updateStatus(6, 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        updateStatus(6, 'error');
    }
}

// Initialize
log('🎵 Karaoke Video Creator ready!', 'success');
log('Upload audio and lyrics files to get started', 'info');
