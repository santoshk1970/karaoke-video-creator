// Quick fix script to convert 0.5s countdown spacing to 1s spacing
const fs = require('fs');
const path = require('path');

const projectDir = process.argv[2] || '.';
const timingFile = path.join(projectDir, 'set-manual-timing.js');

if (!fs.existsSync(timingFile)) {
    console.error('Error: set-manual-timing.js not found');
    process.exit(1);
}

let content = fs.readFileSync(timingFile, 'utf-8');

// Find the lyricStarts array
const match = content.match(/const lyricStarts = \[([\s\S]*?)\];/);
if (!match) {
    console.error('Error: Could not find lyricStarts array');
    process.exit(1);
}

const timingsText = match[1];
const lines = timingsText.split('\n').filter(l => l.trim());

const newTimings = [];
let lastTime = null;
let countdownSequence = [];

for (const line of lines) {
    const timeMatch = line.match(/^\s*([\d.]+),/);
    if (!timeMatch) continue;

    const time = parseFloat(timeMatch[1]);
    const comment = line.match(/\/\/ (.+)$/)?.[1] || '';

    // Check if this is a countdown line
    const isCountdown = comment.includes('[4]') || comment.includes('[3]') || comment.includes('[2]') || comment.includes('[1]');

    if (isCountdown) {
        if (countdownSequence.length === 0) {
            // Start of countdown sequence
            countdownSequence.push({ time, comment, line });
        } else {
            countdownSequence.push({ time, comment, line });

            if (countdownSequence.length === 4) {
                // We have all 4 countdown numbers, fix their spacing
                const startTime = countdownSequence[0].time;
                for (let i = 0; i < 4; i++) {
                    const newTime = startTime + i; // 1 second spacing
                    const originalComment = countdownSequence[i].comment;
                    newTimings.push(`    ${newTime.toFixed(2)},     // ${originalComment}`);
                }
                countdownSequence = [];
            }
        }
    } else {
        // Not a countdown, keep as-is
        newTimings.push(line);
    }

    lastTime = time;
}

// Rebuild the file
const newContent = content.replace(
    /const lyricStarts = \[[\s\S]*?\];/,
    `const lyricStarts = [\n${newTimings.join('\n')}\n];`
);

// Backup original
fs.writeFileSync(timingFile + '.backup', content);
fs.writeFileSync(timingFile, newContent);

console.log('✅ Fixed countdown spacing from 0.5s to 1s');
console.log('✅ Backup saved to set-manual-timing.js.backup');
console.log('\nNow run: node set-manual-timing.js');
