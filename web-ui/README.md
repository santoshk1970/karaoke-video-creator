# Karaoke Video Creator - Web UI

Beautiful web interface for creating karaoke videos with timed lyrics.

## Features

- 🎵 **Step-by-step workflow** with visual progress tracking
- 📁 **Drag & drop** file uploads
- 📊 **Live output console** showing real-time progress
- ✅ **Status indicators** for each step
- 🔄 **Auto-backup** existing videos (with purge option)
- 🎬 **One-click video playback**

## Installation

```bash
cd web-ui
npm install
```

## Usage

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open in browser:**
   ```
   http://localhost:3000
   ```

3. **Follow the 6-step workflow:**
   - **Step 1:** Upload audio (.mp3) and lyrics (.txt) files
   - **Step 2:** Time lyrics interactively (opens terminal)
   - **Step 3:** Generate lyric images
   - **Step 4:** Apply manual timing
   - **Step 5:** Create video (with optional purge mode)
   - **Step 6:** Play the final video

## Project Structure

```
web-ui/
├── index.html      # Main UI
├── app.js          # Frontend logic
├── server.js       # Express backend
├── package.json    # Dependencies
└── README.md       # This file
```

## API Endpoints

- `POST /api/setup` - Create project and upload files
- `POST /api/time-lyrics` - Run interactive timing tool
- `POST /api/generate-images` - Generate lyric images
- `POST /api/apply-timing` - Apply manual timing
- `POST /api/create-video` - Create final video
- `POST /api/play-video` - Open video in player

## Notes

- Projects are stored in `../projects/[project-name]/`
- Each project contains: `audio.mp3`, `lyrics.txt`, `output/`
- The timing tool (Step 2) opens in a terminal window
- Video creation streams progress to the UI console
