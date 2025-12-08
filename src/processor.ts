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

        const INSTRUMENTAL_SPLIT_DURATION = 5; // Split instrumentals every 5 seconds
        const MIN_SPLIT_DURATION = 7; // Only split if total duration is at least 7 seconds

        for (let i = 0; i < timedLyrics.length; i++) {
            const lyric = timedLyrics[i];
            const duration = lyric.endTime - lyric.startTime;
            const isInstrumental = /^[♪\s]+.*[♪\s]+$/.test(lyric.text.trim());
            
            // Get next line if available
            const nextLine = i < timedLyrics.length - 1 ? timedLyrics[i + 1].text : undefined;
            
            // Check if we should split this instrumental segment
            if (isInstrumental && duration >= MIN_SPLIT_DURATION) {
                const numSegments = Math.ceil(duration / INSTRUMENTAL_SPLIT_DURATION);
                
                for (let seg = 0; seg < numSegments; seg++) {
                    // Generate unique filename for each segment
                    const segmentIndex = lyric.index + (seg / 100); // e.g., 5.00, 5.01, 5.02
                    const filename = `lyric_${String(lyric.index).padStart(3, '0')}_seg${seg}.png`;
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
                        gradientColors: ['#8B4513', '#2C1810'], // Warm brown to dark brown gradient
                        textShadow: true,
                        transliterationFontSize: 56,
                        transliterationColor: '#AAAAAA',
                        nextLineColor: '#888888',
                        nextLineFontSize: 64
                    }, nextLine);
                }
            } else {
                // Normal single image generation
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
                    gradientColors: ['#8B4513', '#2C1810'], // Warm brown to dark brown gradient
                    textShadow: true,
                    transliterationFontSize: 56,
                    transliterationColor: '#AAAAAA',
                    nextLineColor: '#888888',
                    nextLineFontSize: 64
                }, nextLine);
            }

            process.stdout.write(`\r   Progress: ${lyric.index + 1}/${timedLyrics.length}`);
        }
        console.log(); // New line after progress
    }

    /**
     * Split long instrumental segments into multiple shorter segments for image cycling
     * Returns extended lyrics with segmentIndex for proper image path resolution
     */
    private splitLongInstrumentals(timedLyrics: TimedLyric[]): Array<TimedLyric & { segmentIndex?: number }> {
        const INSTRUMENTAL_SPLIT_DURATION = 5;
        const MIN_SPLIT_DURATION = 7;
        const result: Array<TimedLyric & { segmentIndex?: number }> = [];

        for (const lyric of timedLyrics) {
            const duration = lyric.endTime - lyric.startTime;
            const isInstrumental = /^[♪\s]+.*[♪\s]+$/.test(lyric.text.trim());

            if (isInstrumental && duration >= MIN_SPLIT_DURATION) {
                const numSegments = Math.ceil(duration / INSTRUMENTAL_SPLIT_DURATION);
                const segmentDuration = duration / numSegments;

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
                result.push(lyric);
            }
        }

        return result;
    }

    private async exportTimestamps(timedLyrics: TimedLyric[]): Promise<void> {
        const outputPath = path.join(
            this.config.outputDir,
            `timestamps.${this.config.format}`
        );

        // Split long instrumentals for export
        const splitLyrics = this.splitLongInstrumentals(timedLyrics);
        await this.exporter.export(splitLyrics, outputPath, this.config.format);
    }

    private async generateVideo(timedLyrics: TimedLyric[]): Promise<void> {
        const imagesDir = path.join(this.config.outputDir, 'images');
        const videoPath = path.join(this.config.outputDir, 'output.mp4');

        // Split long instrumentals for video generation
        const splitLyrics = this.splitLongInstrumentals(timedLyrics);
        await this.videoGenerator.generateSimple(
            splitLyrics,
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
