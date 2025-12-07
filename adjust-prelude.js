#!/usr/bin/env node

/**
 * Adjust timestamps to account for instrumental prelude
 * Usage: node adjust-prelude.js <prelude-seconds> <timestamps-file>
 */

const fs = require('fs');

const preludeSeconds = parseFloat(process.argv[2]);
const timestampsFile = process.argv[3] || './output/timestamps.json';

if (!preludeSeconds || isNaN(preludeSeconds)) {
    console.log('Usage: node adjust-prelude.js <prelude-seconds> [timestamps-file]');
    console.log('\nExample:');
    console.log('  node adjust-prelude.js 15 ./output/timestamps.json');
    console.log('\nThis will shift all lyrics by 15 seconds to account for the prelude.');
    process.exit(1);
}

console.log(`🎵 Adjusting timestamps for ${preludeSeconds} second prelude...\n`);

// Read timestamps
const data = JSON.parse(fs.readFileSync(timestampsFile, 'utf-8'));

// Shift all timestamps
data.lyrics.forEach(lyric => {
    lyric.startTime += preludeSeconds;
    lyric.endTime += preludeSeconds;
});

// Save backup
const backupFile = timestampsFile.replace('.json', '.backup.json');
fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
console.log(`✅ Backup saved: ${backupFile}`);

// Save adjusted timestamps
fs.writeFileSync(timestampsFile, JSON.stringify(data, null, 2));
console.log(`✅ Adjusted timestamps saved: ${timestampsFile}`);
console.log(`\nAll lyrics shifted by ${preludeSeconds} seconds.`);
console.log('\nNow regenerate the video:');
console.log(`  npm run video ./data/Originalमिल-गईं-नज़रें.mp3 ./output`);
