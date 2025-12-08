#!/usr/bin/env node

/**
 * Test script to compare different TTS voices
 * Generates a short sample with each voice for comparison
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, 'voice-samples');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const TEST_TEXT = 'Welcome to Karaoke Video Creator - a powerful tool that transforms your song lyrics into professional karaoke and sing-along videos.';

async function testOpenAIVoices() {
    console.log('🎙️  Testing OpenAI TTS Voices\n');
    
    if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  OPENAI_API_KEY not set. Skipping OpenAI voices.\n');
        return;
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    
    console.log('Generating samples for all OpenAI voices...\n');
    
    for (const voice of voices) {
        const outputFile = path.join(OUTPUT_DIR, `openai-${voice}.mp3`);
        
        try {
            console.log(`  Generating: ${voice}...`);
            
            const mp3 = await openai.audio.speech.create({
                model: 'tts-1-hd',
                voice: voice,
                input: TEST_TEXT,
                speed: 1.0
            });
            
            const buffer = Buffer.from(await mp3.arrayBuffer());
            await fs.promises.writeFile(outputFile, buffer);
            
            const stats = fs.statSync(outputFile);
            const sizeKB = (stats.size / 1024).toFixed(2);
            
            console.log(`    ✓ ${voice}: ${sizeKB} KB\n`);
            
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error(`    ✗ Error with ${voice}:`, error.message, '\n');
        }
    }
    
    console.log('✅ OpenAI voices generated!\n');
}

function testMacOSVoices() {
    console.log('🎙️  Testing macOS TTS Voices\n');
    
    // Popular macOS voices
    const voices = [
        { name: 'Samantha', description: 'Female, clear' },
        { name: 'Alex', description: 'Male, clear' },
        { name: 'Victoria', description: 'Female, British' },
        { name: 'Daniel', description: 'Male, British' },
        { name: 'Karen', description: 'Female, Australian' }
    ];
    
    console.log('Generating samples for macOS voices...\n');
    
    for (const voice of voices) {
        const outputFile = path.join(OUTPUT_DIR, `macos-${voice.name}.aiff`);
        
        try {
            console.log(`  Generating: ${voice.name} (${voice.description})...`);
            
            execSync(`say -v "${voice.name}" -o "${outputFile}" "${TEST_TEXT}"`, {
                stdio: 'pipe'
            });
            
            const stats = fs.statSync(outputFile);
            const sizeKB = (stats.size / 1024).toFixed(2);
            
            console.log(`    ✓ ${voice.name}: ${sizeKB} KB\n`);
            
        } catch (error) {
            console.error(`    ✗ Error with ${voice.name}:`, error.message, '\n');
        }
    }
    
    console.log('✅ macOS voices generated!\n');
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎤 Voice Comparison Tool');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`Test text: "${TEST_TEXT}"\n`);
    console.log(`Output directory: ${OUTPUT_DIR}\n`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Test OpenAI voices
    await testOpenAIVoices();
    
    // Test macOS voices
    testMacOSVoices();
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ All voice samples generated!\n');
    console.log('📁 Samples saved to:', OUTPUT_DIR);
    console.log('\n🎧 Listen to the samples to compare:');
    console.log(`   open ${OUTPUT_DIR}\n`);
    console.log('💡 Recommendations:');
    console.log('   • OpenAI "nova" - Best for engaging demos');
    console.log('   • OpenAI "alloy" - Best for technical content');
    console.log('   • macOS "Samantha" - Best free option\n');
    console.log('═══════════════════════════════════════════════════════');
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
