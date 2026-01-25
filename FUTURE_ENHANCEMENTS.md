# 🌐 Web UI Workflow Analysis

## Current Web UI Process

### Step-by-Step What Web UI Does Right Now:

#### **Step 1: Project Setup**
```
User Actions:
- Enter project name
- Upload audio file (.mp3)
- Upload lyrics file (.txt)
- Click "Create Project"

System Actions:
- Creates project directory: ../projects/[project-name]/
- Saves: audio.mp3, lyrics.txt
- Returns success response
```

#### **Step 2: Time Lyrics**
```
User Actions:
- Click "Time Lyrics" button
- Terminal window opens with timing tool
- User uses arrow keys to set timing for each line
- Press 'q' when done

System Actions:
- Opens timing-tool.js in terminal
- Creates timestamps.json with timing data
- Updates Web UI with completion status
```

#### **Step 3: Generate Images**
```
User Actions:
- Click "Generate Images" button
- Watches real-time console output

System Actions:
- Runs: npm start -- --audio audio.mp3 --lyrics lyrics-with-timing.txt --output output
- Creates PNG images: 001.png, 002.png, etc.
- Creates/updates: timestamps.json (JSON format only)
- Streams progress to Web UI console
```

#### **Step 4: Apply Manual Timing**
```
User Actions:
- Click "Apply Manual Timing" button
- Opens timing editor in browser
- Adjust timing if needed
- Save changes

System Actions:
- Opens timing.html editor
- Updates timestamps.json with manual adjustments
- Applies changes to image generation
```

#### **Step 5: Create Video**
```
User Actions:
- Click "Create Video" button
- Choose options (purge mode, etc.)
- Watches real-time progress

System Actions:
- Runs FFmpeg to combine images + audio
- Creates final-video.mp4
- Streams progress to Web UI console
```

#### **Step 6: Play Video**
```
User Actions:
- Click "Play Video" button

System Actions:
- Opens final-video.mp4 in default video player
- Shows completion status
```

## Current Output Structure

```
projects/[project-name]/
├── audio.mp3                    # Original audio
├── lyrics.txt                   # Original lyrics
├── lyrics-with-timing.txt       # Lyrics with timing markers
├── timestamps.json              # JSON timing data (ONLY format)
├── output/
│   ├── 001.png, 002.png...     # Lyric images
│   └── timestamps.json          # JSON timing data
└── final-video.mp4              # Final karaoke video
```

## Where LRC and SRT Would Be Relevant

### 🎯 **Stage 3: Image Generation** - PRIMARY OPPORTUNITY

#### **Current Limitation:**
```bash
# Web UI runs this command:
npm start -- --audio audio.mp3 --lyrics lyrics-with-timing.txt --output output
# Result: Only timestamps.json created
```

#### **Enhanced Web UI with LRC/SRT:**
```bash
# Enhanced Web UI could run:
npm start -- --audio audio.mp3 --lyrics lyrics-with-timing.txt --output output --format all
# Results: timestamps.json + lyrics.lrc + lyrics.srt
```

#### **User Benefits:**
- **Karaoke players**: Download lyrics.lrc for karaoke apps
- **Video platforms**: Download lyrics.srt for YouTube uploads
- **Web integration**: Download lyrics.json for web applications

### 🎯 **Stage 6: Play Video** - SECONDARY OPPORTUNITY

#### **Current Limitation:**
```
User only gets final-video.mp4
No separate subtitle/lyric files for other uses
```

#### **Enhanced Web UI with Export Options:**
```
After video creation, show download options:
□ Download Video (final-video.mp4)
□ Download Karaoke Lyrics (lyrics.lrc)
□ Download Subtitles (lyrics.srt)
□ Download Data (lyrics.json)
```

## Proposed Enhanced Web UI Workflow

### **Enhanced Step 3: Generate Images & Exports**
```
User Actions:
- Click "Generate Images & Exports" button
- Choose output formats:
  ☑ Images (PNG)
  ☑ Karaoke format (LRC)
  ☑ Subtitle format (SRT)
  ☑ Data format (JSON)

System Actions:
- Runs: npm start -- --audio audio.mp3 --lyrics lyrics-with-timing.txt --output output --format all
- Creates: PNG images + lyrics.lrc + lyrics.srt + timestamps.json
- Shows download links for each format
```

### **Enhanced Step 6: Export Options**
```
User Actions:
- Click "Export & Download" button
- Select desired formats
- Download individual files or ZIP archive

System Actions:
- Packages selected formats
- Generates download links
- Creates ZIP archive if requested
```

## Implementation Requirements

### **Frontend Changes (HTML/JS):**
1. **Add format checkboxes** to Step 3
2. **Add download section** to Step 6
3. **Update progress indicators** for multiple formats
4. **Add ZIP download** functionality

### **Backend Changes (server.js):**
1. **Modify spawn command** to include --format parameter
2. **Add format validation** and error handling
3. **Create download endpoints** for LRC/SRT files
4. **Add ZIP creation** for bulk downloads

### **API Endpoints to Add:**
```
GET /api/download/:projectName/:format
- Downloads: lyrics.lrc, lyrics.srt, timestamps.json

GET /api/download-all/:projectName
- Downloads: ZIP archive with all formats

POST /api/generate-formats
- Accepts: format selection (lrc, srt, json)
- Returns: download links for selected formats
```

## User Scenarios Enhanced by LRC/SRT

### **Scenario 1: Karaoke Bar Owner**
```
Current: Creates video → Manual extract timing → Create LRC
Enhanced: Creates video → Download LRC directly → Use in karaoke system
```

### **Scenario 2: YouTuber**
```
Current: Creates video → Manual extract timing → Create SRT
Enhanced: Creates video → Download SRT directly → Upload to YouTube
```

### **Scenario 3: Web Developer**
```
Current: Creates video → Extract data from JSON → Integrate
Enhanced: Creates video → Download JSON → Direct web integration
```

### **Scenario 4: Music Teacher**
```
Current: Creates video → Students watch only
Enhanced: Creates video → Download LRC → Students practice with karaoke apps
```

## Priority Implementation Order

### **Phase 1: Basic Export (High Priority)**
- Add --format parameter to existing image generation
- Create download links for LRC and SRT files
- Update UI to show multiple output formats

### **Phase 2: Enhanced UX (Medium Priority)**
- Add format selection checkboxes
- Create ZIP download functionality
- Improve progress indicators for multiple formats

### **Phase 3: Advanced Features (Low Priority)**
- Add format preview in browser
- Batch export for multiple projects
- Format conversion tools

## Conclusion

**LRC and SRT are most relevant at Stage 3 (Image Generation)** where the timing data is already processed and can be exported to multiple formats simultaneously.

**Secondary relevance at Stage 6 (Video Completion)** for providing users with comprehensive export options for different platforms and use cases.

**Current Web UI is video-focused** but could easily be enhanced to support multiple export formats with minimal backend changes and significant user value addition.
