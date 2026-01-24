/**
 * Lyric Sync - Timestamp Exporter Tests
 * Copyright (c) 2026 Santosh Kulkarni
 * MIT License - See LICENSE file for details
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TimestampExporter } from '../exporter';
import * as fs from 'fs';
import * as path from 'path';

describe('TimestampExporter', () => {
    let exporter: TimestampExporter;
    const testOutputDir = './test-output';

    beforeEach(() => {
        exporter = new TimestampExporter();
        // Ensure test output directory exists
        if (!fs.existsSync(testOutputDir)) {
            fs.mkdirSync(testOutputDir, { recursive: true });
        }
    });

    afterEach(() => {
        // Clean up test files
        if (fs.existsSync(testOutputDir)) {
            fs.rmSync(testOutputDir, { recursive: true, force: true });
        }
    });

    describe('JSON Export', () => {
        it('should export timestamps in JSON format', async () => {
            const lyrics = [
                { index: 0, startTime: 0.0, endTime: 3.5, text: 'First line' },
                { index: 1, startTime: 3.5, endTime: 7.0, text: 'Second line' },
                { index: 2, startTime: 7.0, endTime: 10.5, text: 'Third line' }
            ];

            const outputPath = path.join(testOutputDir, 'test.json');
            await exporter.export(lyrics, outputPath, 'json');

            expect(fs.existsSync(outputPath)).toBe(true);
            
            const content = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
            expect(content.version).toBe('1.0');
            expect(content.metadata).toBeDefined();
            expect(content.lyrics).toHaveLength(3);
            expect(content.lyrics[0].text).toBe('First line');
            expect(content.lyrics[0].startTime).toBe(0.0);
            expect(content.lyrics[0].endTime).toBe(3.5);
        });

        it('should include metadata in JSON export', async () => {
            const lyrics = [
                { index: 0, startTime: 0.0, endTime: 3.5, text: 'Test line' }
            ];

            const outputPath = path.join(testOutputDir, 'test-metadata.json');
            await exporter.export(lyrics, outputPath, 'json');

            const content = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
            expect(content.metadata.generatedAt).toBeDefined();
            expect(content.metadata.totalLines).toBe(1);
            expect(content.metadata.duration).toBe(3.5);
        });
    });

    describe('LRC Export', () => {
        it('should export timestamps in LRC format', async () => {
            const lyrics = [
                { index: 0, startTime: 12.5, endTime: 16.0, text: 'Test line' },
                { index: 1, startTime: 16.0, endTime: 20.5, text: 'Second line' }
            ];

            const outputPath = path.join(testOutputDir, 'test.lrc');
            await exporter.export(lyrics, outputPath, 'lrc');

            expect(fs.existsSync(outputPath)).toBe(true);
            
            const content = fs.readFileSync(outputPath, 'utf-8');
            expect(content).toContain('[ar:Unknown Artist]');
            expect(content).toContain('[al:Unknown Album]');
            expect(content).toContain('[by:Lyric Sync]');
            expect(content).toContain('[00:12.50]Test line');
            expect(content).toContain('[00:16.00]Second line');
        });

        it('should format LRC timestamps correctly', async () => {
            const lyrics = [
                { index: 0, startTime: 65.75, endTime: 70.25, text: 'Minute test' }
            ];

            const outputPath = path.join(testOutputDir, 'test-time.lrc');
            await exporter.export(lyrics, outputPath, 'lrc');

            const content = fs.readFileSync(outputPath, 'utf-8');
            expect(content).toContain('[01:05.75]Minute test');
        });
    });

    describe('SRT Export', () => {
        it('should export timestamps in SRT format', async () => {
            const lyrics = [
                { index: 0, startTime: 2.5, endTime: 6.0, text: 'First subtitle' },
                { index: 1, startTime: 6.5, endTime: 10.0, text: 'Second subtitle' }
            ];

            const outputPath = path.join(testOutputDir, 'test.srt');
            await exporter.export(lyrics, outputPath, 'srt');

            expect(fs.existsSync(outputPath)).toBe(true);
            
            const content = fs.readFileSync(outputPath, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim());
            
            expect(lines[0]).toBe('1');
            expect(lines[1]).toBe('00:00:02,500 --> 00:00:06,000');
            expect(lines[2]).toBe('First subtitle');
            
            expect(lines[3]).toBe('2');
            expect(lines[4]).toBe('00:00:06,500 --> 00:00:10,000');
            expect(lines[5]).toBe('Second subtitle');
        });

        it('should handle edge cases in SRT format', async () => {
            const lyrics = [
                { index: 0, startTime: 0.0, endTime: 1.0, text: 'Start' },
                { index: 1, startTime: 3661.5, endTime: 3665.0, text: 'Over an hour' }
            ];

            const outputPath = path.join(testOutputDir, 'test-edge.srt');
            await exporter.export(lyrics, outputPath, 'srt');

            const content = fs.readFileSync(outputPath, 'utf-8');
            expect(content).toContain('00:00:00,000 --> 00:00:01,000');
            expect(content).toContain('01:01:01,500 --> 01:01:05,000');
        });
    });

    describe('Error Handling', () => {
        it('should throw error for unsupported format', async () => {
            const lyrics = [
                { index: 0, startTime: 0.0, endTime: 3.5, text: 'Test' }
            ];

            const outputPath = path.join(testOutputDir, 'test.xyz');
            
            await expect(exporter.export(lyrics, outputPath, 'xyz' as any))
                .rejects.toThrow('Unsupported format: xyz');
        });

        it('should handle empty lyrics array', async () => {
            const outputPath = path.join(testOutputDir, 'empty.json');
            await exporter.export([], outputPath, 'json');

            const content = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
            expect(content.lyrics).toHaveLength(0);
            expect(content.metadata.totalLines).toBe(0);
        });
    });
});
