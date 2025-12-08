#!/usr/bin/env node

/**
 * Vocal separation with MP3 output (fixes WAV backend issue)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const audioFile = process.argv[2];

if (!audioFile || !fs.existsSync(audioFile)) {
    console.log('Usage: node separate-vocals-mp3.js <audio-file.mp3>');
    process.exit(1);
}

console.log('🎵 Vocal Separation (MP3 Output)\n');

const outputDir = path.dirname(audioFile);
const baseName = path.basename(audioFile, path.extname(audioFile));

console.log(`Processing: ${audioFile}\n`);

try {
    // Run demucs with MP3 output
    console.log('Running Demucs (this takes 1-2 minutes)...\n');
    
    execSync(`demucs --two-stems=vocals --mp3 --mp3-bitrate=192 -o "${outputDir}" "${audioFile}"`, {
        stdio: 'inherit'
    });
    
    console.log('\n✅ Separation complete!\n');
    
    // Find output files
    const demucsOutput = path.join(outputDir, 'htdemucs', baseName);
    
    if (fs.existsSync(demucsOutput)) {
        const vocalsFile = path.join(demucsOutput, 'vocals.mp3');
        const noVocalsFile = path.join(demucsOutput, 'no_vocals.mp3');
        
        console.log('Output files:');
        
        if (fs.existsSync(vocalsFile)) {
            const stats = fs.statSync(vocalsFile);
            console.log(`  ✓ vocals.mp3 (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
            console.log(`    ${vocalsFile}`);
        }
        
        if (fs.existsSync(noVocalsFile)) {
            const stats = fs.statSync(noVocalsFile);
            console.log(`  ✓ no_vocals.mp3 (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
            console.log(`    ${noVocalsFile}`);
            
            // Copy to project root as audio-novocal.mp3
            const targetFile = path.join(outputDir, 'audio-novocal.mp3');
            fs.copyFileSync(noVocalsFile, targetFile);
            console.log(`\n  ✓ Copied to: ${targetFile}`);
        }
        
        console.log('\n💡 Next steps:');
        console.log('  • Use original audio.mp3 for sing-along (with vocals)');
        console.log('  • Use audio-novocal.mp3 for karaoke (instrumental)');
        console.log('  • Both files are now ready in your project!');
        
    } else {
        console.log('⚠️  Output directory not found');
    }
    
} catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
}

console.log('\n');
