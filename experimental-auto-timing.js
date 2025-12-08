#!/usr/bin/env node

/**
 * Experimental: Automatic vocal timing detection using Meyda
 * Analyzes audio to detect vocal onsets and energy changes
 * 
 * Install: npm install meyda web-audio-api
 */

const Meyda = require('meyda');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuration
const AUDIO_FILE = process.argv[2];
const LYRICS_FILE = process.argv[3];
const OUTPUT_FILE = 'auto-timing.json';

// Detection parameters
const ENERGY_THRESHOLD = 0.15;  // Adjust based on audio
const MIN_SILENCE_DURATION = 0.5; // seconds
const SAMPLE_RATE = 44100;
const HOP_SIZE = 512;

if (!AUDIO_FILE || !LYRICS_FILE) {
    console.log('Usage: node experimental-auto-timing.js <audio.mp3> <lyrics.txt>');
    console.log('');
    console.log('Example:');
    console.log('  node experimental-auto-timing.js audio.mp3 lyrics.txt');
    process.exit(1);
}

console.log('🎵 Experimental Auto-Timing with Meyda');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log('⚠️  This is experimental - results may need manual adjustment');
console.log('');

// Step 1: Convert MP3 to WAV for processing
console.log('Step 1: Converting audio to WAV...');
const wavFile = '/tmp/temp-audio.wav';

const ffmpeg = spawn('ffmpeg', [
    '-i', AUDIO_FILE,
    '-ar', SAMPLE_RATE.toString(),
    '-ac', '1', // mono
    '-f', 'wav',
    wavFile,
    '-y'
]);

ffmpeg.on('close', (code) => {
    if (code !== 0) {
        console.error('❌ Failed to convert audio');
        process.exit(1);
    }
    
    console.log('✓ Audio converted');
    console.log('');
    
    // Step 2: Analyze audio
    analyzeAudio();
});

function analyzeAudio() {
    console.log('Step 2: Analyzing audio features...');
    
    // Read WAV file
    const audioBuffer = fs.readFileSync(wavFile);
    
    // Parse WAV header (skip 44 bytes)
    const audioData = new Float32Array(audioBuffer.length / 2);
    for (let i = 44; i < audioBuffer.length; i += 2) {
        const sample = audioBuffer.readInt16LE(i);
        audioData[(i - 44) / 2] = sample / 32768.0; // Normalize to -1.0 to 1.0
    }
    
    console.log(`  Audio length: ${(audioData.length / SAMPLE_RATE).toFixed(2)}s`);
    console.log(`  Samples: ${audioData.length}`);
    console.log('');
    
    // Step 3: Extract features
    console.log('Step 3: Detecting vocal onsets...');
    
    const onsets = [];
    let lastOnsetTime = 0;
    
    // Analyze in chunks
    for (let i = 0; i < audioData.length - HOP_SIZE; i += HOP_SIZE) {
        const chunk = audioData.slice(i, i + HOP_SIZE);
        
        // Extract features using Meyda
        const features = Meyda.extract([
            'rms',           // Root Mean Square (energy)
            'energy',        // Energy
            'spectralCentroid', // Brightness
            'zcr'            // Zero Crossing Rate (noisiness)
        ], chunk);
        
        const currentTime = i / SAMPLE_RATE;
        
        // Detect onset: high energy after silence
        if (features.rms > ENERGY_THRESHOLD && 
            (currentTime - lastOnsetTime) > MIN_SILENCE_DURATION) {
            
            onsets.push({
                time: currentTime,
                rms: features.rms,
                energy: features.energy,
                spectralCentroid: features.spectralCentroid,
                zcr: features.zcr
            });
            
            lastOnsetTime = currentTime;
        }
    }
    
    console.log(`  Detected ${onsets.length} potential vocal onsets`);
    console.log('');
    
    // Step 4: Match with lyrics
    matchWithLyrics(onsets);
}

function matchWithLyrics(onsets) {
    console.log('Step 4: Matching onsets with lyrics...');
    
    // Read lyrics
    const lyricsContent = fs.readFileSync(LYRICS_FILE, 'utf-8');
    const lines = lyricsContent.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    console.log(`  Lyrics lines: ${lines.length}`);
    console.log(`  Detected onsets: ${onsets.length}`);
    console.log('');
    
    // Match onsets to lyrics (simple 1:1 mapping)
    const timing = [];
    const maxMatches = Math.min(lines.length, onsets.length);
    
    for (let i = 0; i < maxMatches; i++) {
        timing.push({
            line: i + 1,
            text: lines[i],
            time: onsets[i].time.toFixed(3),
            confidence: calculateConfidence(onsets[i])
        });
    }
    
    // Step 5: Save results
    console.log('Step 5: Saving results...');
    
    const output = {
        metadata: {
            audioFile: AUDIO_FILE,
            lyricsFile: LYRICS_FILE,
            method: 'meyda-auto-detection',
            parameters: {
                energyThreshold: ENERGY_THRESHOLD,
                minSilenceDuration: MIN_SILENCE_DURATION,
                sampleRate: SAMPLE_RATE,
                hopSize: HOP_SIZE
            }
        },
        timing: timing,
        statistics: {
            totalLines: lines.length,
            detectedOnsets: onsets.length,
            matchedLines: maxMatches,
            unmatchedLines: lines.length - maxMatches
        }
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    
    console.log(`✓ Saved to: ${OUTPUT_FILE}`);
    console.log('');
    
    // Display results
    displayResults(output);
    
    // Cleanup
    fs.unlinkSync(wavFile);
}

function calculateConfidence(onset) {
    // Simple confidence based on energy and spectral centroid
    // Higher energy + moderate spectral centroid = likely vocal
    const energyScore = Math.min(onset.rms / 0.5, 1.0);
    const spectralScore = onset.spectralCentroid > 1000 && onset.spectralCentroid < 4000 ? 1.0 : 0.5;
    
    return ((energyScore + spectralScore) / 2 * 100).toFixed(0) + '%';
}

function displayResults(output) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Auto-Timing Results');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    
    console.log('Statistics:');
    console.log(`  Total lyrics lines: ${output.statistics.totalLines}`);
    console.log(`  Detected onsets: ${output.statistics.detectedOnsets}`);
    console.log(`  Matched lines: ${output.statistics.matchedLines}`);
    console.log(`  Unmatched lines: ${output.statistics.unmatchedLines}`);
    console.log('');
    
    console.log('First 10 timings:');
    output.timing.slice(0, 10).forEach(t => {
        console.log(`  ${t.time}s [${t.confidence}] - ${t.text.substring(0, 50)}`);
    });
    
    if (output.timing.length > 10) {
        console.log(`  ... and ${output.timing.length - 10} more`);
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('⚠️  Important Notes:');
    console.log('  • This is experimental and may not be accurate');
    console.log('  • Results depend heavily on audio quality');
    console.log('  • Works best with clear vocals and distinct pauses');
    console.log('  • May need manual adjustment in timing tool');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('  1. Review auto-timing.json');
    console.log('  2. Import into timing tool for refinement');
    console.log('  3. Adjust ENERGY_THRESHOLD if too many/few detections');
    console.log('');
    console.log('🔧 Tuning Parameters:');
    console.log(`  Current ENERGY_THRESHOLD: ${ENERGY_THRESHOLD}`);
    console.log('  • Increase if too many false detections');
    console.log('  • Decrease if missing vocal onsets');
    console.log('');
}
