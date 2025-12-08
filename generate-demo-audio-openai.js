#!/usr/bin/env node

/**
 * Generate audio files for demo video using OpenAI TTS API
 * Much higher quality than macOS 'say' command
 * 
 * Setup:
 * 1. Install OpenAI SDK: npm install openai
 * 2. Set your API key: export OPENAI_API_KEY='your-key-here'
 * 3. Run: node generate-demo-audio-openai.js
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // Set this in your environment
});

// Output directory for audio files
const OUTPUT_DIR = path.join(__dirname, 'demo-audio');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Scene narrations
const scenes = [
    {
        id: 1,
        name: 'landing-page',
        duration: 8,
        text: 'Welcome to Karaoke Video Creator - a powerful tool that transforms your song lyrics into professional karaoke and sing-along videos. Let\'s see how easy it is to create your first project.'
    },
    {
        id: 2,
        name: 'create-project-empty',
        duration: 8,
        text: 'Creating a project is simple. You\'ll need three things: a project name, at least one audio file - either the original with vocals for sing-along videos, or an instrumental version for karaoke - and your lyrics file.'
    },
    {
        id: 3,
        name: 'create-project-filled',
        duration: 10,
        text: 'Here we\'ve uploaded both audio versions - the original with vocals and the instrumental without vocals - along with our lyrics file. The system supports Hindi and English transliteration format. Now we\'re ready to create our project.'
    },
    {
        id: 4,
        name: 'ready-to-time',
        duration: 10,
        text: 'Great! Our project is created. Notice both audio files are confirmed with green checkmarks. The first step is to time our lyrics. Click \'Start Timing Tool\' to open the interactive timing interface.'
    },
    {
        id: 5,
        name: 'timing-tool',
        duration: 20,
        text: 'The timing tool features a split-screen layout. On the left, you see the current lyric line with playback controls. Simply press the spacebar when you hear each line. The right panel shows all your lyrics, with the current line highlighted and completed lines marked with strikethrough. This makes it easy to track your progress through the entire song.'
    },
    {
        id: 6,
        name: 'ready-to-generate-images',
        duration: 12,
        text: 'Once all lyrics are timed, return to the project dashboard. Step 1 is now complete with a green checkmark. The console shows our timing was successful - 32 lines marked across 44 segments. Now we can generate the lyric images by clicking \'Generate Images\'.'
    },
    {
        id: 7,
        name: 'images-generated',
        duration: 12,
        text: 'The system generates beautiful lyric slides with your dual-language text. Watch the progress in the console - it processes each segment and creates high-quality images. With 44 images generated successfully, we can now apply the precise timing data.'
    },
    {
        id: 8,
        name: 'ready-to-create-videos',
        duration: 15,
        text: 'Now comes the exciting part! With our images ready, we can create both video types. The blue \'Create Karaoke Video\' button uses the instrumental audio - perfect for singing along without vocals. The purple \'Create Sing-along Video\' button uses the original audio with vocals - great for learning the song. You can create one or both videos.'
    },
    {
        id: 9,
        name: 'videos-complete',
        duration: 20,
        text: 'Both videos are now created! The console shows the encoding process - reading timestamps, verifying images, and generating the final video files. Each video is saved separately: karaoke dot mp4 and singalong dot mp4. Notice both sections now show green checkmarks, and the play buttons are enabled. Click either button to watch your creation!'
    },
    {
        id: 10,
        name: 'closing-summary',
        duration: 15,
        text: 'And that\'s it! In just a few simple steps, you\'ve created professional karaoke and sing-along videos with multi-line lyrics, perfect timing, and beautiful presentation. Whether you\'re practicing for karaoke night or learning a new song, Karaoke Video Creator makes it easy. Try it today!'
    }
];

/**
 * OpenAI TTS Voice Options:
 * 
 * - alloy: Neutral, balanced (good for technical content)
 * - echo: Male, clear and direct
 * - fable: British accent, expressive
 * - onyx: Deep male voice, authoritative
 * - nova: Warm female voice, engaging (RECOMMENDED for demos)
 * - shimmer: Soft female voice, friendly
 * 
 * Model Options:
 * - tts-1: Standard quality, faster, cheaper ($0.015/1K chars)
 * - tts-1-hd: High definition, better quality ($0.030/1K chars)
 */

const VOICE = 'nova';  // Recommended: warm, engaging female voice
const MODEL = 'tts-1-hd';  // Use HD for best quality
const SPEED = 1.0;  // 0.25 to 4.0 (1.0 is normal speed)

async function generateAudio(scene, index, total) {
    const outputFile = path.join(OUTPUT_DIR, `scene-${scene.id}-${scene.name}.mp3`);
    
    console.log(`[${index + 1}/${total}] Generating: ${scene.name}...`);
    console.log(`    Text: "${scene.text.substring(0, 60)}..."`);
    
    try {
        // Call OpenAI TTS API
        const mp3 = await openai.audio.speech.create({
            model: MODEL,
            voice: VOICE,
            input: scene.text,
            speed: SPEED
        });
        
        // Convert response to buffer
        const buffer = Buffer.from(await mp3.arrayBuffer());
        
        // Save to file
        await fs.promises.writeFile(outputFile, buffer);
        
        console.log(`    ✓ Created: ${path.basename(outputFile)}`);
        
        // Get file size
        const stats = fs.statSync(outputFile);
        const fileSizeKB = (stats.size / 1024).toFixed(2);
        console.log(`    Size: ${fileSizeKB} KB`);
        
        // Estimate cost (approximate)
        const charCount = scene.text.length;
        const costPer1K = MODEL === 'tts-1-hd' ? 0.030 : 0.015;
        const cost = (charCount / 1000) * costPer1K;
        console.log(`    Cost: ~$${cost.toFixed(4)} (${charCount} chars)\n`);
        
        return { success: true, cost, chars: charCount };
        
    } catch (error) {
        console.error(`    ✗ Error generating ${scene.name}:`, error.message);
        return { success: false, cost: 0, chars: 0 };
    }
}

async function main() {
    console.log('🎙️  OpenAI TTS Audio Generator for Demo Video\n');
    console.log(`Voice: ${VOICE}`);
    console.log(`Model: ${MODEL}`);
    console.log(`Speed: ${SPEED}x`);
    console.log(`Output: ${OUTPUT_DIR}\n`);
    
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ Error: OPENAI_API_KEY environment variable not set');
        console.error('\nTo set your API key:');
        console.error('  export OPENAI_API_KEY="your-api-key-here"');
        console.error('\nOr add to your ~/.zshrc or ~/.bashrc:');
        console.error('  echo \'export OPENAI_API_KEY="your-key"\' >> ~/.zshrc');
        console.error('\nGet your API key from: https://platform.openai.com/api-keys\n');
        process.exit(1);
    }
    
    console.log('✓ API key found\n');
    console.log('Generating audio files...\n');
    
    let totalCost = 0;
    let totalChars = 0;
    let successCount = 0;
    
    // Generate audio for each scene
    for (let i = 0; i < scenes.length; i++) {
        const result = await generateAudio(scenes[i], i, scenes.length);
        if (result.success) {
            successCount++;
            totalCost += result.cost;
            totalChars += result.chars;
        }
        
        // Small delay to avoid rate limits
        if (i < scenes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Audio generation complete!\n');
    console.log(`📊 Statistics:`);
    console.log(`   • Files created: ${successCount}/${scenes.length}`);
    console.log(`   • Total characters: ${totalChars.toLocaleString()}`);
    console.log(`   • Estimated cost: $${totalCost.toFixed(4)}`);
    console.log(`   • Model: ${MODEL}`);
    console.log(`   • Voice: ${VOICE}`);
    console.log(`\n📁 Audio files saved to: ${OUTPUT_DIR}`);
    console.log('\n📝 Next steps:');
    console.log('   1. Review the generated audio files');
    console.log('   2. Run: node create-demo-video.js');
    console.log('   3. Or run: ./make-demo.sh (skip audio generation)');
}

// Run the generator
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
