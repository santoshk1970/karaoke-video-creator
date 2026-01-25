# 🎬 Demo Video Generator

Automated scripts to create a professional demo video for Karaoke Video Creator using text-to-speech narration and your screenshots.

## 📋 Prerequisites

- **macOS** (for `say` command text-to-speech)
- **ffmpeg** installed: `brew install ffmpeg`
- **Node.js** installed
- Screenshots in `/Users/santosh/development/pointless-game/imagesForDemo/`

## 🚀 Quick Start

Run the master script to generate everything:

```bash
./make-demo.sh
```

This will:
1. Generate audio narration for all 10 scenes using macOS TTS
2. Convert audio to MP3 format
3. Create video segments with fade transitions
4. Concatenate all segments into final video
5. Output: `demo-output/karaoke-creator-demo.mp4`

## 📁 Files Created

```
lyric-sync/
├── demo-audio/              # Generated audio files (AIFF)
│   ├── scene-1-landing-page.aiff
│   ├── scene-2-create-project-empty.aiff
│   └── ... (10 audio files)
├── demo-output/             # Final video output
│   └── karaoke-creator-demo.mp4
└── demo-temp/               # Temporary files (auto-cleaned)
```

## 🎙️ Audio Generation

### Manual Audio Generation Only

```bash
node generate-demo-audio.js
```

**Voice Settings:**
- Voice: Samantha (clear, professional female voice)
- Rate: 180 words per minute
- Format: AIFF (lossless)

**Alternative Voices:**
- `Alex` - Male, clear
- `Victoria` - Female, British accent
- `Karen` - Female, Australian accent
- `Daniel` - Male, British accent

To change voice, edit `generate-demo-audio.js` line 84:
```javascript
const voice = 'Samantha'; // Change to your preferred voice
```

## 🎬 Video Assembly

### Manual Video Creation Only

```bash
node create-demo-video.js
```

**Video Specifications:**
- Resolution: 1920x1080 (Full HD)
- Frame Rate: 30 fps
- Format: MP4 (H.264)
- Audio: AAC, 192 kbps
- Transitions: 0.5s fade in/out between scenes

## 📊 Scene Breakdown

| Scene | Image | Duration | Description |
|-------|-------|----------|-------------|
| 1 | landingpage.png | 8s | Introduction |
| 2 | createNewProject.png | 8s | Create project form |
| 3 | createNewProjectWithFilesUploaded.png | 10s | Files uploaded |
| 4 | ReadyToUseTimingTool.png | 10s | Ready to time |
| 5 | TimingToolnAction.png | 20s | Timing tool demo |
| 6 | ReadyToGenerateImages.png | 12s | Timing complete |
| 7 | ReadyToApplyTimings.png | 12s | Images generated |
| 8 | ReadyToCreateVideos.png | 15s | Ready for videos |
| 9 | VideosGeneratedReadtoPlay.png | 20s | Videos complete |

**Total Duration:** ~2 minutes

## 🛠️ Customization

### Change Scene Duration

Edit `generate-demo-audio.js` or `create-demo-video.js`:

```javascript
const scenes = [
    { id: 1, duration: 8 },  // Change duration here
    // ...
];
```

### Change Narration Text

Edit `generate-demo-audio.js` in the `scenes` array:

```javascript
{
    id: 1,
    text: 'Your custom narration here...'
}
```

### Add Background Music

To add background music, modify `create-demo-video.js` to include an audio track:

```bash
ffmpeg -i video.mp4 -i music.mp3 -filter_complex "[1:a]volume=0.2[a1];[0:a][a1]amix=inputs=2:duration=first[a]" -map 0:v -map "[a]" output.mp4
```

## 🎨 Advanced Editing

For more advanced features (text overlays, animations, etc.), import the generated video into:

- **Adobe Premiere Pro**
- **Final Cut Pro**
- **DaVinci Resolve** (free)
- **iMovie** (free, Mac)

## 📝 Script Details

### generate-demo-audio.js
- Uses macOS `say` command for TTS
- Generates 10 audio files (one per scene)
- Output format: AIFF (lossless)
- Customizable voice and speech rate

### create-demo-video.js
- Converts AIFF to MP3
- Creates video segments with images + audio
- Adds fade in/out transitions
- Concatenates all segments
- Cleans up temporary files

### make-demo.sh
- Master script that runs both steps
- Checks for ffmpeg installation
- Provides progress feedback
- Error handling

## 🐛 Troubleshooting

### "ffmpeg not found"
```bash
brew install ffmpeg
```

### "Audio file not found"
Run audio generation first:
```bash
node generate-demo-audio.js
```

### "Image file not found"
Check that images exist in:
```
/Users/santosh/development/pointless-game/imagesForDemo/
```

### Video quality issues
Increase bitrate in `create-demo-video.js`:
```javascript
-c:v libx264 -crf 18  // Lower CRF = higher quality (default: 23)
```

### Audio too fast/slow
Adjust speech rate in `generate-demo-audio.js`:
```javascript
const rate = 180; // Increase for faster, decrease for slower
```

## 📤 Sharing Your Video

### YouTube
- Recommended: 1080p, 30fps
- Add captions/subtitles
- Create engaging thumbnail
- Add to playlist

### Vimeo
- Professional hosting
- Better quality preservation
- Embed on website

### Direct Download
- Host on GitHub releases
- Share via Google Drive/Dropbox
- Embed in documentation

## ✅ Quality Checklist

Before sharing:
- [ ] Audio is clear and audible
- [ ] Transitions are smooth
- [ ] All scenes are in correct order
- [ ] Video duration is appropriate (~2-3 min)
- [ ] Resolution is 1080p
- [ ] No audio/video sync issues
- [ ] File size is reasonable (<50MB)

## 🎯 Next Steps

1. **Review the generated video**
2. **Add intro/outro** (optional)
3. **Add background music** (optional)
4. **Upload to platform**
5. **Share with users!**

## 📞 Support

If you encounter issues:
1. Check ffmpeg installation: `ffmpeg -version`
2. Verify image paths are correct
3. Check console output for errors
4. Review generated audio files in `demo-audio/`

---

**Happy video making! 🎉**
