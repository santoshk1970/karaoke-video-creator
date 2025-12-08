#!/bin/bash

# Final attempt: Extract clips from original videos with maximum compatibility

PROJECT_DIR="/Users/santosh/development/pointless-game/lyric-sync/projects/MyFirstSong"
OUTPUT_DIR="/Users/santosh/development/pointless-game/imagesForDemo"

echo "🎬 Final Attempt: Extracting clips with maximum iMovie compatibility..."
echo ""

# Check if original videos exist
if [ ! -f "${PROJECT_DIR}/karaoke.mp4" ]; then
    echo "❌ karaoke.mp4 not found in project"
    exit 1
fi

if [ ! -f "${PROJECT_DIR}/singalong.mp4" ]; then
    echo "❌ singalong.mp4 not found in project"
    exit 1
fi

# Extract karaoke clip (0-10 seconds)
echo "Extracting karaoke clip (0-10s)..."
ffmpeg -ss 0 -i "${PROJECT_DIR}/karaoke.mp4" -t 10 \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p" \
    -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
    -c:a aac -b:a 256k -ar 48000 -ac 2 \
    -movflags +faststart \
    "${OUTPUT_DIR}/karaoke-final.mov" -y

echo "✓ Created karaoke-final.mov"
echo ""

# Extract singalong clip (0-10 seconds)
echo "Extracting singalong clip (0-10s)..."
ffmpeg -ss 0 -i "${PROJECT_DIR}/singalong.mp4" -t 10 \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p" \
    -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
    -c:a aac -b:a 256k -ar 48000 -ac 2 \
    -movflags +faststart \
    "${OUTPUT_DIR}/singalong-final.mov" -y

echo "✓ Created singalong-final.mov"
echo ""

echo "✅ Done! Try these .mov files in iMovie:"
echo "   • karaoke-final.mov"
echo "   • singalong-final.mov"
echo ""
echo "If these still don't work, proceed without video clips."
echo ""
