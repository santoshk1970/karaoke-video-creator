#!/bin/bash

# Extract short clips from generated videos
# Shows countdown to first lyric

echo "🎬 Extracting video clips for demo..."
echo ""

# Directories
PROJECT_DIR="/Users/santosh/development/pointless-game/lyric-sync/projects/MyFirstSong"
OUTPUT_DIR="/Users/santosh/development/pointless-game/imagesForDemo"

# Check if videos exist
KARAOKE_VIDEO="$PROJECT_DIR/output/karaoke.mp4"
SINGALONG_VIDEO="$PROJECT_DIR/output/singalong.mp4"

if [ ! -f "$KARAOKE_VIDEO" ]; then
    echo "❌ Karaoke video not found: $KARAOKE_VIDEO"
    exit 1
fi

if [ ! -f "$SINGALONG_VIDEO" ]; then
    echo "❌ Sing-along video not found: $SINGALONG_VIDEO"
    exit 1
fi

echo "✓ Found karaoke video"
echo "✓ Found sing-along video"
echo ""

# Extract first 10 seconds (countdown + first lyric)
# Adjust duration as needed

echo "Extracting Karaoke clip (0:00 - 0:10)..."
ffmpeg -i "$KARAOKE_VIDEO" \
    -ss 0 \
    -t 10 \
    -c:v libx264 -crf 18 -preset slow \
    -c:a aac -b:a 192k \
    "$OUTPUT_DIR/karaoke-clip.mp4" \
    -y 2>&1 | grep -E "time=|Duration"

echo ""
echo "✓ Karaoke clip created"
echo ""

echo "Extracting Sing-along clip (0:00 - 0:10)..."
ffmpeg -i "$SINGALONG_VIDEO" \
    -ss 0 \
    -t 10 \
    -c:v libx264 -crf 18 -preset slow \
    -c:a aac -b:a 192k \
    "$OUTPUT_DIR/singalong-clip.mp4" \
    -y 2>&1 | grep -E "time=|Duration"

echo ""
echo "✓ Sing-along clip created"
echo ""

# Get file sizes
KARAOKE_SIZE=$(du -h "$OUTPUT_DIR/karaoke-clip.mp4" | cut -f1)
SINGALONG_SIZE=$(du -h "$OUTPUT_DIR/singalong-clip.mp4" | cut -f1)

echo "═══════════════════════════════════════════════════════"
echo "✅ Video clips extracted successfully!"
echo ""
echo "📁 Output location: $OUTPUT_DIR"
echo ""
echo "📊 Files created:"
echo "   • karaoke-clip.mp4 ($KARAOKE_SIZE)"
echo "   • singalong-clip.mp4 ($SINGALONG_SIZE)"
echo ""
echo "🎬 Duration: 10 seconds each"
echo "   Shows: Countdown → First lyric"
echo ""
echo "Next steps:"
echo "   1. Review the clips"
echo "   2. Update create-demo-video.js to include them"
echo "═══════════════════════════════════════════════════════"
