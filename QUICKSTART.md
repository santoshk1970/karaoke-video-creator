# Quick Start Guide

## 1. Install Dependencies

```bash
cd lyric-sync
npm install
```

## 2. Install FFmpeg (Required)

```bash
# macOS
brew install ffmpeg

# Check installation
ffmpeg -version
```

## 3. (Optional) Install Python Aeneas for Best Accuracy

**Note**: Aeneas installation is complex and requires additional dependencies (espeak, numpy, etc.). 
**The tool works great without it** using FFmpeg-based alignment!

If you still want to try installing aeneas:
```bash
# Install dependencies
brew install espeak
pip3 install numpy
pip3 install aeneas
```

**Skip this step if you encounter errors** - the tool will automatically fall back to FFmpeg alignment.

## 4. Prepare Your Files

You need:
- **Audio file** (MP3, WAV, etc.) - the full song
- **Lyrics file** (TXT) - one line per lyric line

Optional:
- **Vocal-only track** - improves accuracy
- **Instrumental track** - for reference

## 5. Run the Tool

### Simple Example

```bash
# Using the example file
npm start example-audio.mp3 example-lyrics.txt
```

### With Your Own Files

```bash
npm start /path/to/your/song.mp3 /path/to/your/lyrics.txt
```

### With All Options

```bash
npm start song.mp3 lyrics.txt \
  --vocal vocals.mp3 \
  --output ./my-karaoke \
  --format lrc
```

## 6. Check the Output

```bash
ls output/
# You should see:
# - images/ folder with PNG files
# - timestamps.json (or .lrc or .srt depending on format)
```

## Example Workflow

### Step 1: Create lyrics file

```bash
cat > my-lyrics.txt << 'EOF'
This is the first line
This is the second line
And here's the third
EOF
```

### Step 2: Run the tool

```bash
npm start my-song.mp3 my-lyrics.txt --output ./results
```

### Step 3: View results

```bash
# View the JSON output
cat results/timestamps.json

# View the images
open results/images/
```

## What You Get

### 1. Timed Lyrics (JSON)

```json
{
  "lyrics": [
    {
      "index": 0,
      "startTime": 0.0,
      "endTime": 3.5,
      "text": "This is the first line",
      "imagePath": "images/lyric_000.png"
    }
  ]
}
```

### 2. Lyric Images

- High-quality PNG images (1920x1080)
- One image per lyric line
- Centered white text on black background
- Customizable styling

### 3. Multiple Export Formats

**JSON**: Full metadata with timestamps and image paths
**LRC**: Standard karaoke format
**SRT**: Subtitle format for video players

## Troubleshooting

### Error: "Audio file not found"
Make sure the path to your audio file is correct.

### Error: "FFmpeg not found"
Install FFmpeg: `brew install ffmpeg`

### Timing is off
- Try using a vocal-only track: `--vocal vocals.mp3`
- Install aeneas for better accuracy: `pip3 install aeneas`

### Images are blank
Check that the canvas library installed correctly: `npm install canvas`

## Next Steps

- Customize image styling in `src/imageGenerator.ts`
- Use the JSON output to create a karaoke video
- Import LRC files into karaoke players
- Use SRT files as video subtitles

## Need Help?

Check the full README.md for detailed documentation.
