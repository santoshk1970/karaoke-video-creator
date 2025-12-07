#!/usr/bin/env node

/**
 * Timing Adjustment Tool
 * 
 * Adjust individual timing marks and optionally shift all subsequent timings
 * 
 * Usage:
 *   node adjust-timing.js <line-number> <new-time> [--no-shift]
 *   node adjust-timing.js 5 25.5              # Adjust line 5 to 25.5s, shift rest
 *   node adjust-timing.js 5 25.5 --no-shift   # Adjust line 5 only, don't shift rest
 *   node adjust-timing.js --interactive       # Interactive mode
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class TimingAdjuster {
    constructor(timingFile = './set-manual-timing.js') {
        this.timingFile = timingFile;
        this.timings = [];
        this.comments = [];
    }

    load() {
        if (!fs.existsSync(this.timingFile)) {
            throw new Error(`Timing file not found: ${this.timingFile}`);
        }

        const content = fs.readFileSync(this.timingFile, 'utf-8');
        
        // Extract timing array
        const arrayMatch = content.match(/const lyricStarts = \[([\s\S]*?)\];/);
        if (!arrayMatch) {
            throw new Error('Could not parse timing file');
        }

        const lines = arrayMatch[1].trim().split('\n');
        
        this.timings = [];
        this.comments = [];
        
        lines.forEach(line => {
            const match = line.match(/^\s*(\d+),\s*\/\/\s*(\d+):\s*(.+)$/);
            if (match) {
                this.timings.push(parseInt(match[1]));
                this.comments.push(match[3]);
            }
        });

        console.log(`✅ Loaded ${this.timings.length} timing marks from ${this.timingFile}\n`);
    }

    display(start = 0, count = 10) {
        console.log('\n📋 Current Timings:\n');
        console.log('Line | Time  | Lyric');
        console.log('─'.repeat(60));
        
        const end = Math.min(start + count, this.timings.length);
        
        for (let i = start; i < end; i++) {
            const time = this.formatTime(this.timings[i]);
            const lyric = this.comments[i].substring(0, 40);
            console.log(`${String(i).padStart(4)} | ${time} | ${lyric}`);
        }
        
        if (end < this.timings.length) {
            console.log(`... (${this.timings.length - end} more lines)`);
        }
        console.log('');
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    }

    adjust(lineNumber, newTime, shiftSubsequent = true) {
        if (lineNumber < 0 || lineNumber >= this.timings.length) {
            throw new Error(`Invalid line number: ${lineNumber} (valid range: 0-${this.timings.length - 1})`);
        }

        const oldTime = this.timings[lineNumber];
        const delta = newTime - oldTime;

        console.log(`\n🔧 Adjusting line ${lineNumber}:`);
        console.log(`   Old time: ${this.formatTime(oldTime)}`);
        console.log(`   New time: ${this.formatTime(newTime)}`);
        console.log(`   Delta: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}s`);
        console.log(`   Lyric: "${this.comments[lineNumber]}"`);

        this.timings[lineNumber] = Math.round(newTime);

        if (shiftSubsequent && delta !== 0) {
            let shiftedCount = 0;
            for (let i = lineNumber + 1; i < this.timings.length; i++) {
                this.timings[i] = Math.round(this.timings[i] + delta);
                shiftedCount++;
            }
            console.log(`   ↪️  Shifted ${shiftedCount} subsequent lines by ${delta > 0 ? '+' : ''}${delta.toFixed(1)}s`);
        } else if (!shiftSubsequent) {
            console.log(`   ⚠️  Not shifting subsequent lines (--no-shift)`);
        }

        console.log('');
    }

    save(backupOriginal = true) {
        if (backupOriginal && fs.existsSync(this.timingFile)) {
            const backupPath = this.timingFile.replace('.js', '.backup.js');
            fs.copyFileSync(this.timingFile, backupPath);
            console.log(`💾 Backup saved: ${backupPath}`);
        }

        let content = `// Auto-generated timing file
// Last modified: ${new Date().toISOString()}
// Total lines: ${this.timings.length}

const fs = require('fs');
const path = require('path');

const timestampsPath = './output/timestamps.json';
const data = JSON.parse(fs.readFileSync(timestampsPath, 'utf-8'));

// Lyric start times (in seconds)
const lyricStarts = [
`;

        this.timings.forEach((time, i) => {
            content += `    ${time},     // ${i}: ${this.comments[i]}\n`;
        });

        content += `];

// Calculate end times (each lyric ends when the next one starts)
const totalDuration = data.metadata.duration;

for (let i = 0; i < lyricStarts.length && i < data.lyrics.length; i++) {
    const startTime = lyricStarts[i];
    const endTime = (i < lyricStarts.length - 1) ? lyricStarts[i + 1] : totalDuration;
    
    data.lyrics[i].startTime = startTime;
    data.lyrics[i].endTime = endTime;
}

// Save updated timestamps
fs.writeFileSync(timestampsPath, JSON.stringify(data, null, 2));

console.log('✅ Manual timing applied to', data.lyrics.length, 'lyrics');
`;

        fs.writeFileSync(this.timingFile, content);
        console.log(`✅ Saved: ${this.timingFile}\n`);
    }

    async interactive() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

        console.log('\n🎛️  Interactive Timing Adjustment\n');
        console.log('Commands:');
        console.log('  list [start] [count] - Show timing list');
        console.log('  adjust <line> <time> - Adjust timing (shifts subsequent)');
        console.log('  set <line> <time>    - Set timing (no shift)');
        console.log('  save                 - Save changes');
        console.log('  quit                 - Exit without saving\n');

        let modified = false;

        while (true) {
            const input = await question('> ');
            const parts = input.trim().split(/\s+/);
            const cmd = parts[0].toLowerCase();

            try {
                if (cmd === 'list' || cmd === 'l') {
                    const start = parseInt(parts[1]) || 0;
                    const count = parseInt(parts[2]) || 10;
                    this.display(start, count);
                } else if (cmd === 'adjust' || cmd === 'a') {
                    const line = parseInt(parts[1]);
                    const time = parseFloat(parts[2]);
                    this.adjust(line, time, true);
                    modified = true;
                } else if (cmd === 'set' || cmd === 's') {
                    const line = parseInt(parts[1]);
                    const time = parseFloat(parts[2]);
                    this.adjust(line, time, false);
                    modified = true;
                } else if (cmd === 'save') {
                    this.save();
                    modified = false;
                } else if (cmd === 'quit' || cmd === 'q' || cmd === 'exit') {
                    if (modified) {
                        const confirm = await question('⚠️  You have unsaved changes. Quit anyway? (y/n) ');
                        if (confirm.toLowerCase() !== 'y') {
                            continue;
                        }
                    }
                    break;
                } else if (cmd === 'help' || cmd === 'h' || cmd === '?') {
                    console.log('\nCommands:');
                    console.log('  list [start] [count] - Show timing list');
                    console.log('  adjust <line> <time> - Adjust timing (shifts subsequent)');
                    console.log('  set <line> <time>    - Set timing (no shift)');
                    console.log('  save                 - Save changes');
                    console.log('  quit                 - Exit\n');
                } else if (cmd) {
                    console.log(`❌ Unknown command: ${cmd}. Type 'help' for commands.\n`);
                }
            } catch (error) {
                console.log(`❌ Error: ${error.message}\n`);
            }
        }

        rl.close();
        console.log('\n👋 Goodbye!\n');
    }
}

// Main
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        console.log(`
Timing Adjustment Tool

Usage:
  node adjust-timing.js <line-number> <new-time> [--no-shift]
  node adjust-timing.js --interactive

Examples:
  node adjust-timing.js 5 25.5              # Adjust line 5 to 25.5s, shift rest
  node adjust-timing.js 5 25.5 --no-shift   # Adjust line 5 only
  node adjust-timing.js --interactive       # Interactive mode

Options:
  --no-shift    Don't shift subsequent timings (default: shift enabled)
  --interactive Interactive adjustment mode
  --file <path> Use custom timing file (default: ./set-manual-timing.js)
`);
        process.exit(0);
    }

    const adjuster = new TimingAdjuster();

    try {
        adjuster.load();

        if (args[0] === '--interactive' || args[0] === '-i') {
            adjuster.interactive();
        } else {
            const lineNumber = parseInt(args[0]);
            const newTime = parseFloat(args[1]);
            const shiftSubsequent = !args.includes('--no-shift');

            if (isNaN(lineNumber) || isNaN(newTime)) {
                console.error('❌ Error: Invalid line number or time');
                console.error('Usage: node adjust-timing.js <line-number> <new-time> [--no-shift]');
                process.exit(1);
            }

            adjuster.adjust(lineNumber, newTime, shiftSubsequent);
            adjuster.save();

            console.log('✅ Done! Run the video generation to see changes.\n');
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

module.exports = TimingAdjuster;
