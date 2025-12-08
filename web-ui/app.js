let projectPath = '';
let audioFileName = '';
let lyricsFileName = '';
let projectName = '';

// Check if project is specified in URL
window.addEventListener('DOMContentLoaded', () => {
    // Initialize
    log('🎵 Karaoke Video Creator ready!', 'success');
    
    const urlParams = new URLSearchParams(window.location.search);
    projectName = urlParams.get('project');
    
    if (projectName) {
        // Load existing project
        loadProject(projectName);
    } else {
        // Redirect to projects page if no project specified
        window.location.href = '/projects.html';
    }
});

async function loadProject(name) {
    try {
        console.log('=== loadProject START ===');
        console.log('Project name:', name);
        
        // Store project name for API calls
        projectName = name;
        projectPath = name; // APIs expect just the project name
        
        console.log('Set projectName:', projectName);
        console.log('Set projectPath:', projectPath);
        
        const titleElement = document.getElementById('projectTitle');
        console.log('titleElement:', titleElement);
        if (titleElement) {
            titleElement.textContent = name;
        }
        
        log(`📂 Loaded project: ${name}`, 'success');
        
        // Check project status and enable appropriate buttons
        const response = await fetch(`/api/check-project-status?project=${encodeURIComponent(name)}`);
        const result = await response.json();
        
        console.log('Project status result:', result);
        
        if (result.success) {
            console.log('Project loaded successfully');
            // Project exists, so always enable timing tool
            updateStatus(1, 'success');
            console.log('Enabling btn-time');
            enableButton('btn-time');
            console.log('Enabling btn-check-timing');
            enableButton('btn-check-timing');
            
            if (result.hasTimingFiles) {
                updateStatus(1, 'success');
                enableButton('btn-images');
            }
            
            if (result.hasImages) {
                updateStatus(2, 'success');
                enableButton('btn-apply-timing');
            }
            
            if (result.hasTimestamps) {
                updateStatus(3, 'success');
                enableButton('btn-video');
            }
            
            if (result.hasVideo) {
                updateStatus(4, 'success');
                enableButton('btn-play');
            }
            
            // Check audio files status
            checkAudioFilesStatus();
            
            log(`✓ Project status loaded`, 'info');
        }
    } catch (error) {
        log(`Error loading project: ${error.message}`, 'error');
    }
}

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
    const el = document.getElementById(`status-${step}`);
    if (!el) {
        console.warn(`Status element not found for step`, step);
        return;
    }
    el.textContent = statusEmoji[status];
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
    console.log('=== timeLyrics() START ===');
    console.log('projectPath:', projectPath);
    console.log('projectName:', projectName);
    
    log('🔍 timeLyrics() called', 'info');
    log(`🔍 projectPath: ${projectPath}`, 'info');
    log(`🔍 projectName: ${projectName}`, 'info');
    
    if (!projectPath) {
        console.error('ERROR: No project path set');
        log('❌ Error: No project path set', 'error');
        return;
    }
    
    console.log('Project path is valid, continuing...');

    updateStatus(1, 'running');
    log('Opening timing tool in new window...', 'info');
    log('💡 Press SPACE when you hear each line (auto-adjusts -2s for reaction time)', 'info');
    
    // Enable kill button while timing is active
    enableButton('btn-kill-audio');

    try {
        console.log('Sending fetch request to /api/time-lyrics');
        log(`🔍 Sending request to /api/time-lyrics with projectPath: ${projectPath}`, 'info');
        
        const response = await fetch('/api/time-lyrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectPath })
        });
        
        console.log('Response received, status:', response.status);
        log(`🔍 Response status: ${response.status}`, 'info');

        const result = await response.json();
        console.log('Response JSON:', result);

        if (result.success) {
            console.log('Success! Opening timing URL:', result.timingUrl);
            log('✓ Opening timing interface...', 'success');
            
            // Open timing page in new window
            const timingWindow = window.open(result.timingUrl, 'timing', 'width=1200,height=900');
            console.log('Window opened:', timingWindow);
            
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
async function createVideo(videoType) {
    if (!projectPath) {
        log('Please complete previous steps first', 'error');
        return;
    }

    const purgeMode = document.getElementById('purgeMode').checked;
    const videoName = videoType === 'karaoke' ? 'Karaoke' : 'Sing-along';
    const buttonId = `btn-video-${videoType}`;
    const statusId = `status-${videoType}`;
    
    document.getElementById(statusId).textContent = '🔵';
    log(`Creating ${videoName} video...`, 'info');
    if (purgeMode) {
        log('🗑️ Purge mode: Will overwrite without backup', 'warning');
    }
    disableButton(buttonId);

    try {
        const response = await fetch('/api/create-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectPath, purge: purgeMode, videoType })
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

        const videoFilename = videoType === 'karaoke' ? 'karaoke.mp4' : 'singalong.mp4';
        log(`✓ ${videoName} video created successfully!`, 'success');
        log(`📹 Video saved to: output/${videoFilename}`, 'success');
        
        document.getElementById(statusId).textContent = '✅';
        enableButton(`btn-play-${videoType}`);
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        document.getElementById(statusId).textContent = '❌';
        enableButton(buttonId);
    }
}

// Step 6: Play Video
async function playVideo(videoType) {
    if (!projectPath) {
        log('Please complete previous steps first', 'error');
        return;
    }

    const videoName = videoType === 'karaoke' ? 'Karaoke' : 'Sing-along';
    log(`Opening ${videoName} video...`, 'info');

    try {
        const response = await fetch('/api/play-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectPath, videoType })
        });

        const result = await response.json();

        if (result.success) {
            log(`✓ ${videoName} video opened in default player`, 'success');
            log(`🎵 Enjoy your ${videoName.toLowerCase()} video!`, 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
    }
}

// Audio file management
async function checkAudioFilesStatus() {
    try {
        const response = await fetch(`/api/check-audio-files?project=${encodeURIComponent(projectName)}`);
        const result = await response.json();
        
        if (result.success) {
            // Update original audio status
            const originalStatus = document.getElementById('audio-original-status');
            if (originalStatus) {
                originalStatus.textContent = result.hasOriginal ? '✅' : '⚪';
            }
            
            // Update no-vocal audio status
            const novocalStatus = document.getElementById('audio-novocal-status');
            if (novocalStatus) {
                novocalStatus.textContent = result.hasNoVocal ? '✅' : '⚪';
            }
            
            // Check if timestamps exist to enable video buttons
            const timestampsExist = document.getElementById('status-4').textContent === '✅';
            
            // Enable Sing-along video button if original audio exists and timestamps exist
            if (result.hasOriginal && timestampsExist) {
                enableButton('btn-video-singalong');
            } else {
                disableButton('btn-video-singalong');
            }
            
            // Enable Karaoke video button if no-vocal audio exists and timestamps exist
            if (result.hasNoVocal && timestampsExist) {
                enableButton('btn-video-karaoke');
            } else {
                disableButton('btn-video-karaoke');
            }
            
            // Check video status
            checkVideoStatus();
        }
    } catch (error) {
        console.error('Error checking audio files:', error);
    }
}

async function checkVideoStatus() {
    try {
        const response = await fetch(`/api/check-video-status?project=${encodeURIComponent(projectName)}`);
        const result = await response.json();
        
        if (result.success) {
            // Update Karaoke video status
            if (result.hasKaraoke) {
                document.getElementById('status-karaoke').textContent = '✅';
                enableButton('btn-play-karaoke');
            }
            
            // Update Sing-along video status
            if (result.hasSingalong) {
                document.getElementById('status-singalong').textContent = '✅';
                enableButton('btn-play-singalong');
            }
        }
    } catch (error) {
        console.error('Error checking video status:', error);
    }
}

function uploadNoVocalAudio() {
    const fileInput = document.getElementById('novocalAudioFile');
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            log('📤 Uploading instrumental audio...', 'info');
            
            const formData = new FormData();
            formData.append('projectName', projectName);
            formData.append('audio', file);
            
            const response = await fetch('/api/upload-novocal-audio', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                log('✅ Instrumental audio uploaded successfully', 'success');
                checkAudioFilesStatus();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            log(`❌ Error uploading audio: ${error.message}`, 'error');
        }
        
        // Reset file input
        fileInput.value = '';
    };
    
    fileInput.click();
}

// Initialization moved to DOMContentLoaded event
