#!/bin/bash

# Convert to Apple ProRes (iMovie's native format)

INPUT_DIR="/Users/santosh/development/pointless-game/imagesForDemo"

echo "🎬 Converting to Apple ProRes (iMovie native format)..."
echo ""

# Karaoke clip
echo "Converting karaoke-clip.mp4 to ProRes..."
ffmpeg -i "${INPUT_DIR}/karaoke-clip.mp4" \
    -c:v prores_ks -profile:v 3 -vendor apl0 -bits_per_mb 8000 -pix_fmt yuv422p10le \
    -c:a pcm_s16le -ar 48000 -ac 2 \
    "${INPUT_DIR}/karaoke-clip-prores.mov" -y

echo "✓ Created karaoke-clip-prores.mov"
echo ""

# Singalong clip
echo "Converting singalong-clip.mp4 to ProRes..."
ffmpeg -i "${INPUT_DIR}/singalong-clip.mp4" \
    -c:v prores_ks -profile:v 3 -vendor apl0 -bits_per_mb 8000 -pix_fmt yuv422p10le \
    -c:a pcm_s16le -ar 48000 -ac 2 \
    "${INPUT_DIR}/singalong-clip-prores.mov" -y

echo "✓ Created singalong-clip-prores.mov"
echo ""

echo "✅ Done! ProRes files created:"
echo "   • karaoke-clip-prores.mov"
echo "   • singalong-clip-prores.mov"
echo ""
echo "⚠️  Note: ProRes files are LARGE but guaranteed to work in iMovie"
echo ""
