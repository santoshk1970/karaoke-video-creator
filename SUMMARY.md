# Lyric Sync - Project Summary

## ✅ What Was Built

A complete TypeScript/Node.js application that:
1. Takes an audio file and lyrics text file as input
2. Automatically syncs lyrics to audio timestamps
3. Generates PNG images for each lyric line (1920x1080)
4. Exports timing data in multiple formats (JSON, LRC, SRT)

## 🎯 Key Features

### 1. **Smart Alignment System** (3 strategies with automatic fallback)
- **Strategy 1**: Python Aeneas (most accurate, optional)
- **Strategy 2**: FFmpeg silence detection (good, no Python needed) ✅ **Ready to use**
- **Strategy 3**: Simple time distribution (always works)

### 2. **Image Generation**
- High-quality 1920x1080 PNG images
- Customizable styling (fonts, colors, backgrounds)
- Text wrapping and alignment
- One image per lyric line

### 3. **Multiple Export Formats**
- **JSON**: Full metadata with timestamps and image paths
- **LRC**: Standard karaoke format (compatible with music players)
- **SRT**: SubRip subtitle format (for video editors)

## 📁 Project Structure

```
lyric-sync/
├── src/
│   ├── index.ts           # CLI entry point
│   ├── processor.ts       # Main orchestrator
│   ├── alignment.ts       # Audio-lyric alignment (3 strategies)
│   ├── imageGenerator.ts  # PNG image creation
│   └── exporter.ts        # Export to JSON/LRC/SRT
├── package.json
├── tsconfig.json
├── README.md              # Full documentation
├── QUICKSTART.md          # Quick start guide
└── example-lyrics.txt     # Sample lyrics file
```

## 🚀 How to Use

### Basic Command
```bash
npm start song.mp3 lyrics.txt
```

### With Options
```bash
npm start song.mp3 lyrics.txt \
  --vocal vocals.mp3 \
  --output ./my-output \
  --format lrc
```

### Output
```
output/
├── images/
│   ├── lyric_000.png
│   ├── lyric_001.png
│   └── lyric_002.png
└── timestamps.json (or .lrc or .srt)
```

## 📊 Output Format Examples

### JSON Output
```json
{
  "version": "1.0",
  "metadata": {
    "generatedAt": "2025-12-05T20:30:00.000Z",
    "totalLines": 3,
    "duration": 180.5
  },
  "lyrics": [
    {
      "index": 0,
      "startTime": 0.0,
      "endTime": 3.5,
      "duration": 3.5,
      "text": "First line of the song",
      "imagePath": "images/lyric_000.png"
    }
  ]
}
```

### LRC Output (Karaoke Format)
```
[00:00.00]First line of the song
[00:03.50]Second line of the song
[00:07.20]Third line of the song
```

### SRT Output (Subtitle Format)
```
1
00:00:00,000 --> 00:00:03,500
First line of the song

2
00:00:03,500 --> 00:00:07,200
Second line of the song
```

## 🛠️ Technical Details

### Dependencies
- **TypeScript** - Type-safe development
- **Node.js** - Runtime environment
- **Canvas** - Image generation
- **FFmpeg** - Audio analysis (required)
- **Python Aeneas** - Forced alignment (optional)

### Alignment Strategies

#### 1. Aeneas (Optional)
- Uses forced alignment algorithm
- Most accurate timing
- Requires Python + dependencies
- **Status**: Optional (complex installation)

#### 2. FFmpeg Silence Detection (Recommended)
- Analyzes audio for silence periods
- Uses silence as line boundaries
- Good accuracy for most songs
- **Status**: ✅ Ready to use (FFmpeg installed)

#### 3. Simple Distribution (Fallback)
- Distributes lyrics evenly across duration
- Always works
- Less accurate but reliable
- **Status**: ✅ Always available

## 🎨 Customization

### Image Styling
Edit `src/imageGenerator.ts` to customize:
```typescript
{
    width: 1920,
    height: 1080,
    fontSize: 80,
    fontFamily: 'Arial',
    textColor: '#FFFFFF',
    backgroundColor: '#000000',
    padding: 100
}
```

### Advanced Styling
The `generateStyled()` method includes:
- Gradient backgrounds
- Text shadows
- Custom positioning

## 💡 Use Cases

1. **Karaoke Videos**: Generate timed lyric images for video editing
2. **Music Videos**: Create lyric overlays
3. **Subtitle Creation**: Export SRT files for video players
4. **Lyric Apps**: Use JSON output for custom applications
5. **Social Media**: Create lyric quote images with timestamps

## 🔧 Current Status

✅ **Fully Functional**
- FFmpeg installed and working
- TypeScript compiles successfully
- All core features implemented
- Multiple export formats ready
- Image generation working

⚠️ **Optional Enhancement**
- Aeneas installation (complex, not required)
- Tool works great without it!

## 📝 Next Steps

### To Use the Tool:
1. Prepare your audio file (MP3, WAV, etc.)
2. Create a lyrics text file (one line per lyric)
3. Run: `npm start your-song.mp3 your-lyrics.txt`
4. Check the `output/` folder for results

### To Improve Accuracy:
1. Use a vocal-only track: `--vocal vocals.mp3`
2. Use FFmpeg silence detection (automatic)
3. Manually adjust JSON timestamps if needed

### To Customize:
1. Edit image styling in `src/imageGenerator.ts`
2. Modify alignment parameters in `src/alignment.ts`
3. Add new export formats in `src/exporter.ts`

## 🎓 Learning Resources

- **FFmpeg Documentation**: https://ffmpeg.org/documentation.html
- **Canvas API**: https://www.npmjs.com/package/canvas
- **LRC Format**: https://en.wikipedia.org/wiki/LRC_(file_format)
- **SRT Format**: https://en.wikipedia.org/wiki/SubRip

## 🐛 Troubleshooting

### "Audio file not found"
- Check file path is correct
- Use absolute paths if needed

### "FFmpeg not found"
- Run: `ffmpeg -version` to verify installation
- Reinstall: `brew install ffmpeg`

### Images look wrong
- Adjust styling in `src/imageGenerator.ts`
- Check canvas library: `npm install canvas`

### Timing is off
- Use `--vocal` option with vocal-only track
- Try different audio formats
- Manually adjust JSON output

## 📦 Ready to Ship

The application is **production-ready** and can:
- Process any audio format supported by FFmpeg
- Handle lyrics of any length
- Generate professional-quality images
- Export in industry-standard formats
- Run without Python dependencies

**Status**: ✅ **Complete and Working**
