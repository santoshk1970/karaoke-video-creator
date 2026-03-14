/**
 * WhisperX Transcriber - Parse and process WhisperX transcription output
 * Copyright (c) 2026 Santosh Kulkarni
 * MIT License - See LICENSE file for details
 */

import * as fs from 'fs';
import * as path from 'path';
import { TimedLyric } from './processor';

export interface WhisperXWord {
    word: string;
    start: number;
    end: number;
    confidence?: number;
}

export interface WhisperXSegment {
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
    words: WhisperXWord[];
}

export interface WhisperXTranscription {
    language: string;
    language_probability: number;
    duration: number;
    all_language_probs: Array<[string, number]>;
    segments: WhisperXSegment[];
}

export interface WhisperXConfig {
    transcriptionFile: string;
    outputDir?: string;
    minWordConfidence?: number;
    mergeThreshold?: number; // seconds between segments to merge
}

export class WhisperXTranscriber {
    private config: WhisperXConfig;

    constructor(config: WhisperXConfig) {
        this.validateConfig(config);
        this.config = {
            outputDir: path.dirname(config.transcriptionFile),
            minWordConfidence: 0.5,
            mergeThreshold: 0.5,
            ...config
        };
    }

    /**
     * Load and parse WhisperX transcription file
     */
    async loadTranscription(): Promise<WhisperXTranscription> {
        console.log('📝 Loading WhisperX transcription...');
        
        if (!fs.existsSync(this.config.transcriptionFile)) {
            throw new Error(`Transcription file not found: ${this.config.transcriptionFile}`);
        }

        try {
            const content = fs.readFileSync(this.config.transcriptionFile, 'utf-8');
            const transcription: WhisperXTranscription = JSON.parse(content);
            
            this.validateTranscription(transcription);
            console.log(`   Loaded ${transcription.segments.length} segments`);
            console.log(`   Language: ${transcription.language} (${(transcription.language_probability * 100).toFixed(1)}% confidence)`);
            console.log(`   Duration: ${transcription.duration.toFixed(1)}s`);
            
            return transcription;
        } catch (error: any) {
            if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON in transcription file: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Convert WhisperX transcription to TimedLyric format
     */
    async toTimedLyrics(): Promise<TimedLyric[]> {
        const transcription = await this.loadTranscription();
        console.log('🔄 Converting to TimedLyric format...');

        // Filter segments by confidence and merge if needed
        const filteredSegments = this.filterAndMergeSegments(transcription.segments);
        
        const timedLyrics: TimedLyric[] = filteredSegments.map((segment, index) => ({
            index,
            startTime: segment.start,
            endTime: segment.end,
            text: this.cleanText(segment.text)
        }));

        console.log(`   Converted ${timedLyrics.length} timed lyrics`);
        return timedLyrics;
    }

    /**
     * Export detailed word-level timing information
     */
    async exportWordTiming(): Promise<void> {
        const transcription = await this.loadTranscription();
        const outputPath = path.join(this.config.outputDir!, 'word-timing.json');

        const wordTiming = {
            metadata: {
                language: transcription.language,
                languageProbability: transcription.language_probability,
                duration: transcription.duration,
                totalSegments: transcription.segments.length,
                totalWords: transcription.segments.reduce((sum, seg) => sum + seg.words.length, 0)
            },
            words: transcription.segments.flatMap(segment => 
                segment.words.map(word => ({
                    word: word.word,
                    start: word.start,
                    end: word.end,
                    confidence: word.confidence || 0,
                    segmentId: segment.id,
                    segmentText: segment.text.trim()
                }))
            )
        };

        fs.writeFileSync(outputPath, JSON.stringify(wordTiming, null, 2));
        console.log(`   Word timing exported to: ${outputPath}`);
    }

    /**
     * Export lyrics in various formats
     */
    async exportLyrics(format: 'json' | 'lrc' | 'srt' = 'json'): Promise<void> {
        const timedLyrics = await this.toTimedLyrics();
        const timestampExporter = await import('./exporter').then(m => new m.TimestampExporter());
        
        const outputPath = path.join(this.config.outputDir!, `whisperx-lyrics.${format}`);
        await timestampExporter.export(timedLyrics, outputPath, format);
        
        console.log(`   Lyrics exported to: ${outputPath}`);
    }

    /**
     * Filter segments by confidence and merge close segments
     */
    private filterAndMergeSegments(segments: WhisperXSegment[]): WhisperXSegment[] {
        const minConfidence = this.config.minWordConfidence!;
        const mergeThreshold = this.config.mergeThreshold!;

        // Filter segments with low confidence words
        const filteredSegments = segments.filter(segment => {
            const avgConfidence = segment.words.reduce((sum, word) => sum + (word.confidence || 0), 0) / segment.words.length;
            return avgConfidence >= minConfidence && segment.text.trim().length > 0;
        });

        // Merge segments that are very close together
        const mergedSegments: WhisperXSegment[] = [];
        let currentSegment = filteredSegments[0];

        for (let i = 1; i < filteredSegments.length; i++) {
            const nextSegment = filteredSegments[i];
            const gap = nextSegment.start - currentSegment.end;

            if (gap <= mergeThreshold) {
                // Merge with current segment
                currentSegment = {
                    ...currentSegment,
                    end: nextSegment.end,
                    text: currentSegment.text + ' ' + nextSegment.text,
                    words: [...currentSegment.words, ...nextSegment.words]
                };
            } else {
                // Push current and start new
                mergedSegments.push(currentSegment);
                currentSegment = nextSegment;
            }
        }

        if (currentSegment) {
            mergedSegments.push(currentSegment);
        }

        console.log(`   Filtered ${segments.length} → ${filteredSegments.length} segments`);
        if (mergedSegments.length !== filteredSegments.length) {
            console.log(`   Merged to ${mergedSegments.length} segments`);
        }

        return mergedSegments;
    }

    /**
     * Clean text by removing artifacts
     */
    private cleanText(text: string): string {
        return text
            .trim()
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/\[.*?\]/g, '') // Remove bracketed content
            .replace(/\(.*?\)/g, '') // Remove parenthesized content
            .replace(/[^\w\s.,!?;:'"-]/g, '') // Remove special characters except basic punctuation
            .trim();
    }

    /**
     * Validate WhisperX transcription structure
     */
    private validateTranscription(transcription: any): void {
        if (!transcription || typeof transcription !== 'object') {
            throw new Error('Invalid transcription: not an object');
        }

        if (!Array.isArray(transcription.segments)) {
            throw new Error('Invalid transcription: segments array not found');
        }

        if (typeof transcription.duration !== 'number' || transcription.duration <= 0) {
            throw new Error('Invalid transcription: invalid duration');
        }

        // Validate segment structure
        for (const segment of transcription.segments) {
            if (typeof segment.start !== 'number' || typeof segment.end !== 'number') {
                throw new Error('Invalid segment: missing start/end times');
            }
            if (segment.start >= segment.end) {
                throw new Error('Invalid segment: start time must be less than end time');
            }
            if (typeof segment.text !== 'string') {
                throw new Error('Invalid segment: missing text');
            }
            if (!Array.isArray(segment.words)) {
                throw new Error('Invalid segment: words array not found');
            }
        }
    }

    /**
     * Validate configuration
     */
    private validateConfig(config: WhisperXConfig): void {
        if (!config.transcriptionFile) {
            throw new Error('Transcription file path is required');
        }

        const ext = path.extname(config.transcriptionFile).toLowerCase();
        if (ext !== '.json') {
            throw new Error(`Transcription file must be JSON, got: ${ext}`);
        }

        if (config.minWordConfidence !== undefined && (config.minWordConfidence < 0 || config.minWordConfidence > 1)) {
            throw new Error('minWordConfidence must be between 0 and 1');
        }

        if (config.mergeThreshold !== undefined && config.mergeThreshold < 0) {
            throw new Error('mergeThreshold must be non-negative');
        }
    }

    /**
     * Get transcription statistics
     */
    async getStats(): Promise<{
        segments: number;
        words: number;
        avgWordsPerSegment: number;
        avgSegmentDuration: number;
        avgWordConfidence: number;
    }> {
        const transcription = await this.loadTranscription();
        
        const totalWords = transcription.segments.reduce((sum, seg) => sum + seg.words.length, 0);
        const totalDuration = transcription.segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
        const allWords = transcription.segments.flatMap(seg => seg.words);
        const avgConfidence = allWords.reduce((sum, word) => sum + (word.confidence || 0), 0) / allWords.length;

        return {
            segments: transcription.segments.length,
            words: totalWords,
            avgWordsPerSegment: totalWords / transcription.segments.length,
            avgSegmentDuration: totalDuration / transcription.segments.length,
            avgWordConfidence: avgConfidence
        };
    }

    /**
     * Generate a summary report
     */
    async generateReport(): Promise<void> {
        const stats = await this.getStats();
        const transcription = await this.loadTranscription();
        
        const report = {
            metadata: {
                file: this.config.transcriptionFile,
                language: transcription.language,
                languageProbability: transcription.language_probability,
                duration: transcription.duration,
                generatedAt: new Date().toISOString()
            },
            statistics: stats,
            segments: transcription.segments.map(seg => ({
                id: seg.id,
                start: seg.start,
                end: seg.end,
                duration: seg.end - seg.start,
                text: this.cleanText(seg.text),
                wordCount: seg.words.length,
                avgConfidence: seg.words.reduce((sum, word) => sum + (word.confidence || 0), 0) / seg.words.length
            }))
        };

        const outputPath = path.join(this.config.outputDir!, 'transcription-report.json');
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(`   Report exported to: ${outputPath}`);
    }
}
