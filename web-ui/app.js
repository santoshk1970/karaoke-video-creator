let projectPath = '';
let audioFileName = '';
let lyricsFileName = '';
let projectName = '';

// Reload Lyrics File
async function reloadLyrics() {
    const fileInput = document.getElementById('lyricsFile');
    fileInput.click();

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        log(`Uploading new lyrics file: ${file.name}...`, 'info');

        const formData = new FormData();
        formData.append('lyrics', file);
        formData.append('projectPath', projectPath);

        try {
            const response = await fetch('/api/reload-lyrics', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                log(`✓ Lyrics file reloaded successfully!`, 'success');
                log(`  Found ${result.lineCount} lines`, 'info');
                // Reset timing status since lyrics changed
                updateStatus(1, 'pending');
                updateStatus(3, 'pending');
                updateStatus(4, 'pending');
                updateStatus(5, 'pending');
            } else {
                log(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            log(`Error uploading lyrics: ${error.message}`, 'error');
        }

        // Reset file input
        fileInput.value = '';
    };
}

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
                enableButton('btn-generate-all');
            }

            if (result.hasImages) {
                updateStatus(2, 'success');
                enableButton('btn-apply-timing');
                enableButton('btn-edit-timing'); // Enable timing editor if images exist
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
            enableButton('btn-generate-all');
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

// Step 3: Generate Images & Video (Combined)
async function generateImagesAndVideo() {
    if (!projectPath) {
        log('Please complete previous steps first', 'error');
        return;
    }

    updateStatus(3, 'running');
    log('Starting image and video generation...', 'info');
    disableButton('btn-generate-all');

    try {
        // Step 1: Apply manual timing if exists
        const timingScriptPath = `${projectPath}/set-manual-timing.js`;
        log('Checking for manual timing...', 'info');
        const timingExists = await fetch('/api/file-exists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: timingScriptPath })
        }).then(r => r.json()).then(data => data.exists).catch(() => false);

        if (timingExists) {
            log('Applying manual timing before image generation...', 'info');
            await applyTiming();
        }

        // Step 2: Generate images
        log('📸 Generating lyric images...', 'info');
        const imgResponse = await fetch('/api/generate-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectPath })
        });

        // Stream the image generation output
        const imgReader = imgResponse.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await imgReader.read();
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

        log('✓ Images generated successfully!', 'success');

        // Step 3: Check if we have instrumental audio for karaoke
        const audioCheckRes = await fetch(`/api/check-audio-files?project=${encodeURIComponent(projectName)}`);
        const audioCheck = await audioCheckRes.json();

        // Step 4: Generate sing-along video (always)
        log('🎬 Generating sing-along video...', 'info');
        const singalongResponse = await fetch('/api/create-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectPath,
                purge: false,
                videoType: 'singalong'
            })
        });

        // Stream the sing-along video generation output
        let vidReader = singalongResponse.body.getReader();

        while (true) {
            const { done, value } = await vidReader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split('\n').filter(l => l.trim());

            lines.forEach(line => {
                if (line.includes('Backup')) {
                    log(line, 'info');
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

        log('✅ Sing-along video generated!', 'success');
        enableButton('btn-play-singalong');

        // Step 5: Generate karaoke video if instrumental audio exists
        if (audioCheck.success && audioCheck.hasNoVocal) {
            log('🎬 Generating karaoke video...', 'info');
            const karaokeResponse = await fetch('/api/create-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectPath,
                    purge: false,
                    videoType: 'karaoke'
                })
            });

            // Stream the karaoke video generation output
            vidReader = karaokeResponse.body.getReader();

            while (true) {
                const { done, value } = await vidReader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split('\n').filter(l => l.trim());

                lines.forEach(line => {
                    if (line.includes('Backup')) {
                        log(line, 'info');
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

            log('✅ Karaoke video generated!', 'success');
            enableButton('btn-play-karaoke');
        }

        log('✅ All done! Images and videos generated successfully!', 'success');

        updateStatus(2, 'success');

        // Enable Edit Timing button after images are generated
        enableButton('btn-edit-timing');

        // Check audio files to update button states
        checkAudioFilesStatus();
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        updateStatus(2, 'error');
        enableButton('btn-generate-all');
    }
}

// Open timing editor
function openTimingEditor() {
    if (!projectName) {
        log('No project loaded', 'error');
        return;
    }

    log('Opening timing editor...', 'info');
    const editorUrl = `/timing-editor.html?project=${encodeURIComponent(projectName)}`;
    window.open(editorUrl, 'timing-editor', 'width=1400,height=900');
}

// Apply Timing (now automatic after image generation)
async function applyTiming() {
    if (!projectPath) {
        log('Please complete previous steps first', 'error');
        return;
    }

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

            // Check audio files to enable appropriate video buttons
            checkAudioFilesStatus();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        log(`Error applying timing: ${error.message}`, 'error');
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

            // Check if images exist to enable video buttons (step 2)
            const imagesExist = document.getElementById('status-2').textContent === '✅';

            // Enable Sing-along video button if original audio exists and images exist
            if (result.hasOriginal && imagesExist) {
                enableButton('btn-video-singalong');
            } else {
                disableButton('btn-video-singalong');
            }

            // Enable Karaoke video button if no-vocal audio exists and images exist
            if (result.hasNoVocal && imagesExist) {
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

async function separateVocals() {
    try {
        // Check if no-vocal file already exists
        const checkResponse = await fetch(`/api/check-audio-files?project=${encodeURIComponent(projectName)}`);
        const checkResult = await checkResponse.json();

        if (checkResult.success && checkResult.hasNoVocal) {
            if (!confirm('Instrumental audio already exists. Do you want to regenerate it? This will overwrite the existing file.')) {
                return;
            }
        }

        log('🎵 Starting vocal separation (this may take 1-2 minutes)...', 'info');

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

        // Call API
        const response = await fetch('/api/separate-vocals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName })
        });

        const result = await response.json();

        // Stop timer
        clearInterval(timerInterval);

        if (result.success) {
            progressBar.style.width = '100%';
            log('✅ Vocal separation complete! Instrumental audio created.', 'success');

            setTimeout(() => {
                progressDiv.classList.add('hidden');
                progressBar.style.width = '0%';
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
                checkAudioFilesStatus();
            }, 1500);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        log(`❌ Error during vocal separation: ${error.message}`, 'error');

        // Reset UI
        document.getElementById('separation-progress').classList.add('hidden');
        document.getElementById('separation-progress-bar').style.width = '0%';
        const btn = document.getElementById('btn-separate-vocals');
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
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
