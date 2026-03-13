/**
 * Lyric Sync - Image Generator Tests
 * Copyright (c) 2026 Santosh Kulkarni
 * MIT License - See LICENSE file for details
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageGenerator, ImageStyle } from '../imageGenerator';

// Mock Canvas to avoid installation issues
const mockContext = {
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
    })),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    drawImage: vi.fn(),
};

vi.mock('canvas', () => ({
    createCanvas: vi.fn(() => ({
        getContext: vi.fn(() => mockContext),
        toBuffer: vi.fn(() => Buffer.from('fake-image-data')),
    })),
    registerFont: vi.fn(),
    loadImage: vi.fn(() => Promise.resolve({
        width: 1920,
        height: 1080,
    })),
}));

// Mock fs to avoid file system dependency issues
vi.mock('fs', () => ({
    writeFileSync: vi.fn(),
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn(() => []),
    readFileSync: vi.fn(() => 'fake content')
}));

describe('ImageGenerator', () => {
    const baseStyle: ImageStyle = {
        width: 1920,
        height: 1080,
        fontSize: 80,
        fontFamily: 'Arial',
        textColor: '#FFFFFF',
        backgroundColor: '#000000',
        padding: 80,
    };
    let generator: ImageGenerator;

    beforeEach(() => {
        vi.clearAllMocks();
        generator = new ImageGenerator();
    });

    describe('Constructor', () => {
        it('should create an instance without errors', () => {
            expect(generator).toBeInstanceOf(ImageGenerator);
        });
    });

    describe('Text Processing', () => {
        it('should process text wrapping logic', async () => {
            await expect(generator.generate('This is a test', '/fake/path.png', baseStyle))
                .resolves.not.toThrow();
        });

        it('should handle empty text', async () => {
            await expect(generator.generate('', '/fake/path.png', baseStyle))
                .resolves.not.toThrow();
        });

        it('should handle dual language text format', async () => {
            await expect(generator.generate('हिंदी | English', '/fake/path.png', baseStyle))
                .resolves.not.toThrow();
        });
    });

    describe('Speaker Color Handling', () => {
        it('should use blue for male speaker prefix M:', async () => {
            await generator.generate('M: This is a male voice', '/fake/path.png', baseStyle);
            expect(mockContext.fillStyle).toBe('blue');
        });

        it('should use pink for female speaker prefix F:', async () => {
            await generator.generate('F: This is a female voice', '/fake/path.png', baseStyle);
            expect(mockContext.fillStyle).toBe('pink');
        });

        it('should use custom male speaker color if provided', async () => {
            const customStyle = { ...baseStyle, maleSpeakerColor: '#0000FF' };
            await generator.generate('M: Custom male color', '/fake/path.png', customStyle);
            expect(mockContext.fillStyle).toBe('#0000FF');
        });

        it('should use custom female speaker color if provided', async () => {
            const customStyle = { ...baseStyle, femaleSpeakerColor: '#FFC0CB' };
            await generator.generate('F: Custom female color', '/fake/path.png', customStyle);
            expect(mockContext.fillStyle).toBe('#FFC0CB');
        });

        it('should use default text color when no prefix is present', async () => {
            await generator.generate('This is a neutral voice', '/fake/path.png', baseStyle);
            expect(mockContext.fillStyle).toBe(baseStyle.textColor);
        });
    });

    describe('Style Processing', () => {
        it('should handle gradient styles', async () => {
            const style: ImageStyle = {
                ...baseStyle,
                useGradient: true,
                gradientColors: ['#FF0000', '#0000FF']
            };

            await expect(generator.generate('Test', '/fake/path.png', style))
                .resolves.not.toThrow();
        });

        it('should handle text shadow styles', async () => {
            const style: ImageStyle = {
                ...baseStyle,
                textShadow: true
            };

            await expect(generator.generate('Test', '/fake/path.png', style))
                .resolves.not.toThrow();
        });

        it('should handle different text alignments', async () => {
            const alignments: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
            
            for (const align of alignments) {
                const style: ImageStyle = {
                    ...baseStyle,
                    textAlign: align
                };

                await expect(generator.generate('Test', '/fake/path.png', style))
                    .resolves.not.toThrow();
            }
        });

        it('should handle different vertical alignments', async () => {
            const alignments: Array<'top' | 'middle' | 'bottom'> = ['top', 'middle', 'bottom'];
            
            for (const align of alignments) {
                const style: ImageStyle = {
                    ...baseStyle,
                    verticalAlign: align
                };

                await expect(generator.generate('Test', '/fake/path.png', style))
                    .resolves.not.toThrow();
            }
        });
    });

    describe('Special Text Handling', () => {
        it('should handle instrumental text markers', async () => {
            await expect(generator.generate('♪ Instrumental ♪', '/fake/path.png', baseStyle))
                .resolves.not.toThrow();
        });

        it('should handle countdown text format', async () => {
            await expect(generator.generate('[4] |', '/fake/path.png', baseStyle))
                .resolves.not.toThrow();
        });

        it('should handle bold text markers', async () => {
            await expect(generator.generate('Normal [Bold] Normal', '/fake/path.png', baseStyle))
                .resolves.not.toThrow();
        });
    });

    describe('Next Line Preview', () => {
        it('should handle next line preview', async () => {
            const style: ImageStyle = {
                ...baseStyle,
                nextLineColor: '#888888',
                nextLineFontSize: 32
            };

            await expect(generator.generate('Current Line', '/fake/path.png', style, 'Next Line'))
                .resolves.not.toThrow();
        });

        it('should handle next line with dual language', async () => {
            const style: ImageStyle = {
                ...baseStyle,
                nextLineColor: '#888888',
                nextLineFontSize: 64
            };

            await expect(generator.generate('Current हिंदी | English', '/fake/path.png', style, 'Next हिंदी | English'))
                .resolves.not.toThrow();
        });
    });

    describe('Styled Image Generation', () => {
        it('should generate styled image with default settings', async () => {
            await expect(generator.generateStyled('Styled Text', '/fake/path.png'))
                .resolves.not.toThrow();
        });
    });

    describe('Error Handling', () => {
        it('should handle very small dimensions', async () => {
            const style: ImageStyle = {
                ...baseStyle,
                width: 100,
                height: 100,
                fontSize: 12,
                padding: 5
            };

            await expect(generator.generate('Small', '/fake/path.png', style))
                .resolves.not.toThrow();
        });

        it('should handle very large dimensions', async () => {
            const style: ImageStyle = {
                ...baseStyle,
                width: 4000,
                height: 3000,
                fontSize: 200,
                padding: 100
            };

            await expect(generator.generate('Large', '/fake/path.png', style))
                .resolves.not.toThrow();
        });
    });
});
