#!/usr/bin/env python3

"""
Create a guide track by replacing vocals with a soft instrument
Usage: python create-guide-track.py <project-name>

This script:
1. Converts vocals to MIDI
2. Synthesizes MIDI to audio with a soft instrument (piano/synth)
3. Mixes it back with the instrumental stems at lower volume
4. Creates a karaoke-ready guide track

Requirements:
    pip install basic-pitch mido fluidsynth
"""

import sys
import os
import subprocess
from pathlib import Path

def create_guide_track(project_name, instrument='piano', guide_volume=0.3):
    """
    Create a guide track with soft instrument replacing vocals
    
    Args:
        project_name: Name of project in projects/ directory
        instrument: Type of instrument ('piano', 'synth', 'flute', 'strings')
        guide_volume: Volume level for guide track (0.0-1.0)
    """
    
    project_dir = Path(f"projects/{project_name}")
    
    if not project_dir.exists():
        print(f"❌ Error: Project '{project_name}' not found")
        sys.exit(1)
    
    print("🎵 Guide Track Creator")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"📂 Project: {project_name}")
    print(f"🎹 Instrument: {instrument}")
    print(f"🔊 Guide volume: {int(guide_volume * 100)}%")
    print("")
    
    # File paths
    audio_file = project_dir / "audio.mp3"
    vocals_file = project_dir / "audio-vocals.mp3"
    drums_file = project_dir / "audio-drums.mp3"
    bass_file = project_dir / "audio-bass.mp3"
    other_file = project_dir / "audio-other.mp3"
    midi_file = project_dir / "audio-vocals.mid"
    guide_audio = project_dir / "guide-instrument.mp3"
    output_file = project_dir / "karaoke-with-guide.mp3"
    
    # Step 1: Check if stems exist, if not separate them
    if not vocals_file.exists():
        print("⏳ Step 1: Separating audio stems...")
        print("   (This may take 2-3 minutes)")
        result = subprocess.run(
            ["python", "separate-all-stems.py", str(audio_file)],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"❌ Error separating stems: {result.stderr}")
            sys.exit(1)
        print("✓ Stems separated")
    else:
        print("✓ Step 1: Stems already exist")
    
    print("")
    
    # Step 2: Convert vocals to MIDI
    if not midi_file.exists():
        print("⏳ Step 2: Converting vocals to MIDI...")
        print("   (This may take 30-60 seconds)")
        result = subprocess.run(
            ["python", "vocals-to-midi.py", str(vocals_file)],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"❌ Error converting to MIDI: {result.stderr}")
            sys.exit(1)
        print("✓ MIDI created")
    else:
        print("✓ Step 2: MIDI already exists")
    
    print("")
    
    # Step 3: Synthesize MIDI to audio with soft instrument
    print("⏳ Step 3: Synthesizing guide instrument...")
    
    # Map instrument names to General MIDI program numbers
    instrument_map = {
        'piano': 0,          # Acoustic Grand Piano
        'soft_piano': 4,     # Electric Piano 1
        'synth': 88,         # Pad 1 (new age)
        'flute': 73,         # Flute
        'strings': 48,       # String Ensemble 1
        'choir': 52,         # Choir Aahs
        'vibes': 11,         # Vibraphone
    }
    
    program = instrument_map.get(instrument, 0)
    
    # Use timidity (more reliable than FluidSynth on Mac)
    wav_file = guide_audio.with_suffix('.wav')
    
    try:
        # Try timidity first (simpler and more reliable)
        result = subprocess.run(
            [
                "timidity",
                str(midi_file),
                "-Ow",
                "-o",
                str(wav_file)
            ],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            # Fallback to FluidSynth
            print("   Trying FluidSynth...")
            
            # Try to find a soundfont
            soundfont_paths = [
                "/usr/share/sounds/sf2/FluidR3_GM.sf2",
                "/usr/local/share/soundfonts/default.sf2",
                "/opt/homebrew/share/soundfonts/default.sf2",
            ]
            
            soundfont = None
            for sf_path in soundfont_paths:
                if os.path.exists(sf_path):
                    soundfont = sf_path
                    break
            
            if not soundfont:
                print("❌ Error: No soundfont found for FluidSynth")
                print("")
                print("Install timidity instead:")
                print("  brew install timidity")
                sys.exit(1)
            
            result = subprocess.run(
                [
                    "fluidsynth",
                    "-ni",
                    soundfont,
                    str(midi_file),
                    "-F",
                    str(wav_file),
                    "-r",
                    "44100"
                ],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                print("❌ Error: MIDI synthesis failed")
                print(result.stderr)
                sys.exit(1)
        
        # Convert WAV to MP3
        if wav_file.exists():
            result = subprocess.run(
                [
                    "ffmpeg",
                    "-i",
                    str(wav_file),
                    "-b:a",
                    "320k",
                    "-y",
                    str(guide_audio)
                ],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                print(f"❌ Error converting to MP3: {result.stderr}")
                sys.exit(1)
            
            # Clean up WAV file
            os.remove(wav_file)
            print("✓ Guide instrument synthesized")
        else:
            print("❌ Error: WAV file not created")
            sys.exit(1)
    
    except FileNotFoundError as e:
        print(f"❌ Error: MIDI synthesizer not found - {e}")
        print("")
        print("Install timidity:")
        print("  brew install timidity")
        sys.exit(1)
    
    print("")
    
    # Step 4: Mix guide track with instrumental stems
    print("⏳ Step 4: Mixing guide track with instrumentals...")
    
    # Create filter complex for FFmpeg
    # Mix: drums (100%) + bass (100%) + other (100%) + guide (30%)
    filter_complex = (
        f"[0:a]volume=1.0[drums];"
        f"[1:a]volume=1.0[bass];"
        f"[2:a]volume=1.0[other];"
        f"[3:a]volume={guide_volume}[guide];"
        f"[drums][bass][other][guide]amix=inputs=4:duration=longest:normalize=0[out]"
    )
    
    result = subprocess.run(
        [
            "ffmpeg",
            "-i", str(drums_file),
            "-i", str(bass_file),
            "-i", str(other_file),
            "-i", str(guide_audio),
            "-filter_complex", filter_complex,
            "-map", "[out]",
            "-ac", "2",
            "-b:a", "320k",
            "-y",
            str(output_file)
        ],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"❌ Error mixing tracks: {result.stderr}")
        sys.exit(1)
    
    print("✓ Guide track mixed")
    
    print("")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("✅ Guide track created!")
    print("")
    print(f"📁 {output_file}")
    print(f"   Instrumentals + {instrument} guide at {int(guide_volume * 100)}%")
    print("")
    print("💡 Files created:")
    print(f"   • {midi_file.name} - Vocal melody as MIDI")
    print(f"   • {guide_audio.name} - Synthesized guide instrument")
    print(f"   • {output_file.name} - Final karaoke track with guide")
    print("")
    print("💡 Tips:")
    print("   • Adjust guide volume with --volume flag (0.0-1.0)")
    print("   • Try different instruments: piano, synth, flute, strings, choir")
    print("   • Use this track for practice before recording vocals")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Error: No project specified")
        print("")
        print("Usage: python create-guide-track.py <project-name> [options]")
        print("")
        print("Examples:")
        print("  python create-guide-track.py milgayi")
        print("  python create-guide-track.py milgayi --instrument synth")
        print("  python create-guide-track.py milgayi --volume 0.2")
        print("")
        print("Instruments:")
        print("  piano, soft_piano, synth, flute, strings, choir, vibes")
        print("")
        print("Requirements:")
        print("  brew install fluid-synth  # OR")
        print("  brew install timidity")
        sys.exit(1)
    
    project_name = sys.argv[1]
    
    # Parse optional arguments
    instrument = 'soft_piano'
    volume = 0.3
    
    for i, arg in enumerate(sys.argv[2:], 2):
        if arg == '--instrument' and i + 1 < len(sys.argv):
            instrument = sys.argv[i + 1]
        elif arg == '--volume' and i + 1 < len(sys.argv):
            volume = float(sys.argv[i + 1])
    
    try:
        create_guide_track(project_name, instrument, volume)
    except Exception as e:
        print("")
        print(f"❌ Error: {e}")
        sys.exit(1)
