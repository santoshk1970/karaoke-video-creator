#!/usr/bin/env node

/**
 * Voice Extraction Tool - CLI for extracting voice from audio files
 * Copyright (c) 2026 Santosh Kulkarni
 * MIT License - See LICENSE file for details
 */

import { VoiceExtractor } from './voiceExtractor';
import * as path from 'path';

interface CLIOptions {
    input: string;
    output?: string;
    method?: 'center' | 'spectral' | 'hybrid';
    quality?: 'low' | 'medium' | 'high';
    outputDir?: string;
}

function parseArgs(): CLIOptions {
    const args = process.argv.slice(2);
    const options: CLIOptions = {
        input: ''
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '-i':
            case '--input':
                options.input = args[++i];
                break;
            case '-o':
            case '--output':
                options.output = args[++i];
                break;
            case '-m':
            case '--method':
                options.method = args[++i] as 'center' | 'spectral' | 'hybrid';
                break;
            case '-q':
            case '--quality':
                options.quality = args[++i] as 'low' | 'medium' | 'high';
                break;
            case '-d':
            case '--output-dir':
                options.outputDir = args[++i];
                break;
            case '-h':
            case '--help':
                showHelp();
                process.exit(0);
                break;
            default:
                if (!options.input && !arg.startsWith('-')) {
                    options.input = arg;
                } else {
                    console.error(`Unknown option: ${arg}`);
                    showHelp();
                    process.exit(1);
                }
        }
    }

    if (!options.input) {
        console.error('Error: Input file is required');
        showHelp();
        process.exit(1);
    }

    return options;
}

function showHelp(): void {
    console.log(`
Voice Extraction Tool - Extract voice-only audio from MP3 files

USAGE:
  voice-extraction [options] <input-file>
  voice-extraction -i <input-file> [options]

OPTIONS:
  -i, --input <file>        Input audio file (required)
  -o, --output <file>       Output filename (default: <input-name>-voice-only.mp3)
  -m, --method <method>     Extraction method (center|spectral|hybrid|advanced|demucs) [default: hybrid]
  -q, --quality <quality>   Audio quality (low|medium|high) [default: medium]
  -d, --output-dir <dir>    Output directory [default: same as input]
  -h, --help                Show this help message

EXAMPLES:
  voice-extraction song.mp3
  voice-extraction -i song.mp3 -m center -q high
  voice-extraction song.mp3 -o vocals.mp3 -d ./output

METHODS:
  center     - Extract center channel (where vocals typically sit)
  spectral   - Apply vocal frequency filtering
  hybrid     - Combine center channel with spectral filtering (recommended)
  advanced   - Multi-pass extraction with aggressive vocal isolation (slowest, best results)
  demucs     - AI-powered separation using Demucs model (best quality, requires pip install demucs)
`);
}

async function main(): Promise<void> {
    try {
        const options = parseArgs();
        
        console.log('🎤 Voice Extraction Tool');
        console.log('========================\n');

        const extractor = new VoiceExtractor({
            inputFile: options.input,
            outputFile: options.output,
            outputDir: options.outputDir,
            method: options.method || 'hybrid',
            quality: options.quality || 'medium'
        });

        const { outputPath, info } = await extractor.extractWithInfo();
        
        console.log('\n✅ Voice extraction completed successfully!');
        console.log(`   Output: ${outputPath}`);
        console.log(`   Duration: ${info.duration.toFixed(1)}s`);
        console.log(`   Bitrate: ${info.bitrate} bps`);
        console.log(`   Sample Rate: ${info.sampleRate} Hz\n`);

        console.log('📝 Next steps:');
        console.log('   1. Run WhisperX on the extracted voice file:');
        console.log(`      whisperx "${outputPath}" --output_dir ./transcription`);
        console.log('   2. Use the transcription for karaoke processing:');
        console.log(`      npm start -- "${options.input}" lyrics.txt --transcription ./transcription/transcription.json --extract-voice\n`);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    });
}
