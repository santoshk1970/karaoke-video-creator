#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

interface LyricLine {
    text: string;
    speaker?: string;
    start?: number;
    end?: number;
    words?: WordTiming[];
}

interface WordTiming {
    word: string;
    start: number;
    end: number;
    score?: number;
}

interface TranscriptionSegment {
    start: number;
    end: number;
    text: string;
    words?: WordTiming[];
}

export class SimpleLyricAligner {
    private transcriptionFile: string;
    private lyricsFile: string;
    private outputDir: string;

    constructor(transcriptionFile: string, lyricsFile: string, outputDir: string = './output') {
        this.transcriptionFile = transcriptionFile;
        this.lyricsFile = lyricsFile;
        this.outputDir = outputDir;
        
        if (!fs.existsSync(transcriptionFile)) {
            throw new Error(`Transcription file not found: ${transcriptionFile}`);
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
     * Align provided lyrics with existing transcription timing
     */
    alignLyrics(): LyricLine[] {
        console.log('🎵 Aligning lyrics with existing transcription...');
        console.log(`   Transcription: ${this.transcriptionFile}`);
        console.log(`   Lyrics: ${this.lyricsFile}`);

        try {
            // Load transcription
            const transcription: TranscriptionSegment[] = this.loadTranscription();
            console.log(`   Found ${transcription.length} transcription segments`);

            // Load and parse lyrics
            const lyrics = this.loadLyrics();
            console.log(`   Found ${lyrics.length} lyric lines`);

            // Align lyrics with transcription
            const alignedLyrics = this.performAlignment(lyrics, transcription);
            
            // Save results
            this.saveAlignedLyrics(alignedLyrics);
            this.exportToSRT(alignedLyrics);
            this.exportToKaraokeFormat(alignedLyrics);
            
            console.log('   ✅ Lyrics aligned successfully!');
            return alignedLyrics;

        } catch (error: any) {
            console.error('   ❌ Alignment failed:', error.message);
            throw error;
        }
    }

    /**
     * Load transcription from JSON file
     */
    private loadTranscription(): TranscriptionSegment[] {
        const transcriptionData = JSON.parse(fs.readFileSync(this.transcriptionFile, 'utf-8'));
        return transcriptionData.segments || [];
    }

    /**
     * Load and parse lyrics from text file
     */
    private loadLyrics(): LyricLine[] {
        const lyricsContent = fs.readFileSync(this.lyricsFile, 'utf-8');
        const lines = lyricsContent.split('\n');
        
        const lyrics: LyricLine[] = [];
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('//') && !trimmedLine.startsWith('#')) {
                // Parse speaker tags like "M:" or "F:"
                let speaker = '';
                let text = trimmedLine;
                
                const speakerMatch = trimmedLine.match(/^([MF]):\s*(.+)$/);
                if (speakerMatch) {
                    speaker = speakerMatch[1];
                    text = speakerMatch[2];
                }
                
                lyrics.push({
                    text,
                    speaker: speaker || undefined
                });
            }
        }
        
        return lyrics;
    }

    /**
     * Perform alignment between lyrics and transcription
     */
    private performAlignment(lyrics: LyricLine[], transcription: TranscriptionSegment[]): LyricLine[] {
        const alignedLyrics: LyricLine[] = [];
        
        // If we have more lyrics than transcription segments, distribute timing
        if (lyrics.length > transcription.length) {
            return this.distributeTiming(lyrics, transcription);
        }
        
        // Original alignment logic for when we have similar counts
        let transcriptionIndex = 0;
        
        for (const lyric of lyrics) {
            let bestMatch: TranscriptionSegment | null = null;
            let bestScore = 0;
            
            // Find best matching transcription segment
            for (let i = transcriptionIndex; i < transcription.length; i++) {
                const segment = transcription[i];
                const score = this.calculateSimilarity(lyric.text, segment.text);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = segment;
                }
                
                // Stop if we've gone too far in time
                if (bestMatch && (segment.start - bestMatch.start) > 10) {
                    break;
                }
            }
            
            if (bestMatch && bestScore > 0.3) { // Threshold for matching
                alignedLyrics.push({
                    text: lyric.text,
                    speaker: lyric.speaker,
                    start: bestMatch.start,
                    end: bestMatch.end,
                    words: bestMatch.words
                });
                
                // Update transcription index to avoid reusing segments
                transcriptionIndex = transcription.findIndex(s => s.start === bestMatch!.start) + 1;
            } else {
                // No good match found, add lyric without timing
                alignedLyrics.push({
                    text: lyric.text,
                    speaker: lyric.speaker
                });
            }
        }
        
        return alignedLyrics;
    }

    /**
     * Distribute transcription timing across all lyrics
     */
    private distributeTiming(lyrics: LyricLine[], transcription: TranscriptionSegment[]): LyricLine[] {
        const alignedLyrics: LyricLine[] = [];
        
        // Calculate total duration
        const totalDuration = transcription[transcription.length - 1].end - transcription[0].start;
        const startTime = transcription[0].start;
        
        // Distribute timing proportionally
        const avgDurationPerLine = totalDuration / lyrics.length;
        
        for (let i = 0; i < lyrics.length; i++) {
            const lyric = lyrics[i];
            const lyricStart = startTime + (i * avgDurationPerLine);
            const lyricEnd = lyricStart + avgDurationPerLine;
            
            // Find the best matching transcription segment for word-level timing
            const matchingSegment = this.findBestMatchingSegment(lyric, transcription);
            
            alignedLyrics.push({
                text: lyric.text,
                speaker: lyric.speaker,
                start: lyricStart,
                end: lyricEnd,
                words: matchingSegment?.words
            });
        }
        
        return alignedLyrics;
    }

    /**
     * Find the best matching transcription segment for a lyric line
     */
    private findBestMatchingSegment(lyric: LyricLine, transcription: TranscriptionSegment[]): TranscriptionSegment | null {
        let bestMatch: TranscriptionSegment | null = null;
        let bestScore = 0;
        
        for (const segment of transcription) {
            const score = this.calculateSimilarity(lyric.text, segment.text);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = segment;
            }
        }
        
        return bestMatch && bestScore > 0.2 ? bestMatch : null;
    }

    /**
     * Calculate similarity between two text strings
     */
    private calculateSimilarity(text1: string, text2: string): number {
        // Simple similarity based on common words
        const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        
        if (words1.length === 0 || words2.length === 0) return 0;
        
        const commonWords = words1.filter(word => words2.some(w => w.includes(word) || word.includes(w)));
        const similarity = commonWords.length / Math.max(words1.length, words2.length);
        
        return similarity;
    }

    /**
     * Save aligned lyrics to JSON
     */
    private saveAlignedLyrics(alignedLyrics: LyricLine[]): void {
        const outputFile = path.join(this.outputDir, 'aligned_lyrics.json');
        fs.writeFileSync(outputFile, JSON.stringify(alignedLyrics, null, 2));
        console.log(`   📄 Aligned lyrics saved: ${outputFile}`);
    }

    /**
     * Export to SRT format
     */
    private exportToSRT(alignedLyrics: LyricLine[]): void {
        let srtContent = '';
        let index = 1;

        for (const lyric of alignedLyrics) {
            if (lyric.start !== undefined && lyric.end !== undefined) {
                const startTime = this.formatSRTTime(lyric.start);
                const endTime = this.formatSRTTime(lyric.end);
                
                srtContent += `${index}\n`;
                srtContent += `${startTime} --> ${endTime}\n`;
                srtContent += `${lyric.text}\n\n`;
                index++;
            }
        }

        const srtFile = path.join(this.outputDir, 'aligned_lyrics.srt');
        fs.writeFileSync(srtFile, srtContent);
        console.log(`   📄 SRT file exported: ${srtFile}`);
    }

    /**
     * Export to karaoke timing format
     */
    private exportToKaraokeFormat(alignedLyrics: LyricLine[]): void {
        const timingData = alignedLyrics.map((lyric, index) => ({
            id: index + 1,
            text: lyric.text,
            speaker: lyric.speaker,
            start: lyric.start || 0,
            end: lyric.end || 0,
            duration: (lyric.end || 0) - (lyric.start || 0),
            words: lyric.words || []
        }));

        const karaokeFile = path.join(this.outputDir, 'karaoke_timing.json');
        fs.writeFileSync(karaokeFile, JSON.stringify(timingData, null, 2));
        console.log(`   🎬 Karaoke timing exported: ${karaokeFile}`);
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
Usage: ts-node simpleLyricAligner.ts <transcription-file> <lyrics-file> [output-dir]

Arguments:
  transcription-file  Path to the WhisperX transcription JSON file
  lyrics-file         Path to the lyrics text file
  output-dir          Output directory (default: ./output)

Example:
  ts-node simpleLyricAligner.ts ./transcription/merineendovoice-demucs.json ./lyrics.txt ./output
        `);
        process.exit(1);
    }

    const [transcriptionFile, lyricsFile, outputDir = './output'] = args;

    try {
        const aligner = new SimpleLyricAligner(transcriptionFile, lyricsFile, outputDir);
        const alignedLyrics = aligner.alignLyrics();
        
        console.log('\n🎉 Alignment completed successfully!');
        console.log('\n📁 Generated files:');
        console.log(`   • aligned_lyrics.json - Complete alignment data`);
        console.log(`   • aligned_lyrics.srt - Subtitle format`);
        console.log(`   • karaoke_timing.json - Karaoke timing format`);
        
        console.log('\n📊 Alignment Summary:');
        const withTiming = alignedLyrics.filter(l => l.start !== undefined).length;
        const withoutTiming = alignedLyrics.length - withTiming;
        console.log(`   • Lines with timing: ${withTiming}`);
        console.log(`   • Lines without timing: ${withoutTiming}`);
        console.log(`   • Total lines: ${alignedLyrics.length}`);
        
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
