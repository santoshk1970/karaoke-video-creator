import { TimedLyric } from './processor';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export class AlignmentEngine {
    /**
     * Align lyrics to audio using multiple strategies
     * 
     * Strategy 1: Use ffmpeg to detect silence and estimate timing
     * Strategy 2: Simple time-based distribution as fallback
     */
    async align(
        audioFile: string,
        lyrics: string[],
        vocalFile?: string
    ): Promise<TimedLyric[]> {
        // Validate inputs
        this.validateInputs(audioFile, lyrics, vocalFile);

        console.log('   Checking for alignment tools...');

        // Try to use ffmpeg for audio analysis
        try {
            return await this.alignWithFFmpeg(audioFile, lyrics, vocalFile);
        } catch (error: any) {
            console.log('   ⚠️  FFmpeg analysis failed, using time-based distribution...');
            console.log(`      Reason: ${error.message}`);
        }

        // Fallback: Simple time-based distribution
        return this.alignSimple(audioFile, lyrics);
    }

    /**
     * Validate alignment inputs
     */
    private validateInputs(audioFile: string, lyrics: string[], vocalFile?: string): void {
        // Validate audio file
        if (!audioFile) {
            throw new Error('Audio file path is required');
        }
        if (!fs.existsSync(audioFile)) {
            throw new Error(`Audio file not found: ${audioFile}`);
        }
        const audioExt = path.extname(audioFile).toLowerCase();
        const validExts = ['.mp3', '.wav', '.m4a', '.flac', '.aac'];
        if (!validExts.includes(audioExt)) {
            throw new Error(`Unsupported audio format: ${audioExt}`);
        }

        // Validate lyrics
        if (!lyrics || !Array.isArray(lyrics)) {
            throw new Error('Lyrics must be a non-empty array');
        }
        if (lyrics.length === 0) {
            throw new Error('Lyrics array is empty');
        }
        if (lyrics.some(lyric => typeof lyric !== 'string')) {
            throw new Error('All lyrics must be strings');
        }

        // Validate optional vocal file
        if (vocalFile) {
            if (!fs.existsSync(vocalFile)) {
                throw new Error(`Vocal file not found: ${vocalFile}`);
            }
            const vocalExt = path.extname(vocalFile).toLowerCase();
            if (!validExts.includes(vocalExt)) {
                throw new Error(`Unsupported vocal file format: ${vocalExt}`);
            }
        }
    }

    /**
     * Use ffmpeg to analyze audio and estimate timing
     */
    private async alignWithFFmpeg(
        audioFile: string,
        lyrics: string[],
        vocalFile?: string
    ): Promise<TimedLyric[]> {
        console.log('   Analyzing audio with FFmpeg...');

        // Get audio duration
        const duration = await this.getAudioDuration(audioFile);

        // Detect silence periods (potential line breaks)
        const silencePeriods = await this.detectSilence(vocalFile || audioFile);

        // Distribute lyrics based on silence detection
        return this.distributeBysilence(lyrics, duration, silencePeriods);
    }

    /**
     * Get audio duration using ffprobe
     */
    private async getAudioDuration(audioFile: string): Promise<number> {
        if (!fs.existsSync(audioFile)) {
            throw new Error(`Audio file not found: ${audioFile}`);
        }

        // Sanitize file path to prevent command injection
        const sanitizedAudioFile = audioFile.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
        const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${sanitizedAudioFile}"`;
        const { stdout } = await execAsync(command);
        const duration = parseFloat(stdout.trim());

        if (isNaN(duration) || duration <= 0) {
            throw new Error(`Invalid audio duration: ${duration}`);
        }

        return duration;
    }

    /**
     * Detect silence periods in audio
     */
    private async detectSilence(audioFile: string): Promise<Array<{ start: number; end: number }>> {
        const command = `ffmpeg -i "${audioFile}" -af silencedetect=noise=-30dB:d=0.5 -f null - 2>&1 | grep silence`;

        try {
            const { stdout } = await execAsync(command);
            const lines = stdout.split('\n');
            const silences: Array<{ start: number; end: number }> = [];

            let currentSilence: { start?: number; end?: number } = {};

            for (const line of lines) {
                const startMatch = line.match(/silence_start: ([\d.]+)/);
                const endMatch = line.match(/silence_end: ([\d.]+)/);

                if (startMatch) {
                    currentSilence.start = parseFloat(startMatch[1]);
                }
                if (endMatch && currentSilence.start !== undefined) {
                    currentSilence.end = parseFloat(endMatch[1]);
                    silences.push(currentSilence as { start: number; end: number });
                    currentSilence = {};
                }
            }

            return silences;
        } catch {
            return [];
        }
    }

    /**
     * Distribute lyrics based on detected silence periods
     */
    private distributeBysilence(
        lyrics: string[],
        duration: number,
        silences: Array<{ start: number; end: number }>
    ): TimedLyric[] {
        // If not enough silences or silences don't make sense, use even distribution
        if (silences.length === 0 || silences.length < lyrics.length / 2) {
            console.log(`   Not enough silences detected (${silences.length}), using even distribution`);
            return this.distributeEvenly(lyrics, duration);
        }

        // Use silence periods as boundaries
        const timedLyrics: TimedLyric[] = [];
        let currentTime = 0;

        for (let i = 0; i < lyrics.length; i++) {
            const nextSilence = silences[i] || { start: duration, end: duration };

            // Sanity check: if duration is 0 or negative, use even distribution
            if (nextSilence.start <= currentTime) {
                console.log(`   Invalid silence timing detected, using even distribution`);
                return this.distributeEvenly(lyrics, duration);
            }

            timedLyrics.push({
                index: i,
                startTime: currentTime,
                endTime: nextSilence.start,
                text: lyrics[i]
            });

            currentTime = nextSilence.end;
        }

        return timedLyrics;
    }

    /**
     * Simple fallback: distribute lyrics evenly across audio duration
     */
    private async alignSimple(audioFile: string, lyrics: string[]): Promise<TimedLyric[]> {
        console.log('   Using simple time-based distribution...');

        const duration = await this.getAudioDuration(audioFile);
        return this.distributeEvenly(lyrics, duration);
    }

    /**
     * Distribute lyrics evenly
     */
    private distributeEvenly(lyrics: string[], duration: number): TimedLyric[] {
        const timePerLine = duration / lyrics.length;

        return lyrics.map((text, index) => ({
            index,
            startTime: index * timePerLine,
            endTime: (index + 1) * timePerLine,
            text
        }));
    }
}
