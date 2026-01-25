# 🎵 Lyric Sync - Documentation Index

Welcome to Lyric Sync! This tool automatically syncs lyrics to audio and generates timed lyric images.

## 📚 Documentation Files

### 🚀 Getting Started
1. **[QUICKSTART.md](QUICKSTART.md)** - Start here! Quick setup and first run
2. **[CHEATSHEET.md](CHEATSHEET.md)** - Quick reference for common commands
3. **[README.md](README.md)** - Complete documentation with all features

### 🧪 Testing & Verification
4. **[TEST.md](TEST.md)** - How to test the tool and verify it works
5. **[SUMMARY.md](SUMMARY.md)** - Project overview and technical details

### 🎬 Video Generation
6. **[VIDEO_GUIDE.md](VIDEO_GUIDE.md)** - How to create MP4 videos (NEW!)
7. **[STANDALONE_VIDEO.md](STANDALONE_VIDEO.md)** - Create videos from existing data (NEW!)

### 📖 This File
8. **[INDEX.md](INDEX.md)** - You are here! Navigation guide

## 🎯 Quick Navigation

### I want to...

#### Get Started Quickly
→ Read [QUICKSTART.md](QUICKSTART.md)
- Installation steps
- First run example
- Basic usage

#### Learn All Features
→ Read [README.md](README.md)
- Complete feature list
- All options explained
- Advanced usage

#### See Command Examples
→ Read [CHEATSHEET.md](CHEATSHEET.md)
- Common commands
- Quick reference
- Copy-paste examples

#### Test the Tool
→ Read [TEST.md](TEST.md)
- Create test files
- Verify output
- Troubleshooting

#### Understand the Project
→ Read [SUMMARY.md](SUMMARY.md)
- Architecture overview
- Technical details
- Use cases

#### Create Videos
→ Read [VIDEO_GUIDE.md](VIDEO_GUIDE.md)
- Automatic video generation
- Quality settings
- Troubleshooting

## 🏃 Super Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Verify FFmpeg
ffmpeg -version

# 3. Run with your files
npm start your-song.mp3 your-lyrics.txt

# 4. Check output
ls output/
```

## 📋 What You Need

### Required
- ✅ Node.js (installed)
- ✅ FFmpeg (installed)
- ✅ Audio file (MP3, WAV, etc.)
- ✅ Lyrics file (plain text, one line per lyric)

### Optional
- ⭕ Vocal-only track (improves accuracy)
- ⭕ Python Aeneas (best accuracy, complex setup)

## 🎓 Learning Path

### Beginner
1. Read QUICKSTART.md (5 min)
2. Run the example (2 min)
3. Try with your own files (5 min)

### Intermediate
1. Read README.md (10 min)
2. Try different export formats (5 min)
3. Customize image styling (10 min)

### Advanced
1. Read SUMMARY.md (10 min)
2. Modify alignment algorithms
3. Add custom export formats
4. Integrate into your workflow

## 🔧 Common Tasks

### First Time Setup
```bash
cd lyric-sync
npm install
brew install ffmpeg
```
→ See [QUICKSTART.md](QUICKSTART.md) for details

### Basic Usage
```bash
npm start song.mp3 lyrics.txt
```
→ See [CHEATSHEET.md](CHEATSHEET.md) for more examples

### Testing
```bash
ffmpeg -f lavfi -i anullsrc -t 30 test.mp3
npm start test.mp3 example-lyrics.txt
```
→ See [TEST.md](TEST.md) for complete test guide

### Troubleshooting
- FFmpeg not found? → [QUICKSTART.md](QUICKSTART.md#2-install-ffmpeg-required)
- Timing is off? → [README.md](README.md#alignment-strategies)
- Images blank? → [TEST.md](TEST.md#troubleshooting-tests)

## 📊 Output Formats

| Format | Use Case | File Extension |
|--------|----------|----------------|
| JSON | Custom apps, web players | `.json` |
| LRC | Karaoke software | `.lrc` |
| SRT | Video subtitles | `.srt` |

→ See [README.md](README.md#output-format) for format details

## 🎨 Customization

### Image Styling
Edit `src/imageGenerator.ts`
→ See [SUMMARY.md](SUMMARY.md#customization)

### Alignment Parameters
Edit `src/alignment.ts`
→ See [README.md](README.md#alignment-strategies)

### Export Formats
Edit `src/exporter.ts`
→ See [SUMMARY.md](SUMMARY.md#technical-details)

## 🆘 Help & Support

### Something Not Working?
1. Check [TEST.md](TEST.md#troubleshooting-tests)
2. Verify FFmpeg: `ffmpeg -version`
3. Rebuild: `npm run build`

### Want to Understand How It Works?
1. Read [SUMMARY.md](SUMMARY.md#technical-details)
2. Check source code in `src/`
3. Review alignment strategies

### Need Quick Answer?
1. Check [CHEATSHEET.md](CHEATSHEET.md)
2. Look at examples in [README.md](README.md)

## 📁 Project Structure

```
lyric-sync/
├── src/                    # Source code
│   ├── index.ts           # CLI entry
│   ├── processor.ts       # Main logic
│   ├── alignment.ts       # Audio sync
│   ├── imageGenerator.ts  # Image creation
│   └── exporter.ts        # Format export
├── docs/                   # Documentation
│   ├── INDEX.md           # This file
│   ├── QUICKSTART.md      # Quick start
│   ├── README.md          # Full docs
│   ├── CHEATSHEET.md      # Quick ref
│   ├── TEST.md            # Testing
│   └── SUMMARY.md         # Overview
├── package.json
├── tsconfig.json
└── example-lyrics.txt
```

## ✨ Features at a Glance

- ✅ Automatic lyric-to-audio synchronization
- ✅ High-quality image generation (1920x1080)
- ✅ Multiple export formats (JSON, LRC, SRT)
- ✅ Three alignment strategies with auto-fallback
- ✅ Customizable styling
- ✅ Batch processing support
- ✅ No Python required (FFmpeg only)

## 🎯 Use Cases

1. **Karaoke Videos** - Generate lyric overlays
2. **Music Videos** - Add timed lyrics
3. **Subtitle Creation** - Export SRT for videos
4. **Lyric Apps** - Use JSON in applications
5. **Social Media** - Create quote images

→ See [SUMMARY.md](SUMMARY.md#use-cases) for details

## 🚦 Status

✅ **Ready to Use**
- All core features working
- FFmpeg installed
- TypeScript compiling
- Documentation complete

## 📞 Quick Reference

```bash
# Help
npm start

# Basic usage
npm start audio.mp3 lyrics.txt

# With options
npm start audio.mp3 lyrics.txt --output ./out --format lrc

# Test
npm run build
```

---

**Ready to start?** → Go to [QUICKSTART.md](QUICKSTART.md)

**Need help?** → Check [TEST.md](TEST.md#troubleshooting-tests)

**Want details?** → Read [README.md](README.md)
