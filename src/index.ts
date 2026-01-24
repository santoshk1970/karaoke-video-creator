#!/usr/bin/env node

/**
 * Lyric Sync - Audio to Timed Lyric Images
 * Copyright (c) 2026 Santosh Kulkarni
 * MIT License - See LICENSE file for details
 */

import { LyricSyncProcessor } from './processor';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
    console.log('🎵 Lyric Sync - Audio to Timed Lyric Images\n');

    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('Usage: npm start <audio-file> <lyrics-file> [options]');
        console.log('\nOptions:');
        console.log('  --vocal <file>        Path to vocal-only track (optional)');
        console.log('  --instrumental <file> Path to instrumental track (optional)');
        console.log('  --output <dir>        Output directory (default: ./output)');
        console.log('  --format <format>     Output format: json|lrc|srt (default: json)');
        console.log('  --video               Generate video file (MP4)');
        console.log('  --quality <quality>   Video quality: low|medium|high|ultra (default: high)');
        console.log('\nExample:');
        console.log('  npm start song.mp3 lyrics.txt --output ./my-output --video');
        process.exit(1);
    }

    const audioFile = args[0];
    const lyricsFile = args[1];
    
    // Parse optional arguments
    let vocalFile: string | undefined;
    let instrumentalFile: string | undefined;
    let outputDir = './output';
    let format: 'json' | 'lrc' | 'srt' = 'json';
    let generateVideo = false;
    let videoQuality: 'low' | 'medium' | 'high' | 'ultra' = 'high';

    for (let i = 2; i < args.length; i++) {
        if (args[i] === '--vocal' && args[i + 1]) {
            vocalFile = args[i + 1];
            i++;
        } else if (args[i] === '--instrumental' && args[i + 1]) {
            instrumentalFile = args[i + 1];
            i++;
        } else if (args[i] === '--output' && args[i + 1]) {
            outputDir = args[i + 1];
            i++;
        } else if (args[i] === '--format' && args[i + 1]) {
            format = args[i + 1] as 'json' | 'lrc' | 'srt';
            i++;
        } else if (args[i] === '--video') {
            generateVideo = true;
        } else if (args[i] === '--quality' && args[i + 1]) {
            videoQuality = args[i + 1] as 'low' | 'medium' | 'high' | 'ultra';
            i++;
        }
    }

    // Validate input files
    if (!fs.existsSync(audioFile)) {
        console.error(`❌ Audio file not found: ${audioFile}`);
        process.exit(1);
    }

    if (!fs.existsSync(lyricsFile)) {
        console.error(`❌ Lyrics file not found: ${lyricsFile}`);
        process.exit(1);
    }

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('📁 Input files:');
    console.log(`   Audio: ${audioFile}`);
    console.log(`   Lyrics: ${lyricsFile}`);
    if (vocalFile) console.log(`   Vocal: ${vocalFile}`);
    if (instrumentalFile) console.log(`   Instrumental: ${instrumentalFile}`);
    console.log(`   Output: ${outputDir}\n`);

    // Process the song
    const processor = new LyricSyncProcessor({
        audioFile,
        lyricsFile,
        vocalFile,
        instrumentalFile,
        outputDir,
        format,
        generateVideo,
        videoQuality
    });

    try {
        await processor.process();
        console.log('\n✅ Processing complete!');
        console.log(`📂 Output saved to: ${path.resolve(outputDir)}`);
    } catch (error) {
        console.error('\n❌ Error processing:', error);
        process.exit(1);
    }
}

main();
