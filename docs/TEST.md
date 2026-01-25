# Testing the Lyric Sync Tool

## Quick Test (Without Audio File)

Since you may not have an audio file ready, here's how to test the tool:

### Option 1: Use a Sample Audio File

Download a short audio clip or use any MP3 you have:

```bash
# Example with any MP3 file on your system
npm start ~/Music/any-song.mp3 example-lyrics.txt
```

### Option 2: Create a Test Audio File

Generate a simple test audio file using FFmpeg:

```bash
# Create a 30-second silent audio file for testing
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 30 -q:a 9 -acodec libmp3lame test-audio.mp3

# Now test with it
npm start test-audio.mp3 example-lyrics.txt
```

### Option 3: Test Individual Components

Test the TypeScript compilation:
```bash
npm run build
```

Check the compiled output:
```bash
ls -la dist/
```

## Full Test Workflow

### 1. Create Test Files

```bash
# Create a test lyrics file
cat > test-lyrics.txt << 'EOF'
This is line one of the test
Here comes line two
And finally line three
EOF

# Create test audio (30 seconds)
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 30 -q:a 9 -acodec libmp3lame test-audio.mp3
```

### 2. Run the Tool

```bash
npm start test-audio.mp3 test-lyrics.txt --output ./test-output
```

### 3. Verify Output

```bash
# Check the output directory
ls -la test-output/

# Should see:
# - images/ folder
# - timestamps.json

# Check images
ls -la test-output/images/

# Should see:
# - lyric_000.png
# - lyric_001.png
# - lyric_002.png

# View the JSON output
cat test-output/timestamps.json
```

### 4. Test Different Formats

```bash
# Test LRC format
npm start test-audio.mp3 test-lyrics.txt --output ./test-lrc --format lrc
cat test-lrc/timestamps.lrc

# Test SRT format
npm start test-audio.mp3 test-lyrics.txt --output ./test-srt --format srt
cat test-srt/timestamps.srt
```

## Expected Output

### Console Output
```
🎵 Lyric Sync - Audio to Timed Lyric Images

📁 Input files:
   Audio: test-audio.mp3
   Lyrics: test-lyrics.txt
   Output: ./test-output

🔄 Step 1: Reading lyrics file...
   Found 3 lines

🔄 Step 2: Analyzing audio and aligning lyrics...
   Checking for alignment tools...
   ⚠️  Aeneas not available, trying alternative methods...
   Analyzing audio with FFmpeg...
   Aligned 3 lyric segments

🔄 Step 3: Generating lyric images...
   Progress: 3/3
   Generated 3 images

🔄 Step 4: Exporting timestamp data...
   Timestamp data exported

✅ Processing complete!
📂 Output saved to: /path/to/test-output
```

### File Structure
```
test-output/
├── images/
│   ├── lyric_000.png  (1920x1080, white text on black)
│   ├── lyric_001.png
│   └── lyric_002.png
└── timestamps.json    (or .lrc or .srt)
```

### JSON Content
```json
{
  "version": "1.0",
  "metadata": {
    "generatedAt": "2025-12-05T...",
    "totalLines": 3,
    "duration": 30.0
  },
  "lyrics": [
    {
      "index": 0,
      "startTime": 0.0,
      "endTime": 10.0,
      "duration": 10.0,
      "text": "This is line one of the test",
      "imagePath": "images/lyric_000.png"
    },
    ...
  ]
}
```

## Verification Checklist

- [ ] Tool runs without errors
- [ ] Images folder is created
- [ ] 3 PNG images are generated (one per line)
- [ ] Images are 1920x1080 pixels
- [ ] Images contain white text on black background
- [ ] Timestamps file is created (JSON/LRC/SRT)
- [ ] Timestamps are in correct format
- [ ] All timestamps are within audio duration

## View Generated Images

```bash
# macOS
open test-output/images/lyric_000.png

# Or open all images
open test-output/images/*.png
```

## Troubleshooting Tests

### Error: "Audio file not found"
```bash
# Check file exists
ls -la test-audio.mp3

# Use absolute path
npm start $(pwd)/test-audio.mp3 test-lyrics.txt
```

### Error: "FFmpeg not found"
```bash
# Verify FFmpeg installation
ffmpeg -version

# Reinstall if needed
brew reinstall ffmpeg
```

### Images are blank
```bash
# Check canvas installation
npm list canvas

# Reinstall if needed
npm install canvas
```

### TypeScript errors
```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

## Performance Test

Test with a longer lyrics file:

```bash
# Create 20-line lyrics
for i in {1..20}; do echo "This is lyric line number $i"; done > long-lyrics.txt

# Create 2-minute audio
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 120 -q:a 9 -acodec libmp3lame long-audio.mp3

# Process
time npm start long-audio.mp3 long-lyrics.txt --output ./long-test
```

## Clean Up Test Files

```bash
# Remove test files
rm -rf test-audio.mp3 test-lyrics.txt test-output/ test-lrc/ test-srt/
rm -rf long-audio.mp3 long-lyrics.txt long-test/
```

## Success Criteria

✅ The tool is working correctly if:
1. No errors during execution
2. Images are generated (correct count)
3. Images contain readable text
4. Timestamps file is valid JSON/LRC/SRT
5. Timestamps are reasonable (within audio duration)

## Next Steps After Testing

Once tests pass:
1. Use with real audio files
2. Customize image styling
3. Integrate with video editing workflow
4. Export to your preferred format
