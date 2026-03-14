#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

interface TranscriptionSegment {
    start: number;
    end: number;
    text: string;
    speaker: string;
    words: Array<{
        word: string;
        start: number;
        end: number;
        confidence?: number;
    }>;
}

interface AudioAnalysisResult {
    segments: TranscriptionSegment[];
    metadata: {
        totalDuration: number;
        language: string;
        generatedAt: string;
    };
}

export class AudioAnalysisTiming {
    constructor() {
        // Empty constructor
    }

    async extractTiming(vocalPath: string, transcriptionPath: string, outputDir: string): Promise<AudioAnalysisResult> {
        console.log('🎵 Extracting timing with audio analysis...');
        console.log(`   Vocal track: ${vocalPath}`);
        console.log(`   Transcription file: ${transcriptionPath}`);

        // Create Python script for audio analysis
        const pythonScript = this.createAudioAnalysisScript();

        // Write Python script to temp file
        const scriptPath = path.join(outputDir, 'audio_analysis_script.py');
        await fs.promises.writeFile(scriptPath, pythonScript);

        try {
            // Run Python script
            const result = await this.runPythonScript(scriptPath, vocalPath, transcriptionPath, outputDir);
            
            // Parse result
            const segments = JSON.parse(result);
            
            return {
                segments: segments,
                metadata: {
                    totalDuration: segments.length > 0 ? segments[segments.length - 1].end : 0,
                    language: 'hi',
                    generatedAt: new Date().toISOString()
                }
            };

        } finally {
            // Clean up temp script
            if (fs.existsSync(scriptPath)) {
                await fs.promises.unlink(scriptPath);
            }
        }
    }

    private createAudioAnalysisScript(): string {
        return `
import sys
import json
import os
import numpy as np
import librosa
import warnings
warnings.filterwarnings("ignore")

def analyze_vocal_timing(vocal_path, transcription_path, output_dir):
    """Extract timing from vocal track using audio analysis with transcribed lyrics"""
    try:
        print(f"Loading vocal track: {vocal_path}")
        
        # Load vocal audio with librosa
        y, sr = librosa.load(vocal_path, sr=None)
        print(f"Audio loaded: {len(y)} samples, {sr} Hz")
        
        # Get audio duration
        duration = len(y) / sr
        print(f"Audio duration: {duration:.2f} seconds")
        
        # Load transcription data
        print(f"Loading transcription: {transcription_path}")
        with open(transcription_path, 'r', encoding='utf-8') as f:
            transcription_data = json.load(f)
        
        # Extract segments from transcription
        transcribed_segments = transcription_data.get('segments', [])
        print(f"Found {len(transcribed_segments)} transcribed segments")
        
        # Convert transcription to our format
        lyrics = []
        for segment in transcribed_segments:
            lyrics.append({
                'speaker': 'M',  # Default to male, could be enhanced
                'text': segment.get('text', ''),
                'original_start': segment.get('start', 0),
                'original_end': segment.get('end', 0),
                'words': segment.get('words', [])
            })
        
        print(f"Processed {len(lyrics)} lyric lines from transcription")
        
        # Audio analysis for lyric detection
        print("Performing audio analysis...")
        
        # 1. Onset detection - find when singing starts
        onset_frames = librosa.onset.onset_detect(y=y, sr=sr, backtrack=True)
        onset_times = librosa.frames_to_time(onset_frames, sr=sr)
        
        print(f"Found {len(onset_times)} onset events")
        
        # 2. RMS energy analysis
        hop_length = 512
        rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
        rms_times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop_length)
        
        # 3. Spectral centroid - helps distinguish singing from silence
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        centroid_times = librosa.frames_to_time(np.arange(len(spectral_centroids)), sr=sr, hop_length=hop_length)
        
        # 4. Find singing segments
        # Combine multiple features for better detection
        energy_threshold = np.percentile(rms, 30)  # Above 30th percentile
        centroid_threshold = np.percentile(spectral_centroids, 40)  # Above 40th percentile
        
        singing_mask = (rms > energy_threshold) & (spectral_centroids > centroid_threshold)
        singing_times = rms_times[singing_mask]
        
        print(f"Singing detected in {len(singing_times)} frames")
        
        # 5. Segment the singing into lyric lines
        if len(singing_times) < len(lyrics):
            print(f"Warning: Only {len(singing_times)} singing frames for {len(lyrics)} lyrics")
        
        # Create segments based on singing detection
        segments = []
        
        if len(singing_times) > 0:
            # Find continuous singing segments
            is_singing = np.zeros(len(singing_times), dtype=bool)
            time_diffs = np.diff(singing_times)
            
            # Mark continuous singing (gaps less than 2 seconds)
            is_singing[0] = True
            for i in range(1, len(singing_times)):
                is_singing[i] = is_singing[i-1] and (time_diffs[i-1] < 2.0)
            
            # Find segment boundaries
            segment_starts = []
            segment_ends = []
            
            in_segment = False
            start_idx = 0
            
            for i, singing in enumerate(is_singing):
                if singing and not in_segment:
                    # Start of segment
                    start_idx = i
                    in_segment = True
                elif not singing and in_segment:
                    # End of segment
                    segment_starts.append(singing_times[start_idx])
                    segment_ends.append(singing_times[i])
                    in_segment = False
            
            # Handle case where audio ends with singing
            if in_segment:
                segment_starts.append(singing_times[start_idx])
                segment_ends.append(singing_times[-1])
            
            print(f"Found {len(segment_starts)} singing segments")
            
            # Distribute lyrics across segments
            if len(segment_starts) > 0:
                # Calculate how many lyrics per segment
                total_singing_duration = sum(end - start for start, end in zip(segment_starts, segment_ends))
                avg_duration_per_lyric = total_singing_duration / len(lyrics)
                
                lyric_idx = 0
                for i, (start_time, end_time) in enumerate(zip(segment_starts, segment_ends)):
                    segment_duration = end_time - start_time
                    lyrics_in_segment = max(1, int(segment_duration / avg_duration_per_lyric))
                    
                    # Create lyric segments
                    for j in range(lyrics_in_segment):
                        if lyric_idx >= len(lyrics):
                            break
                        
                        # Calculate timing for this lyric
                        lyric_start = start_time + (j * segment_duration / lyrics_in_segment)
                        lyric_end = start_time + ((j + 1) * segment_duration / lyrics_in_segment)
                        
                        # Ensure we don't exceed the segment
                        if lyric_end > end_time:
                            lyric_end = end_time
                        
                        lyric_data = lyrics[lyric_idx]
                        
                        # Create word-level timing (simple distribution)
                        words = lyric_data['text'].split()
                        word_count = len(words)
                        
                        if word_count > 0:
                            word_duration = (lyric_end - lyric_start) / word_count
                            word_timings = []
                            
                            for k, word in enumerate(words):
                                word_start = lyric_start + (k * word_duration)
                                word_end = word_start + word_duration
                                
                                word_timings.append({
                                    "word": word,
                                    "start": word_start,
                                    "end": word_end,
                                    "confidence": 0.85
                                })
                        else:
                            word_timings = []
                        
                        segments.append({
                            "start": lyric_start,
                            "end": lyric_end,
                            "text": lyric_data['text'],
                            "speaker": lyric_data['speaker'],
                            "words": word_timings
                        })
                        
                        lyric_idx += 1
            
            # Add any remaining lyrics at the end
            while lyric_idx < len(lyrics):
                last_end = segments[-1]["end"] if segments else duration
                segments.append({
                    "start": last_end,
                    "end": min(last_end + 3.0, duration),
                    "text": lyrics[lyric_idx]['text'],
                    "speaker": lyrics[lyric_idx]['speaker'],
                    "words": []
                })
                lyric_idx += 1
        
        else:
            # No singing detected - create evenly spaced segments
            print("No singing detected, creating evenly spaced segments")
            segment_duration = duration / len(lyrics)
            
            for i, lyric_data in enumerate(lyrics):
                start_time = i * segment_duration
                end_time = (i + 1) * segment_duration
                
                segments.append({
                    "start": start_time,
                    "end": end_time,
                    "text": lyric_data['text'],
                    "speaker": lyric_data['speaker'],
                    "words": []
                })
        
        print(f"Generated {len(segments)} segments")
        
        # Add instrumental segments for gaps
        if len(segments) > 0:
            # Check for gap at beginning
            if segments[0]["start"] > 2.0:
                segments.insert(0, {
                    "start": 0,
                    "end": segments[0]["start"],
                    "text": "♪ Instrumental ♪",
                    "speaker": "I",
                    "words": []
                })
            
            # Check for gaps between segments
            i = 1
            while i < len(segments):
                prev_end = segments[i-1]["end"]
                curr_start = segments[i]["start"]
                
                if curr_start - prev_end > 2.0:  # Gap of more than 2 seconds
                    segments.insert(i, {
                        "start": prev_end,
                        "end": curr_start,
                        "text": "♪ Instrumental ♪",
                        "speaker": "I",
                        "words": []
                    })
                    i += 2
                else:
                    i += 1
            
            # Check for gap at end
            last_end = segments[-1]["end"]
            if duration - last_end > 2.0:
                segments.append({
                    "start": last_end,
                    "end": duration,
                    "text": "♪ Instrumental ♪",
                    "speaker": "I",
                    "words": []
                })
        
        print(f"Final segment count: {len(segments)}")
        print(f"Coverage: {segments[-1]['end']:.2f}s / {duration:.2f}s")
        
        # Save results
        output_path = os.path.join(output_dir, 'audio_analysis_result.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(segments, f, ensure_ascii=False, indent=2)
        
        print(f"Results saved to: {output_path}")
        
        # Return JSON output
        print(json.dumps(segments, ensure_ascii=False))
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python audio_analysis_script.py <vocal_path> <lyrics_path> <output_dir>")
        sys.exit(1)
    
    vocal_path = sys.argv[1]
    lyrics_path = sys.argv[2]
    output_dir = sys.argv[3]
    
    analyze_vocal_timing(vocal_path, lyrics_path, output_dir)
`;
    }

    private async runPythonScript(scriptPath: string, vocalPath: string, transcriptionPath: string, outputDir: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const python = spawn('python3', [scriptPath, vocalPath, transcriptionPath, outputDir]);
            
            let stdout = '';
            let stderr = '';

            python.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            python.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    console.error('Python script error:', stderr);
                    reject(new Error(`Python script failed with code ${code}: ${stderr}`));
                    return;
                }

                // Extract JSON from stdout
                const lines = stdout.trim().split('\n');
                const jsonLine = lines[lines.length - 1]; // Last line should be JSON
                
                try {
                    // Validate JSON
                    JSON.parse(jsonLine);
                    resolve(jsonLine);
                } catch (error) {
                    console.error('Invalid JSON output:', jsonLine);
                    reject(new Error('Invalid JSON output from Python script'));
                }
            });

            python.on('error', (error) => {
                reject(error);
            });
        });
    }
}

// CLI interface
async function main() {
    if (process.argv.length < 5) {
        console.error('Usage: ts-node audioAnalysisTiming.ts <vocalPath> <transcriptionPath> <outputDir>');
        process.exit(1);
    }

    const vocalPath = process.argv[2];
    const transcriptionPath = process.argv[3];
    const outputDir = process.argv[4];

    const analyzer = new AudioAnalysisTiming();
    
    try {
        const result = await analyzer.extractTiming(vocalPath, transcriptionPath, outputDir);
        
        console.log('\n🎉 Audio analysis timing completed successfully!');
        console.log(`📊 Generated ${result.segments.length} timing segments`);
        console.log(`📁 Output saved to: ${outputDir}/audio_analysis_result.json`);
        
        console.log('\n📝 Sample timing:');
        result.segments.slice(0, 3).forEach((segment, index) => {
            console.log(`   ${index + 1}. [${segment.start.toFixed(2)}-${segment.end.toFixed(2)}] [${segment.speaker}] ${segment.text.substring(0, 50)}...`);
        });
        
    } catch (error) {
        console.error('❌ Timing extraction failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
