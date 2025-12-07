#!/usr/bin/env node

/**
 * Fix instrumental intro duration
 * Usage: node fix-instrumental.js <instrumental-duration> [timestamps-file]
 */

const fs = require('fs');

const instrumentalDuration = parseFloat(process.argv[2]);
const timestampsFile = process.argv[3] || './output/timestamps.json';

if (!instrumentalDuration || isNaN(instrumentalDuration)) {
    console.log('Usage: node fix-instrumental.js <instrumental-duration> [timestamps-file]');
    console.log('\nExample:');
    console.log('  node fix-instrumental.js 25 ./output/timestamps.json');
    console.log('\nThis will set the first entry (instrumental) to 25 seconds');
    console.log('and shift all other lyrics accordingly.');
    process.exit(1);
}

console.log(`🎵 Setting instrumental duration to ${instrumentalDuration} seconds...\n`);

// Read timestamps
const data = JSON.parse(fs.readFileSync(timestampsFile, 'utf-8'));

if (data.lyrics.length === 0) {
    console.error('❌ No lyrics found in timestamps file');
    process.exit(1);
}

// Save backup
const backupFile = timestampsFile.replace('.json', '.backup.json');
fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
console.log(`✅ Backup saved: ${backupFile}`);

// Get the original first entry duration
const originalDuration = data.lyrics[0].endTime - data.lyrics[0].startTime;
const shift = instrumentalDuration - originalDuration;

console.log(`   Original instrumental duration: ${originalDuration.toFixed(2)}s`);
console.log(`   New instrumental duration: ${instrumentalDuration}s`);
console.log(`   Shifting remaining lyrics by: ${shift.toFixed(2)}s\n`);

// Fix first entry
data.lyrics[0].endTime = instrumentalDuration;
data.lyrics[0].duration = instrumentalDuration;

// Shift all other entries
for (let i = 1; i < data.lyrics.length; i++) {
    data.lyrics[i].startTime += shift;
    data.lyrics[i].endTime += shift;
}

// Save adjusted timestamps
fs.writeFileSync(timestampsFile, JSON.stringify(data, null, 2));
console.log(`✅ Adjusted timestamps saved: ${timestampsFile}`);
console.log(`\nInstrumental will now play for ${instrumentalDuration} seconds.`);
console.log('\nRegenerate the video:');
console.log(`  npm run video ./data/Originalमिल-गईं-नज़रें.mp3 ./output`);
