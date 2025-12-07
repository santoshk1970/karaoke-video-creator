#!/usr/bin/env node

/**
 * Convert SRT subtitle file to timestamps.json
 * Usage: node srt-to-json.js <srt-file> <output-dir>
 */

const fs = require('fs');
const path = require('path');

const srtFile = process.argv[2];
const outputDir = process.argv[3] || './output';

if (!srtFile) {
    console.log('Usage: node srt-to-json.js <srt-file> [output-dir]');
    console.log('\nExample:');
    console.log('  node srt-to-json.js lyrics.srt ./output');
    process.exit(1);
}

console.log('🎵 Converting SRT to timestamps.json...\n');

// Parse SRT format
function parseSRT(content) {
    const blocks = content.trim().split(/\n\s*\n/);
    const lyrics = [];
    
    for (const block of blocks) {
        const lines = block.split('\n');
        if (lines.length >= 3) {
            // Line 0: index
            // Line 1: timestamp
            // Line 2+: text
            
            const timeLine = lines[1];
            const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
            
            if (timeMatch) {
                const startTime = parseInt(timeMatch[1]) * 3600 + 
                                parseInt(timeMatch[2]) * 60 + 
                                parseInt(timeMatch[3]) + 
                                parseInt(timeMatch[4]) / 1000;
                
                const endTime = parseInt(timeMatch[5]) * 3600 + 
                              parseInt(timeMatch[6]) * 60 + 
                              parseInt(timeMatch[7]) + 
                              parseInt(timeMatch[8]) / 1000;
                
                const text = lines.slice(2).join(' ').trim();
                
                lyrics.push({
                    index: lyrics.length,
                    startTime,
                    endTime,
                    duration: endTime - startTime,
                    text,
                    imagePath: `images/lyric_${String(lyrics.length).padStart(3, '0')}.png`
                });
            }
        }
    }
    
    return lyrics;
}

// Read and parse SRT
const content = fs.readFileSync(srtFile, 'utf-8');
const lyrics = parseSRT(content);

const totalDuration = lyrics.length > 0 ? lyrics[lyrics.length - 1].endTime : 0;

// Create timestamps.json
const data = {
    version: '1.0',
    metadata: {
        generatedAt: new Date().toISOString(),
        totalLines: lyrics.length,
        duration: totalDuration,
        source: 'SRT subtitle file'
    },
    lyrics
};

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const outputFile = path.join(outputDir, 'timestamps.json');
fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));

console.log(`✅ Converted ${lyrics.length} subtitles`);
console.log(`✅ Saved to: ${outputFile}`);
console.log(`\nNow generate images and video:`);
console.log(`  1. Make sure images are in ${outputDir}/images/`);
console.log(`  2. Run: npm run video <audio-file> ${outputDir}`);
