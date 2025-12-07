# Lyric Sync - Quick Reference

## Installation
```bash
cd lyric-sync
npm install
brew install ffmpeg
```

## Basic Usage
```bash
npm start <audio-file> <lyrics-file>
```

## Common Commands

### Simple Processing
```bash
npm start song.mp3 lyrics.txt
```

### With Vocal Track (Better Accuracy)
```bash
npm start song.mp3 lyrics.txt --vocal vocals.mp3
```

### Custom Output Directory
```bash
npm start song.mp3 lyrics.txt --output ./my-karaoke
```

### Different Export Formats
```bash
# JSON (default)
npm start song.mp3 lyrics.txt --format json

# LRC (karaoke format)
npm start song.mp3 lyrics.txt --format lrc

# SRT (subtitle format)
npm start song.mp3 lyrics.txt --format srt
```

### Generate Video (NEW!)
```bash
# Create MP4 video automatically
npm start song.mp3 lyrics.txt --video

# With quality setting
npm start song.mp3 lyrics.txt --video --quality ultra

# Standalone: Create video from existing images/timestamps
npm run video song.mp3 ./output
npm run video song.mp3 ./output --quality ultra --output my-video.mp4
```

### All Options Combined
```bash
npm start song.mp3 lyrics.txt \
  --vocal vocals.mp3 \
  --instrumental instrumental.mp3 \
  --output ./results \
  --format lrc
```

## Output Structure
```
output/
├── images/
│   ├── lyric_000.png  (1920x1080)
│   ├── lyric_001.png
│   └── ...
└── timestamps.json (or .lrc or .srt)
```

## File Formats

### Lyrics File (Input)
```
First line of lyrics
Second line of lyrics
Third line of lyrics
```
- Plain text file
- One line per lyric line
- UTF-8 encoding

### JSON Output
```json
{
  "lyrics": [{
    "index": 0,
    "startTime": 0.0,
    "endTime": 3.5,
    "text": "First line",
    "imagePath": "images/lyric_000.png"
  }]
}
```

### LRC Output
```
[00:00.00]First line
[00:03.50]Second line
```

### SRT Output
```
1
00:00:00,000 --> 00:00:03,500
First line
```

## Quick Test
```bash
# Create test files
echo -e "Line one\nLine two\nLine three" > test.txt
ffmpeg -f lavfi -i anullsrc -t 30 test.mp3

# Run
npm start test.mp3 test.txt

# Check output
ls output/
```

## Customization

### Image Style
Edit `src/imageGenerator.ts`:
```typescript
{
  width: 1920,
  height: 1080,
  fontSize: 80,
  textColor: '#FFFFFF',
  backgroundColor: '#000000'
}
```

### Alignment Method
The tool automatically tries:
1. Aeneas (if installed)
2. FFmpeg silence detection
3. Simple time distribution

## Troubleshooting

### Check FFmpeg
```bash
ffmpeg -version
```

### Check Node/NPM
```bash
node --version
npm --version
```

### Rebuild
```bash
npm run build
```

### Clean Start
```bash
rm -rf node_modules dist
npm install
npm run build
```

## Tips

✅ **For Best Results:**
- Use high-quality audio files
- Provide vocal-only track if available
- One lyric line per text line
- Clear pauses between lines helps

⚠️ **Common Issues:**
- Timing off? Use `--vocal` option
- Images blank? Check canvas installation
- FFmpeg error? Verify installation

## File Paths

### Relative Paths
```bash
npm start ./audio/song.mp3 ./lyrics/song.txt
```

### Absolute Paths
```bash
npm start /Users/you/Music/song.mp3 /Users/you/lyrics.txt
```

### With Spaces
```bash
npm start "my song.mp3" "my lyrics.txt"
```

## Development

### Build TypeScript
```bash
npm run build
```

### Run Compiled Version
```bash
node dist/index.js song.mp3 lyrics.txt
```

### Watch Mode (for development)
```bash
npx tsc --watch
```

## Integration

### Use in Scripts
```bash
#!/bin/bash
for song in *.mp3; do
  lyrics="${song%.mp3}.txt"
  npm start "$song" "$lyrics" --output "./output/$song"
done
```

### Batch Processing
```bash
# Process multiple songs
npm start song1.mp3 lyrics1.txt --output ./song1
npm start song2.mp3 lyrics2.txt --output ./song2
```

## Export Formats Use Cases

- **JSON**: Custom apps, web players
- **LRC**: Karaoke software, music players
- **SRT**: Video editors (Premiere, Final Cut)

## Quick Links

- README.md - Full documentation
- QUICKSTART.md - Getting started guide
- TEST.md - Testing instructions
- SUMMARY.md - Project overview
