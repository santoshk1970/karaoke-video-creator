# 🎬 Standalone Video Generation

Create videos from existing images and timestamps without re-processing everything!

## Quick Start

```bash
npm run video song.mp3 ./output
```

## What It Does

Creates an MP4 video using:
- ✅ Existing `timestamps.json`
- ✅ Existing `images/*.png` files
- ✅ Your audio file

**No re-processing** of lyrics or image generation!

## Usage

```bash
npm run video <audio-file> <output-dir> [options]
```

### Options

- `--quality <quality>` - Video quality: `low` | `medium` | `high` | `ultra`
- `--output <filename>` - Output filename (default: `output.mp4`)

## Examples

### Basic Usage

```bash
npm run video song.mp3 ./output
```

Creates: `./output/output.mp4`

### Custom Quality

```bash
npm run video song.mp3 ./output --quality ultra
```

### Custom Output Name

```bash
npm run video song.mp3 ./output --output karaoke.mp4
```

Creates: `./output/karaoke.mp4`

### Both Options

```bash
npm run video song.mp3 ./output --quality high --output final-video.mp4
```

## Requirements

Your output directory must have:

```
output/
├── timestamps.json    ← Required
└── images/            ← Required
    ├── lyric_000.png
    ├── lyric_001.png
    └── ...
```

## When to Use

### ✅ Perfect For:

1. **Regenerating videos** with different quality
2. **Creating multiple versions** (low quality preview + high quality final)
3. **After manual edits** to timestamps.json
4. **Testing different audio** files with same lyrics
5. **Quick iterations** without re-processing

### ❌ Not For:

- First-time processing (use `npm start ... --video` instead)
- When you don't have images/timestamps yet

## Workflow Examples

### Example 1: Preview then Final

```bash
# Generate images and timestamps
npm start song.mp3 lyrics.txt --output ./output

# Create quick preview (fast)
npm run video song.mp3 ./output --quality low --output preview.mp4

# Review preview, then create final (slow, high quality)
npm run video song.mp3 ./output --quality ultra --output final.mp4
```

### Example 2: Manual Timing Adjustments

```bash
# Generate everything
npm start song.mp3 lyrics.txt --output ./output

# Edit timestamps.json manually to fix timing
# (adjust startTime/endTime values)

# Regenerate video with corrected timing
npm run video song.mp3 ./output --quality high
```

### Example 3: Multiple Versions

```bash
# Create different quality versions
npm run video song.mp3 ./output --quality low --output preview.mp4
npm run video song.mp3 ./output --quality medium --output web.mp4
npm run video song.mp3 ./output --quality ultra --output master.mp4
```

### Example 4: Different Audio

```bash
# Generate with original audio
npm start original.mp3 lyrics.txt --output ./output

# Create video with remix (reusing same images/timing)
npm run video remix.mp3 ./output --output remix-video.mp4

# Create video with instrumental
npm run video instrumental.mp3 ./output --output instrumental-video.mp4
```

## Quality Comparison

| Quality | Speed | File Size | Use Case |
|---------|-------|-----------|----------|
| `low` | ⚡ Fastest | Larger | Quick previews |
| `medium` | 🚀 Fast | Medium | Web/social media |
| `high` | 🐢 Slow | Smaller | Final output |
| `ultra` | 🐌 Slowest | Smallest | Professional/archive |

## Performance

Encoding times (3-minute song):
- **low**: ~30 seconds
- **medium**: ~1 minute
- **high**: ~2 minutes
- **ultra**: ~4 minutes

## Error Messages

### "timestamps.json not found"

**Solution**: Run the main tool first:
```bash
npm start song.mp3 lyrics.txt --output ./output
```

### "images/ folder not found"

**Solution**: Make sure you've generated images first:
```bash
npm start song.mp3 lyrics.txt --output ./output
```

### "Missing: lyric_XXX.png"

**Solution**: Some images are missing. Regenerate all images:
```bash
npm start song.mp3 lyrics.txt --output ./output
```

### "Audio file not found"

**Solution**: Check the audio file path:
```bash
# Use absolute path if needed
npm run video /full/path/to/song.mp3 ./output
```

## Tips

✅ **Generate once, create many** - Generate images/timestamps once, create multiple video versions

✅ **Test with low quality** - Use `--quality low` for quick previews

✅ **Edit timestamps manually** - Fine-tune timing in `timestamps.json` before video generation

✅ **Different audio tracks** - Reuse images with different audio (remix, instrumental, etc.)

✅ **Batch processing** - Create videos for multiple songs using same workflow

## Comparison: Full vs Standalone

### Full Command (`npm start ... --video`)

```bash
npm start song.mp3 lyrics.txt --video
```

**Does:**
1. ✅ Reads lyrics
2. ✅ Aligns to audio
3. ✅ Generates images
4. ✅ Creates timestamps.json
5. ✅ Creates video

**Use when:** Starting from scratch

### Standalone Command (`npm run video`)

```bash
npm run video song.mp3 ./output
```

**Does:**
1. ❌ (skips) Reads existing timestamps.json
2. ❌ (skips) Uses existing images
3. ✅ Creates video

**Use when:** You already have images/timestamps

## Advanced: Editing timestamps.json

You can manually edit `timestamps.json` to fix timing:

```json
{
  "lyrics": [
    {
      "index": 0,
      "startTime": 0.0,      ← Adjust this
      "endTime": 3.5,        ← Adjust this
      "text": "First line",
      "imagePath": "images/lyric_000.png"
    }
  ]
}
```

After editing, regenerate video:
```bash
npm run video song.mp3 ./output
```

## Integration with Other Tools

### Use with Video Editors

1. Generate video with standalone command
2. Import into Premiere/Final Cut/DaVinci
3. Add effects, transitions, etc.

### Use with Different Audio

1. Generate images/timestamps once
2. Create videos with different audio versions:
   - Original
   - Remix
   - Instrumental
   - Karaoke (no vocals)

## Summary

**Standalone video generation** lets you:
- ⚡ Create videos faster (skip processing)
- 🎨 Iterate on quality settings
- ✏️ Use manually edited timestamps
- 🎵 Try different audio files
- 📹 Generate multiple versions

**Command:**
```bash
npm run video <audio> <output-dir> [--quality <q>] [--output <file>]
```

**Perfect for:** Regenerating videos without re-processing everything!
