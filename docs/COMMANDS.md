# 🎵 Karaoke Wizard - Command Reference

## Quick Commands

```bash
# Complete workflow (one command!)
./karaoke-wizard.sh <project-folder>

# Interactive timing only
node timing-tool.js <project-folder>

# Adjust timing (shift subsequent lines)
node adjust-timing.js <line-number> <new-time>

# Adjust timing (no shift)
node adjust-timing.js <line-number> <new-time> --no-shift

# Interactive timing adjustment
node adjust-timing.js --interactive

# Separate vocals only
./separate-and-convert.sh <audio-file> <output-dir>

# Generate images only
npm start -- <audio-file> <lyrics-file> --output <output-dir>

# Create video only
npm run video <audio-file> <output-dir>
```

## Interactive Mode Commands

### Timing Tool
- `SPACE` - Mark current time
- `BACKSPACE` - Undo last mark
- `Q` - Finish and save

### Adjustment Tool
```
list [start] [count]  - Show timings
adjust <line> <time>  - Adjust with shift
set <line> <time>     - Adjust without shift
save                  - Save changes
quit                  - Exit
```

## Examples

### Complete Workflow
```bash
./karaoke-wizard.sh ./my-song
```

### Fix Timing Mistake
```bash
# Line 10 is 2 seconds late
node adjust-timing.js 10 47.5

# Regenerate video
npm run video ./my-song/output/Novocals-audio.mp3 ./my-song/output
```

### Manual Control
```bash
# Step 1: Timing
node timing-tool.js ./my-song

# Step 2: Vocals
./separate-and-convert.sh ./my-song/audio.mp3 ./my-song/output

# Step 3: Images
npm start -- ./my-song/audio.mp3 ./my-song/lyrics-with-timing.txt --output ./my-song/output

# Step 4: Apply timing
cd my-song && node set-manual-timing.js && cd ..

# Step 5: Videos
npm run video ./my-song/audio.mp3 ./my-song/output
npm run video ./my-song/output/Novocals-audio.mp3 ./my-song/output
```

## File Locations

### Input
```
project-folder/
├── audio.mp3      # Your audio (any name)
└── lyrics.txt     # Your lyrics (must contain "lyrics")
```

### Output
```
project-folder/
├── lyrics-with-timing.txt    # Generated
├── set-manual-timing.js      # Generated
└── output/
    ├── Original-audio.mp4    # Video with vocals
    ├── Karaoke-audio.mp4     # Video without vocals
    ├── Vocals-audio.mp3      # Vocals only
    ├── Novocals-audio.mp3    # Instrumental only
    ├── images/               # Lyric slides
    └── timestamps.json       # Timing data
```

## Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `SPACE` | Mark time | Timing tool |
| `BACKSPACE` | Undo | Timing tool |
| `Q` | Quit/Finish | Timing tool |
| `Ctrl+C` | Cancel | Any tool |

## Common Patterns

### Pattern 1: Quick Test
```bash
# Use demo project
./karaoke-wizard.sh ./test-song
```

### Pattern 2: Production
```bash
# Your own song
mkdir my-song
cp audio.mp3 my-song/
cp lyrics.txt my-song/
./karaoke-wizard.sh ./my-song
```

### Pattern 3: Fix & Regenerate
```bash
# Adjust timing
node adjust-timing.js --interactive

# Regenerate video only (fast!)
npm run video ./my-song/output/Novocals-audio.mp3 ./my-song/output
```

## Flags & Options

### timing-tool.js
```bash
node timing-tool.js <project-folder>
```
No flags - interactive only

### adjust-timing.js
```bash
node adjust-timing.js <line> <time> [--no-shift]
node adjust-timing.js --interactive
node adjust-timing.js --help
```

### separate-and-convert.sh
```bash
./separate-and-convert.sh <audio-file> [output-dir]
```
Default output-dir: `./data`

## Troubleshooting Commands

```bash
# Check what was generated
ls -la <project-folder>/

# View timing file
cat <project-folder>/set-manual-timing.js

# Count images
ls <project-folder>/output/images/ | wc -l

# Check video file size
du -h <project-folder>/output/*.mp4

# View Demucs log
cat demucs.log

# Test audio playback
ffplay <audio-file>
```

## Clean Up

```bash
# Remove generated files (keep originals)
rm -rf <project-folder>/output
rm <project-folder>/set-manual-timing.js
rm <project-folder>/lyrics-with-timing.txt

# Start fresh
./karaoke-wizard.sh <project-folder>
```

## Performance Tips

```bash
# Skip vocal separation if you already have it
node timing-tool.js ./my-song
# ... manually copy novocals file ...
npm start -- ./my-song/audio.mp3 ./my-song/lyrics-with-timing.txt --output ./my-song/output

# Regenerate only video (after timing adjustment)
npm run video <audio-file> <output-dir>
# Much faster than full wizard!

# Batch process
for folder in song1 song2 song3; do
    ./karaoke-wizard.sh ./$folder
done
```

## Help Commands

```bash
# Wizard help
./karaoke-wizard.sh --help

# Adjustment help
node adjust-timing.js --help

# View documentation
cat QUICK-START.md
cat KARAOKE-WIZARD.md
cat DEMO.md
```

---

**Quick Start**: `./karaoke-wizard.sh ./test-song`
