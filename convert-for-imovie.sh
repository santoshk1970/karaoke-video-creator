#!/bin/bash

# Convert video clips to iMovie-compatible format
# iMovie prefers: H.264, AAC audio, MP4 container, specific settings

INPUT_DIR="/Users/santosh/development/pointless-game/imagesForDemo"
OUTPUT_DIR="/Users/santosh/development/pointless-game/imagesForDemo"

echo "🎬 Converting videos for iMovie compatibility..."
echo ""

# Convert karaoke clip
echo "Converting karaoke-clip.mp4..."
ffmpeg -i "${INPUT_DIR}/karaoke-clip.mp4" \
    -c:v libx264 -profile:v high -level:v 4.0 \
    -pix_fmt yuv420p -preset slow -crf 18 \
    -c:a aac -b:a 256k -ar 48000 -ac 2 \
    -movflags +faststart \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1" \
    "${OUTPUT_DIR}/karaoke-clip-imovie.mp4" -y

echo "✓ Created karaoke-clip-imovie.mp4"
echo ""

# Convert singalong clip
echo "Converting singalong-clip.mp4..."
ffmpeg -i "${INPUT_DIR}/singalong-clip.mp4" \
    -c:v libx264 -profile:v high -level:v 4.0 \
    -pix_fmt yuv420p -preset slow -crf 18 \
    -c:a aac -b:a 256k -ar 48000 -ac 2 \
    -movflags +faststart \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1" \
    "${OUTPUT_DIR}/singalong-clip-imovie.mp4" -y

echo "✓ Created singalong-clip-imovie.mp4"
echo ""

echo "✅ Done! Use these files in iMovie:"
echo "   • karaoke-clip-imovie.mp4"
echo "   • singalong-clip-imovie.mp4"
echo ""
