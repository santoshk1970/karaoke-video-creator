#!/usr/bin/env node

/**
 * Standalone video generator
 * Creates video from existing images and timestamps.json
 */

import { VideoGenerator } from './videoGenerator';
import * as fs from 'fs';
import * as path from 'path';

interface TimedLyric {
    index: number;
    startTime: number;
    endTime: number;
    text: string;
    imagePath?: string;
}

async function main() {
    console.log('🎬 Standalone Video Generator\n');

    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('Usage: npm run video <audio-file> <output-dir> [options]');
        console.log('\nOptions:');
        console.log('  --quality <quality>   Video quality: low|medium|high|ultra (default: high)');
        console.log('  --output <file>       Output video filename (default: output.mp4)');
        console.log('  --purge               Overwrite existing video without backup');
        console.log('\nExample:');
        console.log('  npm run video song.mp3 ./output');
        console.log('  npm run video song.mp3 ./output --quality ultra --output my-video.mp4');
        console.log('  npm run video song.mp3 ./output --purge');
        console.log('\nRequirements:');
        console.log('  - output-dir/timestamps.json must exist');
        console.log('  - output-dir/images/ folder with PNG files must exist');
        process.exit(1);
    }

    const audioFile = args[0];
    const outputDir = args[1];

    // Parse options
    let quality: 'low' | 'medium' | 'high' | 'ultra' = 'high';
    let outputFilename = 'output.mp4';
    let purge = false;

    for (let i = 2; i < args.length; i++) {
        if (args[i] === '--quality' && args[i + 1]) {
            quality = args[i + 1] as 'low' | 'medium' | 'high' | 'ultra';
            i++;
        } else if (args[i] === '--output' && args[i + 1]) {
            outputFilename = args[i + 1];
            i++;
        } else if (args[i] === '--purge') {
            purge = true;
        }
    }

    // Validate inputs
    if (!fs.existsSync(audioFile)) {
        console.error(`❌ Audio file not found: ${audioFile}`);
        process.exit(1);
    }

    if (!fs.existsSync(outputDir)) {
        console.error(`❌ Output directory not found: ${outputDir}`);
        process.exit(1);
    }

    const timestampsFile = path.join(outputDir, 'timestamps.json');
    if (!fs.existsSync(timestampsFile)) {
        console.error(`❌ timestamps.json not found in: ${outputDir}`);
        console.error('   Run the main tool first to generate timestamps and images.');
        process.exit(1);
    }

    const imagesDir = path.join(outputDir, 'images');
    if (!fs.existsSync(imagesDir)) {
        console.error(`❌ images/ folder not found in: ${outputDir}`);
        console.error('   Run the main tool first to generate images.');
        process.exit(1);
    }

    const outputPath = path.join(outputDir, outputFilename);

    // Backup existing video if it exists and purge is not set
    if (fs.existsSync(outputPath) && !purge) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const backupPath = path.join(outputDir, `${path.parse(outputFilename).name}.backup.${timestamp}.mp4`);
        console.log(`📦 Backing up existing video...`);
        fs.copyFileSync(outputPath, backupPath);
        console.log(`   Backup saved: ${path.basename(backupPath)}\n`);
    } else if (fs.existsSync(outputPath) && purge) {
        console.log(`🗑️  Purge mode: Overwriting existing video without backup\n`);
    }

    console.log('📁 Input files:');
    console.log(`   Audio: ${audioFile}`);
    console.log(`   Timestamps: ${timestampsFile}`);
    console.log(`   Images: ${imagesDir}`);
    console.log(`   Quality: ${quality}`);
    console.log(`   Output: ${outputPath}\n`);

    // Read timestamps
    console.log('🔄 Reading timestamps...');
    const data = JSON.parse(fs.readFileSync(timestampsFile, 'utf-8'));
    const timedLyrics: TimedLyric[] = data.lyrics.map((lyric: any) => ({
        index: lyric.index,
        startTime: lyric.startTime,
        endTime: lyric.endTime,
        text: lyric.text,
        imagePath: lyric.imagePath
    }));

    console.log(`   Found ${timedLyrics.length} lyric segments\n`);

    // Verify all images exist
    console.log('\n🔄 Verifying all images...');
    const missingImages: string[] = [];
    for (const lyric of data.lyrics) {
        const imagePath = lyric.imagePath
            ? path.join(imagesDir, path.basename(lyric.imagePath))
            : path.join(imagesDir, `lyric_${String(lyric.index).padStart(3, '0')}.png`);

        if (!fs.existsSync(imagePath)) {
            missingImages.push(imagePath);
            console.log(`   ⚠️  Missing: ${imagePath}`);
        }
    }

    if (missingImages.length > 0) {
        console.log(`\n❌ ${missingImages.length} image(s) missing. Cannot create video.\n`);
        process.exit(1);
    }
    console.log('   All ' + data.lyrics.length + ' images found ✓\n');

    // Generate video
    console.log('🎬 Generating video...');
    const videoGenerator = new VideoGenerator();

    try {
        await videoGenerator.generateSimple(
            timedLyrics,
            imagesDir,
            audioFile,
            outputPath,
            { quality, fps: 30 }
        );

        console.log('\n✅ Video created successfully!');
        console.log(`📹 Video saved to: ${path.resolve(outputPath)}`);
        console.log(`📊 File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
    } catch (error: any) {
        console.error('\n❌ Error creating video:', error.message);
        process.exit(1);
    }
}

main();
