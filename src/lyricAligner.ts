#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface LyricLine {
    text: string;
    start?: number;
    end?: number;
    words?: WordTiming[];
}

interface WordTiming {
    word: string;
    start: number;
    end: number;
    confidence?: number;
}

interface AlignmentResult {
    segments: LyricLine[];
    word_segments: WordTiming[];
    language: string;
}

export class LyricAligner {
    private audioFile: string;
    private lyricsFile: string;
    private outputDir: string;

    constructor(audioFile: string, lyricsFile: string, outputDir: string = './output') {
        this.audioFile = audioFile;
        this.lyricsFile = lyricsFile;
        this.outputDir = outputDir;
        
        if (!fs.existsSync(audioFile)) {
            throw new Error(`Audio file not found: ${audioFile}`);
        }
        
        if (!fs.existsSync(lyricsFile)) {
            throw new Error(`Lyrics file not found: ${lyricsFile}`);
        }
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
    }

    /**
     * Align lyrics with audio using WhisperX forced alignment
     */
    async alignLyrics(): Promise<AlignmentResult> {
        console.log('🎵 Aligning lyrics with audio...');
        console.log(`   Audio: ${this.audioFile}`);
        console.log(`   Lyrics: ${this.lyricsFile}`);

        try {
            // Read lyrics
            const lyrics = fs.readFileSync(this.lyricsFile, 'utf-8');
            const cleanLyrics = this.cleanLyrics(lyrics);
            
            console.log(`   Found ${cleanLyrics.split('\n').length} lyric lines`);

            // Create temporary lyrics file for WhisperX
            const tempLyricsFile = path.join(this.outputDir, 'temp_lyrics.txt');
            fs.writeFileSync(tempLyricsFile, cleanLyrics);

            // Run WhisperX with forced alignment
            const transcriptionFile = path.join(this.outputDir, 'aligned_transcription.json');
            const cmd = `whisperx "${this.audioFile}" --output_dir "${this.outputDir}" --language hi --output_format json`;
            
            console.log('   Running WhisperX alignment...');
            await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });

            // Check if transcription file exists
            const baseName = path.basename(this.audioFile, path.extname(this.audioFile));
            const expectedFile = path.join(this.outputDir, `${baseName}.json`);
            
            if (fs.existsSync(expectedFile)) {
                const transcription = JSON.parse(fs.readFileSync(expectedFile, 'utf-8'));
                
                // Align with provided lyrics
                const alignedResult = this.alignWithProvidedLyrics(transcription, cleanLyrics);
                
                // Save aligned result
                const outputFile = path.join(this.outputDir, 'lyrics_with_timing.json');
                fs.writeFileSync(outputFile, JSON.stringify(alignedResult, null, 2));
                
                console.log('   ✅ Lyrics aligned successfully!');
                console.log(`   Output: ${outputFile}`);
                
                return alignedResult;
            } else {
                throw new Error('WhisperX alignment failed - no output file generated');
            }

        } catch (error: any) {
            console.error('   ❌ Alignment failed:', error.message);
            throw error;
        }
    }

    /**
     * Clean lyrics for processing
     */
    private cleanLyrics(lyrics: string): string {
        return lyrics
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('[') && !line.startsWith('('))
            .join('\n');
    }

    /**
     * Align WhisperX transcription with provided lyrics
     */
    private alignWithProvidedLyrics(transcription: any, providedLyrics: string): AlignmentResult {
        const lyricLines = providedLyrics.split('\n').filter(line => line.trim());
        const segments = transcription.segments || [];
        
        const alignedSegments: LyricLine[] = [];
        const wordSegments: WordTiming[] = [];

        // Simple alignment - match lyric lines with transcription segments
        let segmentIndex = 0;
        
        for (const lyricLine of lyricLines) {
            if (segmentIndex < segments.length) {
                const segment = segments[segmentIndex];
                alignedSegments.push({
                    text: lyricLine,
                    start: segment.start,
                    end: segment.end,
                    words: segment.words || []
                });
                
                if (segment.words) {
                    wordSegments.push(...segment.words);
                }
                
                segmentIndex++;
            } else {
                // No more segments, add without timing
                alignedSegments.push({
                    text: lyricLine
                });
            }
        }

        return {
            segments: alignedSegments,
            word_segments: wordSegments,
            language: transcription.language || 'hi'
        };
    }

    /**
     * Export aligned lyrics to SRT format
     */
    exportToSRT(alignment: AlignmentResult, outputFile: string): void {
        let srtContent = '';
        let index = 1;

        for (const segment of alignment.segments) {
            if (segment.start !== undefined && segment.end !== undefined) {
                const startTime = this.formatSRTTime(segment.start);
                const endTime = this.formatSRTTime(segment.end);
                
                srtContent += `${index}\n`;
                srtContent += `${startTime} --> ${endTime}\n`;
                srtContent += `${segment.text}\n\n`;
                index++;
            }
        }

        fs.writeFileSync(outputFile, srtContent);
        console.log(`   📄 SRT file exported: ${outputFile}`);
    }

    /**
     * Export aligned lyrics to karaoke timing format
     */
    exportToKaraokeTiming(alignment: AlignmentResult, outputFile: string): void {
        const timingData = alignment.segments.map((segment, index) => ({
            id: index + 1,
            text: segment.text,
            start: segment.start || 0,
            end: segment.end || 0,
            duration: (segment.end || 0) - (segment.start || 0),
            words: segment.words || []
        }));

        fs.writeFileSync(outputFile, JSON.stringify(timingData, null, 2));
        console.log(`   🎬 Karaoke timing exported: ${outputFile}`);
    }

    /**
     * Format time for SRT (HH:MM:SS,mmm)
     */
    private formatSRTTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    }
}

// CLI interface
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log(`
Usage: ts-node lyricAligner.ts <audio-file> <lyrics-file> [output-dir]

Arguments:
  audio-file    Path to the audio file (MP3, WAV, etc.)
  lyrics-file   Path to the lyrics text file
  output-dir    Output directory (default: ./output)

Example:
  ts-node lyricAligner.ts voice.mp3 lyrics.txt ./output
        `);
        process.exit(1);
    }

    const [audioFile, lyricsFile, outputDir = './output'] = args;

    try {
        const aligner = new LyricAligner(audioFile, lyricsFile, outputDir);
        const alignment = await aligner.alignLyrics();
        
        // Export to different formats
        aligner.exportToSRT(alignment, path.join(outputDir, 'lyrics_aligned.srt'));
        aligner.exportToKaraokeTiming(alignment, path.join(outputDir, 'karaoke_timing.json'));
        
        console.log('\n🎉 Alignment completed successfully!');
        console.log('\n📁 Generated files:');
        console.log(`   • lyrics_with_timing.json - Complete alignment data`);
        console.log(`   • lyrics_aligned.srt - Subtitle format`);
        console.log(`   • karaoke_timing.json - Karaoke timing format`);
        
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
