#!/usr/bin/env python3

"""
Analyze and fix timing offset between vocals and guide track
Usage: python sync-guide-timing.py <project-name>

This script:
1. Detects the first vocal onset in the original audio
2. Adds silence padding to the guide track to match
3. Re-mixes with proper synchronization
"""

import sys
import subprocess
from pathlib import Path
import json

def detect_first_onset(audio_file):
    """Detect the time of the first vocal onset using FFmpeg silencedetect"""
    
    result = subprocess.run(
        [
            "ffmpeg",
            "-i", str(audio_file),
            "-af", "silencedetect=noise=-30dB:d=0.1",
            "-f", "null",
            "-"
        ],
        capture_output=True,
        text=True
    )
    
    # Parse silence detection output (FFmpeg writes to stderr)
    output = result.stderr if result.stderr else result.stdout
    lines = output.split('\n')
    for line in lines:
        if 'silence_end' in line:
            # First silence_end is when audio starts
            parts = line.split('silence_end: ')
            if len(parts) > 1:
                time_str = parts[1].split('|')[0].strip()
                return float(time_str)
    
    return 0.0

def sync_guide_track(project_name):
    """Synchronize guide track with original vocals"""
    
    project_dir = Path(f"projects/{project_name}")
    
    if not project_dir.exists():
        print(f"❌ Error: Project '{project_name}' not found")
        sys.exit(1)
    
    print("🎵 Guide Track Timing Sync")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"📂 Project: {project_name}")
    print("")
    
    vocals_file = project_dir / "audio-vocals.mp3"
    guide_file = project_dir / "guide-instrument.mp3"
    synced_guide = project_dir / "guide-instrument-synced.mp3"
    drums_file = project_dir / "audio-drums.mp3"
    bass_file = project_dir / "audio-bass.mp3"
    other_file = project_dir / "audio-other.mp3"
    output_file = project_dir / "karaoke-with-guide-synced.mp3"
    
    if not guide_file.exists():
        print("❌ Error: Guide track not found. Run create-guide-track.py first.")
        sys.exit(1)
    
    # Step 1: Detect first vocal onset
    print("⏳ Step 1: Detecting vocal onset timing...")
    onset_time = detect_first_onset(vocals_file)
    print(f"✓ First vocal detected at {onset_time:.2f}s")
    print("")
    
    # Step 2: Add silence padding to guide track
    if onset_time > 0.1:  # Only pad if there's significant delay
        print(f"⏳ Step 2: Adding {onset_time:.2f}s silence padding to guide...")
        
        result = subprocess.run(
            [
                "ffmpeg",
                "-f", "lavfi",
                "-i", f"anullsrc=r=44100:cl=stereo:d={onset_time}",
                "-i", str(guide_file),
                "-filter_complex", "[0:a][1:a]concat=n=2:v=0:a=1",
                "-y",
                str(synced_guide)
            ],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"❌ Error adding padding: {result.stderr}")
            sys.exit(1)
        
        print("✓ Silence padding added")
        guide_to_use = synced_guide
    else:
        print("✓ Step 2: No padding needed (vocals start immediately)")
        guide_to_use = guide_file
    
    print("")
    
    # Step 3: Re-mix with synced guide
    print("⏳ Step 3: Mixing synced guide with instrumentals...")
    
    filter_complex = (
        "[0:a]volume=1.0[drums];"
        "[1:a]volume=1.0[bass];"
        "[2:a]volume=1.0[other];"
        "[3:a]volume=0.3[guide];"
        "[drums][bass][other][guide]amix=inputs=4:duration=longest:normalize=0[out]"
    )
    
    result = subprocess.run(
        [
            "ffmpeg",
            "-i", str(drums_file),
            "-i", str(bass_file),
            "-i", str(other_file),
            "-i", str(guide_to_use),
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
        print(f"❌ Error mixing: {result.stderr}")
        sys.exit(1)
    
    print("✓ Synced guide track mixed")
    
    print("")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("✅ Synchronized guide track created!")
    print("")
    print(f"📁 {output_file}")
    print(f"   Guide track starts at {onset_time:.2f}s (synced with vocals)")
    print("")
    print("💡 Compare:")
    print(f"   • {project_dir / 'karaoke-with-guide.mp3'} - Original (may be off)")
    print(f"   • {output_file.name} - Synchronized version")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Error: No project specified")
        print("")
        print("Usage: python sync-guide-timing.py <project-name>")
        print("")
        print("Example:")
        print("  python sync-guide-timing.py milgayi")
        sys.exit(1)
    
    project_name = sys.argv[1]
    
    try:
        sync_guide_track(project_name)
    except Exception as e:
        print("")
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
