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
}

export class ImageGenerator {
    /**
     * Generate an image with the given text
     */
    async generate(text: string, outputPath: string, style: ImageStyle): Promise<void> {
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
            this.drawDualLanguage(ctx, hindiText, englishText, style);
        } else {
            // Single language mode (original behavior)
            // Set text style
            ctx.fillStyle = style.textColor;
            ctx.font = `${style.fontSize}px ${style.fontFamily}`;
            ctx.textAlign = style.textAlign || 'center';
            ctx.textBaseline = 'middle';

            // Handle multi-line text if needed
            const lines = this.wrapText(ctx, text, style.width - (style.padding * 2));
            
            // Calculate vertical position
            const lineHeight = style.fontSize * 1.2;
            const totalHeight = lines.length * lineHeight;
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

            // Draw each line with bold support
            const x = style.width / 2;
            for (const line of lines) {
                this.drawLineWithBold(ctx, line, x, y, style);
                y += lineHeight;
            }
        }

        // Save to file
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
    }

    /**
     * Draw dual language text (Hindi top-left, English bottom-right)
     */
    private drawDualLanguage(ctx: CanvasRenderingContext2D, hindiText: string, englishText: string, style: ImageStyle): void {
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
        ctx.fillStyle = style.textColor;
        ctx.font = `${style.fontSize}px ${style.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const hindiLines = this.wrapText(ctx, hindiText, style.width / 2 - padding * 2);
        let hindiY = padding + yOffset;
        const lineHeight = style.fontSize * 1.2;
        
        for (const line of hindiLines) {
            this.drawLineWithBold(ctx, line, padding + xOffset, hindiY, {...style, textAlign: 'left'});
            hindiY += lineHeight;
        }
        
        // Draw English transliteration (bottom-right)
        // Increase font size by 25% (from 0.7 to 0.875 of main font size)
        const translitFontSize = style.transliterationFontSize ? style.transliterationFontSize * 1.25 : style.fontSize * 0.875;
        ctx.fillStyle = style.transliterationColor || '#AAAAAA';
        ctx.font = `${translitFontSize}px ${style.fontFamily}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        
        // Offset to move text left and up from bottom-right corner
        const englishXOffset = 100; // Move left from right edge
        const englishYOffset = 120;  // Move up from bottom edge (increased from 60)
        
        const englishLines = this.wrapText(ctx, englishText, style.width / 2 - padding * 2);
        let englishY = style.height - padding - englishYOffset - (englishLines.length - 1) * translitFontSize * 1.2;
        
        for (const line of englishLines) {
            ctx.fillText(line, style.width - padding - englishXOffset, englishY);
            englishY += translitFontSize * 1.2;
        }
    }

    /**
     * Draw a line with bold text support using [text] syntax
     */
    private drawLineWithBold(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: ImageStyle): void {
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
