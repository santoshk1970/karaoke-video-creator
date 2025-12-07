import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface WhisperWord {
    word: string;
    start: number;
    end: number;
}

export interface WhisperSegment {
    text: string;
    start: number;
    end: number;
    words?: WhisperWord[];
}

/**
 * Use Whisper to get accurate timestamps
 * Requires: pip install openai-whisper
 */
export async function alignWithWhisper(audioFile: string, lyrics: string[]): Promise<any[]> {
    console.log('   Attempting Whisper alignment...');
    
    try {
        // Check if whisper is installed
        await execAsync('which whisper');
    } catch {
        throw new Error('Whisper not installed. Install with: pip install openai-whisper');
    }

    // Run whisper with word-level timestamps
    const outputDir = path.dirname(audioFile);
    const outputName = path.basename(audioFile, path.extname(audioFile));
    const jsonOutput = path.join(outputDir, `${outputName}.json`);

    console.log('   Running Whisper (this may take a few minutes)...');
    
    try {
        // Run whisper with JSON output and word timestamps
        const command = `whisper "${audioFile}" --model base --language hi --output_format json --output_dir "${outputDir}" --word_timestamps True`;
        await execAsync(command, { maxBuffer: 50 * 1024 * 1024 });

        // Read the JSON output
        const whisperData = JSON.parse(fs.readFileSync(jsonOutput, 'utf-8'));
        
        // Match lyrics to whisper segments
        return matchLyricsToSegments(lyrics, whisperData.segments);
    } catch (error: any) {
        throw new Error(`Whisper failed: ${error.message}`);
    }
}

/**
 * Match user's lyrics to Whisper's detected segments
 */
function matchLyricsToSegments(lyrics: string[], segments: WhisperSegment[]): any[] {
    const timedLyrics: any[] = [];
    
    // Simple approach: distribute segments across lyrics
    const segmentsPerLyric = Math.max(1, Math.floor(segments.length / lyrics.length));
    
    for (let i = 0; i < lyrics.length; i++) {
        const startIdx = i * segmentsPerLyric;
        const endIdx = Math.min((i + 1) * segmentsPerLyric, segments.length);
        
        const relevantSegments = segments.slice(startIdx, endIdx);
        
        if (relevantSegments.length > 0) {
            timedLyrics.push({
                index: i,
                startTime: relevantSegments[0].start,
                endTime: relevantSegments[relevantSegments.length - 1].end,
                text: lyrics[i]
            });
        }
    }
    
    return timedLyrics;
}
