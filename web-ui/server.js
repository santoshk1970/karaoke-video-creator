const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static(__dirname));

// Redirect root to projects page
app.get('/', (req, res) => {
    res.redirect('/projects.html');
});

const PROJECTS_DIR = path.join(__dirname, '..', 'projects');

// Ensure projects directory exists
if (!fs.existsSync(PROJECTS_DIR)) {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

// API: List projects
app.get('/api/list-projects', async (req, res) => {
    try {
        const projects = [];
        const dirs = fs.readdirSync(PROJECTS_DIR);

        for (const dir of dirs) {
            const projectPath = path.join(PROJECTS_DIR, dir);
            const stat = fs.statSync(projectPath);

            if (stat.isDirectory()) {
                const files = fs.readdirSync(projectPath);
                
                // Get line count if lyrics exist
                let lineCount = null;
                const lyricsPath = path.join(projectPath, 'lyrics.txt');
                if (fs.existsSync(lyricsPath)) {
                    const content = fs.readFileSync(lyricsPath, 'utf-8');
                    lineCount = content.split('\n').filter(l => l.trim()).length;
                }

                projects.push({
                    name: dir,
                    created: stat.mtime.toLocaleDateString(),
                    files: files,
                    lineCount
                });
            }
        }

        // Sort by modified time, newest first
        projects.sort((a, b) => new Date(b.created) - new Date(a.created));

        res.json({ success: true, projects });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Delete project
app.post('/api/delete-project', async (req, res) => {
    try {
        const { projectName } = req.body;
        const projectPath = path.join(PROJECTS_DIR, projectName);

        if (!fs.existsSync(projectPath)) {
            throw new Error('Project not found');
        }

        // Delete project directory recursively
        fs.rmSync(projectPath, { recursive: true, force: true });

        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Check project status
app.get('/api/check-project-status', async (req, res) => {
    try {
        const { project } = req.query;
        const projectPath = path.join(PROJECTS_DIR, project);

        if (!fs.existsSync(projectPath)) {
            throw new Error('Project not found');
        }

        const hasTimingFiles = fs.existsSync(path.join(projectPath, 'lyrics-with-timing.txt'));
        const hasImages = fs.existsSync(path.join(projectPath, 'output', 'images'));
        const hasTimestamps = fs.existsSync(path.join(projectPath, 'output', 'timestamps.json'));
        const hasVideo = fs.existsSync(path.join(projectPath, 'output', 'output.mp4'));

        res.json({
            success: true,
            hasTimingFiles,
            hasImages,
            hasTimestamps,
            hasVideo
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Setup project
app.post('/api/setup', upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'lyrics', maxCount: 1 },
    { name: 'instrumental', maxCount: 1 }
]), async (req, res) => {
    try {
        const { projectName } = req.body;
        const audioFile = req.files['audio'][0];
        const lyricsFile = req.files['lyrics'][0];

        // Create project directory
        const projectPath = path.join(PROJECTS_DIR, projectName);
        if (!fs.existsSync(projectPath)) {
            fs.mkdirSync(projectPath, { recursive: true });
        }

        // Copy files
        const audioPath = path.join(projectPath, 'audio.mp3');
        const lyricsPath = path.join(projectPath, 'lyrics.txt');

        fs.copyFileSync(audioFile.path, audioPath);
        fs.copyFileSync(lyricsFile.path, lyricsPath);

        // Handle optional instrumental file
        const instrumentalFile = req.files['instrumental'] ? req.files['instrumental'][0] : null;
        if (instrumentalFile) {
            const instrumentalPath = path.join(projectPath, 'instrumental.mp3');
            fs.copyFileSync(instrumentalFile.path, instrumentalPath);
            fs.unlinkSync(instrumentalFile.path);
        }

        // Clean up temp files
        fs.unlinkSync(audioFile.path);
        fs.unlinkSync(lyricsFile.path);

        // Count lines
        const lyricsContent = fs.readFileSync(lyricsPath, 'utf-8');
        const lineCount = lyricsContent.split('\n').filter(l => l.trim()).length;

        res.json({
            success: true,
            projectPath,
            lineCount
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Time lyrics (browser-based)
app.post('/api/time-lyrics', async (req, res) => {
    try {
        const { projectPath } = req.body;
        
        // Return URL to timing page
        res.json({
            success: true,
            timingUrl: `/timing.html?project=${encodeURIComponent(projectPath)}`
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Get project data for timing
app.get('/api/get-project-data', async (req, res) => {
    try {
        const { project } = req.query;
        const projectPath = path.join(PROJECTS_DIR, project);
        
        // Try to find lyrics file (prefer lyrics-with-transliteration.txt if it exists)
        let lyricsPath = path.join(projectPath, 'lyrics-with-transliteration.txt');
        if (!fs.existsSync(lyricsPath)) {
            lyricsPath = path.join(projectPath, 'lyrics.txt');
        }
        if (!fs.existsSync(lyricsPath)) {
            throw new Error('Lyrics file not found');
        }

        const lyricsContent = fs.readFileSync(lyricsPath, 'utf-8');
        const allLyrics = lyricsContent.split('\n').filter(l => l.trim());
        
        // Filter out countdown lines (they'll be auto-inserted later)
        const lyrics = allLyrics.filter(line => {
            // Skip countdown lines like "[4] 3 2 1" or "4 [3] 2 1" etc
            // But keep instrumental lines
            if (line.toLowerCase().includes('instrumental')) {
                return true; // Keep instrumental
            }
            
            // Check if line is a countdown pattern
            const countdownPattern = /^(\[?\d\]?\s*){2,4}\|/;
            const isCountdown = countdownPattern.test(line);
            
            return !isCountdown;
        });

        res.json({
            success: true,
            lyrics
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Get audio file
app.get('/api/get-audio', async (req, res) => {
    try {
        const { project } = req.query;
        const projectPath = path.join(PROJECTS_DIR, project);
        const audioPath = path.join(projectPath, 'audio.mp3');
        
        console.log('Looking for audio at:', audioPath);
        console.log('File exists:', fs.existsSync(audioPath));
        
        if (!fs.existsSync(audioPath)) {
            throw new Error(`Audio file not found at: ${audioPath}`);
        }

        res.sendFile(path.resolve(audioPath));
    } catch (error) {
        console.error('Audio error:', error.message);
        res.status(404).send(error.message);
    }
});

// API: Save timing data
app.post('/api/save-timing', async (req, res) => {
    try {
        const { projectPath: projectName, marks, lyrics } = req.body;
        const projectPath = path.join(PROJECTS_DIR, projectName);
        
        // Apply -1 second adjustment to all marks (already done in browser, but ensure consistency)
        // The browser already applies -1s, so marks are already adjusted
        
        // Process marks and insert countdowns (similar to timing-tool.js logic)
        const COUNTDOWN_THRESHOLD = 10;
        const marksWithCountdowns = [];
        
        for (let i = 0; i < marks.length; i++) {
            const currentMark = marks[i];
            
            if (i > 0) {
                const prevMark = marks[i - 1];
                const gap = currentMark.time - prevMark.time;
                
                if (gap > COUNTDOWN_THRESHOLD) {
                    // Insert countdown slides
                    const countdownStart = currentMark.time - 4;
                    for (let j = 4; j >= 1; j--) {
                        const highlightedCountdown = ['4', '3', '2', '1'].map((n, idx) => 
                            idx === (4 - j) ? `[${n}]` : n
                        ).join(' ');
                        
                        marksWithCountdowns.push({
                            lineIndex: marksWithCountdowns.length,
                            time: countdownStart + (4 - j),
                            lyric: `${highlightedCountdown} | ${highlightedCountdown}`,
                            isCountdown: true
                        });
                    }
                }
            }
            
            marksWithCountdowns.push(currentMark);
        }
        
        // Generate set-manual-timing.js
        const updatedLyrics = marksWithCountdowns.map(m => m.lyric);
        let content = `// Auto-generated timing file\n// Original lines: ${lyrics.length}\n// With countdowns: ${marksWithCountdowns.length}\n// Total lines: ${marksWithCountdowns.length}\n\n`;
        content += `const fs = require('fs');\nconst path = require('path');\n\n`;
        content += `const timestampsPath = './output/timestamps.json';\nconst data = JSON.parse(fs.readFileSync(timestampsPath, 'utf-8'));\n\n`;
        content += `// Lyric start times (in seconds)\nconst lyricStarts = [\n`;
        
        marksWithCountdowns.forEach((mark, i) => {
            const comment = mark.lyric.substring(0, 40);
            content += `    ${Math.round(mark.time)},     // ${i}: ${comment}...\n`;
        });
        
        content += `];\n\n`;
        content += `// Calculate end times\nconst totalDuration = data.metadata.duration;\n\n`;
        content += `for (let i = 0; i < lyricStarts.length && i < data.lyrics.length; i++) {\n`;
        content += `    const startTime = lyricStarts[i];\n`;
        content += `    const endTime = (i < lyricStarts.length - 1) ? lyricStarts[i + 1] : totalDuration;\n`;
        content += `    data.lyrics[i].startTime = startTime;\n`;
        content += `    data.lyrics[i].endTime = endTime;\n`;
        content += `}\n\n`;
        content += `fs.writeFileSync(timestampsPath, JSON.stringify(data, null, 2));\n`;
        content += `console.log('✅ Manual timing applied to', data.lyrics.length, 'lyrics');\n`;
        
        const outputPath = path.join(projectPath, 'set-manual-timing.js');
        fs.writeFileSync(outputPath, content);
        
        // Save lyrics-with-timing.txt
        const updatedLyricsPath = path.join(projectPath, 'lyrics-with-timing.txt');
        fs.writeFileSync(updatedLyricsPath, updatedLyrics.join('\n'));
        
        const countdownsCount = marksWithCountdowns.length - marks.length;
        
        res.json({
            success: true,
            marksCount: marks.length,
            countdownsCount,
            totalLines: marksWithCountdowns.length
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Check if timing is complete
app.post('/api/check-timing', async (req, res) => {
    try {
        const { projectPath: projectName } = req.body;
        
        // Construct absolute path
        const projectPath = path.join(PROJECTS_DIR, projectName);
        const timingFile = path.join(projectPath, 'lyrics-with-timing.txt');
        const hasTimingFiles = fs.existsSync(timingFile);
        
        if (hasTimingFiles) {
            const content = fs.readFileSync(timingFile, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim());
            
            const originalLyrics = fs.readFileSync(path.join(projectPath, 'lyrics.txt'), 'utf-8');
            const originalCount = originalLyrics.split('\n').filter(l => l.trim()).length;
            
            res.json({
                success: true,
                hasTimingFiles: true,
                marksCount: originalCount,
                totalLines: lines.length
            });
        } else {
            res.json({
                success: true,
                hasTimingFiles: false
            });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Generate images
app.post('/api/generate-images', async (req, res) => {
    try {
        const { projectPath: projectName } = req.body;
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Construct absolute paths
        const projectPath = path.join(PROJECTS_DIR, projectName);
        const audioPath = path.join(projectPath, 'audio.mp3');
        const lyricsPath = path.join(projectPath, 'lyrics-with-timing.txt');
        const outputPath = path.join(projectPath, 'output');

        const process = spawn('npm', ['start', '--', audioPath, lyricsPath, '--output', outputPath], {
            cwd: path.join(__dirname, '..')
        });

        process.stdout.on('data', (data) => {
            res.write(data.toString());
        });

        process.stderr.on('data', (data) => {
            res.write(data.toString());
        });

        process.on('close', (code) => {
            if (code === 0) {
                res.write('\n✅ Images generated successfully!\n');
            } else {
                res.write('\n❌ Image generation failed\n');
            }
            res.end();
        });
    } catch (error) {
        res.write(`\n❌ Error: ${error.message}\n`);
        res.end();
    }
});

// API: Apply timing
app.post('/api/apply-timing', async (req, res) => {
    try {
        const { projectPath: projectName } = req.body;
        
        // Construct absolute path
        const projectPath = path.join(PROJECTS_DIR, projectName);
        const setTimingScript = path.join(projectPath, 'set-manual-timing.js');
        
        console.log('Looking for timing script at:', setTimingScript);
        console.log('Script exists:', fs.existsSync(setTimingScript));
        
        if (!fs.existsSync(setTimingScript)) {
            throw new Error('Timing script not found. Please complete timing step first.');
        }

        const process = spawn('node', [setTimingScript], {
            cwd: projectPath
        });

        let output = '';
        process.stdout.on('data', (data) => {
            output += data.toString();
        });

        process.on('close', (code) => {
            if (code === 0) {
                const timestampsFile = path.join(projectPath, 'output', 'timestamps.json');
                const timestamps = JSON.parse(fs.readFileSync(timestampsFile, 'utf-8'));
                
                res.json({
                    success: true,
                    segmentCount: timestamps.lyrics.length
                });
            } else {
                res.json({ success: false, error: 'Failed to apply timing' });
            }
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Create video
app.post('/api/create-video', async (req, res) => {
    try {
        const { projectPath: projectName, purge } = req.body;
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Construct absolute paths
        const projectPath = path.join(PROJECTS_DIR, projectName);
        const audioPath = path.join(projectPath, 'audio.mp3');
        const outputPath = path.join(projectPath, 'output');

        const args = ['run', 'video', '--', audioPath, outputPath];
        if (purge) {
            args.push('--purge');
        }

        const process = spawn('npm', args, {
            cwd: path.join(__dirname, '..')
        });

        process.stdout.on('data', (data) => {
            res.write(data.toString());
        });

        process.stderr.on('data', (data) => {
            res.write(data.toString());
        });

        process.on('close', (code) => {
            if (code === 0) {
                res.write('\n✅ Video created successfully!\n');
            } else {
                res.write('\n❌ Video creation failed\n');
            }
            res.end();
        });
    } catch (error) {
        res.write(`\n❌ Error: ${error.message}\n`);
        res.end();
    }
});

// API: Play video
app.post('/api/play-video', async (req, res) => {
    try {
        const { projectPath: projectName } = req.body;
        const projectPath = path.join(PROJECTS_DIR, projectName);
        const videoPath = path.join(projectPath, 'output', 'output.mp4');

        if (!fs.existsSync(videoPath)) {
            throw new Error('Video not found. Please create video first.');
        }

        // Open video with default player
        const process = spawn('open', [videoPath]);

        process.on('close', (code) => {
            if (code === 0) {
                res.json({ success: true });
            } else {
                res.json({ success: false, error: 'Failed to open video' });
            }
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Kill audio playback
app.post('/api/kill-audio', async (req, res) => {
    try {
        const { execSync } = require('child_process');
        
        // Kill all ffplay processes
        try {
            execSync('killall ffplay 2>/dev/null', { stdio: 'ignore' });
        } catch (e) {
            // Ignore if no processes to kill
        }
        
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Emergency kill all
app.post('/api/emergency-kill', async (req, res) => {
    try {
        const { execSync } = require('child_process');
        const killed = [];
        
        // Kill ffplay (audio playback)
        try {
            execSync('killall ffplay 2>/dev/null', { stdio: 'ignore' });
            killed.push('ffplay');
        } catch (e) {
            // Ignore if no processes
        }
        
        // Kill ffmpeg (video encoding)
        try {
            execSync('killall ffmpeg 2>/dev/null', { stdio: 'ignore' });
            killed.push('ffmpeg');
        } catch (e) {
            // Ignore if no processes
        }
        
        // Kill any node processes running timing-tool
        try {
            execSync('pkill -f timing-tool.js 2>/dev/null', { stdio: 'ignore' });
            killed.push('timing-tool');
        } catch (e) {
            // Ignore if no processes
        }
        
        res.json({ 
            success: true, 
            killed: killed.length > 0 ? killed : ['none (no processes running)']
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`🎵 Karaoke Video Creator UI running at http://localhost:${PORT}`);
    console.log(`📁 Projects directory: ${PROJECTS_DIR}`);
});
