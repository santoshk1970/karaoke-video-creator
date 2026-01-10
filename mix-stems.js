#!/usr/bin/env node

/**
 * Mix multiple stems together using FFmpeg
 * Usage: node mix-stems.js <output.mp3> <stem1.mp3> <stem2.mp3> [stem3.mp3] ...
 * 
 * Example:
 *   node mix-stems.js karaoke.mp3 drums.mp3 bass.mp3 other.mp3
 *   (Creates karaoke track without vocals)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('❌ Error: Not enough arguments');
    console.log('');
    console.log('Usage: node mix-stems.js <output.mp3> <stem1.mp3> <stem2.mp3> [stem3.mp3] ...');
    console.log('');
    console.log('Examples:');
    console.log('  # Karaoke (no vocals)');
    console.log('  node mix-stems.js karaoke.mp3 drums.mp3 bass.mp3 other.mp3');
    console.log('');
    console.log('  # Drums + Bass only');
    console.log('  node mix-stems.js rhythm.mp3 drums.mp3 bass.mp3');
    console.log('');
    console.log('  # Everything except drums');
    console.log('  node mix-stems.js no-drums.mp3 vocals.mp3 bass.mp3 other.mp3');
    process.exit(1);
}

const outputFile = args[0];
const inputStems = args.slice(1);

// Validate input files
for (const stem of inputStems) {
    if (!fs.existsSync(stem)) {
        console.error(`❌ Error: File not found: ${stem}`);
        process.exit(1);
    }
}

console.log('🎵 FFmpeg Stem Mixer');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📂 Output: ${outputFile}`);
console.log(`📂 Mixing ${inputStems.length} stems:`);
inputStems.forEach((stem, i) => {
    console.log(`   ${i + 1}. ${path.basename(stem)}`);
});
console.log('');
console.log('⏳ Mixing...');

try {
    // Build FFmpeg command
    // -i for each input
    // -filter_complex amix to mix them
    // -ac 2 for stereo output
    // -b:a 320k for high quality
    
    const inputs = inputStems.map(stem => `-i "${stem}"`).join(' ');
    const filterComplex = `amix=inputs=${inputStems.length}:duration=longest:normalize=0`;
    
    const command = `ffmpeg ${inputs} -filter_complex "${filterComplex}" -ac 2 -b:a 320k -y "${outputFile}"`;
    
    execSync(command, { stdio: 'inherit' });
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Mix complete!');
    
    if (fs.existsSync(outputFile)) {
        const stats = fs.statSync(outputFile);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`📁 ${outputFile} (${sizeMB} MB)`);
    }

} catch (error) {
    console.error('');
    console.error('❌ Error during mixing:', error.message);
    console.error('');
    console.error('Make sure FFmpeg is installed:');
    console.error('   brew install ffmpeg');
    process.exit(1);
}
