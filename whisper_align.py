#!/usr/bin/env python3
"""
Use Whisper to automatically detect lyric timing
Usage: python3 whisper_align.py <audio-file> <lyrics-file> <output-dir>
"""

import sys
import json
import os
from pathlib import Path

def main():
    if len(sys.argv) < 3:
        print('Usage: python3 whisper_align.py <audio-file> <lyrics-file> [output-dir]')
        print('\nExample:')
        print('  python3 whisper_align.py song.mp3 lyrics.txt ./output')
        sys.exit(1)
    
    audio_file = sys.argv[1]
    lyrics_file = sys.argv[2]
    output_dir = sys.argv[3] if len(sys.argv) > 3 else './output'
    
    print('🎵 Whisper Automatic Alignment\n')
    
    # Import whisper (will download model if needed)
    print('📦 Loading Whisper...')
    try:
        import whisper
        import ssl
        ssl._create_default_https_context = ssl._create_unverified_context
    except ImportError:
        print('❌ Whisper not installed. Install with: pip3 install openai-whisper')
        sys.exit(1)
    
    # Read lyrics
    print('📖 Reading lyrics...')
    with open(lyrics_file, 'r', encoding='utf-8') as f:
        lyrics = [line.strip() for line in f if line.strip()]
    
    print(f'   Found {len(lyrics)} lines\n')
    
    # Load Whisper model
    print('🎤 Loading Whisper model (first time will download ~150MB)...')
    model = whisper.load_model("base")
    
    # Transcribe with word timestamps
    print('🎤 Analyzing audio (this may take 2-5 minutes)...')
    print('   Detecting speech and timing...')
    
    result = model.transcribe(
        audio_file,
        language='hi',
        word_timestamps=True,
        verbose=False
    )
    
    print('   ✓ Whisper analysis complete\n')
    
    # Match lyrics to segments
    print('🔗 Matching lyrics to detected speech...')
    timed_lyrics = match_lyrics_to_segments(lyrics, result['segments'])
    
    # Create timestamps.json
    total_duration = timed_lyrics[-1]['endTime'] if timed_lyrics else 0
    
    data = {
        'version': '1.0',
        'metadata': {
            'generatedAt': '2025-12-05T22:00:00.000Z',
            'totalLines': len(timed_lyrics),
            'duration': total_duration,
            'source': 'Whisper automatic alignment'
        },
        'lyrics': timed_lyrics
    }
    
    # Save timestamps.json
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, 'timestamps.json')
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f'\n✅ Success!')
    print(f'   Aligned {len(timed_lyrics)} lyrics')
    print(f'   Saved to: {output_file}')
    print(f'\nNext steps:')
    print(f'  1. Generate images (if needed): npm start -- "{audio_file}" "{lyrics_file}" --output "{output_dir}"')
    print(f'  2. Generate video: npm run video "{audio_file}" "{output_dir}"')

def match_lyrics_to_segments(lyrics, segments):
    """Match user's lyrics to Whisper's detected segments"""
    timed_lyrics = []
    
    if not segments:
        print('   ⚠️  No speech detected by Whisper')
        return []
    
    # Strategy: Distribute segments evenly across lyrics
    segments_per_lyric = len(segments) / len(lyrics)
    
    for i, lyric in enumerate(lyrics):
        start_idx = int(i * segments_per_lyric)
        end_idx = int((i + 1) * segments_per_lyric)
        
        relevant_segments = segments[start_idx:end_idx]
        
        if relevant_segments:
            start_time = relevant_segments[0]['start']
            end_time = relevant_segments[-1]['end']
            
            timed_lyrics.append({
                'index': i,
                'startTime': start_time,
                'endTime': end_time,
                'duration': end_time - start_time,
                'text': lyric,
                'imagePath': f"images/lyric_{str(i).zfill(3)}.png"
            })
            
            preview = lyric[:40] + '...' if len(lyric) > 40 else lyric
            print(f'   {i + 1}. {start_time:.1f}s - {end_time:.1f}s: {preview}')
    
    return timed_lyrics

if __name__ == '__main__':
    main()
