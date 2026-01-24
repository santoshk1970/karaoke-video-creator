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

// API: Reload lyrics file
app.post('/api/reload-lyrics', upload.single('lyrics'), (req, res) => {
    try {
        const { projectPath } = req.body;
        const projectDir = path.join(PROJECTS_DIR, projectPath);

        if (!fs.existsSync(projectDir)) {
            return res.json({ success: false, error: 'Project not found' });
        }

        // Read uploaded file
        const uploadedFile = req.file;
        const lyricsContent = fs.readFileSync(uploadedFile.path, 'utf-8');

        // Write to lyrics-with-timing.txt
        const lyricsPath = path.join(projectDir, 'lyrics-with-timing.txt');
        fs.writeFileSync(lyricsPath, lyricsContent);

        // Count lines
        const lineCount = lyricsContent.split('\n').filter(line => line.trim()).length;

        // Clean up uploaded file
        fs.unlinkSync(uploadedFile.path);

        // Delete old timing data and images since lyrics changed
        const outputDir = path.join(projectDir, 'output');
        if (fs.existsSync(outputDir)) {
            const timestampsPath = path.join(outputDir, 'timestamps.json');
            const imagesDir = path.join(outputDir, 'images');

            if (fs.existsSync(timestampsPath)) {
                fs.unlinkSync(timestampsPath);
            }
            // Also delete render manifest
            const renderPath = path.join(outputDir, 'timestamps-render.json');
            if (fs.existsSync(renderPath)) {
                fs.unlinkSync(renderPath);
            }
            if (fs.existsSync(imagesDir)) {
                fs.rmSync(imagesDir, { recursive: true, force: true });
            }
        }

        // Also delete stale manual timing script from project root
        const manualTimingScript = path.join(projectDir, 'set-manual-timing.js');
        if (fs.existsSync(manualTimingScript)) {
            fs.unlinkSync(manualTimingScript);
        }

        res.json({ success: true, lineCount });
    } catch (error) {
        console.error('Error reloading lyrics:', error);
        res.json({ success: false, error: error.message });
    }
});

// API: Check audio files
app.get('/api/check-audio-files', async (req, res) => {
    try {
        const { project } = req.query;
        const projectPath = path.join(PROJECTS_DIR, project);

        const hasOriginal = fs.existsSync(path.join(projectPath, 'audio.mp3'));
        const hasNoVocal = fs.existsSync(path.join(projectPath, 'audio-novocal.mp3'));

        res.json({
            success: true,
            hasOriginal,
            hasNoVocal
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Upload no-vocal audio
app.post('/api/upload-novocal-audio', upload.single('audio'), async (req, res) => {
    try {
        const { projectName } = req.body;
        const audioFile = req.file;

        if (!audioFile) {
            return res.json({ success: false, error: 'No audio file provided' });
        }

        const projectPath = path.join(PROJECTS_DIR, projectName);
        const novocalPath = path.join(projectPath, 'audio-novocal.mp3');

        fs.copyFileSync(audioFile.path, novocalPath);
        fs.unlinkSync(audioFile.path);

        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Separate vocals
app.post('/api/separate-vocals', async (req, res) => {
    try {
        const { projectName } = req.body;
        const projectPath = path.join(PROJECTS_DIR, projectName);
        const audioPath = path.join(projectPath, 'audio.mp3');

        if (!fs.existsSync(audioPath)) {
            return res.json({ success: false, error: 'Original audio file not found' });
        }

        // Run the vocal separation script
        const { execSync } = require('child_process');
        const scriptPath = path.join(__dirname, '..', 'separate-vocals-mp3.js');

        console.log(`Running vocal separation for ${projectName}...`);

        try {
            execSync(`node "${scriptPath}" "${audioPath}"`, {
                stdio: 'inherit',
                maxBuffer: 1024 * 1024 * 10
            });

            // Check if output file was created
            const novocalPath = path.join(projectPath, 'audio-novocal.mp3');
            if (fs.existsSync(novocalPath)) {
                console.log('Vocal separation completed successfully');
                res.json({ success: true });
            } else {
                throw new Error('Separation completed but output file not found');
            }
        } catch (error) {
            console.error('Vocal separation error:', error.message);
            throw error;
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Check if file exists
app.post('/api/file-exists', (req, res) => {
    try {
        const { filePath } = req.body;
        const exists = fs.existsSync(filePath);
        res.json({ success: true, exists });
    } catch (error) {
        res.json({ success: false, exists: false, error: error.message });
    }
});

// API: Check video status
app.get('/api/check-video-status', async (req, res) => {
    try {
        const { project } = req.query;
        const projectPath = path.join(PROJECTS_DIR, project);
        const outputDir = path.join(projectPath, 'output');

        const hasKaraoke = fs.existsSync(path.join(outputDir, 'karaoke.mp4'));
        const hasSingalong = fs.existsSync(path.join(outputDir, 'singalong.mp4'));

        res.json({
            success: true,
            hasKaraoke,
            hasSingalong
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

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
        const audioFile = req.files['audio'] ? req.files['audio'][0] : null;
        const lyricsFile = req.files['lyrics'][0];
        const instrumentalFile = req.files['instrumental'] ? req.files['instrumental'][0] : null;

        // Validate at least one audio file
        if (!audioFile && !instrumentalFile) {
            return res.json({ success: false, error: 'At least one audio file is required' });
        }

        // Create project directory
        const projectPath = path.join(PROJECTS_DIR, projectName);
        if (!fs.existsSync(projectPath)) {
            fs.mkdirSync(projectPath, { recursive: true });
        }

        // Copy lyrics file
        const lyricsPath = path.join(projectPath, 'lyrics.txt');
        fs.copyFileSync(lyricsFile.path, lyricsPath);
        fs.unlinkSync(lyricsFile.path);

        // Copy original audio file (with vocals - for Sing-along)
        if (audioFile) {
            const audioPath = path.join(projectPath, 'audio.mp3');
            fs.copyFileSync(audioFile.path, audioPath);
            fs.unlinkSync(audioFile.path);
        }

        // Copy instrumental file (no vocals - for Karaoke)
        if (instrumentalFile) {
            const instrumentalPath = path.join(projectPath, 'audio-novocal.mp3');
            fs.copyFileSync(instrumentalFile.path, instrumentalPath);
            fs.unlinkSync(instrumentalFile.path);
        }

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

        // No adjustment applied - marks reflect exact time when user pressed spacebar
        // This matches the browser timing tool behavior

        // Process marks and insert countdowns (similar to timing-tool.js logic)
        const COUNTDOWN_THRESHOLD = 10;
        const INSTRUMENTAL_THRESHOLD = 15; // Threshold for auto-inserting instrumental break
        const marksWithCountdowns = [];

        for (let i = 0; i < marks.length; i++) {
            let currentMark = marks[i];

            if (i > 0) {
                const prevMark = marksWithCountdowns[marksWithCountdowns.length - 1];
                let gap = currentMark.time - prevMark.time;

                // Check for auto-instrumental insertion
                // If gap is large AND current line isn't instrumental AND previous line wasn't instrumental
                if (gap > INSTRUMENTAL_THRESHOLD &&
                    !currentMark.lyric.includes('Instrumental') &&
                    !prevMark.lyric.includes('Instrumental')) {

                    // Start instrumental 3 seconds after previous line
                    const instrumentalTime = prevMark.time + 3.0;

                    // Create instrumental mark
                    const instrumentalMark = {
                        lineIndex: marksWithCountdowns.length,
                        time: instrumentalTime,
                        lyric: '♪ Instrumental ♪',
                        isCountdown: false
                    };

                    marksWithCountdowns.push(instrumentalMark);
                    console.log(`   Auto-inserted Instrumental at ${instrumentalTime.toFixed(2)}s (gap was ${gap.toFixed(2)}s)`);

                    // Recalculate gap from new instrumental mark to current mark
                    // The gap is now: (Instrumental -> Current)
                    gap = currentMark.time - instrumentalTime;
                }

                // Check for countdown insertion (now checks against new gap if instrumental was inserted)
                if (gap > COUNTDOWN_THRESHOLD) {
                    // Insert countdown slides
                    const countdownStart = currentMark.time - 4; // 4 seconds before next lyric
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

        // Insert prelude screen if first mark is not at time 0
        if (marksWithCountdowns.length > 0 && marksWithCountdowns[0].time > 0) {
            const firstMarkTime = marksWithCountdowns[0].time;
            const preludeMark = {
                lineIndex: -1,
                time: 0.0,
                lyric: '♪ ♪',
                isCountdown: false
            };
            marksWithCountdowns.unshift(preludeMark);
            console.log(`   Added prelude screen from 0.0s to ${firstMarkTime.toFixed(1)}s`);
        }

        // Generate set-manual-timing.js
        const updatedLyrics = marksWithCountdowns.map(m => m.lyric);
        let content = `// Auto-generated timing file\n// Original lines: ${lyrics.length}\n// With countdowns: ${marksWithCountdowns.length}\n// Total lines: ${marksWithCountdowns.length}\n\n`;
        content += `const fs = require('fs');\nconst path = require('path');\n\n`;
        content += `const timestampsPath = './output/timestamps.json';\nconst data = JSON.parse(fs.readFileSync(timestampsPath, 'utf-8'));\n\n`;
        content += `// Lyric start times (in seconds)\nconst lyricStarts = [\n`;

        marksWithCountdowns.forEach((mark, i) => {
            const comment = mark.lyric.substring(0, 40);
            content += `    ${mark.time.toFixed(2)},     // ${i}: ${comment}...\n`;
        });

        content += `];\n\n`;

        // Add lyric texts array
        content += `// Lyric texts (matching lyricStarts array)\nconst lyricTexts = [\n`;
        marksWithCountdowns.forEach((mark, i) => {
            const escapedText = mark.lyric.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
            content += `    '${escapedText}',\n`;
        });
        content += `];\n\n`;

        content += `// Rebuild lyrics array from marks (to include prelude, countdowns, etc.)
const totalDuration = data.metadata?.duration || 600; // Default to 10 min if missing

// Create new lyrics array matching marks exactly
const updatedLyrics = [];
for (let i = 0; i < lyricStarts.length; i++) {
    const startTime = lyricStarts[i];
    const endTime = (i < lyricStarts.length - 1) ? lyricStarts[i + 1] : totalDuration;

    updatedLyrics.push({
        index: i,
        startTime: startTime,
        endTime: endTime,
        text: lyricTexts[i],
        imagePath: 'images/lyric_' + String(i).padStart(3, '0') + '.png'
    });
}

// Replace lyrics array completely with new data
data.lyrics = updatedLyrics;

    fs.writeFileSync(timestampsPath, JSON.stringify(data, null, 2));\n`;
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
        const { projectPath: projectName, purge, videoType } = req.body;

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Construct absolute paths
        const projectPath = path.join(PROJECTS_DIR, projectName);

        // Select audio file based on video type
        const audioFilename = videoType === 'karaoke' ? 'audio-novocal.mp3' : 'audio.mp3';
        const audioPath = path.join(projectPath, audioFilename);

        // Check if audio file exists
        if (!fs.existsSync(audioPath)) {
            res.write(`❌ Error: ${audioFilename} not found. Please upload the required audio file.\n`);
            res.end();
            return;
        }

        const outputPath = path.join(projectPath, 'output');

        // Output filename based on video type
        const outputFilename = videoType === 'karaoke' ? 'karaoke.mp4' : 'singalong.mp4';

        const args = ['run', 'video', '--', audioPath, outputPath, '--output', outputFilename];
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
        const { projectPath: projectName, videoType } = req.body;
        const projectPath = path.join(PROJECTS_DIR, projectName);

        // Select video file based on type
        const videoFilename = videoType === 'karaoke' ? 'karaoke.mp4' : 'singalong.mp4';
        const videoPath = path.join(projectPath, 'output', videoFilename);

        if (!fs.existsSync(videoPath)) {
            throw new Error(`${videoFilename} not found. Please create the video first.`);
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

// API: Get timing data for editor
app.get('/api/get-timing-data', async (req, res) => {
    try {
        const { project } = req.query;
        const projectPath = path.join(PROJECTS_DIR, project);
        const timestampsPath = path.join(projectPath, 'output/timestamps.json');

        if (!fs.existsSync(timestampsPath)) {
            return res.json({ success: false, error: 'Timestamps file not found. Generate images first.' });
        }

        const data = JSON.parse(fs.readFileSync(timestampsPath, 'utf-8'));
        res.json({ success: true, data });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Update timing with propagation
app.post('/api/update-timing', async (req, res) => {
    try {
        const { project, updates } = req.body;
        const projectPath = path.join(PROJECTS_DIR, project);
        const timestampsPath = path.join(projectPath, 'output/timestamps.json');

        if (!fs.existsSync(timestampsPath)) {
            return res.json({ success: false, error: 'Timestamps file not found' });
        }

        const data = JSON.parse(fs.readFileSync(timestampsPath, 'utf-8'));

        // Apply updates with propagation
        updates.forEach(update => {
            const { index, newStartTime, propagate } = update;
            const oldStartTime = data.lyrics[index].startTime;
            const delta = newStartTime - oldStartTime;

            // Update this lyric
            data.lyrics[index].startTime = newStartTime;

            // Propagate if checked
            if (propagate && delta !== 0) {
                for (let i = index + 1; i < data.lyrics.length; i++) {
                    data.lyrics[i].startTime += delta;
                }
            }
        });

        // Recalculate all endTimes
        for (let i = 0; i < data.lyrics.length; i++) {
            const nextStart = i < data.lyrics.length - 1
                ? data.lyrics[i + 1].startTime
                : data.metadata.duration;
            data.lyrics[i].endTime = nextStart;
        }

        // Save updated data
        fs.writeFileSync(timestampsPath, JSON.stringify(data, null, 2));

        res.json({ success: true, updatedCount: updates.length });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// API: Delete images to force regeneration
app.post('/api/delete-images', async (req, res) => {
    try {
        const { project } = req.body;
        const projectPath = path.join(PROJECTS_DIR, project);
        const imagesDir = path.join(projectPath, 'output/images');

        if (fs.existsSync(imagesDir)) {
            fs.rmSync(imagesDir, { recursive: true, force: true });
            res.json({ success: true, message: 'Images deleted' });
        } else {
            res.json({ success: true, message: 'No images to delete' });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🎵 Karaoke Video Creator UI running at http://localhost:${PORT}`);
    console.log(`📁 Projects directory: ${PROJECTS_DIR}`);
});
