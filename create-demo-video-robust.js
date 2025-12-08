#!/usr/bin/env node

/**
 * Robust demo video creator - fixes audio garbling issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = '/Users/santosh/development/pointless-game/imagesForDemo';
const AUDIO_DIR = path.join(__dirname, 'demo-audio');
const OUTPUT_DIR = path.join(__dirname, 'demo-output');
const TEMP_DIR = path.join(__dirname, 'demo-temp');

[OUTPUT_DIR, TEMP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const scenes = [
    { id: 1, type: 'image', file: 'landingpage.png', audio: 'scene-1-landing-page.mp3' },
    { id: 2, type: 'image', file: 'createNewProject.png', audio: 'scene-2-create-project-empty.mp3' },
    { id: 3, type: 'image', file: 'createNewProjectWithFilesUploaded.png', audio: 'scene-3-create-project-filled.mp3' },
    { id: 4, type: 'image', file: 'ReadyToUseTimingTool.png', audio: 'scene-4-ready-to-time.mp3' },
    { id: 5, type: 'image', file: 'TimingToolnAction.png', audio: 'scene-5-timing-tool.mp3' },
    { id: 6, type: 'image', file: 'ReadyToGenerateImages.png', audio: 'scene-6-ready-to-generate-images.mp3' },
    { id: 7, type: 'image', file: 'ReadyToApplyTimings.png', audio: 'scene-7-images-generated.mp3' },
    { id: 8, type: 'image', file: 'ReadyToCreateVideos.png', audio: 'scene-8-ready-to-create-videos.mp3' },
    { id: 9, type: 'image', file: 'VideosGeneratedReadtoPlay.png', audio: 'scene-9-videos-complete.mp3' },
    { id: 10, type: 'video', file: 'karaoke-clip.mp4', audio: 'scene-10-karaoke-demo.mp3' },
    { id: 11, type: 'video', file: 'singalong-clip.mp4', audio: 'scene-11-singalong-demo.mp3' },
    { id: 12, type: 'image', file: 'closing-slide.png', audio: 'scene-12-closing-summary.mp3' }
];

console.log('🎬 Creating Demo Video (Robust Audio Handling)\n');

// Step 1: Create segments with proper audio
console.log('Step 1: Creating segments...\n');

scenes.forEach((scene, index) => {
    const videoOutput = path.join(TEMP_DIR, `seg-${scene.id}.mp4`);
    
    console.log(`[${index + 1}/${scenes.length}] ${scene.file}`);
    
    try {
        if (scene.type === 'image') {
            const imageInput = path.join(IMAGES_DIR, scene.file);
            const audioInput = path.join(AUDIO_DIR, scene.audio);
            
            if (!fs.existsSync(imageInput) || !fs.existsSync(audioInput)) {
                console.log(`  ⚠️  Missing files\n`);
                return;
            }
            
            // Create video from image with audio duration
            execSync(`ffmpeg -loop 1 -framerate 30 -i "${imageInput}" -i "${audioInput}" \
                -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p" \
                -c:v libx264 -preset medium -crf 23 -tune stillimage \
                -c:a aac -b:a 192k -ar 48000 -ac 2 \
                -shortest -movflags +faststart \
                "${videoOutput}" -y 2>&1 | tail -1`, {
                stdio: 'pipe'
            });
            
            console.log(`  ✓ Created\n`);
            
        } else if (scene.type === 'video') {
            const videoInput = path.join(IMAGES_DIR, scene.file);
            const audioInput = path.join(AUDIO_DIR, scene.audio);
            
            if (!fs.existsSync(videoInput)) {
                console.log(`  ⚠️  Video not found\n`);
                return;
            }
            
            if (fs.existsSync(audioInput)) {
                // Extract video audio duration
                const vidDur = execSync(
                    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoInput}"`
                ).toString().trim();
                
                const narDur = execSync(
                    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioInput}"`
                ).toString().trim();
                
                const maxDur = Math.max(parseFloat(vidDur), parseFloat(narDur));
                
                // Mix audio properly
                execSync(`ffmpeg -i "${videoInput}" -i "${audioInput}" \
                    -filter_complex "[0:a]volume=0.15,apad[a0];[1:a]apad[a1];[a0][a1]amerge=inputs=2,pan=stereo|c0<c0+c2|c1<c1+c3[aout]" \
                    -map 0:v -map "[aout]" \
                    -c:v libx264 -preset medium -crf 23 \
                    -c:a aac -b:a 192k -ar 48000 -ac 2 \
                    -t ${maxDur} -movflags +faststart \
                    "${videoOutput}" -y 2>&1 | tail -1`, {
                    stdio: 'pipe'
                });
                
                console.log(`  ✓ With audio mix\n`);
            } else {
                // Just copy video
                execSync(`ffmpeg -i "${videoInput}" \
                    -c:v libx264 -preset medium -crf 23 \
                    -c:a aac -b:a 192k -ar 48000 -ac 2 \
                    -movflags +faststart \
                    "${videoOutput}" -y 2>&1 | tail -1`, {
                    stdio: 'pipe'
                });
                
                console.log(`  ✓ Video only\n`);
            }
        }
        
    } catch (error) {
        console.error(`  ✗ Error: ${error.message}\n`);
    }
});

console.log('Step 2: Concatenating with filter_complex...\n');

// Build filter_complex for smooth concat
const inputs = scenes.map((s, i) => `-i "${path.join(TEMP_DIR, `seg-${s.id}.mp4`)}"`).join(' ');
const filterParts = scenes.map((s, i) => `[${i}:v][${i}:a]`).join('');
const filterComplex = `${filterParts}concat=n=${scenes.length}:v=1:a=1[outv][outa]`;

const finalOutput = path.join(OUTPUT_DIR, 'karaoke-creator-demo-full.mp4');

try {
    execSync(`ffmpeg ${inputs} \
        -filter_complex "${filterComplex}" \
        -map "[outv]" -map "[outa]" \
        -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p \
        -c:a aac -b:a 192k -ar 48000 -ac 2 \
        -movflags +faststart \
        "${finalOutput}" -y`, {
        stdio: 'inherit'
    });
    
    console.log('\n✅ Video created!\n');
    
    const stats = fs.statSync(finalOutput);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📹 ${finalOutput}`);
    console.log(`📦 ${fileSizeMB} MB\n`);
    
} catch (error) {
    console.error('\n✗ Error:', error.message);
}

console.log('🧹 Cleaning up...');
try {
    fs.readdirSync(TEMP_DIR).forEach(file => {
        fs.unlinkSync(path.join(TEMP_DIR, file));
    });
    fs.rmdirSync(TEMP_DIR);
    console.log('  ✓ Done\n');
} catch (error) {
    console.log('  ⚠️  Cleanup failed\n');
}
