import { createCanvas, registerFont, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';

export interface ImageStyle {
    width: number;
    height: number;
    fontSize: number;
    fontFamily: string;
    textColor: string;
    backgroundColor: string;
    padding: number;
    textAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    useGradient?: boolean;
    gradientColors?: [string, string];
    textShadow?: boolean;
    transliterationFontSize?: number;
    transliterationColor?: string;
    nextLineColor?: string;
    nextLineFontSize?: number;
}

export class ImageGenerator {
    /**
     * Generate an image with the given text and optional next line preview
     */
    async generate(text: string, outputPath: string, style: ImageStyle, nextLine?: string): Promise<void> {
        const canvas = createCanvas(style.width, style.height);
        const ctx = canvas.getContext('2d');

        // Fill background with gradient or solid color
        if (style.useGradient && style.gradientColors) {
            const gradient = ctx.createLinearGradient(0, 0, 0, style.height);
            gradient.addColorStop(0, style.gradientColors[0]);
            gradient.addColorStop(1, style.gradientColors[1]);
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = style.backgroundColor;
        }
        ctx.fillRect(0, 0, style.width, style.height);

        // Add text shadow if enabled
        if (style.textShadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 4;
            ctx.shadowOffsetY = 4;
        }

        // Check if text contains transliteration (format: "Hindi | English")
        const parts = text.split('|');
        const hasTransliteration = parts.length === 2;

        if (hasTransliteration) {
            // Dual language mode
            const hindiText = parts[0].trim();
            const englishText = parts[1].trim();
            this.drawDualLanguage(ctx, hindiText, englishText, style, nextLine);
        } else {
            // Single language mode with optional next line preview
            // Set text style
            ctx.fillStyle = style.textColor;
            ctx.font = `${style.fontSize}px ${style.fontFamily}`;
            ctx.textAlign = style.textAlign || 'center';
            ctx.textBaseline = 'middle';

            // Handle multi-line text if needed
            const lines = this.wrapText(ctx, text, style.width - (style.padding * 2));
            
            // Check if we should show next line (not instrumental)
            const isInstrumental = /^[♪\s]+.*[♪\s]+$/.test(text.trim());
            const shouldShowNextLine = nextLine && !isInstrumental && !/^[♪\s]+.*[♪\s]+$/.test(nextLine.trim());
            
            // Calculate vertical position
            const lineHeight = style.fontSize * 1.2;
            const nextLineHeight = shouldShowNextLine ? (style.nextLineFontSize || style.fontSize * 0.6) * 1.2 : 0;
            const spacing = shouldShowNextLine ? 40 : 0;
            const totalHeight = lines.length * lineHeight + (shouldShowNextLine ? nextLineHeight + spacing : 0);
            let y: number;

            switch (style.verticalAlign || 'middle') {
                case 'top':
                    y = style.padding + lineHeight / 2;
                    break;
                case 'bottom':
                    y = style.height - style.padding - totalHeight + lineHeight / 2;
                    break;
                case 'middle':
                default:
                    y = (style.height - totalHeight) / 2 + lineHeight / 2;
                    break;
            }

            // Draw each line of current text with bold support (highlighted)
            const x = style.width / 2;
            for (const line of lines) {
                this.drawLineWithBold(ctx, line, x, y, style, true); // true = highlighted
                y += lineHeight;
            }
            
            // Draw next line preview if available
            if (shouldShowNextLine) {
                y += spacing;
                const nextLineFontSize = style.nextLineFontSize || style.fontSize * 0.6;
                const nextLineColor = style.nextLineColor || '#888888';
                
                ctx.fillStyle = nextLineColor;
                ctx.font = `${nextLineFontSize}px ${style.fontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Remove transliteration from next line if present
                const nextLineParts = nextLine!.split('|');
                const nextLineText = nextLineParts.length === 2 ? nextLineParts[0].trim() : nextLine!;
                
                const nextLines = this.wrapText(ctx, nextLineText, style.width - (style.padding * 2));
                for (const line of nextLines) {
                    ctx.fillText(line, x, y);
                    y += nextLineHeight;
                }
            }
        }

        // Save to file
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
    }

    /**
     * Draw dual language text (Hindi top-left, English bottom-right) with optional next line
     */
    private drawDualLanguage(ctx: CanvasRenderingContext2D, hindiText: string, englishText: string, style: ImageStyle, nextLine?: string): void {
        const padding = style.padding;
        // Horizontal offset to move text right (away from left edge)
        const xOffset = style.textShadow ? 500 : 0;
        // Vertical offset - keep minimal to stay at top
        const yOffset = style.textShadow ? 20 : 0;
        
        // Check if this is a countdown (contains only numbers and brackets)
        const isCountdown = /^[\[\]\d\s]+$/.test(hindiText.trim());
        
        if (isCountdown) {
            // For countdown, draw centered without dual language
            ctx.fillStyle = style.textColor;
            ctx.font = `${style.fontSize}px ${style.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const x = style.width / 2;
            const y = style.height / 2;
            this.drawLineWithBold(ctx, hindiText, x, y, {...style, textAlign: 'center'});
            return;
        }
        
        // Draw Hindi text (top-left)
        const hindiLines = this.wrapText(ctx, hindiText, style.width / 2 - padding * 2);
        let hindiY = padding + yOffset;
        const lineHeight = style.fontSize * 1.2;
        const hindiX = padding + xOffset;
        
        // Check if text has bold markers
        const hasBoldMarkers = /\[([^\]]+)\]/.test(hindiText);
        
        if (hasBoldMarkers) {
            // Use drawLineWithBold for bold text support
            ctx.fillStyle = style.textColor;
            ctx.font = `${style.fontSize}px ${style.fontFamily}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            
            for (const line of hindiLines) {
                this.drawLineWithBold(ctx, line, hindiX, hindiY, {...style, textAlign: 'left'});
                hindiY += lineHeight;
            }
        } else {
            // Use direct fillText for consistent alignment
            ctx.fillStyle = style.textColor;
            ctx.font = `${style.fontSize}px ${style.fontFamily}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            
            for (const line of hindiLines) {
                ctx.fillText(line, hindiX, hindiY);
                hindiY += lineHeight;
            }
        }
        
        // Draw next line preview if available (right below current Hindi lyric)
        let nextLineEnglish = '';
        if (nextLine) {
            const isInstrumental = /^[♪\s]+.*[♪\s]+$/.test(nextLine.trim());
            if (!isInstrumental) {
                // Extract Hindi and English parts from next line
                const nextLineParts = nextLine.split('|');
                const nextLineHindi = nextLineParts[0].trim();
                nextLineEnglish = nextLineParts.length === 2 ? nextLineParts[1].trim() : '';
                
                const nextLineFontSize = style.nextLineFontSize || style.fontSize * 0.8;
                const nextLineColor = style.nextLineColor || '#888888';
                
                // Add spacing before next line
                hindiY += 30;
                
                // Draw next Hindi line (left-aligned, same x position as current)
                ctx.fillStyle = nextLineColor;
                ctx.font = `${nextLineFontSize}px ${style.fontFamily}`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                
                const nextHindiLines = this.wrapText(ctx, nextLineHindi, style.width / 2 - padding * 2);
                for (const line of nextHindiLines) {
                    ctx.fillText(line, hindiX, hindiY);
                    hindiY += nextLineFontSize * 1.2;
                }
            }
        }
        
        // Draw English transliteration (bottom-right)
        // Increase font size by 25% (from 0.7 to 0.875 of main font size)
        const translitFontSize = style.transliterationFontSize ? style.transliterationFontSize * 1.25 : style.fontSize * 0.875;
        
        // Offset to move text left and up from bottom-right corner
        const englishXOffset = 100; // Move left from right edge
        const englishYOffset = 120;  // Move up from bottom edge (increased from 60)
        const englishX = style.width - padding - englishXOffset; // Fixed x position for alignment
        
        ctx.fillStyle = style.transliterationColor || '#AAAAAA';
        ctx.font = `${translitFontSize}px ${style.fontFamily}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        
        const englishLines = this.wrapText(ctx, englishText, style.width / 2 - padding * 2);
        let englishY = style.height - padding - englishYOffset - (englishLines.length - 1) * translitFontSize * 1.2;
        
        for (const line of englishLines) {
            ctx.fillText(line, englishX, englishY);
            englishY += translitFontSize * 1.2;
        }
        
        // Draw next English transliteration (bottom-right, below current English, same x position)
        if (nextLineEnglish) {
            const nextLineFontSize = style.nextLineFontSize || style.fontSize * 0.8;
            const nextEnglishFontSize = nextLineFontSize * 0.85;
            const nextLineColor = style.nextLineColor || '#888888';
            
            // Add spacing after current English
            englishY += 20;
            
            ctx.fillStyle = nextLineColor;
            ctx.font = `${nextEnglishFontSize}px ${style.fontFamily}`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            
            const nextEnglishLines = this.wrapText(ctx, nextLineEnglish, style.width / 2 - padding * 2);
            for (const line of nextEnglishLines) {
                ctx.fillText(line, englishX, englishY); // Use same englishX
                englishY += nextEnglishFontSize * 1.2;
            }
        }
    }

    /**
     * Draw a line with bold text support using [text] syntax
     */
    private drawLineWithBold(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: ImageStyle, isHighlighted: boolean = false): void {
        // Parse text for [bold] markers
        const parts: Array<{text: string, bold: boolean}> = [];
        const regex = /\[([^\]]+)\]|([^\[]+)/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            if (match[1]) {
                // Text inside [brackets] - make it bold
                parts.push({ text: match[1], bold: true });
            } else if (match[2]) {
                // Regular text
                parts.push({ text: match[2], bold: false });
            }
        }
        
        // If no brackets found, just draw the text normally
        if (parts.length === 0) {
            ctx.fillText(text, x, y);
            return;
        }
        
        // Calculate total width to center the text
        let totalWidth = 0;
        for (const part of parts) {
            const font = part.bold ? `bold ${style.fontSize}px ${style.fontFamily}` : `${style.fontSize}px ${style.fontFamily}`;
            ctx.font = font;
            totalWidth += ctx.measureText(part.text).width;
        }
        
        // Start drawing from left of center
        let currentX = x - totalWidth / 2;
        
        for (const part of parts) {
            // Increase bold text size by 50% (1.5x) instead of 20% (1.2x)
            const font = part.bold ? `bold ${style.fontSize * 1.5}px ${style.fontFamily}` : `${style.fontSize}px ${style.fontFamily}`;
            ctx.font = font;
            ctx.textAlign = 'left';
            
            // Use brighter color for bold text
            ctx.fillStyle = part.bold ? '#FFD700' : style.textColor;
            
            ctx.fillText(part.text, currentX, y);
            currentX += ctx.measureText(part.text).width;
        }
        
        // Reset styles
        ctx.fillStyle = style.textColor;
        ctx.font = `${style.fontSize}px ${style.fontFamily}`;
        ctx.textAlign = style.textAlign || 'center';
    }

    /**
     * Wrap text to fit within a given width
     */
    private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines.length > 0 ? lines : [text];
    }

    /**
     * Generate a styled image with gradient background
     */
    async generateStyled(text: string, outputPath: string): Promise<void> {
        const width = 1920;
        const height = 1080;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add text shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const lines = this.wrapText(ctx, text, width - 200);
        const lineHeight = 96;
        const totalHeight = lines.length * lineHeight;
        let y = (height - totalHeight) / 2 + lineHeight / 2;

        for (const line of lines) {
            ctx.fillText(line, width / 2, y);
            y += lineHeight;
        }

        // Save
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
    }
}
