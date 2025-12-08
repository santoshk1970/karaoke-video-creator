#!/usr/bin/env node

/**
 * Advanced: Automatic vocal timing using Meyda with onset detection
 * Uses spectral flux and energy analysis for better accuracy
 * 
 * Install: npm install meyda
 */

const Meyda = require('meyda');
const fs = require('fs');
const { execSync } = require('child_process');

const AUDIO_FILE = process.argv[2];
const LYRICS_FILE = process.argv[3];

if (!AUDIO_FILE || !LYRICS_FILE) {
    console.log('Usage: node experimental-auto-timing-advanced.js <audio.mp3> <lyrics.txt>');
    process.exit(1);
}

console.log('🎵 Advanced Auto-Timing with Meyda');
console.log('═══════════════════════════════════════════════════════\n');

// Convert to WAV
console.log('Converting audio...');
const wavFile = '/tmp/auto-timing.wav';
execSync(`ffmpeg -i "${AUDIO_FILE}" -ar 22050 -ac 1 "${wavFile}" -y 2>/dev/null`);
console.log('✓ Converted\n');

// Read WAV
const buffer = fs.readFileSync(wavFile);
const samples = [];
for (let i = 44; i < buffer.length; i += 2) {
    samples.push(buffer.readInt16LE(i) / 32768.0);
}

const sampleRate = 22050;
const frameSize = 512;
const hopSize = 256;

console.log(`Analyzing ${(samples.length / sampleRate).toFixed(1)}s of audio...\n`);

// Analyze with Meyda
const features = [];

for (let i = 0; i < samples.length - frameSize; i += hopSize) {
    const frame = samples.slice(i, i + frameSize);
    
    const f = Meyda.extract(['rms', 'energy', 'zcr'], frame);
    features.push({
        time: i / sampleRate,
        rms: f.rms,
        energy: f.energy,
        zcr: f.zcr
    });
}

// Detect onsets using energy peaks
const onsets = [];

for (let i = 2; i < features.length - 2; i++) {
    const prev = features[i - 1];
    const curr = features[i];
    const next = features[i + 1];
    
    // Onset = energy peak (local maximum)
    const isEnergyPeak = curr.rms > prev.rms && curr.rms > next.rms;
    const hasEnergy = curr.rms > 0.08;  // Threshold
    
    if (isEnergyPeak && hasEnergy) {
        // Avoid duplicates within 0.4s
        if (onsets.length === 0 || curr.time - onsets[onsets.length - 1].time > 0.4) {
            onsets.push({
                time: curr.time,
                strength: curr.rms,
                energy: curr.energy
            });
        }
    }
}

console.log(`Detected ${onsets.length} vocal onsets\n`);

// Match with lyrics
const lyrics = fs.readFileSync(LYRICS_FILE, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

console.log(`Matching ${lyrics.length} lyrics lines...\n`);

const timing = [];
for (let i = 0; i < Math.min(lyrics.length, onsets.length); i++) {
    timing.push({
        line: i + 1,
        time: onsets[i].time.toFixed(3),
        text: lyrics[i],
        strength: onsets[i].strength.toFixed(3),
        energy: onsets[i].energy.toFixed(3)
    });
}

// Save results
const output = {
    metadata: {
        audio: AUDIO_FILE,
        lyrics: LYRICS_FILE,
        method: 'meyda-energy-peaks',
        sampleRate,
        frameSize,
        hopSize
    },
    timing,
    stats: {
        lyricsLines: lyrics.length,
        detectedOnsets: onsets.length,
        matched: timing.length,
        unmatched: lyrics.length - timing.length
    }
};

fs.writeFileSync('auto-timing.json', JSON.stringify(output, null, 2));

// Display
console.log('═══════════════════════════════════════════════════════');
console.log('Results:\n');
console.log(`  Lyrics: ${output.stats.lyricsLines}`);
console.log(`  Onsets: ${output.stats.detectedOnsets}`);
console.log(`  Matched: ${output.stats.matched}`);
console.log(`  Unmatched: ${output.stats.unmatched}\n`);

console.log('First 10 timings:');
timing.slice(0, 10).forEach(t => {
    console.log(`  ${t.time}s - ${t.text.substring(0, 60)}`);
});

console.log('\n✓ Saved to auto-timing.json');
console.log('\n⚠️  Review and refine in timing tool');

// Cleanup
fs.unlinkSync(wavFile);
