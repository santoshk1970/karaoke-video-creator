#!/usr/bin/env node

/**
 * Fix timing: Set instrumental duration and redistribute remaining lyrics
 */

const fs = require('fs');

const instrumentalEnd = 32; // When vocals start
const timestampsFile = './output/timestamps.json';

console.log('🎵 Fixing timing...\n');

// Read timestamps
const data = JSON.parse(fs.readFileSync(timestampsFile, 'utf-8'));

// Save backup
const backupFile = timestampsFile.replace('.json', '.backup.json');
fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
console.log(`✅ Backup saved: ${backupFile}`);

const totalDuration = data.metadata.duration;
const remainingDuration = totalDuration - instrumentalEnd;
const vocalLyrics = data.lyrics.length - 1; // All except instrumental
const timePerLyric = remainingDuration / vocalLyrics;

console.log(`   Total duration: ${totalDuration.toFixed(1)}s`);
console.log(`   Instrumental ends at: ${instrumentalEnd}s`);
console.log(`   Remaining duration: ${remainingDuration.toFixed(1)}s`);
console.log(`   Time per vocal lyric: ${timePerLyric.toFixed(1)}s\n`);

// Fix first entry (instrumental)
data.lyrics[0].startTime = 0;
data.lyrics[0].endTime = instrumentalEnd;
data.lyrics[0].duration = instrumentalEnd;

console.log(`1. 0.0s - ${instrumentalEnd}s: ${data.lyrics[0].text}`);

// Distribute remaining lyrics evenly
for (let i = 1; i < data.lyrics.length; i++) {
    const startTime = instrumentalEnd + (i - 1) * timePerLyric;
    const endTime = instrumentalEnd + i * timePerLyric;
    
    data.lyrics[i].startTime = startTime;
    data.lyrics[i].endTime = endTime;
    data.lyrics[i].duration = endTime - startTime;
    
    if (i <= 3) {
        console.log(`${i + 1}. ${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s: ${data.lyrics[i].text.substring(0, 30)}...`);
    }
}

if (data.lyrics.length > 4) {
    console.log(`   ... (${data.lyrics.length - 4} more)`);
}

// Save
fs.writeFileSync(timestampsFile, JSON.stringify(data, null, 2));
console.log(`\n✅ Fixed timestamps saved: ${timestampsFile}`);
console.log(`\nGenerate video:`);
console.log(`  npm run video ./data/Originalमिल-गईं-नज़रें.mp3 ./output`);
