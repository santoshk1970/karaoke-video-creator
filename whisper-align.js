#!/usr/bin/env node

/**
 * Use Whisper to automatically detect lyric timing
 * Usage: node whisper-align.js <audio-file> <lyrics-file> <output-dir>
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

const audioFile = process.argv[2];
const lyricsFile = process.argv[3];
const outputDir = process.argv[4] || './output';

if (!audioFile || !lyricsFile) {
    console.log('Usage: node whisper-align.js <audio-file> <lyrics-file> [output-dir]');
    console.log('\nExample:');
    console.log('  node whisper-align.js song.mp3 lyrics.txt ./output');
    console.log('\nThis will:');
    console.log('  1. Use Whisper to detect when words are spoken');
    console.log('  2. Match detected words to your lyrics');
    console.log('  3. Create timestamps.json with accurate timing');
    process.exit(1);
}

async function main() {
    console.log('🎵 Whisper Automatic Alignment\n');
    
    // Read lyrics
    console.log('📖 Reading lyrics...');
    const lyrics = fs.readFileSync(lyricsFile, 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    console.log(`   Found ${lyrics.length} lines\n`);
    
    // Run Whisper
    console.log('🎤 Running Whisper (this may take 2-5 minutes)...');
    console.log('   Detecting speech and timing...');
    
    const tempDir = path.join(outputDir, 'temp_whisper');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const audioName = path.basename(audioFile, path.extname(audioFile));
    
    try {
        // Run whisper with word-level timestamps
        const command = `whisper "${audioFile}" --model base --language hi --output_format json --output_dir "${tempDir}" --word_timestamps True`;
        
        await execAsync(command, { maxBuffer: 50 * 1024 * 1024 });
        
        console.log('   ✓ Whisper analysis complete\n');
        
        // Read Whisper output
        const whisperFile = path.join(tempDir, `${audioName}.json`);
        const whisperData = JSON.parse(fs.readFileSync(whisperFile, 'utf-8'));
        
        console.log('🔗 Matching lyrics to detected speech...');
        
        // Match lyrics to segments
        const timedLyrics = matchLyricsToSegments(lyrics, whisperData.segments);
        
        // Create timestamps.json
        const totalDuration = timedLyrics.length > 0 ? 
            timedLyrics[timedLyrics.length - 1].endTime : 0;
        
        const data = {
            version: '1.0',
            metadata: {
                generatedAt: new Date().toISOString(),
                totalLines: timedLyrics.length,
                duration: totalDuration,
                source: 'Whisper automatic alignment'
            },
            lyrics: timedLyrics
        };
        
        // Save timestamps.json
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const outputFile = path.join(outputDir, 'timestamps.json');
        fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
        
        console.log(`\n✅ Success!`);
        console.log(`   Aligned ${timedLyrics.length} lyrics`);
        console.log(`   Saved to: ${outputFile}`);
        console.log(`\nNext steps:`);
        console.log(`  1. Generate images: npm start -- "${audioFile}" "${lyricsFile}" --output "${outputDir}"`);
        console.log(`  2. Or if images exist: npm run video "${audioFile}" "${outputDir}"`);
        
        // Clean up temp files
        // fs.rmSync(tempDir, { recursive: true, force: true });
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

/**
 * Match user's lyrics to Whisper's detected segments
 */
function matchLyricsToSegments(lyrics, segments) {
    const timedLyrics = [];
    
    if (segments.length === 0) {
        console.error('   ⚠️  No speech detected by Whisper');
        return [];
    }
    
    // Strategy: Distribute segments evenly across lyrics
    const segmentsPerLyric = segments.length / lyrics.length;
    
    for (let i = 0; i < lyrics.length; i++) {
        const startIdx = Math.floor(i * segmentsPerLyric);
        const endIdx = Math.floor((i + 1) * segmentsPerLyric);
        
        const relevantSegments = segments.slice(startIdx, endIdx);
        
        if (relevantSegments.length > 0) {
            const startTime = relevantSegments[0].start;
            const endTime = relevantSegments[relevantSegments.length - 1].end;
            
            timedLyrics.push({
                index: i,
                startTime,
                endTime,
                duration: endTime - startTime,
                text: lyrics[i],
                imagePath: `images/lyric_${String(i).padStart(3, '0')}.png`
            });
            
            console.log(`   ${i + 1}. ${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s: ${lyrics[i].substring(0, 40)}...`);
        }
    }
    
    return timedLyrics;
}

main();
