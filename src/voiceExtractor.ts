/**
 * Voice Extractor - Extract voice-only audio from MP3 files
 * Copyright (c) 2026 Santosh Kulkarni
 * MIT License - See LICENSE file for details
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface VoiceExtractorConfig {
    inputFile: string;
    outputFile?: string;
    outputDir?: string;
    method?: 'center' | 'spectral' | 'hybrid' | 'advanced' | 'demucs';
    quality?: 'low' | 'medium' | 'high';
}

export class VoiceExtractor {
    private config: VoiceExtractorConfig;

    constructor(config: VoiceExtractorConfig) {
        this.validateConfig(config);
        
        const defaultOutputDir = path.dirname(config.inputFile) || '.';
        
        this.config = {
            inputFile: config.inputFile,
            outputFile: config.outputFile || this.generateOutputFileName(config.inputFile),
            outputDir: config.outputDir || defaultOutputDir,
            method: config.method || 'hybrid',
            quality: config.quality || 'medium'
        };
    }

    /**
     * Extract voice-only audio from input file
     */
    async extract(): Promise<string> {
        console.log('🎤 Extracting voice from audio file...');
        console.log(`   Input: ${this.config.inputFile}`);
        console.log(`   Method: ${this.config.method}`);
        console.log(`   Quality: ${this.config.quality}`);

        const outputPath = path.join(this.config.outputDir!, this.config.outputFile!);

        try {
            switch (this.config.method) {
                case 'center':
                    return await this.extractCenterChannel(outputPath);
                case 'spectral':
                    return await this.extractSpectral(outputPath);
                case 'advanced':
                    return await this.extractAdvanced(outputPath);
                case 'demucs':
                    return await this.extractDemucs(outputPath);
                case 'hybrid':
                default:
                    return await this.extractHybrid(outputPath);
            }
        } catch (error: any) {
            console.error('   ❌ Voice extraction failed:', error.message);
            throw error;
        }
    }

    /**
     * Extract vocals using center channel isolation
     */
    private async extractCenterChannel(outputPath: string): Promise<string> {
        console.log('   Using center channel isolation...');

        const sanitizedInput = this.sanitizePath(this.config.inputFile);
        const sanitizedOutput = this.sanitizePath(outputPath);

        // More aggressive center channel extraction with vocal isolation
        const command = `ffmpeg -i "${sanitizedInput}" -af "pan=mono|c0=c0+c1,highpass=f=100,lowpass=f=6000,acompressor=threshold=-20dB:ratio=4:attack=2:release=50" ${this.getQualityParam()} "${sanitizedOutput}" -y`;

        await execAsync(command);
        console.log('   ✅ Center channel extraction completed');
        return outputPath;
    }

    /**
     * Extract vocals using spectral subtraction
     */
    private async extractSpectral(outputPath: string): Promise<string> {
        console.log('   Using spectral filtering...');

        const sanitizedInput = this.sanitizePath(this.config.inputFile);
        const sanitizedOutput = this.sanitizePath(outputPath);

        // More aggressive spectral filtering for vocal isolation
        const command = `ffmpeg -i "${sanitizedInput}" -af "highpass=f=120,lowpass=f=4000,acompressor=threshold=-18dB:ratio=6:attack=3:release=40,highpass=f=200,lowpass=f=3500" ${this.getQualityParam()} "${sanitizedOutput}" -y`;

        await execAsync(command);
        console.log('   ✅ Spectral filtering completed');
        return outputPath;
    }

    /**
     * Extract vocals using hybrid approach
     */
    private async extractHybrid(outputPath: string): Promise<string> {
        console.log('   Using hybrid extraction (center + spectral)...');

        const sanitizedInput = this.sanitizePath(this.config.inputFile);
        const sanitizedOutput = this.sanitizePath(outputPath);

        // Most aggressive hybrid approach with multiple filtering stages
        const command = `ffmpeg -i "${sanitizedInput}" -af "pan=mono|c0=c0+c1,highpass=f=80,lowpass=f=8000,acompressor=threshold=-15dB:ratio=3:attack=3:release=100,highpass=f=150,lowpass=f=5000,acompressor=threshold=-12dB:ratio=8:attack=1:release=30" ${this.getQualityParam()} "${sanitizedOutput}" -y`;

        await execAsync(command);
        console.log('   ✅ Hybrid extraction completed');
        return outputPath;
    }

    /**
     * Extract vocals using Demucs AI model
     */
    private async extractDemucs(outputPath: string): Promise<string> {
        console.log('   Using Demucs AI model for vocal separation...');

        const sanitizedInput = this.sanitizePath(this.config.inputFile);
        const inputDir = path.dirname(sanitizedInput);
        const baseName = path.basename(sanitizedInput, path.extname(sanitizedInput));

        try {
            // Check if demucs is available
            await execAsync('which demucs');
        } catch (error) {
            throw new Error('Demucs not installed. Install with: pip install demucs');
        }

        console.log('   Running Demucs AI separation (this may take a few minutes)...');

        // Run demucs with two-stems=vocals to get vocals and no_vocals
        // Use absolute path for output to avoid path issues
        const demucsCmd = `demucs --two-stems=vocals -o "${inputDir}" "${sanitizedInput}"`;
        await execAsync(demucsCmd, { 
            maxBuffer: 1024 * 1024 * 10 
        });

        // Find the vocals output file - try multiple possible paths
        const possiblePaths = [
            path.join(inputDir, 'htdemucs', baseName, 'vocals.wav'),
            path.join(inputDir, 'separated', 'htdemucs', baseName, 'vocals.wav'),
            path.join(inputDir, 'htdemucs', baseName, 'vocals.mp3'),
            path.join(inputDir, 'separated', 'htdemucs', baseName, 'vocals.mp3'),
            path.join(inputDir, 'htdemucs', baseName, 'vocals.flac'),
            path.join(inputDir, 'separated', 'htdemucs', baseName, 'vocals.flac')
        ];

        let vocalsFile = '';
        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
                vocalsFile = possiblePath;
                break;
            }
        }

        if (!vocalsFile) {
            // List the actual directory structure for debugging
            try {
                const possibleDirs = [
                    path.join(inputDir, 'htdemucs'),
                    path.join(inputDir, 'separated', 'htdemucs')
                ];
                
                for (const dir of possibleDirs) {
                    if (fs.existsSync(dir)) {
                        const files = fs.readdirSync(dir);
                        console.log(`   Available in ${dir}:`, files);
                    }
                }
            } catch (e) {
                // Ignore directory listing errors
            }
            throw new Error('Demucs output not found. Check Demucs installation and input file.');
        }

        // Convert vocals to MP3 with desired quality
        console.log('   Converting to MP3...');
        const convertCmd = `ffmpeg -i "${vocalsFile}" ${this.getQualityParam()} "${outputPath}" -y`;
        await execAsync(convertCmd);

        console.log('   ✅ Demucs AI extraction completed');
        return outputPath;
    }

    /**
     * Extract vocals using advanced ML-based approach (two-pass)
     */
    private async extractAdvanced(outputPath: string): Promise<string> {
        console.log('   Using advanced multi-pass extraction...');

        const sanitizedInput = this.sanitizePath(this.config.inputFile);
        const sanitizedOutput = this.sanitizePath(outputPath);
        const tempFile = sanitizedOutput.replace('.mp3', '-temp.mp3');

        // First pass: Aggressive center channel extraction
        const pass1Command = `ffmpeg -i "${sanitizedInput}" -af "pan=mono|c0=c0+c1,highpass=f=100,lowpass=f=6000,acompressor=threshold=-25dB:ratio=8:attack=1:release=100" ${this.getQualityParam()} "${tempFile}" -y`;
        await execAsync(pass1Command);

        // Second pass: Additional vocal enhancement without deesser
        const pass2Command = `ffmpeg -i "${tempFile}" -af "highpass=f=200,lowpass=f=4000,acompressor=threshold=-10dB:ratio=10:attack=0.5:release=50,highpass=f=250,lowpass=f=3500,acompressor=threshold=-8dB:ratio=12:attack=0.3:release=40" ${this.getQualityParam()} "${sanitizedOutput}" -y`;
        await execAsync(pass2Command);

        // Clean up temp file
        try {
            await execAsync(`rm "${tempFile}"`);
        } catch (e) {
            // Ignore cleanup errors
        }

        console.log('   ✅ Advanced extraction completed');
        return outputPath;
    }

    /**
     * Get quality bitrate for FFmpeg
     */
    private getQualityBitrate(): number {
        switch (this.config.quality) {
            case 'low':
                return 96;
            case 'medium':
                return 128;
            case 'high':
                return 192;
            default:
                return 128;
        }
    }

    /**
     * Get FFmpeg quality parameter
     */
    private getQualityParam(): string {
        return `-q:a ${this.getQualityBitrate()}`;
    }

    /**
     * Generate output filename based on input file
     */
    private generateOutputFileName(inputFile: string): string {
        const basename = path.basename(inputFile, path.extname(inputFile));
        // Sanitize basename to remove invalid characters
        const sanitizedBasename = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
        return `${sanitizedBasename}-voice-only.mp3`;
    }

    /**
     * Sanitize file path for shell commands
     */
    private sanitizePath(filePath: string): string {
        return filePath.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    }

    /**
     * Validate configuration
     */
    private validateConfig(config: VoiceExtractorConfig): void {
        if (!config.inputFile) {
            throw new Error('Input file path is required');
        }

        if (!fs.existsSync(config.inputFile)) {
            throw new Error(`Input file not found: ${config.inputFile}`);
        }

        const ext = path.extname(config.inputFile).toLowerCase();
        const validExts = ['.mp3', '.wav', '.m4a', '.flac', '.aac'];
        if (!validExts.includes(ext)) {
            throw new Error(`Unsupported file format: ${ext}. Supported: ${validExts.join(', ')}`);
        }

        if (config.method && !['center', 'spectral', 'hybrid', 'advanced', 'demucs'].includes(config.method)) {
            throw new Error(`Invalid method: ${config.method}. Supported: center, spectral, hybrid, advanced, demucs`);
        }

        if (config.quality && !['low', 'medium', 'high'].includes(config.quality)) {
            throw new Error(`Invalid quality: ${config.quality}. Supported: low, medium, high`);
        }
    }

    /**
     * Get information about the extracted audio
     */
    async getAudioInfo(): Promise<{ duration: number; bitrate: number; sampleRate: number }> {
        const outputPath = path.join(this.config.outputDir!, this.config.outputFile!);

        if (!fs.existsSync(outputPath)) {
            throw new Error(`Extracted audio file not found: ${outputPath}`);
        }

        const sanitizedOutput = this.sanitizePath(outputPath);
        
        // Get duration
        const durationCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${sanitizedOutput}"`;
        const { stdout: durationOutput } = await execAsync(durationCommand);
        const duration = parseFloat(durationOutput.trim());

        // Get bitrate and sample rate
        const infoCommand = `ffprobe -v error -show_entries stream=bit_rate,sample_rate -of default=noprint_wrappers=1:nokey=1 "${sanitizedOutput}"`;
        const { stdout: infoOutput } = await execAsync(infoCommand);
        const [bitrate, sampleRate] = infoOutput.trim().split('\n').map(line => parseInt(line));

        return {
            duration: isNaN(duration) ? 0 : duration,
            bitrate: isNaN(bitrate) ? 0 : bitrate,
            sampleRate: isNaN(sampleRate) ? 0 : sampleRate
        };
    }

    /**
     * Extract voice and return info in one call
     */
    async extractWithInfo(): Promise<{ outputPath: string; info: { duration: number; bitrate: number; sampleRate: number } }> {
        const outputPath = await this.extract();
        const info = await this.getAudioInfo();

        console.log(`   Duration: ${info.duration.toFixed(1)}s`);
        console.log(`   Bitrate: ${info.bitrate} bps`);
        console.log(`   Sample Rate: ${info.sampleRate} Hz`);

        return { outputPath, info };
    }
}
