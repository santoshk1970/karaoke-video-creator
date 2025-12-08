#!/usr/bin/env node

/**
 * Create demo video with actual video clips included
 * Shows screenshots + actual karaoke/singalong video samples
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

// Scene configuration - now includes video clips!
const scenes = [
    { id: 1, type: 'image', file: 'landingpage.png', audio: 'scene-1-landing-page.mp3', duration: 8 },
    { id: 2, type: 'image', file: 'createNewProject.png', audio: 'scene-2-create-project-empty.mp3', duration: 8 },
    { id: 3, type: 'image', file: 'createNewProjectWithFilesUploaded.png', audio: 'scene-3-create-project-filled.mp3', duration: 10 },
    { id: 4, type: 'image', file: 'ReadyToUseTimingTool.png', audio: 'scene-4-ready-to-time.mp3', duration: 10 },
    { id: 5, type: 'image', file: 'TimingToolnAction.png', audio: 'scene-5-timing-tool.mp3', duration: 20 },
    { id: 6, type: 'image', file: 'ReadyToGenerateImages.png', audio: 'scene-6-ready-to-generate-images.mp3', duration: 12 },
    { id: 7, type: 'image', file: 'ReadyToApplyTimings.png', audio: 'scene-7-images-generated.mp3', duration: 12 },
    { id: 8, type: 'image', file: 'ReadyToCreateVideos.png', audio: 'scene-8-ready-to-create-videos.mp3', duration: 15 },
    { id: 9, type: 'image', file: 'VideosGeneratedReadtoPlay.png', audio: 'scene-9-videos-complete.mp3', duration: 20 },
    
    // NEW: Actual video clips!
    { id: 10, type: 'video', file: 'karaoke-clip.mp4', audio: 'scene-10-karaoke-demo.mp3', duration: 10 },
    { id: 11, type: 'video', file: 'singalong-clip.mp4', audio: 'scene-11-singalong-demo.mp3', duration: 10 },
    
    { id: 12, type: 'image', file: 'closing-slide.png', audio: 'scene-12-closing-summary.mp3', duration: 15 }
];

console.log('🎬 Creating enhanced demo video with actual video clips...\n');

// Step 1: Create video segments
console.log('Step 1: Creating video segments...');

scenes.forEach((scene, index) => {
    const videoOutput = path.join(TEMP_DIR, `segment-${scene.id}.mp4`);
    
    console.log(`  [${index + 1}/${scenes.length}] Creating segment ${scene.id} (${scene.type})...`);
    
    try {
        if (scene.type === 'image') {
            // Image-based segment
            const imageInput = path.join(IMAGES_DIR, scene.file);
            const audioInput = path.join(AUDIO_DIR, scene.audio);
            
            if (!fs.existsSync(imageInput)) {
                console.log(`    ⚠️  Image not found: ${scene.file}`);
                return;
            }
            
            if (!fs.existsSync(audioInput)) {
                console.log(`    ⚠️  Audio not found: ${scene.audio}`);
                return;
            }
            
            const fadeIn = 0.5;
            const fadeOut = 0.5;
            
            execSync(`ffmpeg -loop 1 -i "${imageInput}" -i "${audioInput}" \
                -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fade=t=in:st=0:d=${fadeIn},fade=t=out:st=${scene.duration - fadeOut}:d=${fadeOut}" \
                -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p \
                -shortest -t ${scene.duration} "${videoOutput}" -y`, {
                stdio: 'pipe'
            });
            
        } else if (scene.type === 'video') {
            // Video clip segment
            const videoInput = path.join(IMAGES_DIR, scene.file);
            const audioInput = path.join(AUDIO_DIR, scene.audio);
            
            if (!fs.existsSync(videoInput)) {
                console.log(`    ⚠️  Video clip not found: ${scene.file}`);
                return;
            }
            
            if (fs.existsSync(audioInput)) {
                // If we have narration audio, mix it with video audio
                execSync(`ffmpeg -i "${videoInput}" -i "${audioInput}" \
                    -filter_complex "[0:a]volume=0.3[a0];[1:a]volume=1.0[a1];[a0][a1]amix=inputs=2:duration=shortest[aout]" \
                    -map 0:v -map "[aout]" \
                    -c:v libx264 -crf 18 -c:a aac -b:a 192k \
                    -t ${scene.duration} "${videoOutput}" -y`, {
                    stdio: 'pipe'
                });
            } else {
                // No narration, just use video as-is with trimming
                execSync(`ffmpeg -i "${videoInput}" \
                    -c:v libx264 -crf 18 -c:a aac -b:a 192k \
                    -t ${scene.duration} "${videoOutput}" -y`, {
                    stdio: 'pipe'
                });
            }
        }
        
        console.log(`    ✓ Created: segment-${scene.id}.mp4`);
        
    } catch (error) {
        console.error(`    ✗ Error creating segment:`, error.message);
    }
});

console.log('\nStep 2: Creating concat file...');
const concatFile = path.join(TEMP_DIR, 'concat.txt');
const concatContent = scenes
    .map(scene => `file 'segment-${scene.id}.mp4'`)
    .join('\n');

fs.writeFileSync(concatFile, concatContent);
console.log('  ✓ Concat file created');

console.log('\nStep 3: Concatenating all segments...');
const finalOutput = path.join(OUTPUT_DIR, 'karaoke-creator-demo-full.mp4');

try {
    // Re-encode to avoid timestamp warnings (slightly slower but cleaner)
    execSync(`ffmpeg -f concat -safe 0 -i "${concatFile}" -c:v libx264 -crf 18 -preset fast -c:a aac -b:a 192k "${finalOutput}" -y`, {
        stdio: 'inherit'
    });
    
    console.log('\n✅ Enhanced demo video created successfully!');
    console.log(`📹 Output: ${finalOutput}`);
    
    const stats = fs.statSync(finalOutput);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📦 File size: ${fileSizeMB} MB`);
    
    const duration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    console.log(`⏱️  Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`);
    
    console.log('\n🎉 Features:');
    console.log('   ✓ Screenshots of UI');
    console.log('   ✓ Actual karaoke video sample');
    console.log('   ✓ Actual sing-along video sample');
    console.log('   ✓ Professional narration');
    
} catch (error) {
    console.error('✗ Error creating final video:', error.message);
}

console.log('\n🧹 Cleaning up temporary files...');
try {
    fs.readdirSync(TEMP_DIR).forEach(file => {
        fs.unlinkSync(path.join(TEMP_DIR, file));
    });
    fs.rmdirSync(TEMP_DIR);
    console.log('  ✓ Temporary files removed');
} catch (error) {
    console.log('  ⚠️  Could not clean up temp files');
}

console.log('\n🎉 All done! Your enhanced demo video is ready!');
