#!/usr/bin/env node

/**
 * Set manual timing for specific lyrics
 */

const fs = require('fs');

const timestampsFile = './output/timestamps.json';

console.log('🎵 Setting manual timing...\n');

// Read timestamps
const data = JSON.parse(fs.readFileSync(timestampsFile, 'utf-8'));

// Save backup
const backupFile = timestampsFile.replace('.json', '.backup.json');
fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
console.log(`✅ Backup saved: ${backupFile}\n`);

// Manual timing - just set when each lyric STARTS (in seconds from beginning)
// Each lyric will display until the next one starts
const lyricStarts = [
    0,      // 0: ♪ Instrumental ♪
    20,     // 1: [4] 3 2 1
    21,     // 2: 4 [3] 2 1
    22,     // 3: 4 3 [2] 1
    23,     // 4: 4 3 2 [1]
    24,     // 5: मिल गई नज़रें, तो दिल भी
    32,     // 6: एक दिन, मिल जाएंगे
    37,     // 7: तू लहर है ,मैं लहर हूं
    43,     // 8: मिल के साहिल पाएंगे
    48,     // 9: मिल गई नज़रें, तो दिल भी
    54,     // 10: एक दिन, मिल जाएंगे
    59,     // 11: तू लहर है ,मैं लहर हूं
    64,     // 12: मिल के साहिल पाएंगे
    69,     // 13: ♪ Instrumental ♪
    77,     // 14: [4] 3 2 1
    78,     // 15: 4 [3] 2 1
    79,     // 16: 4 3 [2] 1
    80,     // 17: 4 3 2 [1]
    81,     // 18: हमसफ़र हैं हमकदम हैं
    85,     // 19: और सफ़र भी है नया
    90,     // 20: इब्तिदा है प्यार की
    94,     // 21: हमदम मेरे, हमनवाँ
    99,    // 22: ऐसी घड़ियाँ ऐसे पल छिन
    104,    // 23: फिर कहाँ मिल पायेंगे
    109,    // 24: मिल गई नज़रें, तो दिल भी
    116,    // 25: एक दिन, मिल जाएंगे
    123,    // 26: तू लहर है ,मैं लहर हूं
    128,    // 27: मिल के साहिल पायेंगे 
    134,    // 28: ♪ Instrumental ♪
    149,    // 29: [4] 3 2 1
    150,    // 30: 4 [3] 2 1
    151,    // 31: 4 3 [2] 1
    152,    // 32: 4 3 2 [1]
    153,    // 33: महकी महकी चांदनी है
    160,    // 34: बहका बहका है समां
    165,    // 35: फूलों की बारात है और
    170,    // 36: तारों का है कारवां
    175,    // 37: गा रहा था ,एक दिल जो
    181,    // 38: गीत दो दिल ,गाएंगे
    186,    // 39: मिल गई नज़रें, तो दिल भी
    191,    // 40: एक दिन, मिल जाएंगे
    196,    // 41: तू लहर है ,मैं लहर हूं
    201,    // 42: मिल के साहिल पाएंगे
    211,    // 43: Karaoke track by Santosh Kulkarni
];

// Calculate end times (each lyric ends when the next one starts)
const totalDuration = data.metadata.duration;

for (let i = 0; i < lyricStarts.length && i < data.lyrics.length; i++) {
    const startTime = lyricStarts[i];
    const endTime = (i < lyricStarts.length - 1) ? lyricStarts[i + 1] : totalDuration;
    
    data.lyrics[i].startTime = startTime;
    data.lyrics[i].endTime = endTime;
    data.lyrics[i].duration = endTime - startTime;
    
    console.log(`${i + 1}. ${startTime}s - ${endTime}s (${(endTime - startTime).toFixed(1)}s): ${data.lyrics[i].text.substring(0, 40)}...`);
}

// Save
fs.writeFileSync(timestampsFile, JSON.stringify(data, null, 2));
console.log(`\n✅ Saved: ${timestampsFile}`);
console.log(`\nGenerate video:`);
console.log(`  npm run video ./data/Originalमिल-गईं-नज़रें.mp3 ./output`);
