import * as fs from 'fs';
import { TimedLyric } from './processor';

export class TimestampExporter {
    /**
     * Export timed lyrics to various formats
     */
    async export(
        timedLyrics: TimedLyric[],
        outputPath: string,
        format: 'json' | 'lrc' | 'srt'
    ): Promise<void> {
        let content: string;

        switch (format) {
            case 'json':
                content = this.toJSON(timedLyrics);
                break;
            case 'lrc':
                content = this.toLRC(timedLyrics);
                break;
            case 'srt':
                content = this.toSRT(timedLyrics);
                break;
            default:
                throw new Error(`Unsupported format: ${format}`);
        }

        fs.writeFileSync(outputPath, content, 'utf-8');
    }

    /**
     * Export to JSON format
     */
    private toJSON(timedLyrics: TimedLyric[]): string {
        const data = {
            version: '1.0',
            metadata: {
                generatedAt: new Date().toISOString(),
                totalLines: timedLyrics.length,
                duration: timedLyrics[timedLyrics.length - 1]?.endTime || 0
            },
            lyrics: timedLyrics.map(lyric => ({
                index: lyric.index,
                startTime: lyric.startTime,
                endTime: lyric.endTime,
                duration: lyric.endTime - lyric.startTime,
                text: lyric.text,
                imagePath: `images/lyric_${String(lyric.index).padStart(3, '0')}.png`
            }))
        };

        return JSON.stringify(data, null, 2);
    }

    /**
     * Export to LRC format (standard lyric format)
     * Format: [mm:ss.xx]Lyric text
     */
    private toLRC(timedLyrics: TimedLyric[]): string {
        const lines: string[] = [
            '[ti:Unknown Title]',
            '[ar:Unknown Artist]',
            '[al:Unknown Album]',
            '[by:Lyric Sync]',
            ''
        ];

        for (const lyric of timedLyrics) {
            const timestamp = this.formatLRCTimestamp(lyric.startTime);
            lines.push(`${timestamp}${lyric.text}`);
        }

        return lines.join('\n');
    }

    /**
     * Export to SRT format (SubRip subtitle format)
     */
    private toSRT(timedLyrics: TimedLyric[]): string {
        const lines: string[] = [];

        for (const lyric of timedLyrics) {
            const startTime = this.formatSRTTimestamp(lyric.startTime);
            const endTime = this.formatSRTTimestamp(lyric.endTime);

            lines.push(`${lyric.index + 1}`);
            lines.push(`${startTime} --> ${endTime}`);
            lines.push(lyric.text);
            lines.push('');
        }

        return lines.join('\n');
    }

    /**
     * Format timestamp for LRC format [mm:ss.xx]
     */
    private formatLRCTimestamp(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const centiseconds = Math.floor((seconds % 1) * 100);

        return `[${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}]`;
    }

    /**
     * Format timestamp for SRT format (hh:mm:ss,ms)
     */
    private formatSRTTimestamp(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const milliseconds = Math.floor((seconds % 1) * 1000);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
    }
}
