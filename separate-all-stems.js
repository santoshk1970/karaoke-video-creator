#!/usr/bin/env node

/**
 * Separate audio into all 4 stems using Demucs
 * Usage: node separate-all-stems.js <path-to-audio-file>
 * 
 * Outputs:
 *   - vocals.mp3
 *   - drums.mp3
 *   - bass.mp3
 *   - other.mp3
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get audio file from command line
const audioFile = process.argv[2];

if (!audioFile) {
    console.error('❌ Error: No audio file specified');
    console.log('Usage: node separate-all-stems.js <path-to-audio-file>');
    process.exit(1);
}

if (!fs.existsSync(audioFile)) {
    console.error(`❌ Error: Audio file not found: ${audioFile}`);
    process.exit(1);
}

const audioDir = path.dirname(audioFile);
const audioName = path.basename(audioFile, path.extname(audioFile));

console.log('🎵 Demucs Full Stem Separation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📂 Input: ${audioFile}`);
console.log(`📂 Output: ${audioDir}/`);
console.log('');
console.log('⏳ Separating into 4 stems (vocals, drums, bass, other)...');
console.log('   This may take 4-8 minutes depending on song length...');
console.log('');

try {
    // Run Demucs with full separation (4 stems)
    // -o specifies output directory
    // --mp3 forces MP3 output
    // --mp3-bitrate 320 for high quality
    const tempDir = path.join(audioDir, 'demucs_temp');
    
    execSync(
        `demucs --mp3 --mp3-bitrate 320 -o "${tempDir}" "${audioFile}"`,
        { stdio: 'inherit' }
    );

    // Demucs creates: demucs_temp/htdemucs/<audioName>/{vocals,drums,bass,other}.mp3
    const demucsOutputDir = path.join(tempDir, 'htdemucs', audioName);
    
    if (!fs.existsSync(demucsOutputDir)) {
        throw new Error('Demucs output directory not found');
    }

    // Move stems to audio directory with clear names
    const stems = ['vocals', 'drums', 'bass', 'other'];
    const movedFiles = [];

    for (const stem of stems) {
        const sourcePath = path.join(demucsOutputDir, `${stem}.mp3`);
        const destPath = path.join(audioDir, `${audioName}-${stem}.mp3`);
        
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, destPath);
            movedFiles.push(destPath);
            console.log(`✅ ${stem}.mp3 → ${path.basename(destPath)}`);
        } else {
            console.warn(`⚠️  ${stem}.mp3 not found`);
        }
    }

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Stem separation complete!');
    console.log('');
    console.log('📁 Output files:');
    movedFiles.forEach(file => {
        const stats = fs.statSync(file);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`   ${path.basename(file)} (${sizeMB} MB)`);
    });
    console.log('');
    console.log('💡 Tip: You can now mix these stems however you like!');
    console.log('   Example: Karaoke with drums = drums.mp3 + bass.mp3 + other.mp3');

} catch (error) {
    console.error('');
    console.error('❌ Error during stem separation:', error.message);
    console.error('');
    console.error('Make sure Demucs is installed:');
    console.error('   pip install demucs');
    process.exit(1);
}
