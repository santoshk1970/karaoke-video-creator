# 🎼 Handling Instrumental Prelude/Intro

If your song has an instrumental intro before the first lyric, you have several options:

## Option 1: Add Prelude Line to Lyrics (Easiest)

Edit your lyrics file and add a line for the prelude:

```txt
[Instrumental]
मिल गई नज़रें, तो दिल भी
एक दिन, मिल जाएंगे
...
```

Or use a title:

```txt
मिल गई नज़रें
[Song Title or Artist Name]
मिल गई नज़रें, तो दिल भी
...
```

Then regenerate everything:
```bash
npm start -- ./data/Originalमिल-गईं-नज़रें.mp3 ./data/lyrics.txt
npm run video ./data/Originalमिल-गईं-नज़रें.mp3 ./output
```

## Option 2: Manually Adjust Timestamps

If you know the prelude is, say, 15 seconds:

```bash
node adjust-prelude.js 15 ./output/timestamps.json
npm run video ./data/Originalमिल-गईं-नज़रें.mp3 ./output
```

This shifts all lyrics by 15 seconds.

## Option 3: Edit timestamps.json Manually

1. Open `output/timestamps.json`
2. Add prelude seconds to all `startTime` and `endTime` values
3. Regenerate video: `npm run video ...`

Example - if prelude is 12 seconds:
```json
{
  "index": 0,
  "startTime": 12.0,      // was 0.0, now 12.0
  "endTime": 21.398,      // was 9.398, now 21.398
  "text": "मिल गई नज़रें, तो दिल भी"
}
```

## Option 4: Create a Blank/Title Image

1. Create a blank or title image: `output/images/lyric_prelude.png`
2. Manually edit `timestamps.json` to add an entry:

```json
{
  "lyrics": [
    {
      "index": -1,
      "startTime": 0,
      "endTime": 15,
      "duration": 15,
      "text": "[Instrumental]",
      "imagePath": "images/lyric_prelude.png"
    },
    {
      "index": 0,
      "startTime": 15,
      ...
    }
  ]
}
```

## How to Find Prelude Duration

Listen to your song and note when the first lyric starts:

```bash
# Play the audio
open ./data/Originalमिल-गईं-नज़रें.mp3

# Or use ffplay with timestamp display
ffplay -i ./data/Originalमिल-गईं-नज़रें.mp3
```

Note the timestamp when vocals start (e.g., 0:15 = 15 seconds).

## Recommended Workflow

**For your Hindi song:**

1. **Listen** to find when vocals start (let's say 12 seconds)

2. **Add prelude line** to lyrics:
```bash
cat > data/lyrics-with-prelude.txt << 'EOF'
♪ मिल गई नज़रें ♪
मिल गई नज़रें, तो दिल भी
एक दिन, मिल जाएंगे
तू लहर है ,मैं लहर हूं
...
EOF
```

3. **Regenerate**:
```bash
npm start -- ./data/Originalमिल-गईं-नज़रें.mp3 ./data/lyrics-with-prelude.txt
npm run video ./data/Originalमिल-गईं-नज़रें.mp3 ./output
```

## Quick Fix for Current Video

If you don't want to regenerate everything:

```bash
# Shift all lyrics by 12 seconds (adjust as needed)
node adjust-prelude.js 12 ./output/timestamps.json

# Regenerate video only (fast!)
npm run video ./data/Originalमिल-गईं-नज़रें.mp3 ./output
```

## Tips

✅ **Use a title card** - Add song title/artist as first "lyric"
✅ **Use [Instrumental]** - Clear indicator for prelude
✅ **Use musical notes** - ♪ or 🎵 for instrumental sections
✅ **Test timing** - Play video and adjust if needed

## Example: Complete Lyrics with Prelude

```txt
♪ मिल गई नज़रें ♪
[Instrumental Intro]
मिल गई नज़रें, तो दिल भी
एक दिन, मिल जाएंगे
तू लहर है ,मैं लहर हूं
मिल के साहिल पाएंगे
[Chorus]
मिल गई नज़रें, तो दिल भी
...
```

This way the first image shows during the prelude, then lyrics start!
