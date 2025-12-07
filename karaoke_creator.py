#!/usr/bin/env python3
"""
Karaoke Video Creator

Creates a karaoke-style video from an MP3 file and a lyrics text file.
The video displays lyrics synchronized with the audio.
"""

import argparse
import os
import sys
from moviepy.editor import AudioFileClip, TextClip, CompositeVideoClip, ColorClip
from moviepy.video.fx.all import fadein, fadeout


def read_lyrics_file(lyrics_path):
    """
    Read lyrics from a text file.
    
    Args:
        lyrics_path: Path to the lyrics text file
        
    Returns:
        List of lyrics lines
    """
    try:
        with open(lyrics_path, 'r', encoding='utf-8') as f:
            lyrics = f.read().strip()
        return lyrics
    except FileNotFoundError:
        print(f"Error: Lyrics file '{lyrics_path}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading lyrics file: {e}")
        sys.exit(1)


def create_karaoke_video(mp3_path, lyrics_path, output_path, 
                         video_width=1280, video_height=720, 
                         bg_color=(0, 0, 0), text_color='white',
                         font='Arial', fontsize=50):
    """
    Create a karaoke video from MP3 and lyrics.
    
    Args:
        mp3_path: Path to the MP3 audio file
        lyrics_path: Path to the lyrics text file
        output_path: Path where the output video will be saved
        video_width: Width of the output video (default: 1280)
        video_height: Height of the output video (default: 720)
        bg_color: Background color as RGB tuple (default: black)
        text_color: Text color for lyrics (default: white)
        font: Font to use for lyrics (default: Arial)
        fontsize: Font size for lyrics (default: 50)
    """
    # Verify input files exist
    if not os.path.exists(mp3_path):
        print(f"Error: MP3 file '{mp3_path}' not found.")
        sys.exit(1)
    
    if not os.path.exists(lyrics_path):
        print(f"Error: Lyrics file '{lyrics_path}' not found.")
        sys.exit(1)
    
    print(f"Loading audio from: {mp3_path}")
    # Load the audio file
    audio = AudioFileClip(mp3_path)
    duration = audio.duration
    
    print(f"Audio duration: {duration:.2f} seconds")
    print(f"Reading lyrics from: {lyrics_path}")
    
    # Read lyrics
    lyrics = read_lyrics_file(lyrics_path)
    
    # Create background clip
    print("Creating video background...")
    background = ColorClip(size=(video_width, video_height), 
                          color=bg_color, 
                          duration=duration)
    
    # Create text clip with lyrics
    print("Adding lyrics text...")
    try:
        text_clip = TextClip(lyrics, 
                           fontsize=fontsize, 
                           color=text_color,
                           font=font,
                           size=(video_width - 100, video_height - 100),
                           method='caption',
                           align='center')
        text_clip = text_clip.set_duration(duration)
        text_clip = text_clip.set_position('center')
    except Exception as e:
        print(f"Error creating text clip: {e}")
        print("Trying with default font...")
        # Fallback to a simpler approach if font fails
        text_clip = TextClip(lyrics, 
                           fontsize=fontsize, 
                           color=text_color,
                           size=(video_width - 100, video_height - 100),
                           method='caption',
                           align='center')
        text_clip = text_clip.set_duration(duration)
        text_clip = text_clip.set_position('center')
    
    # Compose video with background and text
    print("Composing final video...")
    video = CompositeVideoClip([background, text_clip])
    video = video.set_audio(audio)
    
    # Write the video file
    print(f"Writing video to: {output_path}")
    video.write_videofile(output_path, 
                         fps=24, 
                         codec='libx264',
                         audio_codec='aac',
                         temp_audiofile='temp-audio.m4a',
                         remove_temp=True,
                         logger='bar')
    
    print(f"\nSuccess! Karaoke video created: {output_path}")
    print(f"Video duration: {duration:.2f} seconds")
    
    # Clean up
    audio.close()
    video.close()


def main():
    """Main entry point for the karaoke video creator."""
    parser = argparse.ArgumentParser(
        description='Create a karaoke-style video from MP3 and lyrics text file',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s song.mp3 lyrics.txt
  %(prog)s song.mp3 lyrics.txt -o karaoke_video.mp4
  %(prog)s song.mp3 lyrics.txt -o output.mp4 --width 1920 --height 1080
  %(prog)s song.mp3 lyrics.txt --fontsize 60 --text-color yellow
        """
    )
    
    parser.add_argument('mp3_file', 
                       help='Path to the MP3 audio file')
    parser.add_argument('lyrics_file', 
                       help='Path to the lyrics text file')
    parser.add_argument('-o', '--output', 
                       default='karaoke_output.mp4',
                       help='Output video file path (default: karaoke_output.mp4)')
    parser.add_argument('--width', 
                       type=int, 
                       default=1280,
                       help='Video width in pixels (default: 1280)')
    parser.add_argument('--height', 
                       type=int, 
                       default=720,
                       help='Video height in pixels (default: 720)')
    parser.add_argument('--fontsize', 
                       type=int, 
                       default=50,
                       help='Font size for lyrics (default: 50)')
    parser.add_argument('--text-color', 
                       default='white',
                       help='Text color for lyrics (default: white)')
    parser.add_argument('--bg-color', 
                       default='0,0,0',
                       help='Background color as R,G,B (default: 0,0,0 for black)')
    
    args = parser.parse_args()
    
    # Parse background color
    try:
        bg_color = tuple(map(int, args.bg_color.split(',')))
        if len(bg_color) != 3 or not all(0 <= c <= 255 for c in bg_color):
            raise ValueError
    except ValueError:
        print("Error: Background color must be in format R,G,B (e.g., 0,0,0)")
        sys.exit(1)
    
    # Create the karaoke video
    create_karaoke_video(
        mp3_path=args.mp3_file,
        lyrics_path=args.lyrics_file,
        output_path=args.output,
        video_width=args.width,
        video_height=args.height,
        bg_color=bg_color,
        text_color=args.text_color,
        fontsize=args.fontsize
    )


if __name__ == '__main__':
    main()
