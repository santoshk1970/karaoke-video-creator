#!/usr/bin/env node

/**
 * Smart auto-timing: Better onset selection using clustering
 */

const Meyda = require('meyda');
const fs = require('fs');
const { execSync } = require('child_process');

const AUDIO_FILE = process.argv[2];
const LYRICS_FILE = process.argv[3];

if (!AUDIO_FILE || !LYRICS_FILE) {
    console.log('Usage: node experimental-auto-timing-smart.js <vocals.mp3> <lyrics.txt>');
    process.exit(1);
}

console.log('🎵 Smart Auto-Timing with Onset Clustering\n');

// Convert to WAV
const wavFile = '/tmp/auto-timing.wav';
execSync(`ffmpeg -i "${AUDIO_FILE}" -ar 22050 -ac 1 "${wavFile}" -y 2>/dev/null`);

// Read WAV
const buffer = fs.readFileSync(wavFile);
const samples = [];
for (let i = 44; i < buffer.length; i += 2) {
    samples.push(buffer.readInt16LE(i) / 32768.0);
}

const sampleRate = 22050;
const frameSize = 512;
const hopSize = 256;

console.log(`Analyzing ${(samples.length / sampleRate).toFixed(1)}s...\n`);

// Extract features
const features = [];
for (let i = 0; i < samples.length - frameSize; i += hopSize) {
    const frame = samples.slice(i, i + frameSize);
    const f = Meyda.extract(['rms', 'energy'], frame);
    features.push({
        time: i / sampleRate,
        rms: f.rms,
        energy: f.energy
    });
}

// Detect ALL energy peaks
const allOnsets = [];
for (let i = 2; i < features.length - 2; i++) {
    const prev = features[i - 1];
    const curr = features[i];
    const next = features[i + 1];
    
    if (curr.rms > prev.rms && curr.rms > next.rms && curr.rms > 0.05) {
        allOnsets.push({
            time: curr.time,
            strength: curr.rms
        });
    }
}

console.log(`Detected ${allOnsets.length} total onsets\n`);

// Read lyrics to know how many we need
const lyrics = fs.readFileSync(LYRICS_FILE, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

console.log(`Need to match ${lyrics.length} lyrics lines\n`);

// Smart selection: Pick strongest onsets with good spacing
const selectedOnsets = [];
const minGap = 3.0; // Minimum 3 seconds between lyrics (adjust based on song)

// Sort by strength
const sortedOnsets = [...allOnsets].sort((a, b) => b.strength - a.strength);

for (const onset of sortedOnsets) {
    if (selectedOnsets.length >= lyrics.length) break;
    
    // Check if this onset is far enough from already selected ones
    const tooClose = selectedOnsets.some(s => Math.abs(s.time - onset.time) < minGap);
    
    if (!tooClose) {
        selectedOnsets.push(onset);
    }
}

// Sort by time
selectedOnsets.sort((a, b) => a.time - b.time);

console.log(`Selected ${selectedOnsets.length} best onsets\n`);

// Match with lyrics
const timing = [];
for (let i = 0; i < Math.min(lyrics.length, selectedOnsets.length); i++) {
    timing.push({
        line: i + 1,
        time: selectedOnsets[i].time.toFixed(3),
        text: lyrics[i],
        strength: selectedOnsets[i].strength.toFixed(3)
    });
}

// Save
const output = {
    metadata: {
        audio: AUDIO_FILE,
        lyrics: LYRICS_FILE,
        method: 'smart-onset-clustering',
        minGap,
        totalOnsets: allOnsets.length,
        selected: selectedOnsets.length
    },
    timing,
    stats: {
        lyricsLines: lyrics.length,
        matched: timing.length,
        unmatched: lyrics.length - timing.length
    }
};

fs.writeFileSync('auto-timing-smart.json', JSON.stringify(output, null, 2));

// Display
console.log('═══════════════════════════════════════════════════════');
console.log('Results:\n');
console.log(`  Lyrics: ${output.stats.lyricsLines}`);
console.log(`  Total onsets: ${output.metadata.totalOnsets}`);
console.log(`  Selected: ${output.metadata.selected}`);
console.log(`  Matched: ${output.stats.matched}\n`);

console.log('First 10 timings:');
timing.slice(0, 10).forEach(t => {
    console.log(`  ${t.time}s [${t.strength}] - ${t.text.substring(0, 50)}`);
});

console.log('\n✓ Saved to auto-timing-smart.json');
console.log('\n💡 Adjust minGap parameter if spacing is wrong');
console.log(`   Current: ${minGap}s between lyrics`);

fs.unlinkSync(wavFile);
