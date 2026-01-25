# 🚀 Quick Start Guide

This guide provides the fastest way to get started with **lyric-sync**, focusing on both the user-friendly Web UI and the powerful Command-Line Interface (CLI).

## 1. Installation (One-Time Setup)

First, ensure you have **Node.js** and **FFmpeg** installed.

```bash
# Navigate to the project directory
cd lyric-sync

# Install all required Node.js dependencies
npm install

# Install FFmpeg (if you don't have it)
# On macOS:
brew install ffmpeg
# On Ubuntu/Debian:
sudo apt update && sudo apt install ffmpeg
```

## 2. Using the Web UI (Recommended)

The Web UI provides a guided, step-by-step process for creating karaoke videos.

```bash
# Start the Web UI server
cd web-ui
npm start
```

- **Access the UI**: Open your browser and go to **http://localhost:3000**.
- **Follow the steps**: The interface will guide you through creating a project, timing lyrics, generating images, and creating the final videos.

## 3. Using the Command-Line (CLI)

For more direct control or for scripting, you can use the CLI.

### Basic Usage

This command will analyze your audio, generate timed images, and export a `timestamps.json` file.

```bash
npm start -- --audio your_song.mp3 --lyrics your_lyrics.txt --output ./output
```

### Common CLI Commands

- **Specify an Export Format (LRC or SRT):**
  ```bash
  npm start -- --audio song.mp3 --lyrics lyrics.txt --format srt
  ```

- **Use a Separate Vocal Track (for better accuracy):**
  ```bash
  npm start -- --audio song.mp3 --lyrics lyrics.txt --vocal vocals.mp3
  ```

- **All Options Combined:**
  ```bash
  npm start -- --audio song.mp3 --lyrics lyrics.txt --vocal vocals.mp3 --output ./results --format lrc
  ```

## 4. Project Structure

- **Your Files:** You only need an audio file (e.g., `.mp3`) and a lyrics file (`.txt`).
- **Output:** The tool will generate an `output` directory containing:
    - `images/`: A folder of PNG images for each lyric line.
    - `timestamps.json` (or `.lrc`/`.srt`): The file containing the timing data.

## 5. Troubleshooting

- **`ffmpeg: command not found`**: This means FFmpeg is not installed or not in your system's PATH. Follow the installation instructions in Step 1.
- **Timing is inaccurate**: For songs with prominent vocals, providing a vocal-isolated track using the `--vocal` flag can significantly improve accuracy.
- **Errors during execution**: Ensure your audio and lyrics files are correctly formatted and accessible.
