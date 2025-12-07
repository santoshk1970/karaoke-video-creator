# Test Song - Demo Project

This is a test project folder to demonstrate the Karaoke Wizard workflow.

## Contents

- **audio.mp3** - Sample audio file (5.0 MB)
- **lyrics.txt** - Sample lyrics (32 lines)

## How to Use

### Option 1: Full Wizard (Recommended)

```bash
cd ..
./karaoke-wizard.sh ./test-song
```

This will:
1. Start interactive timing tool
2. Separate vocals with Demucs
3. Generate lyric images
4. Create two videos (Original + Karaoke)

### Option 2: Step-by-Step

```bash
cd ..

# Step 1: Interactive timing
node timing-tool.js ./test-song

# Step 2: Separate vocals
./separate-and-convert.sh ./test-song/audio.mp3 ./test-song/output

# Step 3: Generate images
npm start -- ./test-song/audio.mp3 ./test-song/lyrics-with-timing.txt --output ./test-song/output

# Step 4: Apply timing
cd test-song && node set-manual-timing.js && cd ..

# Step 5: Create videos
npm run video ./test-song/audio.mp3 ./test-song/output
npm run video ./test-song/output/Novocals-audio.mp3 ./test-song/output
```

## Expected Output

After running the wizard, you'll have:

```
test-song/
├── audio.mp3
├── lyrics.txt
├── lyrics-with-timing.txt (generated)
├── set-manual-timing.js (generated)
└── output/
    ├── Original-audio.mp4
    ├── Karaoke-audio.mp4
    ├── Vocals-audio.mp3
    ├── Novocals-audio.mp3
    ├── images/
    └── timestamps.json
```

## Timing Tips for This Test

- First instrumental: ~20 seconds (countdown will auto-insert)
- Mark lyrics when they start singing
- Use SPACE to mark, BACKSPACE to undo
- Press Q when finished

## Notes

This is a demonstration project. The lyrics are from the user's original creation.
