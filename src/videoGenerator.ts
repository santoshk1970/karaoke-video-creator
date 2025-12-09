import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { TimedLyric } from './processor';

export interface VideoOptions {
    width?: number;
    height?: number;
    fps?: number;
    audioFile?: string;
    backgroundColor?: string;
    format?: 'mp4' | 'webm' | 'mov';
    quality?: 'low' | 'medium' | 'high' | 'ultra';
}

interface QualitySettings {
    preset: string;
    crf: number;
}

export class VideoGenerator {
    /**
     * Generate a video from timed lyrics and images
     */
    async generate(
        timedLyrics: TimedLyric[],
        imagesDir: string,
        audioFile: string,
        outputPath: string,
        options: VideoOptions = {}
    ): Promise<void> {
        // Validate inputs
        this.validateInputs(timedLyrics, imagesDir, audioFile);

        const { quality = 'high' } = options;

        console.log('   Creating video with FFmpeg...');

        // Create a temporary file list with durations
        const tempDir = path.join(path.dirname(outputPath), 'temp_video');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const concatFile = path.join(tempDir, 'images.txt');
        const lines: string[] = [];

        // Build concat file
        for (const lyric of timedLyrics) {
            // Use imagePath from lyric object (handles split segments correctly)
            const imagePath = lyric.imagePath
                ? path.join(imagesDir, path.basename(lyric.imagePath))
                : path.join(imagesDir, `lyric_${String(lyric.index).padStart(3, '0')}.png`);

            // Validate image exists
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Image not found: ${imagePath}`);
            }

            const duration = lyric.endTime - lyric.startTime;

            if (duration <= 0) {
                throw new Error(`Invalid duration for lyric ${lyric.index}: ${duration}s`);
            }

            lines.push(`file '${path.resolve(imagePath)}'`);
            lines.push(`duration ${duration.toFixed(3)}`);
        }

        // Add last image again (required by concat demuxer)
        const lastLyric = timedLyrics[timedLyrics.length - 1];
        const lastImage = lastLyric.imagePath
            ? path.join(imagesDir, path.basename(lastLyric.imagePath))
            : path.join(imagesDir, `lyric_${String(timedLyrics.length - 1).padStart(3, '0')}.png`);
        lines.push(`file '${path.resolve(lastImage)}'`);

        fs.writeFileSync(concatFile, lines.join('\n'));

        console.log(`   Created concat file with ${timedLyrics.length} entries`);

        // Build and execute FFmpeg command using fluent-ffmpeg
        const absoluteAudioPath = path.resolve(audioFile);
        const qualitySettings = this.getQualitySettings(quality);

        console.log('   Encoding video (this may take a while)...');

        try {
            await this.runFFmpeg(concatFile, absoluteAudioPath, outputPath, qualitySettings);
            console.log('   ✓ Video created successfully!');
        } catch (error: any) {
            // Clean up on error
            if (fs.existsSync(concatFile)) fs.unlinkSync(concatFile);
            throw new Error(`FFmpeg error: ${error.message}`);
        }
    }

    /**
     * Alias for generate() to maintain backward compatibility
     */
    async generateSimple(
        timedLyrics: TimedLyric[],
        imagesDir: string,
        audioFile: string,
        outputPath: string,
        options: VideoOptions = {}
    ): Promise<void> {
        return this.generate(timedLyrics, imagesDir, audioFile, outputPath, options);
    }

    /**
     * Validate inputs before processing
     */
    private validateInputs(timedLyrics: TimedLyric[], imagesDir: string, audioFile: string): void {
        if (!timedLyrics || timedLyrics.length === 0) {
            throw new Error('No timed lyrics provided');
        }

        if (!fs.existsSync(imagesDir)) {
            throw new Error(`Images directory not found: ${imagesDir}`);
        }

        if (!fs.existsSync(audioFile)) {
            throw new Error(`Audio file not found: ${audioFile}`);
        }

        // Validate audio file format
        const validExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.aac'];
        const ext = path.extname(audioFile).toLowerCase();
        if (!validExtensions.includes(ext)) {
            throw new Error(`Unsupported audio format: ${ext}. Supported: ${validExtensions.join(', ')}`);
        }
    }

    /**
     * Run FFmpeg using fluent-ffmpeg API (secure, no command injection)
     */
    private async runFFmpeg(
        concatFile: string,
        audioFile: string,
        outputPath: string,
        qualitySettings: QualitySettings
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(concatFile)
                .inputOptions(['-f concat', '-safe 0'])
                .input(audioFile)
                .videoCodec('libx264')
                .outputOptions([
                    `-preset ${qualitySettings.preset}`,
                    `-crf ${qualitySettings.crf}`,
                    '-vsync vfr', // Variable frame rate to respect duration directives
                    '-pix_fmt yuv420p', // Compatibility
                    '-shortest' // Match audio length
                ])
                .audioCodec('aac')
                .audioBitrate('192k')
                .on('start', (commandLine) => {
                    console.log('   FFmpeg command:', commandLine);
                })
                .on('progress', (progress) => {
                    if (progress.percent) {
                        process.stdout.write(`\r   Progress: ${progress.percent.toFixed(1)}%`);
                    }
                })
                .on('end', () => {
                    process.stdout.write('\n');
                    resolve();
                })
                .on('error', (err, stdout, stderr) => {
                    reject(new Error(`FFmpeg failed: ${err.message}\n${stderr}`));
                })
                .save(outputPath);
        });
    }

    /**
     * Get quality settings for FFmpeg
     */
    private getQualitySettings(quality: string): QualitySettings {
        switch (quality) {
            case 'low':
                return { preset: 'ultrafast', crf: 28 };
            case 'medium':
                return { preset: 'medium', crf: 23 };
            case 'high':
                return { preset: 'slow', crf: 20 };
            case 'ultra':
                return { preset: 'veryslow', crf: 18 };
            default:
                return { preset: 'medium', crf: 23 };
        }
    }

    /**
     * Get audio duration using fluent-ffmpeg
     */
    async getAudioDuration(audioFile: string): Promise<number> {
        if (!fs.existsSync(audioFile)) {
            throw new Error(`Audio file not found: ${audioFile}`);
        }

        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(audioFile, (err, metadata) => {
                if (err) {
                    reject(new Error(`Failed to probe audio file: ${err.message}`));
                    return;
                }

                const duration = metadata.format.duration;
                if (duration === undefined) {
                    reject(new Error('Could not determine audio duration'));
                    return;
                }

                resolve(duration);
            });
        });
    }
}
