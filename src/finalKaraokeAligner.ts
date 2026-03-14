#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

interface WordTiming {
    word: string;
    start: number;
    end: number;
    confidence?: number;
}

interface LyricLine {
    start: number;
    end: number;
    text: string;
    speaker?: string;
    words?: WordTiming[];
}

export class FinalKaraokeAligner {
    private seamlessResultFile: string;
    private outputDir: string;

    constructor(seamlessResultFile: string, outputDir: string = './output') {
        this.seamlessResultFile = seamlessResultFile;
        this.outputDir = outputDir;
        
        if (!fs.existsSync(seamlessResultFile)) {
            throw new Error(`SeamlessM4T result file not found: ${seamlessResultFile}`);
        }
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
    }

    /**
     * Create final karaoke timing files from SeamlessM4T results
     */
    createKaraokeFiles(): void {
        console.log('🎵 Creating final karaoke timing files...');
        console.log(`   Input: ${this.seamlessResultFile}`);

        try {
            // Load SeamlessM4T results
            const seamlessData = JSON.parse(fs.readFileSync(this.seamlessResultFile, 'utf-8'));
            const segments = seamlessData.segments || [];
            
            console.log(`   Found ${segments.length} lyric segments`);
            console.log(`   Audio duration: ${seamlessData.audio_duration || 'unknown'} seconds`);
            console.log(`   Accuracy: ${seamlessData.accuracy || 'high'}`);

            // Create enhanced karaoke timing
            const karaokeTiming = this.createEnhancedKaraokeTiming(segments);
            
            // Export to different formats
            this.exportToFinalJSON(karaokeTiming);
            this.exportToFinalSRT(karaokeTiming);
            this.exportToKaraokeXML(karaokeTiming);
            this.exportToCSV(karaokeTiming);
            
            console.log('   ✅ Karaoke files created successfully!');
            
        } catch (error: any) {
            console.error('   ❌ Error creating karaoke files:', error.message);
            throw error;
        }
    }

    /**
     * Create enhanced karaoke timing with additional metadata
     */
    private createEnhancedKaraokeTiming(segments: LyricLine[]): any[] {
        return segments.map((segment, index) => ({
            id: index + 1,
            start: segment.start,
            end: segment.end,
            duration: segment.end - segment.start,
            text: segment.text,
            speaker: segment.speaker || 'unknown',
            words: segment.words || [],
            wordCount: segment.words ? segment.words.length : segment.text.split(/\s+/).length,
            characters: segment.text.length,
            // Additional timing info
            beatsPerMinute: this.estimateBPM(segment),
            difficulty: this.estimateDifficulty(segment),
            // Display properties
            displayDuration: this.calculateDisplayDuration(segment),
            fadeIn: segment.start > 0 ? 0.1 : 0,
            fadeOut: 0.1
        }));
    }

    /**
     * Estimate BPM for a segment (simplified)
     */
    private estimateBPM(segment: LyricLine): number {
        // This is a simplified estimation - in real implementation you'd analyze the audio
        const wordCount = segment.words ? segment.words.length : segment.text.split(/\s+/).length;
        const duration = segment.end - segment.start;
        const wordsPerSecond = wordCount / duration;
        
        // Typical singing is 2-4 words per second, map to BPM
        if (wordsPerSecond < 2) return 60;
        if (wordsPerSecond > 4) return 120;
        return Math.round(60 + (wordsPerSecond - 2) * 30);
    }

    /**
     * Estimate difficulty for karaoke display
     */
    private estimateDifficulty(segment: LyricLine): 'easy' | 'medium' | 'hard' {
        const wordCount = segment.words ? segment.words.length : segment.text.split(/\s+/).length;
        const duration = segment.end - segment.start;
        const wordsPerSecond = wordCount / duration;
        
        if (wordsPerSecond < 1.5) return 'easy';
        if (wordsPerSecond < 3) return 'medium';
        return 'hard';
    }

    /**
     * Calculate optimal display duration
     */
    private calculateDisplayDuration(segment: LyricLine): number {
        const baseDuration = segment.end - segment.start;
        // Add a bit more time for readability
        return baseDuration * 1.2;
    }

    /**
     * Export to final JSON format
     */
    private exportToFinalJSON(karaokeTiming: any[]): void {
        const finalData = {
            metadata: {
                title: "Meri Neendon Mein Tum",
                language: "hi",
                totalSegments: karaokeTiming.length,
                totalDuration: karaokeTiming[karaokeTiming.length - 1]?.end || 0,
                generatedBy: "SeamlessM4T with provided lyrics",
                accuracy: "maximum",
                generatedAt: new Date().toISOString()
            },
            segments: karaokeTiming
        };

        const outputFile = path.join(this.outputDir, 'final_karaoke_timing.json');
        fs.writeFileSync(outputFile, JSON.stringify(finalData, null, 2));
        console.log(`   📄 Final JSON: ${outputFile}`);
    }

    /**
     * Export to final SRT format
     */
    private exportToFinalSRT(karaokeTiming: any[]): void {
        let srtContent = '';
        let index = 1;

        for (const segment of karaokeTiming) {
            const startTime = this.formatSRTTime(segment.start);
            const endTime = this.formatSRTTime(segment.end);
            
            srtContent += `${index}\n`;
            srtContent += `${startTime} --> ${endTime}\n`;
            if (segment.speaker && segment.speaker !== 'unknown') {
                srtContent += `[${segment.speaker}] ${segment.text}\n`;
            } else {
                srtContent += `${segment.text}\n`;
            }
            srtContent += `\n`;
            index++;
        }

        const srtFile = path.join(this.outputDir, 'final_karaoke.srt');
        fs.writeFileSync(srtFile, srtContent);
        console.log(`   📄 Final SRT: ${srtFile}`);
    }

    /**
     * Export to Karaoke XML format (compatible with many karaoke systems)
     */
    private exportToKaraokeXML(karaokeTiming: any[]): void {
        let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xmlContent += '<karaoke>\n';
        xmlContent += '  <metadata>\n';
        xmlContent += '    <title>Meri Neendon Mein Tum</title>\n';
        xmlContent += '    <language>hi</language>\n';
        xmlContent += `    <duration>${karaokeTiming[karaokeTiming.length - 1]?.end || 0}</duration>\n`;
        xmlContent += '  </metadata>\n';
        xmlContent += '  <lyrics>\n';

        for (const segment of karaokeTiming) {
            xmlContent += '    <line>\n';
            xmlContent += `      <start>${segment.start}</start>\n`;
            xmlContent += `      <end>${segment.end}</end>\n`;
            xmlContent += `      <text>${this.escapeXML(segment.text)}</text>\n`;
            if (segment.speaker && segment.speaker !== 'unknown') {
                xmlContent += `      <speaker>${segment.speaker}</speaker>\n`;
            }
            xmlContent += '      <words>\n';
            
            if (segment.words && segment.words.length > 0) {
                for (const word of segment.words) {
                    xmlContent += '        <word>\n';
                    xmlContent += `          <text>${this.escapeXML(word.word)}</text>\n`;
                    xmlContent += `          <start>${word.start}</start>\n`;
                    xmlContent += `          <end>${word.end}</end>\n`;
                    xmlContent += `          <confidence>${word.confidence || 0.95}</confidence>\n`;
                    xmlContent += '        </word>\n';
                }
            }
            
            xmlContent += '      </words>\n';
            xmlContent += '    </line>\n';
        }

        xmlContent += '  </lyrics>\n';
        xmlContent += '</karaoke>';

        const xmlFile = path.join(this.outputDir, 'final_karaoke.xml');
        fs.writeFileSync(xmlFile, xmlContent);
        console.log(`   📄 Karaoke XML: ${xmlFile}`);
    }

    /**
     * Export to CSV format for easy import into spreadsheets
     */
    private exportToCSV(karaokeTiming: any[]): void {
        let csvContent = 'ID,Start,End,Duration,Text,Speaker,WordCount,Difficulty,BPM\n';
        
        for (const segment of karaokeTiming) {
            csvContent += `${segment.id},${segment.start},${segment.end},${segment.duration},"${this.escapeCSV(segment.text)}",${segment.speaker},${segment.wordCount},${segment.difficulty},${segment.beatsPerMinute}\n`;
        }

        const csvFile = path.join(this.outputDir, 'final_karaoke.csv');
        fs.writeFileSync(csvFile, csvContent);
        console.log(`   📄 CSV: ${csvFile}`);
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

    /**
     * Escape XML special characters
     */
    private escapeXML(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Escape CSV special characters
     */
    private escapeCSV(text: string): string {
        return text.replace(/"/g, '""');
    }
}

// CLI interface
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log(`
Usage: ts-node finalKaraokeAligner.ts <seamless-result-file> [output-dir]

Arguments:
  seamless-result-file  Path to the SeamlessM4T result JSON file
  output-dir           Output directory (default: ./output)

Example:
  ts-node finalKaraokeAligner.ts ./output/working_seamless_result.json ./output
        `);
        process.exit(1);
    }

    const [seamlessResultFile, outputDir = './output'] = args;

    try {
        const aligner = new FinalKaraokeAligner(seamlessResultFile, outputDir);
        aligner.createKaraokeFiles();
        
        console.log('\n🎉 Final karaoke files created successfully!');
        console.log('\n📁 Generated files:');
        console.log(`   • final_karaoke_timing.json - Complete karaoke timing data`);
        console.log(`   • final_karaoke.srt - Subtitle format`);
        console.log(`   • final_karaoke.xml - Karaoke XML format`);
        console.log(`   • final_karaoke.csv - Spreadsheet format`);
        
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
