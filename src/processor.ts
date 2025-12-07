import * as fs from 'fs';
import * as path from 'path';
import { AlignmentEngine } from './alignment';
import { ImageGenerator } from './imageGenerator';
import { TimestampExporter } from './exporter';
import { VideoGenerator } from './videoGenerator';

export interface ProcessorConfig {
    audioFile: string;
    lyricsFile: string;
    vocalFile?: string;
    instrumentalFile?: string;
    outputDir: string;
    format: 'json' | 'lrc' | 'srt';
    generateVideo?: boolean;
    videoQuality?: 'low' | 'medium' | 'high' | 'ultra';
}

export interface TimedLyric {
    index: number;
    startTime: number;  // in seconds
    endTime: number;    // in seconds
    text: string;
}

export class LyricSyncProcessor {
    private config: ProcessorConfig;
    private alignmentEngine: AlignmentEngine;
    private imageGenerator: ImageGenerator;
    private exporter: TimestampExporter;
    private videoGenerator: VideoGenerator;

    constructor(config: ProcessorConfig) {
        this.config = config;
        this.alignmentEngine = new AlignmentEngine();
        this.imageGenerator = new ImageGenerator();
        this.exporter = new TimestampExporter();
        this.videoGenerator = new VideoGenerator();
    }

    async process(): Promise<void> {
        console.log('🔄 Step 1: Reading lyrics file...');
        const lyrics = this.readLyrics();
        console.log(`   Found ${lyrics.length} lines\n`);

        console.log('🔄 Step 2: Analyzing audio and aligning lyrics...');
        const timedLyrics = await this.alignmentEngine.align(
            this.config.audioFile,
            lyrics,
            this.config.vocalFile
        );
        console.log(`   Aligned ${timedLyrics.length} lyric segments\n`);

        console.log('🔄 Step 3: Generating lyric images...');
        await this.generateImages(timedLyrics);
        console.log(`   Generated ${timedLyrics.length} images\n`);

        console.log('🔄 Step 4: Exporting timestamp data...');
        await this.exportTimestamps(timedLyrics);
        console.log('   Timestamp data exported');

        if (this.config.generateVideo) {
            console.log('\n🔄 Step 5: Generating video...');
            await this.generateVideo(timedLyrics);
            console.log('   Video generated successfully!');
        }
    }

    private readLyrics(): string[] {
        const content = fs.readFileSync(this.config.lyricsFile, 'utf-8');
        return content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }

    private async generateImages(timedLyrics: TimedLyric[]): Promise<void> {
        const imagesDir = path.join(this.config.outputDir, 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        for (const lyric of timedLyrics) {
            const filename = `lyric_${String(lyric.index).padStart(3, '0')}.png`;
            const outputPath = path.join(imagesDir, filename);
            
            await this.imageGenerator.generate(lyric.text, outputPath, {
                width: 1920,
                height: 1080,
                fontSize: 80,
                fontFamily: 'Arial',
                textColor: '#FFFFFF',
                backgroundColor: '#000000',
                padding: 80,
                useGradient: true,
                gradientColors: ['#1a1a3e', '#0f0f23'],
                textShadow: true,
                transliterationFontSize: 56,
                transliterationColor: '#AAAAAA'
            });

            process.stdout.write(`\r   Progress: ${lyric.index + 1}/${timedLyrics.length}`);
        }
        console.log(); // New line after progress
    }

    private async exportTimestamps(timedLyrics: TimedLyric[]): Promise<void> {
        const outputPath = path.join(
            this.config.outputDir,
            `timestamps.${this.config.format}`
        );

        await this.exporter.export(timedLyrics, outputPath, this.config.format);
    }

    private async generateVideo(timedLyrics: TimedLyric[]): Promise<void> {
        const imagesDir = path.join(this.config.outputDir, 'images');
        const videoPath = path.join(this.config.outputDir, 'output.mp4');

        await this.videoGenerator.generateSimple(
            timedLyrics,
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
