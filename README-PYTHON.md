# Python Setup for Lyric Sync

This project uses Python for audio processing tasks (stem separation, MIDI conversion).

## Setup Virtual Environment

```bash
# Create virtual environment (one time)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Mac/Linux
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements-python.txt

# Verify installation
python --version
pip list
```

## Usage

**Always activate the virtual environment first:**
```bash
source venv/bin/activate
```

Then run Python scripts:
```bash
# Separate all stems (4-way)
python separate-all-stems.js <audio-file>

# Convert vocals to MIDI
python vocals-to-midi.py <vocals-file>

# Mix stems together
python mix-stems.js <output.mp3> <stem1.mp3> <stem2.mp3> ...
```

## Deactivate

When done:
```bash
deactivate
```

## Dependencies

- **demucs**: AI-powered stem separation (vocals, drums, bass, other)
- **basic-pitch**: Spotify's audio-to-MIDI converter (optimized for vocals)

## Troubleshooting

If you see `ModuleNotFoundError`:
1. Make sure virtual environment is activated: `source venv/bin/activate`
2. Reinstall dependencies: `pip install -r requirements-python.txt`

If conda interferes:
```bash
conda deactivate
source venv/bin/activate
```
