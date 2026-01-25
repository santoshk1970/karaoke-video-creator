# 🎬 Karaoke Wizard Demo

## Test Project Ready!

A complete test project has been created in `./test-song/`

## Quick Demo

```bash
./karaoke-wizard.sh ./test-song
```

## What You'll See

### Step 1: Validation
```
🎵 Karaoke Wizard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Step 1: Validating input files

✅ Found: audio.mp3 (235s)
✅ Found: lyrics.txt (32 lines)
```

### Step 2: Interactive Timing
```
▶ Step 2: Interactive timing

Instructions:
  • Listen to the song
  • Press SPACEBAR when each lyric line starts
  • Press BACKSPACE to undo last mark
  • Press Q when finished

Note: Countdown slides will be auto-inserted for instrumentals >10s

Ready to start? (y/n)
```

**After you press 'y':**
```
🎵 Starting playback in 3 seconds...

📝 Next (1/32): "♪ Instrumental ♪ | ♪ Instrumental ♪"
⏱️  Current time: 0:00.0
   [SPACE]=Mark | [BACKSPACE]=Undo | [Q]=Quit
```

**When you press SPACE:**
```
✅ [0:00.5] Marked: "♪ Instrumental ♪ | ♪ Instrumental ♪..."

📝 Next (2/32): "मिल गई नज़रें, तो दिल भी | Mil gayi nazarein, to dil bhi"
⏱️  Current time: 0:00.5
   [SPACE]=Mark | [BACKSPACE]=Undo | [Q]=Quit
```

**After marking all lines:**
```
🎉 All lines marked! Press Q to finish.

🎬 Finishing up...

🔄 Processing marks...

🎯 Auto-inserted countdown before line 2 (gap: 19.5s)
🎯 Auto-inserted countdown before line 11 (gap: 12.0s)
🎯 Auto-inserted countdown before line 22 (gap: 15.0s)

✅ Generated: set-manual-timing.js
✅ Generated: lyrics-with-timing.txt

📊 Summary:
   Original lyrics: 32 lines
   With countdowns: 44 lines
   Total marks: 44

🎉 Timing complete!
```

### Step 3: Vocal Separation
```
▶ Step 3: Separating vocals (this may take 3-5 minutes)

🎵 Separating vocals from: ./test-song/audio.mp3
📁 Output directory: ./test-song/output
⏳ This may take a few minutes...

Selected model is a bag of 1 models. You will see that many progress bars per track.
Separated tracks will be stored in /Users/.../separated/htdemucs
Separating track audio.mp3
████████████████████████████████████████ 100%

✅ Separation complete!

🔄 Converting to MP3...

✅ All done!

📂 Output files:
   🎤 Vocals only:     ./test-song/output/Vocals-audio.mp3
   🎵 No vocals:       ./test-song/output/Novocals-audio.mp3
```

### Step 4: Image Generation
```
▶ Step 4: Generating lyric images

🎵 Lyric Sync - Audio to Timed Lyric Images
📁 Input files:
   Audio: ./test-song/audio.mp3
   Lyrics: ./test-song/lyrics-with-timing.txt
   Output: ./test-song/output

🔄 Step 3: Generating lyric images...
   Progress: 44/44
   Generated 44 images

✅ Images generated
```

### Step 5: Apply Timing
```
▶ Step 5: Applying manual timing

✅ Manual timing applied to 44 lyrics

✅ Timing applied
```

### Step 6: Video Creation
```
▶ Step 6: Creating videos

Generating video 1/2: Original audio...
🎬 Standalone Video Generator
✓ Video created successfully!

Generating video 2/2: Karaoke (no vocals)...
🎬 Standalone Video Generator
✓ Video created successfully!

✅ Videos created
```

### Final Summary
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Karaoke creation complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📂 Output files:
   📹 Original:  ./test-song/output/Original-audio.mp4
   🎤 Karaoke:   ./test-song/output/Karaoke-audio.mp4
   🎵 Vocals:    ./test-song/output/Vocals-audio.mp3
   🎼 Novocals:  ./test-song/output/Novocals-audio.mp3

📊 File sizes:
   Original video: 6.0M
   Karaoke video:  6.0M

💡 Tips:
   • To adjust timing: node adjust-timing.js --interactive
   • To regenerate videos: npm run video <audio-file> ./test-song/output
```

## Testing Timing Adjustment

After the wizard completes, try adjusting timing:

```bash
# Interactive mode
node adjust-timing.js --interactive

# Commands in interactive mode:
> list              # Show all timings
> adjust 5 30       # Adjust line 5 to 30 seconds (shifts rest)
> set 5 30          # Adjust line 5 without shifting
> save              # Save changes
> quit              # Exit
```

## Expected Timeline

For the test song (~4 minutes):

| Step | Duration | Notes |
|------|----------|-------|
| Validation | 1 second | Instant |
| Interactive timing | 4-5 minutes | Real-time playback + marking |
| Vocal separation | 3-5 minutes | First run downloads model |
| Image generation | 30 seconds | 44 images |
| Video creation | 1-2 minutes | Two videos |
| **Total** | **~10-15 minutes** | Including user interaction |

## What to Expect

### Countdown Auto-Insertion

The wizard will detect these instrumentals and add countdowns:

1. **Line 1** (0-20s): ♪ Instrumental ♪ → Adds countdown at ~16-20s
2. **Line 10** (69-81s): ♪ Instrumental ♪ → Adds countdown at ~77-81s  
3. **Line 21** (134-149s): ♪ Instrumental ♪ → Adds countdown at ~145-149s

### Video Features

Both videos will have:
- ✅ Dual-language lyrics (Hindi + English)
- ✅ Gradient background
- ✅ Text shadows
- ✅ Bold countdown numbers (1.5x size)
- ✅ Centered countdown slides
- ✅ Smooth transitions

**Difference:**
- **Original-audio.mp4**: Full song with vocals
- **Karaoke-audio.mp4**: Instrumental only (perfect for singing!)

## Troubleshooting Demo

If something goes wrong during the demo:

```bash
# Check what was created
ls -la test-song/

# View timing file
cat test-song/set-manual-timing.js

# Check images
ls test-song/output/images/

# View logs
cat demucs.log
```

## Clean Up Demo

To reset and try again:

```bash
# Remove generated files
rm -rf test-song/output
rm test-song/set-manual-timing.js
rm test-song/lyrics-with-timing.txt

# Run wizard again
./karaoke-wizard.sh ./test-song
```

## Next Steps

After testing with the demo:

1. Create your own project folder
2. Add your audio and lyrics
3. Run the wizard
4. Enjoy your karaoke videos!

---

**Ready to try?** Run: `./karaoke-wizard.sh ./test-song`
