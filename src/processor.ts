/**
 * Lyric Sync - Core Processing Logic
 * Copyright (c) 2026 Santosh Kulkarni
 * MIT License - See LICENSE file for details
 */

import * as fs from 'fs';
import * as path from 'path';
import { AlignmentEngine } from './alignment';
import { ImageGenerator, ImageStyle } from './imageGenerator';
import { TimestampExporter } from './exporter';
import { VideoGenerator } from './videoGenerator';
import { VoiceExtractor } from './voiceExtractor';
import { WhisperXTranscriber } from './whisperXTranscriber';

export interface ProcessorConfig {
    audioFile: string;
    lyricsFile: string;
    vocalFile?: string;
    instrumentalFile?: string;
    outputDir: string;
    format: 'json' | 'lrc' | 'srt';
    generateVideo?: boolean;
    videoQuality?: 'low' | 'medium' | 'high' | 'ultra';
    // Voice extraction options
    extractVoice?: boolean;
    voiceExtractionMethod?: 'center' | 'spectral' | 'hybrid';
    voiceQuality?: 'low' | 'medium' | 'high';
    // WhisperX transcription options
    transcriptionFile?: string;
    useWhisperX?: boolean;
    minWordConfidence?: number;
    mergeThreshold?: number;
}

export interface TimedLyric {
    index: number;
    startTime: number;  // in seconds
    endTime: number;    // in seconds
    text: string;
    imagePath?: string; // Optional: path to image file (for split segments)
}

export class LyricSyncProcessor {
    private config: ProcessorConfig;
    private alignmentEngine: AlignmentEngine;
    private imageGenerator: ImageGenerator;
    private exporter: TimestampExporter;
    private videoGenerator: VideoGenerator;

    constructor(config: ProcessorConfig) {
        this.validateConfig(config);
        this.config = config;
        this.alignmentEngine = new AlignmentEngine();
        this.imageGenerator = new ImageGenerator();
        this.exporter = new TimestampExporter();
        this.videoGenerator = new VideoGenerator();
    }

    /**
     * Validate processor configuration
     */
    private validateConfig(config: ProcessorConfig): void {
        // Validate audio file
        if (!config.audioFile) {
            throw new Error('Audio file path is required');
        }
        if (!fs.existsSync(config.audioFile)) {
            throw new Error(`Audio file not found: ${config.audioFile}`);
        }
        const audioExt = path.extname(config.audioFile).toLowerCase();
        const validAudioExts = ['.mp3', '.wav', '.m4a', '.flac', '.aac'];
        if (!validAudioExts.includes(audioExt)) {
            throw new Error(`Unsupported audio format: ${audioExt}. Supported: ${validAudioExts.join(', ')}`);
        }

        // Validate lyrics file
        if (!config.lyricsFile) {
            throw new Error('Lyrics file path is required');
        }
        if (!fs.existsSync(config.lyricsFile)) {
            throw new Error(`Lyrics file not found: ${config.lyricsFile}`);
        }
        const lyricsExt = path.extname(config.lyricsFile).toLowerCase();
        if (lyricsExt !== '.txt') {
            throw new Error(`Lyrics file must be .txt format, got: ${lyricsExt}`);
        }

        // Validate optional vocal file
        if (config.vocalFile && !fs.existsSync(config.vocalFile)) {
            throw new Error(`Vocal file not found: ${config.vocalFile}`);
        }

        // Validate optional instrumental file
        if (config.instrumentalFile && !fs.existsSync(config.instrumentalFile)) {
            throw new Error(`Instrumental file not found: ${config.instrumentalFile}`);
        }

        // Validate output directory
        if (!config.outputDir) {
            throw new Error('Output directory is required');
        }

        // Validate format
        const validFormats = ['json', 'lrc', 'srt'];
        if (!validFormats.includes(config.format)) {
            throw new Error(`Invalid format: ${config.format}. Supported: ${validFormats.join(', ')}`);
        }
    }

    private async getAudioDuration(audioFile: string): Promise<number> {
        if (!fs.existsSync(audioFile)) {
            throw new Error(`Audio file not found: ${audioFile}`);
        }

        // Validate and sanitize the audio file path to prevent command injection
        const sanitizedAudioFile = audioFile.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
        
        const { execSync } = require('child_process');
        const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${sanitizedAudioFile}"`;
        const stdout = execSync(command, { encoding: 'utf-8' });
        const duration = parseFloat(stdout.trim());

        if (isNaN(duration) || duration <= 0) {
            throw new Error(`Invalid audio duration: ${duration}`);
        }

        return duration;
    }

    async process(): Promise<void> {
        console.log('🔄 Step 1: Reading lyrics file...');
        const lyrics = this.readLyrics();
        console.log(`   Found ${lyrics.length} lines\n`);

        // Step 1.5: Extract voice if requested
        let vocalFile = this.config.vocalFile;
        if (this.config.extractVoice && !vocalFile) {
            console.log('🎤 Step 1.5: Extracting voice from audio...');
            const voiceExtractor = new VoiceExtractor({
                inputFile: this.config.audioFile,
                outputDir: this.config.outputDir,
                method: this.config.voiceExtractionMethod || 'hybrid',
                quality: this.config.voiceQuality || 'medium'
            });
            
            const { outputPath } = await voiceExtractor.extractWithInfo();
            vocalFile = outputPath;
            console.log(`   Voice extracted to: ${vocalFile}\n`);
        }

        console.log('🔄 Step 2: Analyzing audio and aligning lyrics...');

        const timestampsOutputPath = path.join(this.config.outputDir, 'timestamps.json');
        const manualTimingScript = path.join(path.dirname(this.config.outputDir), 'set-manual-timing.js');
        let manualTimedLyrics: TimedLyric[];

        if (fs.existsSync(manualTimingScript)) {
            console.log('   Manual timing script found, creating initial timestamps...');
            const audioDuration = await this.getAudioDuration(this.config.audioFile);

            const minimalTimestamps = {
                audioDuration: audioDuration,
                lyrics: lyrics.map((text, index) => ({
                    index: index,
                    startTime: 0,
                    endTime: 0,
                    text: text
                }))
            };

            fs.writeFileSync(timestampsOutputPath, JSON.stringify(minimalTimestamps, null, 2));
            console.log(`   Created minimal timestamps.json with duration: ${audioDuration.toFixed(1)}s`);

            console.log('   Running manual timing script...');
            const { execSync } = require('child_process');
            try {
                // Validate and sanitize the script path to prevent command injection
                const sanitizedScript = manualTimingScript.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
                
                execSync(`node "${sanitizedScript}"`, {
                    cwd: path.dirname(this.config.outputDir),
                    stdio: 'inherit'
                });

                const updatedData = JSON.parse(fs.readFileSync(timestampsOutputPath, 'utf-8'));
                manualTimedLyrics = updatedData.lyrics.map((lyric: any) => ({
                    index: lyric.index,
                    startTime: lyric.startTime,
                    endTime: lyric.endTime,
                    text: lyric.text
                }));
                console.log(`   ✅ Loaded ${manualTimedLyrics.length} manually timed segments\n`);
            } catch (error: any) {
                console.error('   ❌ Failed to apply manual timing:', error.message);
                throw new Error(`Manual timing script failed. Fix the script or delete it to proceed. Error: ${error.message}`);
            }
        } else if (fs.existsSync(timestampsOutputPath)) {
            console.log('   Using existing timestamps from timestamps.json...');
            const timestampsData = JSON.parse(fs.readFileSync(timestampsOutputPath, 'utf-8'));
            manualTimedLyrics = timestampsData.lyrics.map((lyric: any) => ({
                index: lyric.index,
                startTime: lyric.startTime,
                endTime: lyric.endTime,
                text: lyric.text
            }));
            console.log(`   Loaded ${manualTimedLyrics.length} pre-timed segments\n`);
        } else if (this.config.useWhisperX && this.config.transcriptionFile) {
            console.log('   Using WhisperX transcription for timing...');
            const transcriber = new WhisperXTranscriber({
                transcriptionFile: this.config.transcriptionFile,
                outputDir: this.config.outputDir,
                minWordConfidence: this.config.minWordConfidence,
                mergeThreshold: this.config.mergeThreshold
            });
            
            manualTimedLyrics = await transcriber.toTimedLyrics();
            console.log(`   ✅ Loaded ${manualTimedLyrics.length} WhisperX-timed segments\n`);
            
            // Export word timing and reports
            await transcriber.exportWordTiming();
            await transcriber.generateReport();
        } else {
            manualTimedLyrics = await this.alignmentEngine.align(
                this.config.audioFile,
                lyrics,
                vocalFile
            );
            console.log(`   Aligned ${manualTimedLyrics.length} lyric segments\n`);

            await this.exportTimestamps(manualTimedLyrics);
        }

        // PASS 1: Virtual pass - calculate splits without generating anything
        console.log('🔄 Step 3a: Planning image generation (analyzing splits)...');
        const expandedLyrics = this.planImageGeneration(manualTimedLyrics);
        console.log(`   Planned ${expandedLyrics.length} images (${expandedLyrics.length - manualTimedLyrics.length} splits)\n`);

        // PASS 2: Execution pass - generate images based on plan
        console.log('🔄 Step 3b: Generating lyric images...');
        await this.generateImages(expandedLyrics);
        console.log(`   Generated ${expandedLyrics.length} images\n`);

        // Export Render Manifest (Expanded) for video creation
        console.log('🔄 Step 4: Exporting render manifest...');
        const renderManifestPath = path.join(this.config.outputDir, 'timestamps-render.json');
        await this.exporter.export(expandedLyrics, renderManifestPath, 'json');
        console.log('   Render manifest exported to timestamps-render.json');

        // Also save unexpanded timestamps to timestamps.json to preserve manual timing structure
        await this.exportTimestamps(manualTimedLyrics);
        console.log('   Source timestamps saved to timestamps.json');

        // Generate video if requested
        if (this.config.generateVideo) {
            console.log('🔄 Step 5: Creating video...');
            await this.videoGenerator.generate(
                expandedLyrics, // Use expanded lyrics for video generation
                path.join(this.config.outputDir, 'images'),
                this.config.audioFile,
                path.join(this.config.outputDir, 'karaoke.mp4')
            );
        }
    }

    private readLyrics(): string[] {
        const content = fs.readFileSync(this.config.lyricsFile, 'utf-8');
        const lyrics = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lyrics.length === 0) {
            throw new Error(`Lyrics file is empty: ${this.config.lyricsFile}`);
        }

        return lyrics;
    }

    /**
     * PASS 1: Virtual/Planning Pass
     * Analyze lyrics and determine which segments need splitting
     * Returns expanded list with split segments included
     */
    private planImageGeneration(timedLyrics: TimedLyric[]): Array<TimedLyric & { segmentIndex?: number }> {
        const INSTRUMENTAL_SPLIT_DURATION = 5; // Split every 5 seconds
        const MIN_SPLIT_DURATION = 7; // Only split if >= 7 seconds
        const result: Array<TimedLyric & { segmentIndex?: number }> = [];

        for (const lyric of timedLyrics) {
            const duration = lyric.endTime - lyric.startTime;
            const textParts = lyric.text.split('|');
            const isInstrumental = textParts.some(part => /^[♪\s]+.*[♪\s]+$/.test(part.trim()));

            if (isInstrumental && duration >= MIN_SPLIT_DURATION) {
                // Split this segment
                const numSegments = Math.ceil(duration / INSTRUMENTAL_SPLIT_DURATION);
                const segmentDuration = duration / numSegments;

                console.log(`   Instrumental #${lyric.index}: ${duration.toFixed(1)}s → ${numSegments} segments`);

                for (let seg = 0; seg < numSegments; seg++) {
                    result.push({
                        index: lyric.index,
                        segmentIndex: seg,
                        startTime: lyric.startTime + (seg * segmentDuration),
                        endTime: lyric.startTime + ((seg + 1) * segmentDuration),
                        text: lyric.text
                    });
                }
            } else {
                // Keep as-is
                result.push(lyric);
            }
        }

        return result;
    }

    /**
     * PASS 2: Execution Pass
     * Generate images based on the plan (no recalculation, just execute)
     */
    private async generateImages(expandedLyrics: Array<TimedLyric & { segmentIndex?: number }>): Promise<void> {
        let activeColor: string | undefined;
        const imagesDir = path.join(this.config.outputDir, 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        for (let i = 0; i < expandedLyrics.length; i++) {
            const lyric = expandedLyrics[i];

            // Determine filename based on whether this is a split segment
            const filename = lyric.segmentIndex !== undefined
                ? `lyric_${String(lyric.index).padStart(3, '0')}_seg${lyric.segmentIndex}.png`
                : `lyric_${String(lyric.index).padStart(3, '0')}.png`;
            const outputPath = path.join(imagesDir, filename);

            // Check if current lyric is a countdown
            const isCountdown = /^\[?\d\]?\s*\d?\s*\d?\s*\d?\s*\|/.test(lyric.text);

            // Get next line for preview
            let nextLine: string | undefined;
            if (i < expandedLyrics.length - 1) {
                if (isCountdown) {
                    // For countdown slides, find the next NON-countdown lyric
                    for (let j = i + 1; j < expandedLyrics.length; j++) {
                        const nextText = expandedLyrics[j].text;
                        const isNextCountdown = /^\[?\d\]?\s*\d?\s*\d?\s*\d?\s*\|/.test(nextText);
                        if (!isNextCountdown && !nextText.includes('♪ Instrumental ♪')) {
                            nextLine = nextText;
                            break;
                        }
                    }
                } else {
                    // For regular lyrics, show next line only if it's not a countdown
                    const nextText = expandedLyrics[i + 1].text;
                    const isNextCountdown = /^\[?\d\]?\s*\d?\s*\d?\s*\d?\s*\|/.test(nextText);
                    if (!isNextCountdown) {
                        nextLine = nextText;
                    }
                }
            }

            const style: ImageStyle = {
                width: 1920,
                height: 1080,
                fontSize: 80,
                fontFamily: 'Arial',
                textColor: '#FFFFFF',
                backgroundColor: '#000000',
                padding: 80,
                useGradient: true,
                gradientColors: ['#8B4513', '#2C1810'], // Warm brown to dark brown gradient
                textShadow: true,
                transliterationFontSize: 56,
                transliterationColor: '#AAAAAA',
                nextLineColor: '#888888',
                nextLineFontSize: 64,
                maleSpeakerColor: 'blue',
                femaleSpeakerColor: 'pink',
            };

            if (lyric.text.startsWith('M:')) {
                activeColor = style.maleSpeakerColor;
            } else if (lyric.text.startsWith('F:')) {
                activeColor = style.femaleSpeakerColor;
            }

            await this.imageGenerator.generate(lyric.text, outputPath, style, nextLine, activeColor);

            process.stdout.write(`\r   Progress: ${i + 1}/${expandedLyrics.length}`);
        }
        console.log(); // New line after progress
    }

    private async exportTimestamps(expandedLyrics: Array<TimedLyric & { segmentIndex?: number }>): Promise<void> {
        const outputPath = path.join(
            this.config.outputDir,
            `timestamps.${this.config.format}`
        );

        // Use expanded lyrics (already split from planning pass)
        await this.exporter.export(expandedLyrics, outputPath, this.config.format);
    }

    private async generateVideo(expandedLyrics: Array<TimedLyric & { segmentIndex?: number }>): Promise<void> {
        const imagesDir = path.join(this.config.outputDir, 'images');
        const videoPath = path.join(this.config.outputDir, 'output.mp4');

        // Use expanded lyrics (already split from planning pass)
        await this.videoGenerator.generateSimple(
            expandedLyrics,
            imagesDir,
            this.config.audioFile,
            videoPath,
            {
                quality: this.config.videoQuality || 'high',
                fps: 30
            }
        );
    }
}
