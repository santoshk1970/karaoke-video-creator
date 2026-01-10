#!/usr/bin/env ts-node

/**
 * Interactive Timing Tool for Karaoke
 * 
 * Usage: ts-node src/timing-tool.ts <project-folder>
 * 
 * Features:
 * - Real-time audio playback
 * - Spacebar to mark lyric start times
 * - Visual feedback with timestamp
 * - Undo last mark
 * - Auto-insert countdown for long instrumentals (>10s)
 * - Generates set-manual-timing.js
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess, execSync } from 'child_process';
import * as readline from 'readline';

// Configuration
const COUNTDOWN_THRESHOLD = 10; // seconds
const COUNTDOWN_DURATION = 4; // 4 seconds for "4 3 2 1" (1s per number)
const REACTION_TIME_ADJUSTMENT = 0.0; // seconds to subtract from spacebar press (0 = display when marked)

interface Mark {
    lineIndex: number;
    time: number;
    lyric: string;
    isCountdown?: boolean;
}

export class TimingTool {
    private projectFolder: string;
    private audioFile: string = '';
    private lyricsFile: string = '';
    private lyrics: string[] = [];
    private marks: Mark[] = [];
    private currentLineIndex: number = 0;
    private startTime: number | null = null;
    private ffplayProcess: ChildProcess | null = null;
    private displayInterval: NodeJS.Timeout | null = null;

    constructor(projectFolder: string) {
        this.projectFolder = projectFolder;
    }

    async init(): Promise<void> {
        console.log('\n🎵 Karaoke Timing Tool\n' + '━'.repeat(50) + '\n');

        // Find audio and lyrics files
        await this.findFiles();

        // Load lyrics
        await this.loadLyrics();

        console.log(`✅ Found: ${path.basename(this.audioFile)}`);
        console.log(`✅ Found: ${path.basename(this.lyricsFile)} (${this.lyrics.length} lines)\n`);
    }

    private async findFiles(): Promise<void> {
        const files = fs.readdirSync(this.projectFolder);

        // Find audio file
        const audioFile = files.find(f => f.match(/\.(mp3|wav|m4a|flac)$/i));
        if (!audioFile) {
            throw new Error('No audio file found in project folder');
        }
        this.audioFile = path.join(this.projectFolder, audioFile);

        // Find lyrics file
        const lyricsFile = files.find(f => f.match(/lyrics.*\.txt$/i) || f === 'lyrics.txt');
        if (!lyricsFile) {
            throw new Error('No lyrics file found in project folder');
        }
        this.lyricsFile = path.join(this.projectFolder, lyricsFile);
    }

    private async loadLyrics(): Promise<void> {
        const content = fs.readFileSync(this.lyricsFile, 'utf-8');
        const allLyrics = content.split('\n').filter(line => line.trim());

        // Filter out countdown lines (they'll be auto-inserted later)
        // Keep instrumental lines
        this.lyrics = allLyrics.filter(line => {
            const isCountdown = /^\[?\d\]?\s*\d?\s*\d?\s*\d?\s*\|/.test(line) &&
                !line.toLowerCase().includes('instrumental');
            return !isCountdown;
        });

        console.log(`✅ Found: ${path.basename(this.lyricsFile)} (${this.lyrics.length} lines)\n`);
    }

    private getCurrentTime(): number {
        if (!this.startTime) return 0;
        return (Date.now() - this.startTime) / 1000;
    }

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(1);
        return `${mins}:${secs.padStart(4, '0')}`;
    }

    private markTime(): void {
        const rawTime = this.getCurrentTime();
        // Apply reaction time adjustment (0 = display exactly when marked)
        const adjustedTime = Math.max(0, rawTime - REACTION_TIME_ADJUSTMENT);

        this.marks.push({
            lineIndex: this.currentLineIndex,
            time: adjustedTime,
            lyric: this.lyrics[this.currentLineIndex]
        });

        console.log(`\n✅ [${this.formatTime(adjustedTime)}] Marked: "${this.lyrics[this.currentLineIndex].substring(0, 40)}..." (pressed at ${this.formatTime(rawTime)})`);

        this.currentLineIndex++;
        this.showNextLine();
    }

    private undoLastMark(): void {
        if (this.marks.length === 0) {
            console.log('\n⚠️  No marks to undo');
            return;
        }

        const removed = this.marks.pop()!;
        this.currentLineIndex--;
        console.log(`\n↩️  Undone: [${this.formatTime(removed.time)}] "${removed.lyric.substring(0, 40)}..."`);
        this.showNextLine();
    }

    private showNextLine(): void {
        // Clear any existing display interval
        if (this.displayInterval) {
            clearInterval(this.displayInterval);
        }

        if (this.currentLineIndex >= this.lyrics.length) {
            console.log('\n🎉 All lines marked! Press Q to finish.\n');
            return;
        }

        // Display the line immediately
        this.displayCurrentLine();

        // Update display every second to show current time
        this.displayInterval = setInterval(() => {
            this.displayCurrentLine();
        }, 1000);
    }

    private displayCurrentLine(): void {
        if (this.currentLineIndex >= this.lyrics.length) {
            return;
        }

        const nextLine = this.lyrics[this.currentLineIndex];
        const preview = nextLine.length > 80 ? nextLine.substring(0, 80) + '...' : nextLine;

        // Clear screen and show prominent display
        console.clear();
        console.log('\n');
        console.log('█'.repeat(80));
        console.log('█' + ' '.repeat(78) + '█');
        console.log(`█  🎵 LISTEN FOR LINE ${this.currentLineIndex + 1}/${this.lyrics.length}` + ' '.repeat(80 - 25 - String(this.currentLineIndex + 1).length - String(this.lyrics.length).length) + '█');
        console.log('█' + ' '.repeat(78) + '█');
        console.log('█'.repeat(80));
        console.log('');
        console.log('  ╔' + '═'.repeat(76) + '╗');
        console.log('  ║' + ' '.repeat(76) + '║');
        console.log(`  ║  ${preview}` + ' '.repeat(76 - preview.length - 2) + '║');
        console.log('  ║' + ' '.repeat(76) + '║');
        console.log('  ╚' + '═'.repeat(76) + '╝');
        console.log('');
        console.log(`  ⏱️  Current Time: ${this.formatTime(this.getCurrentTime())}`);
        console.log(`  📊 Progress: ${this.marks.length}/${this.lyrics.length} marked`);
        console.log('');
        console.log('  💡 Press SPACE when you HEAR this line (auto-adjusts -1s for reaction)');
        console.log('  🔄 Press BACKSPACE to undo last mark');
        console.log('  ❌ Press Q to quit and save');
        console.log('');
    }

    private async startPlayback(): Promise<void> {
        console.log('\n🎵 Starting playback in 3 seconds...\n');

        // Kill any existing ffplay processes first
        try {
            execSync('killall ffplay 2>/dev/null', { stdio: 'ignore' });
        } catch (e) {
            // Ignore if no processes to kill
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Start ffplay in background with stdin disabled to prevent keyboard interference
        this.ffplayProcess = spawn('ffplay', [
            '-nodisp',
            '-autoexit',
            '-loglevel', 'quiet',
            this.audioFile
        ], {
            stdio: ['ignore', 'pipe', 'pipe']  // Ignore stdin to prevent ffplay from capturing keyboard
        });

        this.startTime = Date.now();
        this.showNextLine();

        this.ffplayProcess.on('close', () => {
            console.log('\n🎵 Playback finished');
        });

        this.ffplayProcess.on('error', (err) => {
            console.error('\n❌ Playback error:', err.message);
        });
    }

    private setupKeyboardInput(): void {
        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }

        process.stdin.on('keypress', (str, key) => {
            if (key.ctrl && key.name === 'c') {
                this.cleanup();
                process.exit(0);
            }

            if (key.name === 'space') {
                if (this.currentLineIndex < this.lyrics.length) {
                    this.markTime();
                }
            } else if (key.name === 'backspace') {
                this.undoLastMark();
            } else if (key.name === 'q') {
                this.finish();
            }
        });
    }

    private insertCountdowns(): Mark[] {
        // Find gaps > COUNTDOWN_THRESHOLD and insert countdown slides
        const marksWithCountdowns: Mark[] = [];

        for (let i = 0; i < this.marks.length; i++) {
            const currentMark = this.marks[i];
            const nextMark = this.marks[i + 1];

            marksWithCountdowns.push(currentMark);

            // Check if this is an instrumental line
            const isInstrumental = currentMark.lyric.includes('♪ Instrumental ♪');

            if (isInstrumental && nextMark) {
                const gap = nextMark.time - currentMark.time;

                if (gap > COUNTDOWN_THRESHOLD) {
                    // Insert countdown slides
                    const countdownStart = nextMark.time - COUNTDOWN_DURATION;

                    for (let num = 4; num >= 1; num--) {
                        const countdownTime = countdownStart + (4 - num);
                        const countdownText = `${num === 4 ? '[4]' : '4'} ${num === 3 ? '[3]' : '3'} ${num === 2 ? '[2]' : '2'} ${num === 1 ? '[1]' : '1'} | ${num === 4 ? '[4]' : '4'} ${num === 3 ? '[3]' : '3'} ${num === 2 ? '[2]' : '2'} ${num === 1 ? '[1]' : '1'}`;

                        marksWithCountdowns.push({
                            lineIndex: -1,
                            time: countdownTime,
                            lyric: countdownText,
                            isCountdown: true
                        });
                    }

                    console.log(`\n🎯 Auto-inserted countdown before line ${i + 2} (gap: ${gap.toFixed(1)}s)`);
                }
            }
        }

        // Insert prelude screen if first mark is not at time 0
        if (marksWithCountdowns.length > 0 && marksWithCountdowns[0].time > 0) {
            const firstMarkTime = marksWithCountdowns[0].time;
            const preludeMark: Mark = {
                lineIndex: -1,
                time: 0.0,
                lyric: '♪ ♪',
                isCountdown: false
            };
            marksWithCountdowns.unshift(preludeMark);
            console.log(`\n🎵 Added prelude screen from 0.0s to ${firstMarkTime.toFixed(1)}s`);
        }

        // Sort by time
        marksWithCountdowns.sort((a, b) => a.time - b.time);

        return marksWithCountdowns;
    }

    private generateTimingFile(): void {
        console.log('\n🔄 Processing marks...');

        // Insert countdowns for long instrumentals
        const allMarks = this.insertCountdowns();

        // Update lyrics array to include countdown slides
        const updatedLyrics: string[] = [];
        let lyricIndex = 0;

        for (const mark of allMarks) {
            if (mark.isCountdown) {
                updatedLyrics.push(mark.lyric);
            } else {
                updatedLyrics.push(this.lyrics[lyricIndex]);
                lyricIndex++;
            }
        }

        // Generate set-manual-timing.js
        const outputPath = path.join(this.projectFolder, 'set-manual-timing.js');

        let content = `// Auto-generated timing file
// Generated: ${new Date().toISOString()}
// Total lines: ${allMarks.length}

const fs = require('fs');
const path = require('path');

const timestampsPath = './output/timestamps.json';
const data = JSON.parse(fs.readFileSync(timestampsPath, 'utf-8'));

// Lyric start times (in seconds)
const lyricStarts = [
`;

        allMarks.forEach((mark, i) => {
            const comment = mark.lyric.substring(0, 40);
            content += `    ${mark.time.toFixed(2)},     // ${i}: ${comment}...\n`;
        });

        content += `];

// Rebuild lyrics array from marks (to include prelude, countdowns, etc.)
const totalDuration = data.metadata.duration;

// Create new lyrics array matching the marks exactly
const updatedLyrics = [];
for (let i = 0; i < lyricStarts.length; i++) {
    const startTime = lyricStarts[i];
    const endTime = (i < lyricStarts.length - 1) ? lyricStarts[i + 1] : totalDuration;
    
    // Get text from marks array (which includes prelude and countdowns)
    const markText = allMarks[i].lyric;
    
    updatedLyrics.push({
        index: i,
        startTime: startTime,
        endTime: endTime,
        text: markText,
        imagePath: 'images/lyric_' + String(i).padStart(3, '0') + '.png'
    });
}

// Replace the lyrics array completely with new data
data.lyrics = updatedLyrics;

// Save updated timestamps
fs.writeFileSync(timestampsPath, JSON.stringify(data, null, 2));

console.log('✅ Manual timing applied to', data.lyrics.length, 'lyrics');
`;

        fs.writeFileSync(outputPath, content);

        // Update lyrics file with countdown slides
        const updatedLyricsPath = path.join(this.projectFolder, 'lyrics-with-timing.txt');
        fs.writeFileSync(updatedLyricsPath, updatedLyrics.join('\n'));

        console.log(`\n✅ Generated: ${path.basename(outputPath)}`);
        console.log(`✅ Generated: ${path.basename(updatedLyricsPath)}`);
        console.log(`\n📊 Summary:`);
        console.log(`   Original lyrics: ${this.lyrics.length} lines`);
        console.log(`   With countdowns: ${updatedLyrics.length} lines`);
        console.log(`   Total marks: ${allMarks.length}`);
    }

    private finish(): void {
        console.log('\n\n🎬 Finishing up...\n');

        if (this.marks.length === 0) {
            console.log('❌ No marks recorded. Exiting.\n');
            this.cleanup();
            process.exit(0);
        }

        this.generateTimingFile();

        console.log('\n🎉 Timing complete!\n');
        console.log('Next steps:');
        console.log('  1. Run vocal separation: ./separate-and-convert.sh <audio-file> ./output');
        console.log('  2. Generate video: npm start -- <audio-file> ./lyrics-with-timing.txt --output ./output\n');

        this.cleanup();
        process.exit(0);
    }

    private cleanup(): void {
        // Clear display interval
        if (this.displayInterval) {
            clearInterval(this.displayInterval);
        }

        // Kill the specific process
        if (this.ffplayProcess) {
            this.ffplayProcess.kill('SIGKILL');
        }

        // Also kill any lingering ffplay processes
        try {
            execSync('killall ffplay 2>/dev/null', { stdio: 'ignore' });
        } catch (e) {
            // Ignore if no processes to kill
        }

        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
    }

    async run(): Promise<void> {
        try {
            await this.init();
            this.setupKeyboardInput();
            await this.startPlayback();
        } catch (error: any) {
            console.error('\n❌ Error:', error.message);
            this.cleanup();
            process.exit(1);
        }
    }
}

// Main
if (require.main === module) {
    const projectFolder = process.argv[2];

    if (!projectFolder) {
        console.log('Usage: ts-node src/timing-tool.ts <project-folder>');
        console.log('Example: ts-node src/timing-tool.ts ./my-song');
        process.exit(1);
    }

    if (!fs.existsSync(projectFolder)) {
        console.error(`Error: Folder not found: ${projectFolder}`);
        process.exit(1);
    }

    const tool = new TimingTool(projectFolder);
    tool.run();
}
