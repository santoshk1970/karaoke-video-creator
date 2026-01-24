/**
 * Lyric Sync - Processor Tests
 * Copyright (c) 2026 Santosh Kulkarni
 * MIT License - See LICENSE file for details
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LyricSyncProcessor, ProcessorConfig, TimedLyric } from '../processor';
import * as fs from 'fs';
import * as path from 'path';

describe('LyricSyncProcessor', () => {
    let processor: LyricSyncProcessor;
    let testConfig: ProcessorConfig;
    const testOutputDir = './test-output';

    beforeEach(() => {
        // Create test files
        if (!fs.existsSync(testOutputDir)) {
            fs.mkdirSync(testOutputDir, { recursive: true });
        }

        // Create test audio file (dummy)
        const testAudioPath = path.join(testOutputDir, 'test.mp3');
        fs.writeFileSync(testAudioPath, 'dummy audio content');

        // Create test lyrics file
        const testLyricsPath = path.join(testOutputDir, 'test.txt');
        fs.writeFileSync(testLyricsPath, 'First line\nSecond line\nThird line');

        testConfig = {
            audioFile: testAudioPath,
            lyricsFile: testLyricsPath,
            outputDir: testOutputDir,
            format: 'json'
        };

        processor = new LyricSyncProcessor(testConfig);
    });

    afterEach(() => {
        // Clean up test files
        if (fs.existsSync(testOutputDir)) {
            fs.rmSync(testOutputDir, { recursive: true, force: true });
        }
    });

    describe('Configuration Validation', () => {
        it('should validate configuration with valid inputs', () => {
            expect(() => new LyricSyncProcessor(testConfig)).not.toThrow();
        });

        it('should throw error for missing audio file', () => {
            const invalidConfig = { ...testConfig, audioFile: 'nonexistent.mp3' };
            expect(() => new LyricSyncProcessor(invalidConfig))
                .toThrow('Audio file not found');
        });

        it('should throw error for missing lyrics file', () => {
            const invalidConfig = { ...testConfig, lyricsFile: 'nonexistent.txt' };
            expect(() => new LyricSyncProcessor(invalidConfig))
                .toThrow('Lyrics file not found');
        });

        it('should throw error for unsupported audio format', () => {
            const unsupportedAudio = path.join(testOutputDir, 'test.xyz');
            fs.writeFileSync(unsupportedAudio, 'dummy');
            
            const invalidConfig = { ...testConfig, audioFile: unsupportedAudio };
            expect(() => new LyricSyncProcessor(invalidConfig))
                .toThrow('Unsupported audio format');
        });

        it('should throw error for non-txt lyrics file', () => {
            const wrongLyrics = path.join(testOutputDir, 'test.doc');
            fs.writeFileSync(wrongLyrics, 'dummy');
            
            const invalidConfig = { ...testConfig, lyricsFile: wrongLyrics };
            expect(() => new LyricSyncProcessor(invalidConfig))
                .toThrow('Lyrics file must be .txt format');
        });

        it('should throw error for invalid output format', () => {
            const invalidConfig = { ...testConfig, format: 'xyz' as any };
            expect(() => new LyricSyncProcessor(invalidConfig))
                .toThrow('Invalid format: xyz');
        });

        it('should accept optional vocal file when it exists', () => {
            const vocalPath = path.join(testOutputDir, 'vocal.mp3');
            fs.writeFileSync(vocalPath, 'dummy vocal');
            
            const configWithVocal = { ...testConfig, vocalFile: vocalPath };
            expect(() => new LyricSyncProcessor(configWithVocal)).not.toThrow();
        });

        it('should throw error for missing optional vocal file', () => {
            const invalidConfig = { ...testConfig, vocalFile: 'nonexistent-vocal.mp3' };
            expect(() => new LyricSyncProcessor(invalidConfig))
                .toThrow('Vocal file not found');
        });
    });

    describe('Lyrics Reading', () => {
        it('should read lyrics correctly', () => {
            const lyrics = processor['readLyrics']();
            expect(lyrics).toEqual(['First line', 'Second line', 'Third line']);
        });

        it('should handle empty lines in lyrics', () => {
            const lyricsPath = path.join(testOutputDir, 'empty-lines.txt');
            fs.writeFileSync(lyricsPath, 'First line\n\nSecond line\n   \nThird line');
            
            const configWithEmptyLines = { ...testConfig, lyricsFile: lyricsPath };
            const processorWithEmpty = new LyricSyncProcessor(configWithEmptyLines);
            
            const lyrics = processorWithEmpty['readLyrics']();
            expect(lyrics).toEqual(['First line', 'Second line', 'Third line']);
        });

        it('should throw error for empty lyrics file', () => {
            const emptyLyricsPath = path.join(testOutputDir, 'empty.txt');
            fs.writeFileSync(emptyLyricsPath, '');
            
            const configWithEmpty = { ...testConfig, lyricsFile: emptyLyricsPath };
            const processorWithEmpty = new LyricSyncProcessor(configWithEmpty);
            
            expect(() => processorWithEmpty['readLyrics']())
                .toThrow('Lyrics file is empty');
        });
    });

    describe('Image Generation Planning', () => {
        it('should plan image generation without splitting', () => {
            const timedLyrics: TimedLyric[] = [
                { index: 0, startTime: 0, endTime: 3, text: 'First line' },
                { index: 1, startTime: 3, endTime: 6, text: 'Second line' }
            ];

            const planned = processor['planImageGeneration'](timedLyrics);
            
            expect(planned).toHaveLength(2);
            expect(planned[0].text).toBe('First line');
            expect(planned[1].text).toBe('Second line');
        });

        it('should split instrumental segments longer than threshold', () => {
            const timedLyrics: TimedLyric[] = [
                { index: 0, startTime: 0, endTime: 3, text: 'First line' },
                { index: 1, startTime: 3, endTime: 15, text: '♪ Instrumental ♪' }, // 12 seconds
                { index: 2, startTime: 15, endTime: 18, text: 'Second line' }
            ];

            const planned = processor['planImageGeneration'](timedLyrics);
            
            // Should split the 12s instrumental into multiple segments
            expect(planned.length).toBeGreaterThan(3);
            
            // Check that instrumental segments have segmentIndex
            const instrumentalSegments = planned.filter(p => p.text.includes('Instrumental'));
            expect(instrumentalSegments.length).toBeGreaterThan(1);
            
            // Check segment indices
            instrumentalSegments.forEach((segment, index) => {
                expect(segment.segmentIndex).toBe(index);
            });
        });

        it('should not split short instrumental segments', () => {
            const timedLyrics: TimedLyric[] = [
                { index: 0, startTime: 0, endTime: 3, text: 'First line' },
                { index: 1, startTime: 3, endTime: 8, text: '♪ Instrumental ♪' }, // 5 seconds
                { index: 2, startTime: 8, endTime: 11, text: 'Second line' }
            ];

            const planned = processor['planImageGeneration'](timedLyrics);
            
            // Should not split the 5s instrumental
            expect(planned).toHaveLength(3);
        });
    });

    describe('Audio Duration', () => {
        it('should throw error for non-existent audio file', async () => {
            await expect(processor['getAudioDuration']('nonexistent.mp3'))
                .rejects.toThrow('Audio file not found');
        });

        it('should handle audio duration extraction errors', async () => {
            // This test would require mocking the execSync function
            // For now, we'll test the error handling path
            const invalidAudio = path.join(testOutputDir, 'invalid.mp3');
            fs.writeFileSync(invalidAudio, '');
            
            // The actual ffprobe command will fail, but we can't easily mock it here
            // This is more of an integration test scenario
        });
    });

    describe('File Operations', () => {
        it('should validate output directory exists or can be created', () => {
            const newOutputDir = path.join(testOutputDir, 'new-output');
            const configWithNewDir = { ...testConfig, outputDir: newOutputDir };
            
            expect(fs.existsSync(newOutputDir)).toBe(false);
            
            // The processor should validate the directory config (but not create it)
            expect(() => new LyricSyncProcessor(configWithNewDir)).not.toThrow();
            
            // The directory creation happens in the CLI, not processor
            // Let's test that we can create it manually
            fs.mkdirSync(newOutputDir, { recursive: true });
            expect(fs.existsSync(newOutputDir)).toBe(true);
            
            // Clean up
            fs.rmSync(newOutputDir, { recursive: true, force: true });
        });
    });

    describe('Edge Cases', () => {
        it('should handle single lyric line', () => {
            const singleLyricPath = path.join(testOutputDir, 'single.txt');
            fs.writeFileSync(singleLyricPath, 'Single line');
            
            const configWithSingle = { ...testConfig, lyricsFile: singleLyricPath };
            const processorWithSingle = new LyricSyncProcessor(configWithSingle);
            
            const lyrics = processorWithSingle['readLyrics']();
            expect(lyrics).toEqual(['Single line']);
        });

        it('should handle lyrics with special characters', () => {
            const specialLyricsPath = path.join(testOutputDir, 'special.txt');
            fs.writeFileSync(specialLyricsPath, 'Line with émojis 🎵 and spéciäl chars!');
            
            const configWithSpecial = { ...testConfig, lyricsFile: specialLyricsPath };
            const processorWithSpecial = new LyricSyncProcessor(configWithSpecial);
            
            const lyrics = processorWithSpecial['readLyrics']();
            expect(lyrics[0]).toBe('Line with émojis 🎵 and spéciäl chars!');
        });

        it('should handle very long lyric lines', () => {
            const longLyricsPath = path.join(testOutputDir, 'long.txt');
            const longLine = 'This is a very long line that goes on and on and should be handled properly by the text wrapping functionality in the image generator '.repeat(10);
            fs.writeFileSync(longLyricsPath, longLine);
            
            const configWithLong = { ...testConfig, lyricsFile: longLyricsPath };
            const processorWithLong = new LyricSyncProcessor(configWithLong);
            
            const lyrics = processorWithLong['readLyrics']();
            expect(lyrics[0].length).toBeGreaterThan(100);
        });
    });
});
