#!/bin/bash

# Master script to create the demo video
# Runs audio generation and video assembly

echo "🎬 Karaoke Video Creator - Demo Video Generator"
echo "================================================"
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ Error: ffmpeg is not installed"
    echo "Please install ffmpeg: brew install ffmpeg"
    exit 1
fi

echo "✓ ffmpeg found"
echo ""

# Step 1: Generate audio files
echo "Step 1: Generating audio narration..."
echo "--------------------------------------"
node generate-demo-audio.js

if [ $? -ne 0 ]; then
    echo "❌ Audio generation failed"
    exit 1
fi

echo ""
echo "✓ Audio generation complete"
echo ""

# Step 2: Create video
echo "Step 2: Assembling video..."
echo "--------------------------------------"
node create-demo-video.js

if [ $? -ne 0 ]; then
    echo "❌ Video creation failed"
    exit 1
fi

echo ""
echo "================================================"
echo "🎉 Demo video creation complete!"
echo ""
echo "📁 Output location: demo-output/karaoke-creator-demo.mp4"
echo ""
echo "Next steps:"
echo "  • Review the video"
echo "  • Upload to YouTube/Vimeo"
echo "  • Share with your users!"
echo ""
