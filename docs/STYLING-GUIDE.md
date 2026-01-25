# Lyric Sync - Styling Guide

## New Features

### 1. Gradient Background
Images now have a beautiful dark blue gradient background instead of plain black.
- Top color: `#1a1a3e` (dark blue)
- Bottom color: `#0f0f23` (darker blue)

### 2. Text Shadow
All text has a subtle shadow for better readability:
- Shadow color: Black with 70% opacity
- Blur: 15px
- Offset: 4px horizontal, 4px vertical

### 3. Dual Language Support (Hindi + English Transliteration)

#### Format
Use the pipe `|` character to separate Hindi and English:
```
हिंदी गीत | Hindi transliteration
```

#### Layout
- **Hindi text**: Top-left corner, full size (80px)
- **English text**: Bottom-right corner, smaller size (56px, gray color)

#### Example File
See `data/lyrics-with-transliteration.txt` for a complete example.

### 4. Bold Highlighting
Use `[brackets]` to highlight specific words:
```
[4] 3 2 1  → The "4" will be bold, larger, and gold-colored
```

## Usage

### With Transliteration
```bash
npm start "./data/Originalमिल-गईं-नज़रें.mp3" "./data/lyrics-with-transliteration.txt" --output "./output"
```

### Without Transliteration (Original)
```bash
npm start "./data/Originalमिल-गईं-नज़रें.mp3" "./data/lyrics.txt" --output "./output"
```

## Customization

To change colors or styles, edit `src/processor.ts` line 87-100:

```typescript
{
    width: 1920,
    height: 1080,
    fontSize: 80,                              // Main text size
    fontFamily: 'Arial',
    textColor: '#FFFFFF',                      // Main text color
    backgroundColor: '#000000',                // Fallback if gradient disabled
    padding: 100,
    useGradient: true,                         // Enable/disable gradient
    gradientColors: ['#1a1a3e', '#0f0f23'],   // [top, bottom] colors
    textShadow: true,                          // Enable/disable shadow
    transliterationFontSize: 56,               // English text size
    transliterationColor: '#AAAAAA'            // English text color
}
```

## Color Suggestions

### Gradient Presets
- **Dark Blue** (current): `['#1a1a3e', '#0f0f23']`
- **Purple**: `['#2d1b4e', '#1a0f2e']`
- **Dark Red**: `['#3e1a1a', '#230f0f']`
- **Dark Green**: `['#1a3e1a', '#0f230f']`
- **Gray**: `['#2a2a2a', '#1a1a1a']`

### Text Colors
- **White** (current): `#FFFFFF`
- **Cream**: `#FFF8DC`
- **Light Blue**: `#ADD8E6`
- **Gold**: `#FFD700`

## Tips

1. Keep Hindi lines short for better readability in dual-language mode
2. English transliteration should be concise
3. Use `[brackets]` sparingly for emphasis
4. Test different gradient colors to match your video theme
