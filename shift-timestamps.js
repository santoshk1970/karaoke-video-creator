#!/usr/bin/env node

/**
 * Shift all timestamps by a fixed amount
 * Usage: node shift-timestamps.js <shift-seconds> [timestamps-file]
 * 
 * Use negative values to shift earlier, positive to shift later
 */

const fs = require('fs');

const shiftSeconds = parseFloat(process.argv[2]);
const timestampsFile = process.argv[3] || './output/timestamps.json';

if (isNaN(shiftSeconds)) {
    console.log('Usage: node shift-timestamps.js <shift-seconds> [timestamps-file]');
    console.log('\nExamples:');
    console.log('  node shift-timestamps.js -5.8    # Shift 5.8 seconds earlier');
    console.log('  node shift-timestamps.js 3.0     # Shift 3 seconds later');
    console.log('\nUse this when Whisper timing is off by a constant amount.');
    process.exit(1);
}

console.log(`⏱️  Shifting all timestamps by ${shiftSeconds > 0 ? '+' : ''}${shiftSeconds} seconds...\n`);

// Read timestamps
const data = JSON.parse(fs.readFileSync(timestampsFile, 'utf-8'));

// Save backup
const backupFile = timestampsFile.replace('.json', '.backup.json');
fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
console.log(`✅ Backup saved: ${backupFile}`);

// Shift all timestamps
data.lyrics.forEach((lyric, i) => {
    const oldStart = lyric.startTime;
    const oldEnd = lyric.endTime;
    
    lyric.startTime = Math.max(0, lyric.startTime + shiftSeconds);
    lyric.endTime = Math.max(0, lyric.endTime + shiftSeconds);
    
    if (i < 3) {
        console.log(`   ${i + 1}. ${oldStart.toFixed(1)}s → ${lyric.startTime.toFixed(1)}s: ${lyric.text.substring(0, 30)}...`);
    }
});

if (data.lyrics.length > 3) {
    console.log(`   ... (${data.lyrics.length - 3} more)`);
}

// Save adjusted timestamps
fs.writeFileSync(timestampsFile, JSON.stringify(data, null, 2));
console.log(`\n✅ Adjusted timestamps saved: ${timestampsFile}`);
console.log(`\nRegenerate video:`);
console.log(`  npm run video ./data/Originalमिल-गईं-नज़रें.mp3 ./output`);
