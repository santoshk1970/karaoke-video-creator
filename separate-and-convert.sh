#!/bin/bash

# Vocal Separation + MP3 Conversion Script
# Usage: ./separate-and-convert.sh <input-audio-file> [output-dir]

if [ $# -eq 0 ]; then
    echo "❌ Error: No input file specified"
    echo "Usage: ./separate-and-convert.sh <audio-file> [output-dir]"
    echo "Example: ./separate-and-convert.sh './data/my-song.mp3' './data'"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_DIR="${2:-./data}"

if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Error: File not found: $INPUT_FILE"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "🎵 Separating vocals from: $INPUT_FILE"
echo "📁 Output directory: $OUTPUT_DIR"
echo "⏳ This may take a few minutes..."
echo ""

# Run Demucs with the best model (htdemucs)
demucs --two-stems=vocals "$INPUT_FILE"

# Get the base filename without extension
BASENAME=$(basename "$INPUT_FILE" | sed 's/\.[^.]*$//')

# Check if separation was successful
if [ ! -f "separated/htdemucs/$BASENAME/no_vocals.wav" ]; then
    echo "❌ Error: Separation failed"
    exit 1
fi

echo ""
echo "✅ Separation complete!"
echo ""
echo "🔄 Converting to MP3..."

# Convert no_vocals to MP3
ffmpeg -i "separated/htdemucs/$BASENAME/no_vocals.wav" \
       -codec:a libmp3lame -qscale:a 2 \
       "$OUTPUT_DIR/Novocals-$BASENAME.mp3" \
       -y -loglevel error

# Convert vocals to MP3 (optional, but useful)
ffmpeg -i "separated/htdemucs/$BASENAME/vocals.wav" \
       -codec:a libmp3lame -qscale:a 2 \
       "$OUTPUT_DIR/Vocals-$BASENAME.mp3" \
       -y -loglevel error

echo ""
echo "✅ All done!"
echo ""
echo "📂 Output files:"
echo "   🎤 Vocals only:     $OUTPUT_DIR/Vocals-$BASENAME.mp3"
echo "   🎵 No vocals:       $OUTPUT_DIR/Novocals-$BASENAME.mp3"
echo ""
echo "🎬 Ready for karaoke video:"
echo "   npm start -- '$OUTPUT_DIR/Novocals-$BASENAME.mp3' './data/lyrics-with-transliteration.txt' --output './output'"
