# 🎵 Karaoke Wizard - Complete Guide

A streamlined, automated karaoke video creation system with interactive timing.

## 🚀 Quick Start

```bash
# 1. Create project folder with your files
mkdir my-song
cp my-audio.mp3 my-song/
cp my-lyrics.txt my-song/

# 2. Run the wizard
./karaoke-wizard.sh ./my-song

# 3. Follow the interactive prompts
# 4. Get your karaoke videos!
```

## 📁 Input Requirements

Your project folder must contain:

1. **Audio file** (one of):
   - `*.mp3`
   - `*.wav`
   - `*.m4a`
   - `*.flac`

2. **Lyrics file**:
   - Named `lyrics.txt` or `*lyrics*.txt`
   - Format: One line per lyric
   - Supports dual language: `Hindi text | English transliteration`

### Example Folder Structure

```
my-song/
├── audio.mp3           # Your song
└── lyrics.txt          # Your lyrics
```

## 🎬 Complete Workflow

### Step 1: Interactive Timing

The wizard will:
1. Play your audio file
2. Show the next lyric line
3. Wait for you to press **SPACEBAR** when that line starts
4. Display current timestamp
5. Allow **BACKSPACE** to undo mistakes

**Controls:**
- `SPACE` - Mark current time for displayed lyric
- `BACKSPACE` - Undo last mark
- `Q` - Finish early (if done)

**Auto-features:**
- Detects instrumental sections >10s
- Automatically inserts countdown slides (4, 3, 2, 1)
- Generates timing file with countdowns included

### Step 2: Vocal Separation

Automatically separates your audio into:
- **Vocals only** - singing/voice track
- **No vocals** - instrumental/backing track (for karaoke)

Uses Demucs AI model (takes 3-5 minutes).

### Step 3: Image Generation

Creates lyric slides with:
- Dual-language layout (Hindi top-left, English bottom-right)
- Gradient background
- Text shadows
- Bold highlighting for countdown numbers

### Step 4: Video Creation

Generates **TWO videos**:
1. **Original** - With original audio (vocals included)
2. **Karaoke** - With instrumental only (no vocals)

## 📤 Output Files

After completion, your project folder will contain:

```
my-song/
├── audio.mp3                           # Original (unchanged)
├── lyrics.txt                          # Original (unchanged)
├── lyrics-with-timing.txt              # Updated with countdown slides
├── set-manual-timing.js                # Generated timing data
└── output/
    ├── Original-audio.mp4              # Video with vocals
    ├── Karaoke-audio.mp4               # Video without vocals (karaoke!)
    ├── Vocals-audio.mp3                # Vocals only
    ├── Novocals-audio.mp3              # Instrumental only
    ├── images/                         # Generated lyric images
    │   ├── lyric_000.png
    │   ├── lyric_001.png
    │   └── ...
    └── timestamps.json                 # Timing metadata
```

## 🛠️ Advanced Features

### Timing Adjustment Tool

If your timing is slightly off, use the adjustment tool:

#### Command-line Mode

```bash
# Adjust line 5 to 25.5 seconds (shifts all subsequent lines)
node adjust-timing.js 5 25.5

# Adjust line 5 without shifting subsequent lines
node adjust-timing.js 5 25.5 --no-shift
```

#### Interactive Mode

```bash
node adjust-timing.js --interactive
```

**Interactive commands:**
```
> list              # Show all timings
> list 10 20        # Show lines 10-30
> adjust 5 25.5     # Adjust line 5, shift rest
> set 5 25.5        # Adjust line 5, no shift
> save              # Save changes
> quit              # Exit
```

### Manual Timing File

The generated `set-manual-timing.js` looks like this:

```javascript
const lyricStarts = [
    0,      // 0: ♪ Instrumental ♪ | ♪ Instrumental ♪...
    20,     // 1: [4] 3 2 1 | [4] 3 2 1...
    21,     // 2: 4 [3] 2 1 | 4 [3] 2 1...
    22,     // 3: 4 3 [2] 1 | 4 3 [2] 1...
    23,     // 4: 4 3 2 [1] | 4 3 2 [1]...
    24,     // 5: मिल गई नज़रें, तो दिल भी | Mil gayi...
    // ...
];
```

You can edit this file directly if needed.

### Countdown Configuration

Edit `timing-tool.js` to change countdown behavior:

```javascript
const COUNTDOWN_THRESHOLD = 10; // Minimum gap (seconds) to trigger countdown
const COUNTDOWN_DURATION = 4;   // Countdown length (4 = "4 3 2 1")
```

## 🎯 Tips & Best Practices

### For Best Timing Accuracy:

1. **Practice first** - Listen to the song once before marking
2. **Mark slightly early** - Press space just before the lyric starts
3. **Use headphones** - Better audio clarity
4. **Don't rush** - You can undo mistakes with BACKSPACE
5. **Mark instrumentals** - Include "♪ Instrumental ♪" lines in your lyrics

### For Best Video Quality:

1. **High-quality audio** - Use 320kbps MP3 or lossless formats
2. **Clean lyrics** - Check for typos before starting
3. **Consistent format** - Use `Hindi | English` format throughout

### Workflow Optimization:

1. **Test with short section** - Create a 30-second test first
2. **Adjust timing** - Use `adjust-timing.js` for fine-tuning
3. **Regenerate quickly** - Only video step if you adjust timing

## 🐛 Troubleshooting

### "No audio file found"
- Ensure your audio file has a supported extension (.mp3, .wav, .m4a, .flac)
- Check file is in the project folder (not a subfolder)

### "Timing file not generated"
- Make sure you pressed Q to finish
- Check you marked at least one line

### "Vocal separation failed"
- First run downloads AI model (~300MB) - may take time
- Check internet connection
- Ensure enough disk space (~1GB free)

### Timing is slightly off
- Use `node adjust-timing.js --interactive`
- Adjust individual lines
- Regenerate video: `npm run video <audio> ./output`

### Countdown not appearing
- Check instrumental gap is >10 seconds
- Ensure instrumental line contains "♪ Instrumental ♪"
- Increase `COUNTDOWN_THRESHOLD` in `timing-tool.js`

## 📊 Performance

| Task | Duration | Notes |
|------|----------|-------|
| Timing (interactive) | Song length + marking time | Real-time playback |
| Vocal separation | 3-5 minutes | First run downloads model |
| Image generation | 10-30 seconds | Depends on line count |
| Video creation | 30-60 seconds | Per video |
| **Total** | **~10-15 minutes** | For a 4-minute song |

## 🔧 Manual Steps (if needed)

If you want to run steps individually:

```bash
# 1. Interactive timing only
node timing-tool.js ./my-song

# 2. Vocal separation only
./separate-and-convert.sh ./my-song/audio.mp3 ./my-song/output

# 3. Generate images only
npm start -- ./my-song/audio.mp3 ./my-song/lyrics-with-timing.txt --output ./my-song/output

# 4. Apply timing
cd ./my-song && node set-manual-timing.js && cd ..

# 5. Create video
npm run video ./my-song/audio.mp3 ./my-song/output
```

## 🎨 Customization

### Text Positioning

Edit `src/imageGenerator.ts`:

```typescript
const xOffset = 500;  // Horizontal offset from left
const yOffset = 20;   // Vertical offset from top
```

### Font Sizes

Edit `src/processor.ts`:

```typescript
fontSize: 80,                    // Main text size
transliterationFontSize: 56,     // English text size
```

### Countdown Font Size

Bold countdown numbers are automatically 1.5x the base font size.

## 📚 Examples

### Example 1: Simple Song

```bash
# Folder structure
my-song/
├── song.mp3
└── lyrics.txt

# Run wizard
./karaoke-wizard.sh ./my-song

# Output
my-song/output/
├── Original-song.mp4
└── Karaoke-song.mp4
```

### Example 2: With Adjustments

```bash
# Create karaoke
./karaoke-wizard.sh ./my-song

# Oops, line 10 is 2 seconds late
node adjust-timing.js 10 45.5

# Regenerate video only
npm run video ./my-song/output/Novocals-song.mp3 ./my-song/output
```

### Example 3: Batch Processing

```bash
# Process multiple songs
for folder in song1 song2 song3; do
    ./karaoke-wizard.sh ./$folder
done
```

## 🆘 Support

For issues or questions:
1. Check this documentation
2. Review error messages carefully
3. Try manual steps to isolate the problem
4. Check file permissions and disk space

## 🎉 Success!

You should now have:
- ✅ Professional karaoke video
- ✅ Original video with vocals
- ✅ Separated audio tracks
- ✅ All source files preserved

Enjoy your karaoke! 🎤🎵
