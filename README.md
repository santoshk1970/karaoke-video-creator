# 🎵 Lyric Sync

Automatically sync lyrics to audio and generate timed lyric images for karaoke, music videos, or subtitle creation.

## Features

- ✅ **Multiple Alignment Strategies**:
  - Python Aeneas (forced alignment) - most accurate
  - FFmpeg audio analysis (silence detection)
  - Simple time-based distribution (fallback)

- ✅ **Image Generation**: Creates PNG images with lyrics (1920x1080)

- ✅ **Multiple Export Formats**:
  - JSON (with metadata and image paths)
  - LRC (standard lyric format)
  - SRT (SubRip subtitle format)

## Installation

```bash
cd lyric-sync
npm install
```

### Optional: Install Python Aeneas for Best Results

```bash
# Install Python dependencies
pip3 install aeneas

# Or using conda
conda install -c conda-forge aeneas
```

### Required: Install FFmpeg

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

## Usage

### Basic Usage

```bash
npm start <audio-file> <lyrics-file>
```

### With All Options

```bash
npm start song.mp3 lyrics.txt \
  --vocal vocals.mp3 \
  --instrumental instrumental.mp3 \
  --output ./my-output \
  --format json
```

### Options

- `--vocal <file>` - Path to vocal-only track (improves accuracy)
- `--instrumental <file>` - Path to instrumental track (optional)
- `--output <dir>` - Output directory (default: `./output`)
- `--format <format>` - Output format: `json`, `lrc`, or `srt` (default: `json`)

## Example

```bash
# Create a lyrics file
echo "First line of the song
Second line of the song
Third line of the song" > lyrics.txt

# Process the song
npm start mysong.mp3 lyrics.txt --output ./results
```

## Output Structure

```
output/
├── images/
│   ├── lyric_000.png
│   ├── lyric_001.png
│   └── lyric_002.png
└── timestamps.json
```

### JSON Output Format

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

### LRC Output Format

```
[ti:Unknown Title]
[ar:Unknown Artist]
[al:Unknown Album]
[by:Lyric Sync]

[00:00.00]First line of the song
[00:03.50]Second line of the song
[00:07.20]Third line of the song
```

## Alignment Strategies

### 1. Aeneas (Best - Requires Python)

Uses forced alignment to match lyrics to audio with high accuracy.

**Pros**: Most accurate, handles varying line lengths
**Cons**: Requires Python and aeneas installation

### 2. FFmpeg Silence Detection (Good)

Analyzes audio for silence periods and uses them as line boundaries.

**Pros**: No Python required, works well for songs with clear pauses
**Cons**: Less accurate than forced alignment

### 3. Simple Distribution (Fallback)

Distributes lyrics evenly across the song duration.

**Pros**: Always works, no dependencies
**Cons**: Least accurate, assumes even line distribution

## Customizing Image Style

Edit `src/imageGenerator.ts` to customize:
- Image dimensions
- Font size and family
- Text and background colors
- Padding and alignment
- Add gradients, shadows, etc.

## Troubleshooting

### "Aeneas not available"
Install Python aeneas: `pip3 install aeneas`

### "FFmpeg not found"
Install FFmpeg: `brew install ffmpeg` (macOS)

### Images look wrong
Adjust settings in the `generateImages()` call in `src/processor.ts`

### Timing is off
- Use the `--vocal` option with a vocal-only track for better accuracy
- Install aeneas for forced alignment
- Manually adjust the output JSON file

## Advanced Usage

### Using as a Library

```typescript
import { LyricSyncProcessor } from './processor';

const processor = new LyricSyncProcessor({
    audioFile: 'song.mp3',
    lyricsFile: 'lyrics.txt',
    outputDir: './output',
    format: 'json'
});

await processor.process();
```

## License

MIT
