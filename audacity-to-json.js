#!/usr/bin/env node

/**
 * Convert Audacity labels to timestamps.json
 * Usage: node audacity-to-json.js <labels-file> <output-dir>
 * 
 * Audacity label format:
 * 0.000000	3.500000	First lyric
 * 3.500000	7.200000	Second lyric
 */

const fs = require('fs');
const path = require('path');

const labelsFile = process.argv[2];
const outputDir = process.argv[3] || './output';

if (!labelsFile) {
    console.log('Usage: node audacity-to-json.js <labels-file> [output-dir]');
    console.log('\nExample:');
    console.log('  node audacity-to-json.js labels.txt ./output');
    console.log('\nAudacity label format (tab-separated):');
    console.log('  0.000000	3.500000	First lyric');
    console.log('  3.500000	7.200000	Second lyric');
    process.exit(1);
}

console.log('🎵 Converting Audacity labels to timestamps.json...\n');

// Read labels file
const content = fs.readFileSync(labelsFile, 'utf-8');
const lines = content.trim().split('\n');

const lyrics = [];
let totalDuration = 0;

for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    if (parts.length >= 3) {
        const startTime = parseFloat(parts[0]);
        const endTime = parseFloat(parts[1]);
        const text = parts[2].trim();
        
        lyrics.push({
            index: i,
            startTime,
            endTime,
            duration: endTime - startTime,
            text,
            imagePath: `images/lyric_${String(i).padStart(3, '0')}.png`
        });
        
        totalDuration = Math.max(totalDuration, endTime);
    }
}

// Create timestamps.json
const data = {
    version: '1.0',
    metadata: {
        generatedAt: new Date().toISOString(),
        totalLines: lyrics.length,
        duration: totalDuration,
        source: 'Audacity labels'
    },
    lyrics
};

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const outputFile = path.join(outputDir, 'timestamps.json');
fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));

console.log(`✅ Converted ${lyrics.length} labels`);
console.log(`✅ Saved to: ${outputFile}`);
console.log(`\nNow generate images and video:`);
console.log(`  1. Make sure images are in ${outputDir}/images/`);
console.log(`  2. Run: npm run video <audio-file> ${outputDir}`);
