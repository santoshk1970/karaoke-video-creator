#!/usr/bin/env node

/**
 * Compare Meyda auto-timing with manual timing
 */

const fs = require('fs');

const autoFile = process.argv[2] || 'auto-timing-smart.json';
const autoTiming = JSON.parse(fs.readFileSync(autoFile, 'utf-8'));
const manualTiming = JSON.parse(fs.readFileSync('projects/MyFirstSong/output/timestamps.json', 'utf-8'));

console.log('🔍 Timing Comparison: Meyda Auto vs Manual\n');
console.log('═══════════════════════════════════════════════════════\n');

// Skip countdown lines (indices 1-4 in manual)
const manualLyrics = manualTiming.lyrics.filter(l => !l.text.includes('['));

console.log('First 15 lyric lines:\n');
console.log('Line | Auto    | Manual  | Diff   | Text');
console.log('-----|---------|---------|--------|------------------------------');

for (let i = 0; i < Math.min(15, autoTiming.timing.length); i++) {
    const auto = autoTiming.timing[i];
    const manual = manualLyrics[i];
    
    if (manual) {
        const autoTime = parseFloat(auto.time);
        const manualTime = manual.startTime;
        const diff = (autoTime - manualTime).toFixed(2);
        const diffStr = diff > 0 ? `+${diff}s` : `${diff}s`;
        
        console.log(
            `${(i+1).toString().padStart(4)} | ` +
            `${autoTime.toFixed(1).padStart(6)}s | ` +
            `${manualTime.toFixed(1).padStart(6)}s | ` +
            `${diffStr.padStart(6)} | ` +
            `${auto.text.substring(0, 30)}`
        );
    }
}

console.log('\n═══════════════════════════════════════════════════════\n');

// Calculate statistics
const diffs = [];
for (let i = 0; i < Math.min(autoTiming.timing.length, manualLyrics.length); i++) {
    const autoTime = parseFloat(autoTiming.timing[i].time);
    const manualTime = manualLyrics[i].startTime;
    diffs.push(autoTime - manualTime);
}

const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
const absDiffs = diffs.map(Math.abs);
const avgAbsDiff = absDiffs.reduce((a, b) => a + b, 0) / absDiffs.length;
const maxDiff = Math.max(...absDiffs);

console.log('📊 Statistics:\n');
console.log(`  Average difference: ${avgDiff.toFixed(2)}s`);
console.log(`  Average absolute difference: ${avgAbsDiff.toFixed(2)}s`);
console.log(`  Maximum difference: ${maxDiff.toFixed(2)}s`);
console.log(`  Compared lines: ${diffs.length}`);

console.log('\n💡 Analysis:\n');
if (avgAbsDiff < 1.0) {
    console.log('  ✅ Very good! Auto-timing is within 1 second on average');
} else if (avgAbsDiff < 2.0) {
    console.log('  ⚠️  Decent. Auto-timing needs some adjustment');
} else {
    console.log('  ❌ Poor. Auto-timing is significantly off');
}

if (Math.abs(avgDiff) > 0.5) {
    if (avgDiff > 0) {
        console.log(`  📌 Auto-timing is consistently ${avgDiff.toFixed(2)}s LATE`);
        console.log(`  💡 Subtract ${avgDiff.toFixed(2)}s from all auto timings`);
    } else {
        console.log(`  📌 Auto-timing is consistently ${Math.abs(avgDiff).toFixed(2)}s EARLY`);
        console.log(`  💡 Add ${Math.abs(avgDiff).toFixed(2)}s to all auto timings`);
    }
}

console.log('\n═══════════════════════════════════════════════════════\n');
