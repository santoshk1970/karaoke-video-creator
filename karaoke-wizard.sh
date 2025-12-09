#!/bin/bash

###############################################################################
# Karaoke Wizard - Complete Karaoke Video Creation Pipeline
#
# Usage: ./karaoke-wizard.sh <project-folder>
#
# Pipeline:
#   1. Validate input (audio + lyrics)
#   2. Interactive timing (spacebar marking)
#   3. Vocal separation (Demucs)
#   4. Image generation
#   5. Video creation (original + novocals)
#
# Features:
#   - Auto-insert countdown for instrumentals >10s
#   - Real-time timing with visual feedback
#   - Undo capability
#   - Dual video output (original + karaoke)
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
COUNTDOWN_THRESHOLD=10

# Functions
print_header() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}🎵 Karaoke Wizard${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_step() {
    echo -e "\n${BLUE}▶ Step $1: $2${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ Error: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Validate input
if [ $# -eq 0 ]; then
    print_error "No project folder specified"
    echo "Usage: ./karaoke-wizard.sh <project-folder>"
    echo "Example: ./karaoke-wizard.sh ./my-song"
    exit 1
fi

PROJECT_FOLDER="$1"

if [ ! -d "$PROJECT_FOLDER" ]; then
    print_error "Folder not found: $PROJECT_FOLDER"
    exit 1
fi

print_header

# Step 1: Validate files
print_step "1" "Validating input files"

# Find audio file
AUDIO_FILE=$(find "$PROJECT_FOLDER" -maxdepth 1 -type f \( -iname "*.mp3" -o -iname "*.wav" -o -iname "*.m4a" -o -iname "*.flac" \) | head -n 1)

if [ -z "$AUDIO_FILE" ]; then
    print_error "No audio file found in $PROJECT_FOLDER"
    echo "Supported formats: mp3, wav, m4a, flac"
    exit 1
fi

# Find lyrics file
LYRICS_FILE=$(find "$PROJECT_FOLDER" -maxdepth 1 -type f \( -name "*lyrics*.txt" -o -name "lyrics.txt" \) | head -n 1)

if [ -z "$LYRICS_FILE" ]; then
    print_error "No lyrics file found in $PROJECT_FOLDER"
    echo "Expected: lyrics.txt or *lyrics*.txt"
    exit 1
fi

# Get audio duration
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_FILE" 2>/dev/null | cut -d. -f1)
LYRIC_COUNT=$(wc -l < "$LYRICS_FILE" | tr -d ' ')

print_success "Found: $(basename "$AUDIO_FILE") (${DURATION}s)"
print_success "Found: $(basename "$LYRICS_FILE") ($LYRIC_COUNT lines)"

# Step 2: Interactive timing
print_step "2" "Interactive timing"

echo "Instructions:"
echo "  • Listen to the song"
echo "  • Press SPACEBAR when each lyric line starts"
echo "  • Press BACKSPACE to undo last mark"
echo "  • Press Q when finished"
echo ""
echo "Note: Countdown slides will be auto-inserted for instrumentals >10s"
echo ""

read -p "Ready to start? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Timing cancelled"
    exit 0
fi

# Run timing tool
npx ts-node src/timing-tool.ts "$PROJECT_FOLDER"

if [ $? -ne 0 ]; then
    print_error "Timing failed"
    exit 1
fi

# Check if timing file was created
TIMING_FILE="$PROJECT_FOLDER/set-manual-timing.js"
UPDATED_LYRICS="$PROJECT_FOLDER/lyrics-with-timing.txt"

if [ ! -f "$TIMING_FILE" ]; then
    print_error "Timing file not generated"
    exit 1
fi

print_success "Timing complete"

# Step 3: Vocal separation
print_step "3" "Separating vocals (this may take 3-5 minutes)"

OUTPUT_DIR="$PROJECT_FOLDER/output"
mkdir -p "$OUTPUT_DIR"

# Run Demucs
./separate-and-convert.sh "$AUDIO_FILE" "$OUTPUT_DIR"

if [ $? -ne 0 ]; then
    print_error "Vocal separation failed"
    exit 1
fi

BASENAME=$(basename "$AUDIO_FILE" | sed 's/\.[^.]*$//')
NOVOCALS_FILE="$OUTPUT_DIR/Novocals-$BASENAME.mp3"

if [ ! -f "$NOVOCALS_FILE" ]; then
    print_error "Novocals file not created"
    exit 1
fi

print_success "Vocal separation complete"

# Step 4: Generate images
print_step "4" "Generating lyric images"

npm start -- "$AUDIO_FILE" "$UPDATED_LYRICS" --output "$OUTPUT_DIR"

if [ $? -ne 0 ]; then
    print_error "Image generation failed"
    exit 1
fi

print_success "Images generated"

# Step 5: Apply manual timing
print_step "5" "Applying manual timing"

cd "$PROJECT_FOLDER"
node set-manual-timing.js

if [ $? -ne 0 ]; then
    print_error "Failed to apply timing"
    exit 1
fi

cd - > /dev/null

print_success "Timing applied"

# Step 6: Create videos
print_step "6" "Creating videos"

echo "Generating video 1/2: Original audio..."
npm run video "$AUDIO_FILE" "$OUTPUT_DIR"

if [ $? -ne 0 ]; then
    print_error "Original video creation failed"
    exit 1
fi

# Rename original video
mv "$OUTPUT_DIR/output.mp4" "$OUTPUT_DIR/Original-$BASENAME.mp4"

echo ""
echo "Generating video 2/2: Karaoke (no vocals)..."
npm run video "$NOVOCALS_FILE" "$OUTPUT_DIR"

if [ $? -ne 0 ]; then
    print_error "Karaoke video creation failed"
    exit 1
fi

# Rename karaoke video
mv "$OUTPUT_DIR/output.mp4" "$OUTPUT_DIR/Karaoke-$BASENAME.mp4"

print_success "Videos created"

# Final summary
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Karaoke creation complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "📂 Output files:"
echo "   📹 Original:  $OUTPUT_DIR/Original-$BASENAME.mp4"
echo "   🎤 Karaoke:   $OUTPUT_DIR/Karaoke-$BASENAME.mp4"
echo "   🎵 Vocals:    $OUTPUT_DIR/Vocals-$BASENAME.mp3"
echo "   🎼 Novocals:  $OUTPUT_DIR/Novocals-$BASENAME.mp3"
echo ""

# Get file sizes
ORIGINAL_SIZE=$(du -h "$OUTPUT_DIR/Original-$BASENAME.mp4" | cut -f1)
KARAOKE_SIZE=$(du -h "$OUTPUT_DIR/Karaoke-$BASENAME.mp4" | cut -f1)

echo "📊 File sizes:"
echo "   Original video: $ORIGINAL_SIZE"
echo "   Karaoke video:  $KARAOKE_SIZE"
echo ""

echo "💡 Tips:"
echo "   • To adjust timing: node adjust-timing.js --interactive"
echo "   • To regenerate videos: npm run video <audio-file> $OUTPUT_DIR"
echo ""
