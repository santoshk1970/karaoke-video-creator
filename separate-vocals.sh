#!/bin/bash

# Vocal Separation Script using Demucs
# Usage: ./separate-vocals.sh <input-audio-file>

if [ $# -eq 0 ]; then
    echo "❌ Error: No input file specified"
    echo "Usage: ./separate-vocals.sh <audio-file>"
    echo "Example: ./separate-vocals.sh './data/my-song.mp3'"
    exit 1
fi

INPUT_FILE="$1"

if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Error: File not found: $INPUT_FILE"
    exit 1
fi

echo "🎵 Separating vocals from: $INPUT_FILE"
echo "⏳ This may take a few minutes..."
echo ""

# Run Demucs with the best model (htdemucs)
demucs --two-stems=vocals "$INPUT_FILE"

# Get the base filename without extension
BASENAME=$(basename "$INPUT_FILE" | sed 's/\.[^.]*$//')

echo ""
echo "✅ Separation complete!"
echo ""
echo "📂 Output files:"
echo "   Vocals:       separated/htdemucs/$BASENAME/vocals.wav"
echo "   No Vocals:    separated/htdemucs/$BASENAME/no_vocals.wav"
echo ""
echo "💡 Tip: Convert WAV to MP3 with:"
echo "   ffmpeg -i 'separated/htdemucs/$BASENAME/no_vocals.wav' 'data/Novocals-$BASENAME.mp3'"
