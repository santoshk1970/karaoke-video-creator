# 🎵 Karaoke Wizard - Quick Start

## One-Command Karaoke Creation

```bash
./karaoke-wizard.sh <project-folder>
```

## Setup (One-Time)

```bash
# Install dependencies
npm install
pip3 install demucs

# Make scripts executable
chmod +x karaoke-wizard.sh
chmod +x timing-tool.js
chmod +x adjust-timing.js
chmod +x separate-and-convert.sh
```

## Project Folder Structure

```
my-song/
├── audio.mp3      # Your song (any name)
└── lyrics.txt     # Your lyrics (must contain "lyrics" in name)
```

## Workflow

### 1. Create Project

```bash
mkdir my-song
cp my-audio-file.mp3 my-song/
cp my-lyrics-file.txt my-song/lyrics.txt
```

### 2. Run Wizard

```bash
./karaoke-wizard.sh ./my-song
```

### 3. Interactive Timing

- **SPACE** = Mark lyric start
- **BACKSPACE** = Undo last mark
- **Q** = Finish

### 4. Wait for Processing

- Vocal separation: 3-5 min
- Image generation: 30 sec
- Video creation: 1 min

### 5. Get Your Videos!

```
my-song/output/
├── Original-audio.mp4   # With vocals
└── Karaoke-audio.mp4    # No vocals (karaoke!)
```

## Common Commands

```bash
# Adjust timing (line 5 to 25.5 seconds)
node adjust-timing.js 5 25.5

# Interactive timing adjustment
node adjust-timing.js --interactive

# Separate vocals only
./separate-and-convert.sh ./audio.mp3 ./output

# Regenerate video after timing adjustment
npm run video ./audio.mp3 ./output
```

## Features

✅ **Auto-countdown** - Adds 4-3-2-1 countdown before lyrics after long instrumentals  
✅ **Dual videos** - Original + Karaoke versions  
✅ **Vocal separation** - AI-powered (Demucs)  
✅ **Timing adjustment** - Fix mistakes easily  
✅ **Dual language** - Hindi + English transliteration  

## Timing Tips

1. Press SPACE **just before** the lyric starts
2. Use headphones for better accuracy
3. You can undo mistakes with BACKSPACE
4. Mark instrumental sections as "♪ Instrumental ♪"

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Timing slightly off | `node adjust-timing.js --interactive` |
| Countdown not appearing | Instrumental must be >10s |
| No audio file found | Check file extension (.mp3, .wav, etc.) |
| Vocal separation slow | First run downloads model (~300MB) |

## Full Documentation

See `KARAOKE-WIZARD.md` for complete guide.

---

**Total time:** ~10-15 minutes for a 4-minute song  
**Output:** 2 videos + separated audio tracks
