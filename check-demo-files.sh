#!/bin/bash

# Check if all required files exist for demo video creation

echo "🔍 Checking Demo Video Files..."
echo "═══════════════════════════════════════════════════════"
echo ""

IMAGES_DIR="/Users/santosh/development/pointless-game/imagesForDemo"
AUDIO_DIR="/Users/santosh/development/pointless-game/lyric-sync/demo-audio"

# Required images
IMAGES=(
    "landingpage.png"
    "createNewProject.png"
    "createNewProjectWithFilesUploaded.png"
    "ReadyToUseTimingTool.png"
    "TimingToolnAction.png"
    "ReadyToGenerateImages.png"
    "ReadyToApplyTimings.png"
    "ReadyToCreateVideos.png"
    "VideosGeneratedReadtoPlay.png"
    "closing-slide.png"
)

# Required video clips
CLIPS=(
    "karaoke-clip.mp4"
    "singalong-clip.mp4"
)

# Required audio files
AUDIO=(
    "scene-1-landing-page.mp3"
    "scene-2-create-project-empty.mp3"
    "scene-3-create-project-filled.mp3"
    "scene-4-ready-to-time.mp3"
    "scene-5-timing-tool.mp3"
    "scene-6-ready-to-generate-images.mp3"
    "scene-7-images-generated.mp3"
    "scene-8-ready-to-create-videos.mp3"
    "scene-9-videos-complete.mp3"
    "scene-10-karaoke-demo.mp3"
    "scene-11-singalong-demo.mp3"
    "scene-12-closing-summary.mp3"
)

# Check images
echo "📸 Images (10 required):"
IMAGE_COUNT=0
for img in "${IMAGES[@]}"; do
    if [ -f "$IMAGES_DIR/$img" ]; then
        echo "  ✅ $img"
        ((IMAGE_COUNT++))
    else
        echo "  ❌ $img - MISSING"
    fi
done
echo "  Total: $IMAGE_COUNT/10"
echo ""

# Check video clips
echo "🎬 Video Clips (2 required):"
CLIP_COUNT=0
for clip in "${CLIPS[@]}"; do
    if [ -f "$IMAGES_DIR/$clip" ]; then
        SIZE=$(du -h "$IMAGES_DIR/$clip" | cut -f1)
        echo "  ✅ $clip ($SIZE)"
        ((CLIP_COUNT++))
    else
        echo "  ❌ $clip - MISSING"
    fi
done
echo "  Total: $CLIP_COUNT/2"
echo ""

# Check audio files
echo "🎙️  Audio Files (12 required):"
AUDIO_COUNT=0
for audio in "${AUDIO[@]}"; do
    if [ -f "$AUDIO_DIR/$audio" ]; then
        SIZE=$(du -h "$AUDIO_DIR/$audio" | cut -f1)
        echo "  ✅ $audio ($SIZE)"
        ((AUDIO_COUNT++))
    else
        echo "  ❌ $audio - MISSING"
    fi
done
echo "  Total: $AUDIO_COUNT/12"
echo ""

# Summary
echo "═══════════════════════════════════════════════════════"
TOTAL_FILES=$((IMAGE_COUNT + CLIP_COUNT + AUDIO_COUNT))
REQUIRED_FILES=24

if [ $TOTAL_FILES -eq $REQUIRED_FILES ]; then
    echo "✅ All files ready! ($TOTAL_FILES/$REQUIRED_FILES)"
    echo ""
    echo "🚀 You can now create the demo video:"
    echo "   node create-demo-video-with-clips.js"
else
    echo "⚠️  Missing files: $((REQUIRED_FILES - TOTAL_FILES))/$REQUIRED_FILES"
    echo ""
    echo "📝 Still needed:"
    
    if [ $IMAGE_COUNT -lt 10 ]; then
        echo "   • Images: $((10 - IMAGE_COUNT)) missing"
        if [ ! -f "$IMAGES_DIR/closing-slide.png" ]; then
            echo "     - Take screenshot of closing slide"
        fi
    fi
    
    if [ $CLIP_COUNT -lt 2 ]; then
        echo "   • Video clips: $((2 - CLIP_COUNT)) missing"
        echo "     - Run: ./extract-video-clips.sh"
    fi
    
    if [ $AUDIO_COUNT -lt 12 ]; then
        echo "   • Audio files: $((12 - AUDIO_COUNT)) missing"
        echo "     - Create with online TTS tool"
        echo "     - See: ADDITIONAL_NARRATION.md"
    fi
fi
echo "═══════════════════════════════════════════════════════"
