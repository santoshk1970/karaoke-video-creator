#!/usr/bin/env python3

"""
Convert vocals audio file to MIDI using Basic Pitch (Spotify)
Usage: python vocals-to-midi.py <vocals-audio-file> [output.mid]

Requirements:
    pip install basic-pitch
"""

import sys
import os
from basic_pitch.inference import predict
from basic_pitch import ICASSP_2022_MODEL_PATH

def audio_to_midi(audio_file, output_midi=None):
    """
    Convert audio file to MIDI using Basic Pitch
    
    Args:
        audio_file: Path to input audio file (vocals)
        output_midi: Path to output MIDI file (optional)
    """
    
    if not os.path.exists(audio_file):
        print(f"❌ Error: Audio file not found: {audio_file}")
        sys.exit(1)
    
    # Default output filename
    if output_midi is None:
        base_name = os.path.splitext(audio_file)[0]
        output_midi = f"{base_name}.mid"
    
    print("🎵 Basic Pitch Vocal to MIDI Converter (Spotify)")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"📂 Input:  {audio_file}")
    print(f"📂 Output: {output_midi}")
    print("")
    print("⏳ Analyzing audio with AI model...")
    print("   (This may take 30-60 seconds)")
    print("")
    
    # Run Basic Pitch prediction
    # Returns: model_output, midi_data, note_events
    model_output, midi_data, note_events = predict(
        audio_path=audio_file,
        model_or_model_path=ICASSP_2022_MODEL_PATH,
        onset_threshold=0.5,
        frame_threshold=0.3,
        minimum_note_length=127.70,  # milliseconds
        minimum_frequency=None,
        maximum_frequency=None,
        multiple_pitch_bends=False,
        melodia_trick=True,
        debug_file=None,
    )
    
    print("✓ Analysis complete!")
    print("")
    print("⏳ Writing MIDI file...")
    
    # Save MIDI file
    midi_data.write(output_midi)
    
    # Count notes for stats
    note_count = sum(len(instrument.notes) for instrument in midi_data.instruments)
    duration = midi_data.get_end_time()
    
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("✅ MIDI conversion complete!")
    print("")
    print(f"📁 {output_midi}")
    print(f"   {note_count} notes detected")
    print(f"   Duration: {duration:.2f}s")
    print("")
    print("💡 Tips:")
    print("   • Open in GarageBand, Logic, Ableton, etc.")
    print("   • Use for pitch reference in karaoke")
    print("   • Basic Pitch is optimized for vocals and monophonic instruments")
    print("   • Adjust onset/frame thresholds if results aren't accurate")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Error: No audio file specified")
        print("")
        print("Usage: python vocals-to-midi.py <vocals-audio-file> [output.mid]")
        print("")
        print("Examples:")
        print("  python vocals-to-midi.py audio-vocals.mp3")
        print("  python vocals-to-midi.py audio-vocals.mp3 melody.mid")
        print("")
        print("Requirements:")
        print("  pip install basic-pitch")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    output_midi = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        audio_to_midi(audio_file, output_midi)
    except Exception as e:
        print("")
        print(f"❌ Error: {e}")
        print("")
        print("Make sure Basic Pitch is installed:")
        print("  pip install basic-pitch")
        sys.exit(1)
