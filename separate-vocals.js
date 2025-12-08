#!/usr/bin/env node

/**
 * Experimental: Separate vocals from audio using Demucs
 * This will create instrumental (no vocals) version automatically
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const audioFile = process.argv[2];

if (!audioFile) {
    console.log('Usage: node separate-vocals.js <audio-file.mp3>');
    console.log('\nThis will create:');
    console.log('  • vocals.wav - isolated vocals');
    console.log('  • no_vocals.wav - instrumental only (no vocals)');
    process.exit(1);
}

if (!fs.existsSync(audioFile)) {
    console.error(`❌ File not found: ${audioFile}`);
    process.exit(1);
}

console.log('🎵 Vocal Separation Tool\n');
console.log('═══════════════════════════════════════════════════════\n');

// Check if demucs is installed
console.log('Checking for Demucs...');
try {
    execSync('which demucs', { stdio: 'pipe' });
    console.log('✓ Demucs found\n');
} catch (error) {
    console.log('❌ Demucs not installed\n');
    console.log('Install with:');
    console.log('  pip install demucs');
    console.log('\nOr using conda:');
    console.log('  conda install -c conda-forge demucs');
    console.log('\nDemucs is a state-of-the-art AI model for music source separation.');
    process.exit(1);
}

const outputDir = path.join(path.dirname(audioFile), 'separated');
const baseName = path.basename(audioFile, path.extname(audioFile));

console.log(`Processing: ${audioFile}`);
console.log(`Output directory: ${outputDir}\n`);

console.log('Starting separation (this may take a few minutes)...\n');

try {
    // Run demucs
    // Using htdemucs model (best quality)
    const cmd = `demucs --two-stems=vocals -o "${path.dirname(audioFile)}" "${audioFile}"`;
    
    console.log('Running Demucs...');
    console.log('(This uses AI to separate vocals from instruments)\n');
    
    execSync(cmd, { 
        stdio: 'inherit',
        maxBuffer: 1024 * 1024 * 10 
    });
    
    console.log('\n✅ Separation complete!\n');
    
    // Find output files
    const demucsOutput = path.join(path.dirname(audioFile), 'separated', 'htdemucs', baseName);
    
    if (fs.existsSync(demucsOutput)) {
        const vocalsFile = path.join(demucsOutput, 'vocals.wav');
        const noVocalsFile = path.join(demucsOutput, 'no_vocals.wav');
        
        console.log('Output files:');
        
        if (fs.existsSync(vocalsFile)) {
            const stats = fs.statSync(vocalsFile);
            console.log(`  ✓ vocals.wav (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
            console.log(`    ${vocalsFile}`);
        }
        
        if (fs.existsSync(noVocalsFile)) {
            const stats = fs.statSync(noVocalsFile);
            console.log(`  ✓ no_vocals.wav (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
            console.log(`    ${noVocalsFile}`);
        }
        
        console.log('\n💡 Next steps:');
        console.log('  1. Convert no_vocals.wav to MP3 if needed:');
        console.log(`     ffmpeg -i "${noVocalsFile}" -b:a 192k no_vocals.mp3`);
        console.log('\n  2. Use the original audio for sing-along (with vocals)');
        console.log('  3. Use no_vocals.mp3 for karaoke (instrumental only)');
        
    } else {
        console.log('⚠️  Output directory not found. Check Demucs output above.');
    }
    
} catch (error) {
    console.error('\n❌ Error during separation:', error.message);
    console.log('\nTroubleshooting:');
    console.log('  • Make sure you have enough disk space');
    console.log('  • Audio file should be a valid format (MP3, WAV, etc.)');
    console.log('  • Try with a shorter audio clip first');
    process.exit(1);
}

console.log('\n═══════════════════════════════════════════════════════\n');
