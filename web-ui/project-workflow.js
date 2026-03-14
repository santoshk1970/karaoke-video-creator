// Project Workflow JavaScript
let currentProject = null;
let originalTranscription = '';
let projectData = {
    name: '',
    audioFile: '',
    vocalFile: '',
    instrumentalFile: '',
    manualLyrics: '',
    aiTranscription: '',
    editedTranscription: ''
};

// Project Creation Functions
function openProjectModal() {
    document.getElementById('projectModal').classList.remove('hidden');
    document.getElementById('projectForm').reset();
}

function closeProjectModal() {
    document.getElementById('projectModal').classList.add('hidden');
}

function selectAudioFile() {
    document.getElementById('originalAudioFile').click();
}

function selectLyricsFile() {
    document.getElementById('manualLyricsFile').click();
}

// Handle file selections
document.getElementById('originalAudioFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const fileInfo = document.getElementById('audioFileInfo');
        fileInfo.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        fileInfo.classList.remove('hidden');
    }
});

document.getElementById('manualLyricsFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        log('Manual lyrics file selected: ' + file.name, 'info');
    }
});

// Handle project form submission
document.getElementById('projectForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const projectName = document.getElementById('projectName').value;
    const audioFile = document.getElementById('originalAudioFile').files[0];
    const lyricsFile = document.getElementById('manualLyricsFile').files[0];
    
    if (!projectName || !audioFile) {
        alert('Please provide project name and audio file');
        return;
    }
    
    await createProject(projectName, audioFile, lyricsFile);
});

async function createProject(name, audioFile, lyricsFile) {
    try {
        log('Creating project: ' + name, 'info');
        
        // Create project directory
        const projectDir = `/Users/santosh/development/songs/${name}`;
        
        // Save audio file to project directory
        const audioPath = `${projectDir}/${audioFile.name}`;
        await saveUploadedFile(audioFile, audioPath);
        
        // Save lyrics file if provided
        let lyricsPath = '';
        if (lyricsFile) {
            lyricsPath = `${projectDir}/${lyricsFile.name}`;
            await saveUploadedFile(lyricsFile, lyricsPath);
        }
        
        // Set project data
        projectData = {
            name: name,
            audioFile: audioPath,
            vocalFile: '',
            instrumentalFile: '',
            manualLyrics: lyricsPath,
            aiTranscription: '',
            editedTranscription: ''
        };
        
        currentProject = name;
        
        // Update UI
        document.getElementById('currentProjectName').textContent = name;
        document.getElementById('separation-input').textContent = audioFile.name;
        
        // Show workflow, hide modal
        closeProjectModal();
        document.getElementById('projectWorkflow').classList.remove('hidden');
        
        log('✅ Project created successfully!', 'success');
        
    } catch (error) {
        log('❌ Project creation failed: ' + error.message, 'error');
    }
}

async function saveUploadedFile(file, path) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    
    const response = await fetch('/api/save-file', {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) {
        throw new Error('Failed to save file');
    }
    
    return await response.json();
}

// Step 1: Vocal Separation
async function separateProjectVocals() {
    if (!currentProject) {
        log('No project selected', 'error');
        return;
    }
    
    try {
        log('Starting vocal separation...', 'info');
        
        // Show progress
        const progressDiv = document.getElementById('separation-progress');
        const progressBar = document.getElementById('separation-progress-bar');
        const timeSpan = document.getElementById('separation-time');
        progressDiv.classList.remove('hidden');
        
        // Disable button
        document.getElementById('btn-separate-vocals').disabled = true;
        
        // Start timer
        let startTime = Date.now();
        const timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            timeSpan.textContent = `${elapsed}s`;
            const fakeProgress = Math.min(95, elapsed * 0.8);
            progressBar.style.width = `${fakeProgress}%`;
        }, 1000);
        
        // Call API
        const response = await fetch('/api/separate-vocals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectName: currentProject,
                method: 'demucs',
                quality: 'high'
            })
        });
        
        const result = await response.json();
        
        // Stop timer
        clearInterval(timerInterval);
        progressBar.style.width = '100%';
        
        if (result.success) {
            projectData.vocalFile = result.vocalFile;
            projectData.instrumentalFile = result.noVocalFile;
            
            // Update UI
            document.getElementById('vocal-file-info').textContent = result.vocalFile.split('/').pop();
            document.getElementById('instrumental-file-info').textContent = result.noVocalFile.split('/').pop();
            document.getElementById('separation-results').classList.remove('hidden');
            document.getElementById('separation-status').textContent = '🟢';
            
            // Enable transcription
            document.getElementById('transcription-disabled').classList.add('hidden');
            document.getElementById('transcription-enabled').classList.remove('hidden');
            
            log('✅ Vocal separation completed!', 'success');
            
        } else {
            throw new Error(result.error || 'Vocal separation failed');
        }
        
    } catch (error) {
        log('❌ Vocal separation failed: ' + error.message, 'error');
    } finally {
        // Reset UI
        setTimeout(() => {
            document.getElementById('separation-progress').classList.add('hidden');
            document.getElementById('separation-progress-bar').style.width = '0%';
            document.getElementById('btn-separate-vocals').disabled = false;
        }, 1000);
    }
}

// Step 2: AI Transcription
async function transcribeWithAI() {
    if (!projectData.vocalFile) {
        log('No vocal file available', 'error');
        return;
    }
    
    try {
        log('Starting AI transcription...', 'info');
        
        // Show progress
        const progressDiv = document.getElementById('transcription-progress');
        const progressBar = document.getElementById('transcription-progress-bar');
        const timeSpan = document.getElementById('transcription-time');
        progressDiv.classList.remove('hidden');
        
        // Disable button
        document.getElementById('btn-transcribe').disabled = true;
        
        // Start timer
        let startTime = Date.now();
        const timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            timeSpan.textContent = `${elapsed}s`;
            const fakeProgress = Math.min(95, elapsed * 2);
            progressBar.style.width = `${fakeProgress}%`;
        }, 1000);
        
        // Call API
        const response = await fetch('/api/seamless-transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audioFile: projectData.vocalFile,
                language: 'hi'
            })
        });
        
        const result = await response.json();
        
        // Stop timer
        clearInterval(timerInterval);
        progressBar.style.width = '100%';
        
        if (result.success) {
            // Format transcription for display
            let transcriptionText = '';
            if (result.transcription.segments) {
                result.transcription.segments.forEach(segment => {
                    transcriptionText += segment.text + '\n';
                });
            }
            
            originalTranscription = transcriptionText.trim();
            projectData.aiTranscription = originalTranscription;
            projectData.editedTranscription = originalTranscription;
            
            // Update UI
            document.getElementById('transcriptionText').value = originalTranscription;
            document.getElementById('transcription-results').classList.remove('hidden');
            document.getElementById('transcription-status').textContent = '🟢';
            
            // Enable video generation
            document.getElementById('video-disabled').classList.add('hidden');
            document.getElementById('video-enabled').classList.remove('hidden');
            
            log('✅ AI transcription completed!', 'success');
            
        } else {
            throw new Error(result.error || 'Transcription failed');
        }
        
    } catch (error) {
        log('❌ AI transcription failed: ' + error.message, 'error');
    } finally {
        // Reset UI
        setTimeout(() => {
            document.getElementById('transcription-progress').classList.add('hidden');
            document.getElementById('transcription-progress-bar').style.width = '0%';
            document.getElementById('btn-transcribe').disabled = false;
        }, 1000);
    }
}

// Transcription editing functions
function copyTranscription() {
    const textarea = document.getElementById('transcriptionText');
    textarea.select();
    document.execCommand('copy');
    log('Transcription copied to clipboard', 'success');
}

function downloadTranscription() {
    const text = document.getElementById('transcriptionText').value;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject}_transcription.txt`;
    a.click();
    URL.revokeObjectURL(url);
    log('Transcription downloaded', 'success');
}

function saveEditedTranscription() {
    const editedText = document.getElementById('transcriptionText').value;
    projectData.editedTranscription = editedText;
    log('Transcription changes saved', 'success');
}

function resetTranscription() {
    document.getElementById('transcriptionText').value = originalTranscription;
    projectData.editedTranscription = originalTranscription;
    log('Transcription reset to original', 'info');
}

// Step 3: Video Generation
async function generateVideo() {
    if (!projectData.editedTranscription) {
        log('No transcription available', 'error');
        return;
    }
    
    try {
        const videoType = document.querySelector('input[name="videoType"]:checked').value;
        log(`Generating ${videoType} video...`, 'info');
        
        // Show progress
        const progressDiv = document.getElementById('video-progress');
        const progressBar = document.getElementById('video-progress-bar');
        const timeSpan = document.getElementById('video-time');
        progressDiv.classList.remove('hidden');
        
        // Disable button
        document.getElementById('btn-generate-video').disabled = true;
        
        // Start timer
        let startTime = Date.now();
        const timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            timeSpan.textContent = `${elapsed}s`;
            const fakeProgress = Math.min(95, elapsed * 1.5);
            progressBar.style.width = `${fakeProgress}%`;
        }, 1000);
        
        // Prepare timing data
        const timingData = {
            project: currentProject,
            lyrics: projectData.editedTranscription,
            audioFile: videoType === 'karaoke' ? projectData.instrumentalFile : projectData.audioFile,
            vocalFile: projectData.vocalFile,
            type: videoType
        };
        
        // Call API
        const response = await fetch('/api/generate-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(timingData)
        });
        
        const result = await response.json();
        
        // Stop timer
        clearInterval(timerInterval);
        progressBar.style.width = '100%';
        
        if (result.success) {
            // Update UI
            document.getElementById('video-results').classList.remove('hidden');
            document.getElementById('video-status').textContent = '🟢';
            
            log('✅ Video generated successfully!', 'success');
            
        } else {
            throw new Error(result.error || 'Video generation failed');
        }
        
    } catch (error) {
        log('❌ Video generation failed: ' + error.message, 'error');
    } finally {
        // Reset UI
        setTimeout(() => {
            document.getElementById('video-progress').classList.add('hidden');
            document.getElementById('video-progress-bar').style.width = '0%';
            document.getElementById('btn-generate-video').disabled = false;
        }, 1000);
    }
}

function playVideo() {
    log('Playing generated video...', 'info');
    // Implementation for video playback
}

function downloadVideo() {
    log('Downloading video...', 'info');
    // Implementation for video download
}

// Utility functions
function log(message, type = 'info') {
    const outputPanel = document.getElementById('output-panel');
    const timestamp = new Date().toLocaleTimeString();
    const logClass = `log-line log-${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    
    outputPanel.innerHTML += `<div class="${logClass}">${timestamp} ${icon} ${message}</div>`;
    outputPanel.scrollTop = outputPanel.scrollHeight;
}

// Initialize workflow
document.addEventListener('DOMContentLoaded', function() {
    // Add "Create Project" button to existing UI
    const header = document.querySelector('.bg-white .flex.items-center.justify-between');
    if (header) {
        const createProjectBtn = document.createElement('button');
        createProjectBtn.onclick = openProjectModal;
        createProjectBtn.className = 'bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition';
        createProjectBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>Create Project';
        header.appendChild(createProjectBtn);
    }
});
