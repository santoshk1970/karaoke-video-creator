import { createCanvas, registerFont, CanvasRenderingContext2D, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

export interface ImageStyle {
    width: number;
    height: number;
    fontSize: number;
    fontFamily: string;
    textColor: string;
    maleSpeakerColor?: string;
    femaleSpeakerColor?: string;
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
    private instrumentImages: string[] = [];
    private instrumentImageIndex: number = 0;
    private lastInstrumentalImagePath: string | null = null;

    constructor() {
        const instrumentsDir = path.join(__dirname, '..', 'resources', 'instruments');
        if (fs.existsSync(instrumentsDir)) {
            this.instrumentImages = fs.readdirSync(instrumentsDir)
                .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
                .map(file => path.join(instrumentsDir, file));
        }
    }

    private getSpeakerColor(text: string, style: ImageStyle, activeColor?: string): { color: string, processedText: string } {
        if (text.startsWith('M:')) {
            return { color: style.maleSpeakerColor || 'blue', processedText: text.substring(2).trim() };
        } else if (text.startsWith('F:')) {
            return { color: style.femaleSpeakerColor || 'pink', processedText: text.substring(2).trim() };
        }
        return { color: activeColor || style.textColor, processedText: text };
    }

    async generate(text: string, outputPath: string, style: ImageStyle, nextLine?: string, activeColor?: string): Promise<void> {
        const { color, processedText } = this.getSpeakerColor(text, style, activeColor);
        const currentTextColor = color;

        const canvas = createCanvas(style.width, style.height);
        const ctx = canvas.getContext('2d');

        if (style.useGradient && style.gradientColors) {
            const gradient = ctx.createLinearGradient(0, 0, 0, style.height);
            gradient.addColorStop(0, style.gradientColors[0]);
            gradient.addColorStop(1, style.gradientColors[1]);
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = style.backgroundColor;
        }
        ctx.fillRect(0, 0, style.width, style.height);

        if (style.textShadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 4;
            ctx.shadowOffsetY = 4;
        }

        const isInstrumental = /^[♪\s]+.*[♪\s]+$/.test(processedText.trim());

        if (isInstrumental && this.instrumentImages.length > 0) {
            await this.drawInstrumentalImage(ctx, style);
        } else {
            const parts = processedText.split('|');
            const hasTransliteration = parts.length === 2;

            if (hasTransliteration) {
                const hindiText = parts[0].trim();
                const englishText = parts[1].trim();
                await this.drawDualLanguage(ctx, hindiText, englishText, style, nextLine, currentTextColor);
            } else {
                await this.drawSingleLanguage(ctx, processedText, style, nextLine, currentTextColor);
            }
        }

        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
    }

    private async drawInstrumentalImage(ctx: CanvasRenderingContext2D, style: ImageStyle): Promise<void> {
        if (this.instrumentImages.length === 0) return;
        const imagePath = this.instrumentImages[this.instrumentImageIndex];
        this.instrumentImageIndex = (this.instrumentImageIndex + 1) % this.instrumentImages.length;
        this.lastInstrumentalImagePath = imagePath;

        try {
            const image = await loadImage(imagePath);
            this.drawAndCover(ctx, image, style);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, style.width, style.height);
        } catch (error) {
            console.error(`Failed to load instrument image: ${imagePath}`, error);
        }
    }
    
    private drawAndCover(ctx: CanvasRenderingContext2D, image: any, style: ImageStyle) {
        const canvasAspect = style.width / style.height;
        const imageAspect = image.width / image.height;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (imageAspect > canvasAspect) {
            drawHeight = style.height;
            drawWidth = drawHeight * imageAspect;
            offsetX = (style.width - drawWidth) / 2;
            offsetY = 0;
        } else {
            drawWidth = style.width;
            drawHeight = drawWidth / imageAspect;
            offsetX = 0;
            offsetY = (style.height - drawHeight) / 2;
        }
        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    }


    private async drawBackgroundImage(ctx: CanvasRenderingContext2D, imagePath: string, style: ImageStyle): Promise<void> {
        try {
            const image = await loadImage(imagePath);
            this.drawAndCover(ctx, image, style);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, style.width, style.height);
        } catch (error) {
            console.error(`Failed to load background image: ${imagePath}`, error);
        }
    }

    private async drawDualLanguage(ctx: CanvasRenderingContext2D, hindiText: string, englishText: string, style: ImageStyle, nextLine: string | undefined, currentTextColor: string): Promise<void> {
        const isCountdown = /^[\[\]\d\s]+$/.test(hindiText.trim());

        if (isCountdown) {
            if (this.lastInstrumentalImagePath) {
                await this.drawBackgroundImage(ctx, this.lastInstrumentalImagePath, style);
            }
            ctx.fillStyle = style.textColor;
            ctx.font = `bold ${style.fontSize * 1.5}px ${style.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 5;
            this.drawLineWithBold(ctx, hindiText, style.width / 2, style.height / 2, {...style, textAlign: 'center', fontSize: style.fontSize * 1.5});
            return;
        }

        const padding = style.padding;
        const xOffset = style.textShadow ? 500 : 0;
        const yOffset = style.textShadow ? 20 : 0;
        const hindiLines = this.wrapText(ctx, hindiText, style.width / 2 - padding * 2);
        let hindiY = padding + yOffset;
        const lineHeight = style.fontSize * 1.2;
        const hindiX = padding + xOffset;
        
        ctx.fillStyle = currentTextColor;
        ctx.font = `${style.fontSize}px ${style.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        for (const line of hindiLines) {
            this.drawLineWithBold(ctx, line, hindiX, hindiY, {...style, textAlign: 'left', textColor: currentTextColor});
            hindiY += lineHeight;
        }

        let nextLineEnglish = '';
        if (nextLine) {
            const { color: nextLineColorVal, processedText: nextLineProcessed } = this.getSpeakerColor(nextLine, style, currentTextColor);
            if (!/^[♪\s]+.*[♪\s]+$/.test(nextLineProcessed.trim())) {
                const nextLineParts = nextLineProcessed.split('|');
                const nextLineHindi = nextLineParts[0].trim();
                nextLineEnglish = nextLineParts.length === 2 ? nextLineParts[1].trim() : '';
                
                const nextLineFontSize = style.nextLineFontSize || style.fontSize * 0.8;
                hindiY += 30;
                
                ctx.fillStyle = nextLineColorVal;
                ctx.font = `${nextLineFontSize}px ${style.fontFamily}`;
                
                const nextHindiLines = this.wrapText(ctx, nextLineHindi, style.width / 2 - padding * 2);
                for (const line of nextHindiLines) {
                    ctx.fillText(line, hindiX, hindiY);
                    hindiY += nextLineFontSize * 1.2;
                }
            }
        }
        
        const translitFontSize = style.transliterationFontSize ? style.transliterationFontSize * 1.25 : style.fontSize * 0.875;
        const englishXOffset = 100;
        const englishYOffset = 120;
        const englishX = style.width - padding - englishXOffset;
        
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
        
        if (nextLineEnglish) {
            const nextLineFontSize = style.nextLineFontSize || style.fontSize * 0.8;
            const nextEnglishFontSize = nextLineFontSize * 0.85;
            
            englishY += 20;
            ctx.fillStyle = style.nextLineColor || '#888888';
            ctx.font = `${nextEnglishFontSize}px ${style.fontFamily}`;
            
            const nextEnglishLines = this.wrapText(ctx, nextLineEnglish, style.width / 2 - padding * 2);
            for (const line of nextEnglishLines) {
                ctx.fillText(line, englishX, englishY);
                englishY += nextEnglishFontSize * 1.2;
            }
        }
    }

    private drawLineWithBold(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: ImageStyle, isHighlighted: boolean = false): void {
        const originalFillStyle = ctx.fillStyle;
        const parts: Array<{text: string, bold: boolean}> = [];
        const regex = /\[([^\]]+)\]|([^\[]+)/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            if (match[1]) parts.push({ text: match[1], bold: true });
            else if (match[2]) parts.push({ text: match[2], bold: false });
        }
        
        if (parts.length === 0) {
            ctx.fillText(text, x, y);
            return;
        }
        
        let totalWidth = 0;
        for (const part of parts) {
            ctx.font = part.bold ? `bold ${style.fontSize}px ${style.fontFamily}` : `${style.fontSize}px ${style.fontFamily}`;
            totalWidth += ctx.measureText(part.text).width;
        }
        
        let currentX = x - totalWidth / 2;
        
        for (const part of parts) {
            const font = part.bold ? `bold ${style.fontSize * 1.5}px ${style.fontFamily}` : `${style.fontSize}px ${style.fontFamily}`;
            ctx.font = font;
            ctx.textAlign = 'left';
            ctx.fillStyle = part.bold ? '#FFD700' : style.textColor;
            ctx.fillText(part.text, currentX, y);
            currentX += ctx.measureText(part.text).width;
        }
        
        ctx.fillStyle = originalFillStyle as string;
        ctx.font = `${style.fontSize}px ${style.fontFamily}`;
        ctx.textAlign = style.textAlign || 'center';
    }

    private async drawSingleLanguage(ctx: CanvasRenderingContext2D, text: string, style: ImageStyle, nextLine: string | undefined, currentTextColor: string): Promise<void> {
        ctx.fillStyle = currentTextColor;
        ctx.font = `${style.fontSize}px ${style.fontFamily}`;
        ctx.textAlign = style.textAlign || 'center';
        ctx.textBaseline = 'middle';

        const lines = this.wrapText(ctx, text, style.width - (style.padding * 2));
        const shouldShowNextLine = nextLine && !/^[♪\s]+.*[♪\s]+$/.test(nextLine.trim());

        const lineHeight = style.fontSize * 1.2;
        const nextLineHeight = shouldShowNextLine ? (style.nextLineFontSize || style.fontSize * 0.6) * 1.2 : 0;
        const spacing = shouldShowNextLine ? 40 : 0;
        const totalHeight = lines.length * lineHeight + (shouldShowNextLine ? nextLineHeight + spacing : 0);
        let y: number;

        switch (style.verticalAlign || 'middle') {
            case 'top': y = style.padding + lineHeight / 2; break;
            case 'bottom': y = style.height - style.padding - totalHeight + lineHeight / 2; break;
            default: y = (style.height - totalHeight) / 2 + lineHeight / 2; break;
        }

        const x = style.width / 2;
        for (const line of lines) {
            this.drawLineWithBold(ctx, line, x, y, { ...style, textColor: currentTextColor }, true);
            y += lineHeight;
        }

        if (shouldShowNextLine) {
            y += spacing;
            const { color: nextLineColorToUse, processedText: nextLineProcessed } = this.getSpeakerColor(nextLine!, style, currentTextColor);
            
            ctx.fillStyle = nextLineColorToUse;
            ctx.font = `${style.nextLineFontSize || style.fontSize * 0.6}px ${style.fontFamily}`;
            
            const nextLineParts = nextLineProcessed.split('|');
            const nextLineText = nextLineParts.length === 2 ? nextLineParts[0].trim() : nextLineProcessed;

            const nextLines = this.wrapText(ctx, nextLineText, style.width - (style.padding * 2));
            for (const line of nextLines) {
                ctx.fillText(line, x, y);
                y += nextLineHeight;
            }
        }
    }

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

        if (currentLine) lines.push(currentLine);
        return lines.length > 0 ? lines : [text];
    }

    async generateStyled(text: string, outputPath: string): Promise<void> {
        const { width, height } = { width: 1920, height: 1080 };
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

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

        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
    }
}