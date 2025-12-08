#!/bin/bash

# Generate closing slide PNG from HTML
# Requires: Chrome/Chromium browser

echo "🎨 Generating closing slide..."
echo ""

HTML_FILE="/Users/santosh/development/pointless-game/lyric-sync/create-closing-slide.html"
OUTPUT_FILE="/Users/santosh/development/pointless-game/imagesForDemo/closing-slide.png"

# Check if Chrome is available
if command -v "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" &> /dev/null; then
    CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif command -v chromium &> /dev/null; then
    CHROME="chromium"
else
    echo "❌ Chrome/Chromium not found"
    echo ""
    echo "Please open this file in your browser and take a screenshot:"
    echo "  file://$HTML_FILE"
    echo ""
    echo "Save the screenshot as:"
    echo "  $OUTPUT_FILE"
    echo ""
    echo "Make sure the browser window is 1920x1080 pixels"
    exit 1
fi

echo "✓ Found Chrome"
echo ""
echo "Generating screenshot..."

# Use Chrome headless to capture screenshot
"$CHROME" --headless --disable-gpu --screenshot="$OUTPUT_FILE" \
    --window-size=1920,1080 \
    --default-background-color=0 \
    "file://$HTML_FILE" 2>/dev/null

if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo ""
    echo "✅ Closing slide created!"
    echo "📁 Location: $OUTPUT_FILE"
    echo "📦 Size: $FILE_SIZE"
    echo ""
    echo "Preview:"
    open "$OUTPUT_FILE"
else
    echo "❌ Failed to create screenshot"
    echo ""
    echo "Manual method:"
    echo "1. Open: file://$HTML_FILE"
    echo "2. Set browser window to 1920x1080"
    echo "3. Take screenshot (Cmd+Shift+4, then Space, then click window)"
    echo "4. Save as: $OUTPUT_FILE"
fi
