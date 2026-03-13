# 🌐 Web UI Workflow

This document outlines the step-by-step process for creating a karaoke video using the Web UI.

## 1. Create Project
- **Action:** Enter a project name, upload an audio file (`.mp3`), and a lyrics file (`.txt`).
- **Result:** A new project directory is created containing your files.

## 2. Time Lyrics
- **Action:** Click "Time Lyrics" to open the browser-based timing tool.
- **Process:** Listen to the audio and press the **spacebar** at the start of each lyric line.
- **Result:** A `timestamps.json` file is generated with your manual timings.

## 3. Generate Images
- **Action:** Click "Generate Images".
- **Process:** The system uses the timestamps to create a PNG image for each lyric line.
- **Result:** An `output/` directory is filled with numbered lyric images (`001.png`, `002.png`, etc.).

## 4. Apply Manual Timing (Optional)
- **Action:** If adjustments are needed, use the "Apply Manual Timing" feature.
- **Process:** Fine-tune the start and end times for each lyric in a visual editor.
- **Result:** The `timestamps.json` file is updated with your precise adjustments.

## 5. Create Videos
- **Action:** Click "Create Video".
- **Process:** FFmpeg combines the generated images and the original audio to create two video files.
- **Result:**
    - `singalong-video.mp4`: A video with vocals, useful for verifying timing.
    - `karaoke-video.mp4`: The final karaoke video, typically without vocals (if an instrumental is used).

## 6. Play Video
- **Action:** Click "Play Video".
- **Result:** The final `karaoke-video.mp4` is opened in your system's default video player.
