// Enhanced API Server with SeamlessM4T Integration
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(express.json());
app.use(express.static('web-ui'));
app.use(express.static('output'));

// Helper function to run commands
async function runCommand(cmd, options = {}) {
    try {
        const { stdout, stderr } = await execAsync(cmd, { 
            maxBuffer: 1024 * 1024 * 10,
            ...options 
        });
        return { stdout, stderr };
    } catch (error) {
        throw new Error(`Command failed: ${error.message}`);
    }
}

// API: SeamlessM4T Transcription
app.post('/api/seamless-transcribe', async (req, res) => {
    try {
        const { audioFile, language = 'hi' } = req.body;
        
        if (!audioFile || !await fileExists(audioFile)) {
            return res.status(400).json({ success: false, error: 'Audio file not found' });
        }
        
        console.log('Starting SeamlessM4T transcription for:', audioFile);
        
        // Use our working SeamlessM4T implementation
        const cmd = `cd /Users/santosh/development/karaokestudio2 && ts-node src/workingSeamlessM4T.ts "${audioFile}" "./output" "${language}"`;
        
        const { stdout, stderr } = await runCommand(cmd);
        
        // Read the result
        const resultPath = '/Users/santosh/development/karaokestudio2/output/working_seamless_result.json';
        const transcriptionData = JSON.parse(await fs.readFile(resultPath, 'utf8'));
        
        res.json({
            success: true,
            transcription: transcriptionData,
            message: 'Transcription completed successfully'
        });
        
    } catch (error) {
        console.error('SeamlessM4T transcription error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// API: Generate AI Timing
app.post('/api/generate-ai-timing', async (req, res) => {
    try {
        const { audioFile, transcription, language = 'hi' } = req.body;
        
        if (!audioFile || !transcription) {
            return res.status(400).json({ success: false, error: 'Missing audio file or transcription' });
        }
        
        console.log('Generating AI timing for:', audioFile);
        
        // Save transcription temporarily
        const tempTranscriptionPath = '/Users/santosh/development/karaokestudio2/output/temp_transcription.json';
        await fs.writeFile(tempTranscriptionPath, JSON.stringify(transcription, null, 2));
        
        // Generate final karaoke timing
        const cmd = `cd /Users/santosh/development/karaokestudio2 && ts-node src/finalKaraokeAligner.ts "${tempTranscriptionPath}" "./output"`;
        
        await runCommand(cmd);
        
        // Read the final timing
        const finalTimingPath = '/Users/santosh/development/karaokestudio2/output/final_karaoke_timing.json';
        const timingData = JSON.parse(await fs.readFile(finalTimingPath, 'utf8'));
        
        res.json({
            success: true,
            timing: timingData,
            message: 'AI timing generated successfully'
        });
        
    } catch (error) {
        console.error('AI timing generation error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// API: Generate Hybrid Timing
app.post('/api/generate-hybrid-timing', async (req, res) => {
    try {
        const { audioFile, lyrics, language = 'hi' } = req.body;
        
        if (!audioFile || !lyrics) {
            return res.status(400).json({ success: false, error: 'Missing audio file or lyrics' });
        }
        
        console.log('Generating hybrid timing for:', audioFile);
        
        // Save lyrics temporarily
        const tempLyricsPath = '/Users/santosh/development/karaokestudio2/output/temp_lyrics.txt';
        await fs.writeFile(tempLyricsPath, lyrics, 'utf8');
        
        // Use our working SeamlessM4T with provided lyrics
        const cmd = `cd /Users/santosh/development/karaokestudio2 && ts-node src/workingSeamlessM4T.ts "${audioFile}" "./output" "${language}"`;
        
        await runCommand(cmd);
        
        // Generate final karaoke timing
        const finalCmd = `cd /Users/santosh/development/karaokestudio2 && ts-node src/finalKaraokeAligner.ts "./output/working_seamless_result.json" "./output"`;
        await runCommand(finalCmd);
        
        // Read the final timing
        const finalTimingPath = '/Users/santosh/development/karaokestudio2/output/final_karaoke_timing.json';
        const timingData = JSON.parse(await fs.readFile(finalTimingPath, 'utf8'));
        
        res.json({
            success: true,
            timing: timingData,
            message: 'Hybrid timing generated successfully'
        });
        
    } catch (error) {
        console.error('Hybrid timing generation error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// API: Enhanced Vocal Separation (with Demucs option)
app.post('/api/separate-vocals', async (req, res) => {
    try {
        const { projectName, method = 'demucs', quality = 'high', audioFile } = req.body;
        
        if (!projectName) {
            return res.status(400).json({ success: false, error: 'Project name required' });
        }
        
        console.log(`Starting vocal separation with method: ${method}`);
        console.log(`Audio file: ${audioFile}`);
        
        let inputPath;
        if (audioFile && await fileExists(audioFile)) {
            // Use the uploaded audio file path
            inputPath = audioFile;
        } else {
            // Fallback: find the audio file in songs directory
            const projectDir = '/Users/santosh/development/songs';
            const audioFiles = await fs.readdir(projectDir);
            const audioFileFound = audioFiles.find(f => f.endsWith('.mp3') && f.includes(projectName.toLowerCase()));
            
            if (!audioFileFound) {
                return res.status(404).json({ success: false, error: 'Audio file not found' });
            }
            
            inputPath = path.join(projectDir, audioFileFound);
        }
        
        const projectDir = '/Users/santosh/development/songs';
        const outputPath = path.join(projectDir, `${projectName}-voice-${method}.mp3`);
        const noVocalPath = path.join(projectDir, `${projectName}-novocal-${method}.mp3`);
        
        // Use our enhanced voice extractor
        const cmd = `cd /Users/santosh/development/karaokestudio2 && npm run extract-voice -- -m ${method} -q ${quality} "${inputPath}"`;
        
        await runCommand(cmd);
        
        // Check if files were created
        const vocalExists = await fileExists(outputPath);
        const noVocalExists = await fileExists(noVocalPath);
        
        if (!vocalExists || !noVocalExists) {
            // Try to find the actual output files in Demucs directory structure
            const projectDir = '/Users/santosh/development/songs';
            const demucsDir = path.join(projectDir, projectName, 'htdemucs');
            
            if (await fileExists(demucsDir)) {
                const demucsSubdirs = await fs.readdir(demucsDir);
                const targetDir = demucsSubdirs.find(dir => dir.includes(projectName.toLowerCase()));
                
                if (targetDir) {
                    const demucsOutputDir = path.join(demucsDir, targetDir);
                    const vocalFile = path.join(demucsOutputDir, 'vocals.wav');
                    const noVocalFile = path.join(demucsOutputDir, 'no_vocals.wav');
                    
                    if (await fileExists(vocalFile) && await fileExists(noVocalFile)) {
                        // Convert to MP3 for consistency
                        const vocalMp3 = path.join(projectDir, `${projectName}-voice-${method}.mp3`);
                        const noVocalMp3 = path.join(projectDir, `${projectName}-novocal-${method}.mp3`);
                        
                        // Convert WAV to MP3 using ffmpeg
                        await runCommand(`ffmpeg -i "${vocalFile}" "${vocalMp3}"`);
                        await runCommand(`ffmpeg -i "${noVocalFile}" "${noVocalMp3}"`);
                        
                        return res.json({
                            success: true,
                            vocalFile: vocalMp3,
                            noVocalFile: noVocalMp3,
                            message: 'Vocal separation completed successfully'
                        });
                    }
                }
            }
            
            // Fallback: try to find files in project directory
            const files = await fs.readdir(projectDir);
            const vocalFile = files.find(f => f.includes('voice') && f.includes(projectName.toLowerCase()));
            const noVocalFile = files.find(f => f.includes('novocal') && f.includes(projectName.toLowerCase()));
            
            if (!vocalFile || !noVocalFile) {
                throw new Error('Vocal separation output files not found');
            }
            
            return res.json({
                success: true,
                vocalFile: path.join(projectDir, vocalFile),
                noVocalFile: path.join(projectDir, noVocalFile),
                message: 'Vocal separation completed successfully'
            });
        }
        
        res.json({
            success: true,
            vocalFile: outputPath,
            noVocalFile: noVocalPath,
            message: 'Vocal separation completed successfully'
        });
        
    } catch (error) {
        console.error('Vocal separation error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// API: Save uploaded file
app.post('/api/save-file', upload.single('file'), async (req, res) => {
    try {
        const { path: targetPath } = req.body;
        const file = req.file;
        
        if (!file || !targetPath) {
            return res.status(400).json({ success: false, error: 'File and path required' });
        }
        
        // Create directory if it doesn't exist
        const dir = path.dirname(targetPath);
        await fs.mkdir(dir, { recursive: true });
        
        // Move file to target location
        await fs.rename(file.path, targetPath);
        
        res.json({
            success: true,
            filePath: targetPath,
            message: 'File saved successfully'
        });
        
    } catch (error) {
        console.error('Save file error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// API: Generate video
app.post('/api/generate-video', async (req, res) => {
    try {
        const { project, lyrics, audioFile, vocalFile, type } = req.body;
        
        if (!project || !lyrics || !audioFile) {
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }
        
        console.log(`Generating ${type} video for project: ${project}`);
        
        // Create temporary lyrics file
        const tempLyricsPath = `/Users/santosh/development/karaokestudio2/output/temp_${project}_lyrics.txt`;
        await fs.writeFile(tempLyricsPath, lyrics, 'utf8');
        
        // Generate timing using our simple approach
        // Use the original audio file for timing to match the actual song pace
        const cmd = `cd /Users/santosh/development/karaokestudio2 && ts-node src/simpleSeamlessM4T.ts "${audioFile}" "./output" "hi"`;
        await runCommand(cmd);
        
        // Generate final karaoke files
        const finalCmd = `cd /Users/santosh/development/karaokestudio2 && ts-node src/finalKaraokeAligner.ts "./output/simple_seamless_result.json" "./output"`;
        await runCommand(finalCmd);
        
        // Read the timing data
        const timingData = JSON.parse(await fs.readFile('./output/final_karaoke_timing.json', 'utf8'));
        
        // Generate video using existing video creation logic
        // Convert our timing format to the expected timestamps.json format
        const timestampsPath = './output/timestamps.json';
        const convertedTiming = convertTimingFormat(timingData.segments);
        await fs.writeFile(timestampsPath, JSON.stringify(convertedTiming, null, 2));
        
        console.log('Converted timing format:', JSON.stringify(convertedTiming, null, 2));
        
        const videoCmd = `cd /Users/santosh/development/karaokestudio2 && npm run video "${audioFile}" "./output" --output "${project}_${type}_video.mp4"`;
        await runCommand(videoCmd);
        
        res.json({
            success: true,
            videoFile: './output/output.mp4',
            message: 'Video generated successfully'
        });
        
    } catch (error) {
        console.error('Video generation error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// API: Check audio files
app.get('/api/check-audio-files', async (req, res) => {
    try {
        const { project } = req.query;
        
        if (!project) {
            return res.status(400).json({ success: false, error: 'Project name required' });
        }
        
        const projectDir = '/Users/santosh/development/songs';
        const files = await fs.readdir(projectDir);
        
        const vocalFile = files.find(f => f.includes('voice') && f.includes(project.toLowerCase()));
        const noVocalFile = files.find(f => f.includes('novocal') && f.includes(project.toLowerCase()));
        
        res.json({
            success: true,
            hasVocal: !!vocalFile,
            hasNoVocal: !!noVocalFile,
            vocalFile: vocalFile ? path.join(projectDir, vocalFile) : null,
            noVocalFile: noVocalFile ? path.join(projectDir, noVocalFile) : null
        });
        
    } catch (error) {
        console.error('Check audio files error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// API: Get timing data for video generation
app.get('/api/timing-data', async (req, res) => {
    try {
        const { project, method = 'hybrid' } = req.query;
        
        let timingPath;
        switch(method) {
            case 'ai':
                timingPath = '/Users/santosh/development/karaokestudio2/output/final_karaoke_timing.json';
                break;
            case 'hybrid':
                timingPath = '/Users/santosh/development/karaokestudio2/output/final_karaoke_timing.json';
                break;
            default:
                timingPath = `/Users/santosh/development/songs/${project}_timing.json`;
        }
        
        if (!await fileExists(timingPath)) {
            return res.status(404).json({ success: false, error: 'Timing file not found' });
        }
        
        const timingData = JSON.parse(await fs.readFile(timingPath, 'utf8'));
        
        res.json({
            success: true,
            timing: timingData,
            method: method
        });
        
    } catch (error) {
        console.error('Get timing data error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Helper function to check if file exists
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Convert our timing format to the expected timestamps.json format
function convertTimingFormat(segments) {
    const lyrics = [];
    
    // Add prelude filler if first lyric doesn't start at 0
    if (segments.length > 0 && segments[0].start > 0) {
        // Use the first actual image as filler for prelude
        lyrics.push({
            index: 0,
            startTime: 0,
            endTime: segments[0].start,
            duration: segments[0].start,
            text: "♪ Instrumental ♪", // Use instrumental marker
            imagePath: "images/lyric_000.png"
        });
    }
    
    // Add actual lyrics with proper timing
    segments.forEach((segment, index) => {
        const actualIndex = lyrics.length;
        lyrics.push({
            index: actualIndex,
            startTime: segment.start,
            endTime: segment.end,
            duration: segment.end - segment.start,
            text: segment.speaker ? `${segment.speaker}:${segment.text}` : segment.text,
            imagePath: `images/lyric_${String(actualIndex).padStart(3, '0')}.png`
        });
    });
    
    return {
        version: "1.0",
        metadata: {
            generatedAt: new Date().toISOString(),
            totalLines: lyrics.length,
            duration: segments.length > 0 ? segments[segments.length - 1].end : 0
        },
        lyrics: lyrics
    };
}

// Serve static files from output directory
app.use('/output', express.static('/Users/santosh/development/karaokestudio2/output'));

// Serve video files
app.get('/serve-video/:filename', (req, res) => {
    const filename = req.params.filename;
    const videoPath = path.join('/Users/santosh/development/karaokestudio2/output', filename);
    
    console.log('Video requested:', filename);
    console.log('Video path:', videoPath);
    
    if (fs.existsSync(videoPath)) {
        console.log('Video file found, serving...');
        res.sendFile(videoPath);
    } else {
        console.log('Video file not found:', videoPath);
        res.status(404).json({ error: 'Video file not found' });
    }
});

// Serve the main web UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web-ui', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Enhanced Karaoke Server running on port ${PORT}`);
    console.log(`📁 Web UI: http://localhost:${PORT}`);
    console.log(`🎵 SeamlessM4T integration ready`);
    console.log(`🎤 Demucs vocal separation ready`);
});

// Error handling
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

module.exports = app;
