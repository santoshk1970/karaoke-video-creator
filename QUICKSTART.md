# Quick Start Guide

## 🚀 Start Web UI

```bash
# Kill any existing server on port 8080 and start fresh
lsof -ti:8080 | xargs kill -9 2>/dev/null; cd web-ui && node server.js
```

**Access at**: http://localhost:8080

---

## 🎵 Command Line Usage

### Full Karaoke Wizard (Recommended)

```bash
./karaoke-wizard.sh ./my-song
```

### Individual Steps

```bash
# 1. Interactive timing
npm run timing ./my-song

# 2. Vocal separation
./separate-and-convert.sh ./my-song/audio.mp3 ./my-song/output

# 3. Generate images and timestamps
npm start -- ./my-song/audio.mp3 ./my-song/lyrics.txt --output ./my-song/output

# 4. Create video
npm run video ./my-song/audio.mp3 ./my-song/output
```

---

## 📁 Project Structure

```
my-song/
├── audio.mp3           # Your audio file
├── lyrics.txt          # Your lyrics (one line per lyric)
└── output/             # Generated files
    ├── images/         # Lyric images
    ├── timestamps.json # Timing data
    ├── Original-*.mp4  # Video with vocals
    └── Karaoke-*.mp4   # Video without vocals
```

---

## 🔧 Common Commands

```bash
# Build TypeScript
npm run build

# Restart web UI
lsof -ti:8080 | xargs kill -9 2>/dev/null; cd web-ui && node server.js

# Test with sample project
./karaoke-wizard.sh ./test-song
```

---

## 🏷️ Git Tags

```bash
# View all tags
git tag -l

# Rollback to pre-refactoring state
git reset --hard pre_refactoring
```

---

## 📝 Supported Formats

**Audio**: `.mp3`, `.wav`, `.m4a`, `.flac`, `.aac`  
**Lyrics**: `.txt` (one line per lyric)  
**Output**: `.mp4`, `.json`, `.lrc`, `.srt`
