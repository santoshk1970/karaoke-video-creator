import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { TimedLyric } from './processor';

const execAsync = promisify(exec);

export interface VideoOptions {
    width?: number;
    height?: number;
    fps?: number;
    audioFile?: string;
    backgroundColor?: string;
    format?: 'mp4' | 'webm' | 'mov';
    quality?: 'low' | 'medium' | 'high' | 'ultra';
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
        const {
            width = 1920,
            height = 1080,
            fps = 30,
            format = 'mp4',
            quality = 'high'
        } = options;

        console.log('   Creating video with FFmpeg...');

        // Strategy 1: Try concat demuxer (most efficient)
        try {
            await this.generateWithConcat(timedLyrics, imagesDir, audioFile, outputPath, options);
            return;
        } catch (error) {
            console.log('   Concat method failed, trying filter_complex...');
        }

        // Strategy 2: Use filter_complex (more flexible)
        await this.generateWithFilterComplex(timedLyrics, imagesDir, audioFile, outputPath, options);
    }

    /**
     * Generate video using concat demuxer (faster)
     */
    private async generateWithConcat(
        timedLyrics: TimedLyric[],
        imagesDir: string,
        audioFile: string,
        outputPath: string,
        options: VideoOptions
    ): Promise<void> {
        const { fps = 30 } = options;
        const tempDir = path.join(path.dirname(outputPath), 'temp_video');
        
        // Create temp directory
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Create concat file
        const concatFile = path.join(tempDir, 'concat.txt');
        const concatLines: string[] = [];

        for (const lyric of timedLyrics) {
            // Handle split segments with segmentIndex
            const lyricAny = lyric as any;
            const filename = lyricAny.segmentIndex !== undefined
                ? `lyric_${String(lyric.index).padStart(3, '0')}_seg${lyricAny.segmentIndex}.png`
                : `lyric_${String(lyric.index).padStart(3, '0')}.png`;
            const imagePath = path.resolve(path.join(imagesDir, filename));
            const duration = lyric.endTime - lyric.startTime;
            
            concatLines.push(`file '${imagePath}'`);
            concatLines.push(`duration ${duration.toFixed(3)}`);
        }

        // Add last image one more time (FFmpeg concat requirement)
        const lastLyric = timedLyrics[timedLyrics.length - 1] as any;
        const lastFilename = lastLyric.segmentIndex !== undefined
            ? `lyric_${String(lastLyric.index).padStart(3, '0')}_seg${lastLyric.segmentIndex}.png`
            : `lyric_${String(lastLyric.index).padStart(3, '0')}.png`;
        const lastImage = path.resolve(path.join(imagesDir, lastFilename));
        concatLines.push(`file '${lastImage}'`);

        fs.writeFileSync(concatFile, concatLines.join('\n'));

        // Generate video with concat
        const qualitySettings = this.getQualitySettings(options.quality || 'high');
        const command = `ffmpeg -f concat -safe 0 -i "${concatFile}" -i "${audioFile}" -c:v libx264 ${qualitySettings} -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -y "${outputPath}"`;

        console.log('   Running FFmpeg...');
        await execAsync(command);

        // Clean up
        fs.unlinkSync(concatFile);
        fs.rmdirSync(tempDir);
    }

    /**
     * Generate video using filter_complex (more control)
     */
    private async generateWithFilterComplex(
        timedLyrics: TimedLyric[],
        imagesDir: string,
        audioFile: string,
        outputPath: string,
        options: VideoOptions
    ): Promise<void> {
        const { fps = 30 } = options;
        
        // Build filter_complex for crossfading between images
        let filterComplex = '';
        let lastOutput = '[0:v]';

        for (let i = 0; i < timedLyrics.length; i++) {
            const lyric = timedLyrics[i];
            const duration = lyric.endTime - lyric.startTime;
            
            if (i === 0) {
                filterComplex += `[0:v]trim=duration=${duration},setpts=PTS-STARTPTS[v${i}];`;
            } else {
                const fadeStart = duration - 0.5; // 0.5 second crossfade
                filterComplex += `[${i}:v]trim=duration=${duration},setpts=PTS-STARTPTS[v${i}];`;
                filterComplex += `${lastOutput}[v${i}]xfade=transition=fade:duration=0.5:offset=${lyric.startTime - 0.5}[vout${i}];`;
                lastOutput = `[vout${i}]`;
            }
        }

        // This approach is complex - use the simpler concat method instead
        throw new Error('Filter complex not implemented, using concat');
    }

    /**
     * Generate video with simple image sequence (easiest method)
     */
    async generateSimple(
        timedLyrics: TimedLyric[],
        imagesDir: string,
        audioFile: string,
        outputPath: string,
        options: VideoOptions = {}
    ): Promise<void> {
        const { fps = 30, quality = 'high' } = options;

        console.log('   Using simple image sequence method...');

        // Create a temporary file list with durations
        const tempDir = path.join(path.dirname(outputPath), 'temp_video');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const concatFile = path.join(tempDir, 'images.txt');
        const lines: string[] = [];

        for (const lyric of timedLyrics) {
            const imagePath = path.join(imagesDir, `lyric_${String(lyric.index).padStart(3, '0')}.png`);
            const duration = lyric.endTime - lyric.startTime;
            
            lines.push(`file '${path.resolve(imagePath)}'`);
            lines.push(`duration ${duration.toFixed(3)}`);
        }

        // Add last image again (required by concat demuxer)
        const lastImage = path.join(imagesDir, `lyric_${String(timedLyrics.length - 1).padStart(3, '0')}.png`);
        lines.push(`file '${path.resolve(lastImage)}'`);

        fs.writeFileSync(concatFile, lines.join('\n'));

        // Debug: Show concat file contents
        console.log(`   Created concat file with ${timedLyrics.length} entries`);
        console.log(`   Concat file saved at: ${concatFile}`);
        
        // Build FFmpeg command - use absolute path for audio too
        const absoluteAudioPath = path.resolve(audioFile);
        const qualitySettings = this.getQualitySettings(quality);
        const command = [
            'ffmpeg',
            '-f concat',
            '-safe 0',
            `-i "${concatFile}"`,
            `-i "${absoluteAudioPath}"`,
            '-vsync vfr', // Variable frame rate to respect duration directives
            '-c:v libx264',
            qualitySettings,
            '-c:a aac',
            '-b:a 192k',
            '-pix_fmt yuv420p', // Compatibility
            '-shortest', // Match audio length
            '-y', // Overwrite
            `"${outputPath}"`
        ].join(' ');

        console.log('   Encoding video (this may take a while)...');
        
        try {
            const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
            
            // Keep concat file for debugging
            console.log(`   Concat file kept at: ${concatFile} (for debugging)`);
            
            // Clean up temp dir but keep concat file
            // fs.unlinkSync(concatFile);
            // if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
            //     fs.rmdirSync(tempDir);
            // }
            
            console.log('   ✓ Video created successfully!');
        } catch (error: any) {
            // Clean up on error
            if (fs.existsSync(concatFile)) fs.unlinkSync(concatFile);
            throw new Error(`FFmpeg error: ${error.message}`);
        }
    }

    /**
     * Get quality settings for FFmpeg
     */
    private getQualitySettings(quality: string): string {
        switch (quality) {
            case 'low':
                return '-preset ultrafast -crf 28';
            case 'medium':
                return '-preset medium -crf 23';
            case 'high':
                return '-preset slow -crf 20';
            case 'ultra':
                return '-preset veryslow -crf 18';
            default:
                return '-preset medium -crf 23';
        }
    }

    /**
     * Get audio duration
     */
    private async getAudioDuration(audioFile: string): Promise<number> {
        const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioFile}"`;
        const { stdout } = await execAsync(command);
        return parseFloat(stdout.trim());
    }

    /**
     * Create a video with background audio and lyric overlays
     */
    async generateWithBackground(
        timedLyrics: TimedLyric[],
        imagesDir: string,
        audioFile: string,
        backgroundImage: string,
        outputPath: string,
        options: VideoOptions = {}
    ): Promise<void> {
        console.log('   Creating video with background image...');
        
        // This would overlay lyrics on a static background
        // More complex - implement if needed
        throw new Error('Background overlay not yet implemented');
    }
}
