#!/usr/bin/env node

/**
 * Create demo video by combining images and audio files
 * Uses ffmpeg to assemble everything
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Directories
const IMAGES_DIR = '/Users/santosh/development/pointless-game/imagesForDemo';
const AUDIO_DIR = path.join(__dirname, 'demo-audio');
const OUTPUT_DIR = path.join(__dirname, 'demo-output');
const TEMP_DIR = path.join(__dirname, 'demo-temp');

// Create directories
[OUTPUT_DIR, TEMP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Scene configuration with image files and durations
const scenes = [
    { id: 1, image: 'landingpage.png', audio: 'scene-1-landing-page.aiff', duration: 8 },
    { id: 2, image: 'createNewProject.png', audio: 'scene-2-create-project-empty.aiff', duration: 8 },
    { id: 3, image: 'createNewProjectWithFilesUploaded.png', audio: 'scene-3-create-project-filled.aiff', duration: 10 },
    { id: 4, image: 'ReadyToUseTimingTool.png', audio: 'scene-4-ready-to-time.aiff', duration: 10 },
    { id: 5, image: 'TimingToolnAction.png', audio: 'scene-5-timing-tool.aiff', duration: 20 },
    { id: 6, image: 'ReadyToGenerateImages.png', audio: 'scene-6-ready-to-generate-images.aiff', duration: 12 },
    { id: 7, image: 'ReadyToApplyTimings.png', audio: 'scene-7-images-generated.aiff', duration: 12 },
    { id: 8, image: 'ReadyToCreateVideos.png', audio: 'scene-8-ready-to-create-videos.aiff', duration: 15 },
    { id: 9, image: 'VideosGeneratedReadtoPlay.png', audio: 'scene-9-videos-complete.aiff', duration: 20 },
];

console.log('🎬 Creating demo video...\n');

// Step 1: Convert AIFF audio files to MP3
console.log('Step 1: Converting audio files to MP3...');
scenes.forEach((scene, index) => {
    const audioInput = path.join(AUDIO_DIR, scene.audio);
    const audioOutput = path.join(TEMP_DIR, `scene-${scene.id}.mp3`);
    
    if (!fs.existsSync(audioInput)) {
        console.log(`  ⚠️  Audio file not found: ${scene.audio}`);
        return;
    }
    
    console.log(`  [${index + 1}/${scenes.length}] Converting ${scene.audio}...`);
    
    try {
        execSync(`ffmpeg -i "${audioInput}" -acodec libmp3lame -ab 192k "${audioOutput}" -y`, {
            stdio: 'pipe'
        });
        console.log(`    ✓ Created: scene-${scene.id}.mp3`);
    } catch (error) {
        console.error(`    ✗ Error converting audio:`, error.message);
    }
});

console.log('\nStep 2: Creating video segments...');
// Step 2: Create video segment for each scene
scenes.forEach((scene, index) => {
    const imageInput = path.join(IMAGES_DIR, scene.image);
    const audioInput = path.join(TEMP_DIR, `scene-${scene.id}.mp3`);
    const videoOutput = path.join(TEMP_DIR, `segment-${scene.id}.mp4`);
    
    if (!fs.existsSync(imageInput)) {
        console.log(`  ⚠️  Image file not found: ${scene.image}`);
        return;
    }
    
    if (!fs.existsSync(audioInput)) {
        console.log(`  ⚠️  Audio file not found: scene-${scene.id}.mp3`);
        return;
    }
    
    console.log(`  [${index + 1}/${scenes.length}] Creating segment ${scene.id}...`);
    
    try {
        // Create video segment with image and audio
        // Add fade in/out transitions
        const fadeIn = 0.5;
        const fadeOut = 0.5;
        
        execSync(`ffmpeg -loop 1 -i "${imageInput}" -i "${audioInput}" \
            -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fade=t=in:st=0:d=${fadeIn},fade=t=out:st=${scene.duration - fadeOut}:d=${fadeOut}" \
            -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p \
            -shortest -t ${scene.duration} "${videoOutput}" -y`, {
            stdio: 'pipe'
        });
        
        console.log(`    ✓ Created: segment-${scene.id}.mp4`);
    } catch (error) {
        console.error(`    ✗ Error creating segment:`, error.message);
    }
});

console.log('\nStep 3: Creating concat file...');
// Step 3: Create concat file for ffmpeg
const concatFile = path.join(TEMP_DIR, 'concat.txt');
const concatContent = scenes
    .map(scene => `file 'segment-${scene.id}.mp4'`)
    .join('\n');

fs.writeFileSync(concatFile, concatContent);
console.log('  ✓ Concat file created');

console.log('\nStep 4: Concatenating all segments...');
// Step 4: Concatenate all segments
const finalOutput = path.join(OUTPUT_DIR, 'karaoke-creator-demo.mp4');

try {
    // Re-encode to avoid timestamp warnings (slightly slower but cleaner)
    execSync(`ffmpeg -f concat -safe 0 -i "${concatFile}" -c:v libx264 -crf 18 -preset fast -c:a aac -b:a 192k "${finalOutput}" -y`, {
        stdio: 'inherit'
    });
    
    console.log('\n✅ Demo video created successfully!');
    console.log(`📹 Output: ${finalOutput}`);
    
    // Get file size
    const stats = fs.statSync(finalOutput);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📦 File size: ${fileSizeMB} MB`);
    
    // Get video duration
    const duration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    console.log(`⏱️  Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`);
    
} catch (error) {
    console.error('✗ Error creating final video:', error.message);
}

console.log('\n🧹 Cleaning up temporary files...');
// Optional: Clean up temp files
try {
    fs.readdirSync(TEMP_DIR).forEach(file => {
        fs.unlinkSync(path.join(TEMP_DIR, file));
    });
    fs.rmdirSync(TEMP_DIR);
    console.log('  ✓ Temporary files removed');
} catch (error) {
    console.log('  ⚠️  Could not clean up temp files');
}

console.log('\n🎉 All done! Your demo video is ready to share!');
