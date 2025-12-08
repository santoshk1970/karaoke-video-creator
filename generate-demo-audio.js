#!/usr/bin/env node

/**
 * Generate audio files for demo video using macOS 'say' command
 * Each scene gets its own audio file
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

console.log('🎙️  Generating demo audio files using macOS TTS...\n');

// Voice options: Alex, Samantha, Victoria, Karen, Daniel, Fiona
// Using Samantha for a clear, professional female voice
const voice = 'Samantha';
const rate = 180; // Words per minute (default is 175, slightly faster for engagement)

scenes.forEach((scene, index) => {
    const outputFile = path.join(OUTPUT_DIR, `scene-${scene.id}-${scene.name}.aiff`);
    
    console.log(`[${index + 1}/${scenes.length}] Generating: ${scene.name}...`);
    
    try {
        // Generate audio using macOS 'say' command
        execSync(`say -v "${voice}" -r ${rate} -o "${outputFile}" "${scene.text}"`, {
            stdio: 'inherit'
        });
        
        console.log(`    ✓ Created: ${path.basename(outputFile)}`);
        
        // Get file size
        const stats = fs.statSync(outputFile);
        const fileSizeKB = (stats.size / 1024).toFixed(2);
        console.log(`    Size: ${fileSizeKB} KB\n`);
        
    } catch (error) {
        console.error(`    ✗ Error generating ${scene.name}:`, error.message);
    }
});

console.log('✅ Audio generation complete!');
console.log(`📁 Audio files saved to: ${OUTPUT_DIR}`);
console.log('\n📝 Next steps:');
console.log('   1. Review the generated audio files');
console.log('   2. Use video editing software to combine with images');
console.log('   3. Or run the video assembly script to create the final video');
