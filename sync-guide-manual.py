#!/usr/bin/env python3

"""
Manually sync guide track with specific offset
Usage: python sync-guide-manual.py <project-name> <offset-seconds>

Example: python sync-guide-manual.py milgayi 27
"""

import sys
import subprocess
from pathlib import Path

def sync_guide_manual(project_name, offset_seconds):
    """Synchronize guide track with manual offset"""
    
    project_dir = Path(f"projects/{project_name}")
    
    if not project_dir.exists():
        print(f"❌ Error: Project '{project_name}' not found")
        sys.exit(1)
    
    print("🎵 Manual Guide Track Sync")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"📂 Project: {project_name}")
    print(f"⏱️  Offset: {offset_seconds}s")
    print("")
    
    guide_file = project_dir / "guide-instrument.mp3"
    synced_guide = project_dir / "guide-instrument-manual.mp3"
    drums_file = project_dir / "audio-drums.mp3"
    bass_file = project_dir / "audio-bass.mp3"
    other_file = project_dir / "audio-other.mp3"
    output_file = project_dir / "karaoke-with-guide-manual.mp3"
    
    if not guide_file.exists():
        print("❌ Error: Guide track not found. Run create-guide-track.py first.")
        sys.exit(1)
    
    # Step 1: Add silence padding to guide track
    print(f"⏳ Adding {offset_seconds}s silence padding to guide...")
    
    result = subprocess.run(
        [
            "ffmpeg",
            "-f", "lavfi",
            "-i", f"anullsrc=r=44100:cl=stereo:d={offset_seconds}",
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
    print("")
    
    # Step 2: Mix with instrumentals
    print("⏳ Mixing synced guide with instrumentals...")
    
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
            "-i", str(synced_guide),
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
    print("✅ Manually synchronized guide track created!")
    print("")
    print(f"📁 {output_file}")
    print(f"   Guide starts at 0:{int(offset_seconds):02d}")
    print("")
    print("💡 Test and adjust:")
    print(f"   python sync-guide-manual.py {project_name} {int(offset_seconds - 1)}  # Start 1s earlier")
    print(f"   python sync-guide-manual.py {project_name} {int(offset_seconds + 1)}  # Start 1s later")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("❌ Error: Missing arguments")
        print("")
        print("Usage: python sync-guide-manual.py <project-name> <offset-seconds>")
        print("")
        print("Examples:")
        print("  python sync-guide-manual.py milgayi 27")
        print("  python sync-guide-manual.py milgayi 30")
        print("")
        print("💡 Listen to the track and adjust the offset until it matches perfectly")
        sys.exit(1)
    
    project_name = sys.argv[1]
    
    try:
        offset_seconds = float(sys.argv[2])
    except ValueError:
        print(f"❌ Error: Invalid offset '{sys.argv[2]}' - must be a number")
        sys.exit(1)
    
    try:
        sync_guide_manual(project_name, offset_seconds)
    except Exception as e:
        print("")
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
