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

interface LibrosaAnalysisResult {
    segments: TranscriptionSegment[];
    metadata: {
        totalDuration: number;
        language: string;
        generatedAt: string;
    };
}

export class LibrosaDirectAnalysis {
    constructor() {
        // Empty constructor
    }

    async analyzeDirectly(vocalPath: string, transcriptionPath: string, outputDir: string): Promise<LibrosaAnalysisResult> {
        console.log('🎵 Direct librosa analysis (no calculations)...');
        console.log(`   Vocal track: ${vocalPath}`);
        console.log(`   Transcription: ${transcriptionPath}`);

        // Create Python script for direct librosa analysis
        const pythonScript = this.createDirectAnalysisScript();

        // Write Python script to temp file
        const scriptPath = path.join(outputDir, 'direct_librosa_script.py');
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

    private createDirectAnalysisScript(): string {
        return `
import sys
import json
import os
import numpy as np
import librosa
import warnings
warnings.filterwarnings("ignore")

def direct_librosa_analysis(vocal_path, transcription_path, output_dir):
    """Let librosa detect natural boundaries without calculations"""
    try:
        print(f"Loading vocal track: {vocal_path}")
        
        # Load vocal audio with librosa
        y, sr = librosa.load(vocal_path, sr=None)
        print(f"Audio loaded: {len(y)} samples, {sr} Hz")
        
        # Get audio duration
        duration = len(y) / sr
        print(f"Audio duration: {duration:.2f} seconds")
        
        # Load transcription
        print(f"Loading transcription: {transcription_path}")
        with open(transcription_path, 'r', encoding='utf-8') as f:
            transcription_data = json.load(f)
        
        transcribed_segments = transcription_data.get('segments', [])
        print(f"Found {len(transcribed_segments)} transcribed segments")
        
        # Let librosa find natural boundaries
        print("Letting librosa detect natural speech boundaries...")
        
        # 1. Onset detection - natural start points
        onset_frames = librosa.onset.onset_detect(y=y, sr=sr, backtrack=True, pre_max=1, post_max=1)
        onset_times = librosa.frames_to_time(onset_frames, sr=sr)
        
        print(f"Librosa detected {len(onset_times)} natural onset points")
        
        # 2. Tempo and beat tracking - natural rhythm
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        beat_times = librosa.frames_to_time(beats, sr=sr)
        
        # Handle numpy tempo (might be array)
        if isinstance(tempo, np.ndarray):
            tempo_val = float(tempo[0]) if len(tempo) > 0 else 0.0
        else:
            tempo_val = float(tempo)
        
        print(f"Librosa detected tempo: {tempo_val:.2f} BPM")
        print(f"Librosa detected {len(beat_times)} beats")
        
        # 3. Segment the audio naturally using librosa's segment function
        # This finds natural changes in the audio
        S = librosa.feature.melspectrogram(y=y, sr=sr)
        S_db = librosa.power_to_db(S, ref=np.max)
        
        # Find segment boundaries (natural changes in audio)
        try:
            boundary_frames = librosa.segment.segment_path(S_db)
        except AttributeError:
            # Fallback: use onset-based segmentation
            print("segment_path not available, using onset-based segmentation")
            boundary_frames = onset_frames
        
        if len(boundary_frames) > 0:
            boundary_times = librosa.frames_to_time(boundary_frames, sr=sr)
            print(f"Librosa found {len(boundary_times)} natural segment boundaries")
        else:
            print("No natural boundaries found, using onsets")
            boundary_times = onset_times
        
        # 4. Combine all timing information
        all_boundaries = sorted(np.concatenate([onset_times, beat_times[::4], boundary_times]))
        # Convert to numpy array for filtering
        all_boundaries = np.array(all_boundaries)
        all_boundaries = all_boundaries[all_boundaries < duration]
        
        print(f"Combined boundaries: {len(all_boundaries)} points")
        
        # 5. Create segments based on natural boundaries
        segments = []
        
        if len(all_boundaries) > 1:
            # Create segments between natural boundaries
            for i in range(len(all_boundaries) - 1):
                start_time = all_boundaries[i]
                end_time = all_boundaries[i + 1]
                
                # Find the best matching transcription segment
                best_segment = None
                best_overlap = 0
                
                for trans_segment in transcribed_segments:
                    trans_start = trans_segment.get('start', 0)
                    trans_end = trans_segment.get('end', 0)
                    
                    # Calculate overlap
                    overlap = min(end_time, trans_end) - max(start_time, trans_start)
                    if overlap > best_overlap:
                        best_overlap = overlap
                        best_segment = trans_segment
                
                if best_segment and best_overlap > 0.5:  # At least 0.5s overlap
                    segments.append({
                        "start": start_time,
                        "end": end_time,
                        "text": best_segment.get('text', ''),
                        "speaker": best_segment.get('speaker', 'M'),
                        "words": best_segment.get('words', [])
                    })
                else:
                    # Instrumental segment
                    segments.append({
                        "start": start_time,
                        "end": end_time,
                        "text": "♪ Instrumental ♪",
                        "speaker": "I",
                        "words": []
                    })
        
        # 6. Handle beginning and end
        if len(segments) > 0:
            # Add beginning if needed
            if segments[0]["start"] > 2.0:
                segments.insert(0, {
                    "start": 0,
                    "end": segments[0]["start"],
                    "text": "♪ Instrumental ♪",
                    "speaker": "I",
                    "words": []
                })
            
            # Add end if needed
            last_end = segments[-1]["end"]
            if duration - last_end > 2.0:
                segments.append({
                    "start": last_end,
                    "end": duration,
                    "text": "♪ Instrumental ♪",
                    "speaker": "I",
                    "words": []
                })
        else:
            # Fallback: use transcription timing directly
            print("Fallback: using transcription timing")
            for trans_segment in transcribed_segments:
                segments.append({
                    "start": trans_segment.get('start', 0),
                    "end": trans_segment.get('end', 0),
                    "text": trans_segment.get('text', ''),
                    "speaker": trans_segment.get('speaker', 'M'),
                    "words": trans_segment.get('words', [])
                })
        
        print(f"Final result: {len(segments)} segments")
        print(f"Coverage: {segments[-1]['end']:.2f}s / {duration:.2f}s")
        
        # Show first few segments for verification
        print("\\nFirst 5 segments:")
        for i, seg in enumerate(segments[:5]):
            duration = seg["end"] - seg["start"]
            print(f"  {i+1}. [{seg['start']:.2f}-{seg['end']:.2f}] ({duration:.2f}s) {seg['text'][:50]}...")
        
        # Save results
        output_path = os.path.join(output_dir, 'direct_librosa_result.json')
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
        print("Usage: python direct_librosa_script.py <vocal_path> <transcription_path> <output_dir>")
        sys.exit(1)
    
    vocal_path = sys.argv[1]
    transcription_path = sys.argv[2]
    output_dir = sys.argv[3]
    
    direct_librosa_analysis(vocal_path, transcription_path, output_dir)
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
        console.error('Usage: ts-node librosaDirectAnalysis.ts <vocalPath> <transcriptionPath> <outputDir>');
        process.exit(1);
    }

    const vocalPath = process.argv[2];
    const transcriptionPath = process.argv[3];
    const outputDir = process.argv[4];

    const analyzer = new LibrosaDirectAnalysis();
    
    try {
        const result = await analyzer.analyzeDirectly(vocalPath, transcriptionPath, outputDir);
        
        console.log('\n🎉 Direct librosa analysis completed!');
        console.log(`📊 Generated ${result.segments.length} segments`);
        console.log(`📁 Output saved to: ${outputDir}/direct_librosa_result.json`);
        
    } catch (error) {
        console.error('❌ Analysis failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
