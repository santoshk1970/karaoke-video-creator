# Karaoke Video Creator

A Python tool that creates karaoke-style videos from MP3 audio files and lyrics text files. The tool generates a video with the lyrics displayed on screen synchronized with the audio.

## Features

- Creates video from MP3 audio and text-based lyrics
- Customizable video resolution (default: 1280x720)
- Adjustable font size and colors
- Simple command-line interface
- Supports various text and background colors

## Requirements

- Python 3.6 or higher
- FFmpeg (required by moviepy)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/santoshk1970/karaoke-video-creator.git
cd karaoke-video-creator
```

2. Install required Python packages:
```bash
pip install -r requirements.txt
```

3. Make sure FFmpeg is installed on your system:
   - **Ubuntu/Debian**: `sudo apt-get install ffmpeg`
   - **macOS**: `brew install ffmpeg`
   - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

## Usage

### Basic Usage

```bash
python karaoke_creator.py <mp3_file> <lyrics_file>
```

This will create a file named `karaoke_output.mp4` in the current directory.

### Specify Output File

```bash
python karaoke_creator.py song.mp3 lyrics.txt -o my_karaoke.mp4
```

### Custom Video Resolution

```bash
python karaoke_creator.py song.mp3 lyrics.txt --width 1920 --height 1080
```

### Customize Text Appearance

```bash
python karaoke_creator.py song.mp3 lyrics.txt --fontsize 60 --text-color yellow
```

### Custom Background Color

```bash
python karaoke_creator.py song.mp3 lyrics.txt --bg-color 25,25,112
```
(This sets a midnight blue background)

### Full Example

```bash
python karaoke_creator.py mysong.mp3 mysong_lyrics.txt \
  -o karaoke_mysong.mp4 \
  --width 1920 \
  --height 1080 \
  --fontsize 60 \
  --text-color yellow \
  --bg-color 0,0,50
```

## Command-Line Options

```
positional arguments:
  mp3_file              Path to the MP3 audio file
  lyrics_file           Path to the lyrics text file

optional arguments:
  -h, --help            Show help message and exit
  -o OUTPUT, --output OUTPUT
                        Output video file path (default: karaoke_output.mp4)
  --width WIDTH         Video width in pixels (default: 1280)
  --height HEIGHT       Video height in pixels (default: 720)
  --fontsize FONTSIZE   Font size for lyrics (default: 50)
  --text-color TEXT_COLOR
                        Text color for lyrics (default: white)
  --bg-color BG_COLOR   Background color as R,G,B (default: 0,0,0 for black)
```

## Lyrics File Format

The lyrics file should be a plain text file (.txt) containing the song lyrics. The entire text will be displayed on screen throughout the video duration.

Example lyrics file (`lyrics.txt`):
```
Verse 1:
This is the first line
This is the second line

Chorus:
This is the chorus
Singing along
```

## Examples

Create a basic karaoke video:
```bash
python karaoke_creator.py song.mp3 lyrics.txt
```

Create an HD karaoke video with custom styling:
```bash
python karaoke_creator.py song.mp3 lyrics.txt -o output.mp4 --width 1920 --height 1080 --fontsize 70 --text-color cyan
```

## Notes

- The video duration will match the audio duration of the MP3 file
- Lyrics are displayed centered on the screen for the entire duration
- The tool uses H.264 video codec and AAC audio codec for broad compatibility
- Processing time depends on the audio duration and video resolution

## Troubleshooting

**Error: "MoviePy Error: creation of None failed because of the following error"**
- Make sure FFmpeg is properly installed and accessible in your system PATH

**Error: Font-related issues**
- The tool will try to fall back to a default font if the specified font is not available
- Common fonts like Arial should work on most systems

**Error: "ModuleNotFoundError"**
- Make sure all dependencies are installed: `pip install -r requirements.txt`

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.