# Vocal Separation with Demucs

This project now includes **Demucs** for AI-powered vocal separation, perfect for creating karaoke tracks!

## 🎵 What is Demucs?

Demucs is a state-of-the-art AI model from Meta/Facebook that separates audio into:
- **Vocals** - singing/voice only
- **No Vocals** - instrumental/backing track (perfect for karaoke!)

## 📦 Installation

Already installed! ✅

If you need to reinstall:
```bash
pip3 install demucs
```

## 🚀 Quick Start

### Option 1: Simple Separation (WAV output)

```bash
./separate-vocals.sh "./data/your-song.mp3"
```

Output:
- `separated/htdemucs/your-song/vocals.wav`
- `separated/htdemucs/your-song/no_vocals.wav`

### Option 2: Separation + MP3 Conversion (Recommended)

```bash
./separate-and-convert.sh "./data/your-song.mp3"
```

Output:
- `data/Vocals-your-song.mp3` - vocals only
- `data/Novocals-your-song.mp3` - instrumental (ready for karaoke!)

### Option 3: Custom Output Directory

```bash
./separate-and-convert.sh "./data/your-song.mp3" "./output-folder"
```

## 🎬 Complete Karaoke Workflow

```bash
# 1. Separate vocals from original song
./separate-and-convert.sh "./data/Original-song.mp3"

# 2. Create karaoke video with instrumental track
npm start -- "./data/Novocals-Original-song.mp3" "./data/lyrics.txt" --output "./output"

# 3. Apply manual timing
node set-manual-timing.js

# 4. Generate final video
npm run video "./data/Novocals-Original-song.mp3" "./output"
```

## ⚙️ Advanced Usage

### Direct Demucs Command

```bash
# Basic separation (vocals + no_vocals)
demucs --two-stems=vocals "your-song.mp3"

# Full separation (vocals, drums, bass, other)
demucs "your-song.mp3"

# Use specific model
demucs --name htdemucs "your-song.mp3"

# Output to custom directory
demucs --out custom-output "your-song.mp3"
```

### Convert WAV to MP3 manually

```bash
ffmpeg -i "separated/htdemucs/song-name/no_vocals.wav" \
       -codec:a libmp3lame -qscale:a 2 \
       "data/Novocals-song-name.mp3"
```

## 📊 Quality Settings

The scripts use high-quality MP3 encoding (`-qscale:a 2`):
- 0 = best quality (largest file)
- 2 = excellent quality (recommended)
- 4 = good quality
- 9 = lowest quality (smallest file)

## ⏱️ Processing Time

- **Short song (3-4 min)**: ~2-5 minutes
- **Long song (5+ min)**: ~5-10 minutes

First run downloads the AI model (~300MB), subsequent runs are faster.

## 🎯 Tips

1. **Best results**: Use high-quality source audio (320kbps MP3 or lossless)
2. **GPU acceleration**: Demucs automatically uses GPU if available (much faster!)
3. **Batch processing**: Process multiple songs by running the script multiple times
4. **Keep originals**: The scripts don't delete original files

## 🐛 Troubleshooting

**Error: "demucs: command not found"**
```bash
pip3 install --upgrade demucs
```

**Error: "No module named 'torch'"**
```bash
pip3 install torch torchaudio
```

**Slow processing**
- First run downloads the model (~300MB)
- CPU processing is slower than GPU
- Consider using a smaller model: `demucs --name htdemucs_ft "song.mp3"`

## 📚 More Info

- Demucs GitHub: https://github.com/facebookresearch/demucs
- Paper: https://arxiv.org/abs/2111.03600
