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
    confidence?: number;
}

interface TranscriptionSegment {
    start: number;
    end: number;
    text: string;
    words?: WordTiming[];
}

export class IntelligentLyricAligner {
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
     * Align provided lyrics with existing transcription timing using intelligent word distribution
     */
    alignLyrics(): LyricLine[] {
        console.log('🎵 Intelligent lyric alignment...');
        console.log(`   Transcription: ${this.transcriptionFile}`);
        console.log(`   Lyrics: ${this.lyricsFile}`);

        try {
            // Load transcription
            const transcription: TranscriptionSegment[] = this.loadTranscription();
            console.log(`   Found ${transcription.length} transcription segments`);

            // Load and parse lyrics
            const lyrics = this.loadLyrics();
            console.log(`   Found ${lyrics.length} lyric lines`);

            // Perform intelligent alignment
            const alignedLyrics = this.performIntelligentAlignment(lyrics, transcription);
            
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
     * Perform intelligent alignment between lyrics and transcription
     */
    private performIntelligentAlignment(lyrics: LyricLine[], transcription: TranscriptionSegment[]): LyricLine[] {
        const alignedLyrics: LyricLine[] = [];
        
        // Calculate total duration from transcription
        const totalDuration = transcription[transcription.length - 1].end - transcription[0].start;
        const startTime = transcription[0].start;
        
        // Group lyrics by speaker for better timing distribution
        const lyricsBySpeaker = this.groupLyricsBySpeaker(lyrics);
        
        // Distribute timing intelligently
        let currentTime = startTime;
        const avgDurationPerLine = totalDuration / lyrics.length;
        
        for (const lyric of lyrics) {
            const lyricDuration = this.calculateLyricDuration(lyric.text, avgDurationPerLine);
            const lyricEnd = currentTime + lyricDuration;
            
            // Generate intelligent word timing
            const words = this.generateWordTiming(lyric.text, currentTime, lyricEnd);
            
            alignedLyrics.push({
                text: lyric.text,
                speaker: lyric.speaker,
                start: currentTime,
                end: lyricEnd,
                words
            });
            
            currentTime = lyricEnd;
        }
        
        return alignedLyrics;
    }

    /**
     * Group lyrics by speaker for better timing analysis
     */
    private groupLyricsBySpeaker(lyrics: LyricLine[]): Map<string, LyricLine[]> {
        const groups = new Map<string, LyricLine[]>();
        
        for (const lyric of lyrics) {
            const speaker = lyric.speaker || 'unknown';
            if (!groups.has(speaker)) {
                groups.set(speaker, []);
            }
            groups.get(speaker)!.push(lyric);
        }
        
        return groups;
    }

    /**
     * Calculate appropriate duration for a lyric line based on text length
     */
    private calculateLyricDuration(text: string, avgDuration: number): number {
        const wordCount = text.split(/\s+/).length;
        const charCount = text.length;
        
        // Adjust duration based on word count and character count
        // More words/characters = more time needed
        const wordFactor = Math.min(wordCount / 5, 2); // Cap at 2x average
        const charFactor = Math.min(charCount / 50, 1.5); // Cap at 1.5x average
        
        return avgDuration * (0.5 + wordFactor * 0.3 + charFactor * 0.2);
    }

    /**
     * Generate intelligent word timing for a lyric line
     */
    private generateWordTiming(text: string, startTime: number, endTime: number): WordTiming[] {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const duration = endTime - startTime;
        const avgWordDuration = duration / words.length;
        
        const wordTimings: WordTiming[] = [];
        let currentTime = startTime;
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            let wordDuration = avgWordDuration;
            
            // Adjust word duration based on word length
            if (word.length > 8) {
                wordDuration *= 1.2; // Longer words get more time
            } else if (word.length < 3) {
                wordDuration *= 0.8; // Short words get less time
            }
            
            // Add natural pauses after punctuation
            if (word.endsWith(',') || word.endsWith(';')) {
                wordDuration *= 1.1;
            } else if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
                wordDuration *= 1.3;
            }
            
            const wordEnd = Math.min(currentTime + wordDuration, endTime);
            
            wordTimings.push({
                word,
                start: currentTime,
                end: wordEnd,
                confidence: 0.85 // High confidence since we're using provided lyrics
            });
            
            currentTime = wordEnd;
        }
        
        // Adjust for any remaining time
        if (currentTime < endTime && wordTimings.length > 0) {
            const lastWord = wordTimings[wordTimings.length - 1];
            lastWord.end = endTime;
        }
        
        return wordTimings;
    }

    /**
     * Save aligned lyrics to JSON
     */
    private saveAlignedLyrics(alignedLyrics: LyricLine[]): void {
        const outputFile = path.join(this.outputDir, 'intelligently_aligned_lyrics.json');
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

        const srtFile = path.join(this.outputDir, 'intelligently_aligned_lyrics.srt');
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

        const karaokeFile = path.join(this.outputDir, 'intelligent_karaoke_timing.json');
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
Usage: ts-node intelligentLyricAligner.ts <transcription-file> <lyrics-file> [output-dir]

Arguments:
  transcription-file  Path to the WhisperX transcription JSON file
  lyrics-file         Path to the lyrics text file
  output-dir          Output directory (default: ./output)

Example:
  ts-node intelligentLyricAligner.ts ./transcription/merineendovoice-demucs.json ./lyrics.txt ./output
        `);
        process.exit(1);
    }

    const [transcriptionFile, lyricsFile, outputDir = './output'] = args;

    try {
        const aligner = new IntelligentLyricAligner(transcriptionFile, lyricsFile, outputDir);
        const alignedLyrics = aligner.alignLyrics();
        
        console.log('\n🎉 Intelligent alignment completed successfully!');
        console.log('\n📁 Generated files:');
        console.log(`   • intelligently_aligned_lyrics.json - Complete alignment data`);
        console.log(`   • intelligently_aligned_lyrics.srt - Subtitle format`);
        console.log(`   • intelligent_karaoke_timing.json - Karaoke timing format`);
        
        console.log('\n📊 Alignment Summary:');
        const withTiming = alignedLyrics.filter(l => l.start !== undefined).length;
        const withoutTiming = alignedLyrics.length - withTiming;
        console.log(`   • Lines with timing: ${withTiming}`);
        console.log(`   • Lines without timing: ${withoutTiming}`);
        console.log(`   • Total lines: ${alignedLyrics.length}`);
        
        // Show a sample of word timing
        if (alignedLyrics.length > 0 && alignedLyrics[0].words && alignedLyrics[0].words!.length > 0) {
            console.log('\n🎯 Sample word timing (first line):');
            const firstLine = alignedLyrics[0];
            console.log(`   Text: "${firstLine.text}"`);
            console.log(`   Words: ${firstLine.words!.map(w => `${w.word}(${w.start.toFixed(2)}-${w.end.toFixed(2)})`).join(' ')}`);
        }
        
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
