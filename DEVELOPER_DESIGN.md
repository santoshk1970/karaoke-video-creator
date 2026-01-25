# 📋 Developer Design Document

## System Architecture Overview

### Basic Architecture
The Lyric Sync system is a modular TypeScript application that processes audio and lyrics to generate synchronized content for multiple platforms.

### Core Design Principles
- **Modularity**: Separate concerns for alignment, image generation, and export
- **Security**: Input sanitization and command injection protection
- **Flexibility**: Multiple alignment strategies and export formats
- **Performance**: Efficient processing with fallback mechanisms

## Technology Stack

### Frontend Technologies
```typescript
// Web UI - Client Side
Languages: HTML5, JavaScript (ES6+), CSS3
Frameworks: None (vanilla JS for simplicity)
Libraries: None (minimal dependencies)
Features: Drag & drop, real-time updates, progress tracking
```

### Backend Technologies
```typescript
// Web UI - Server Side
Runtime: Node.js 18+
Framework: Express.js 4.18+
Language: TypeScript 5.9+
Package Manager: npm 9+
Libraries:
- multer: File upload handling
- express: Web server framework
- child_process: CLI process spawning
```

### Core Processing Engine
```typescript
// CLI Application
Language: TypeScript 5.9+
Runtime: Node.js 18+
Build Tool: ts-node
Testing: Vitest 4.0+
Coverage: v8 coverage provider
Libraries:
- fluent-ffmpeg: Audio processing
- canvas: Image generation
- @types/node: TypeScript definitions
```

### External Dependencies
```bash
# System Dependencies
Tool: FFmpeg
Purpose: Audio analysis and video creation
Installation: brew install ffmpeg (macOS)
Integration: Command-line interface via fluent-ffmpeg
```

## System Components

### 1. Audio Processing Module
```typescript
// Location: src/alignment.ts
Class: AlignmentEngine
Responsibilities:
- Audio duration detection
- Silence analysis
- Format validation
- External tool integration

Key Methods:
- align(audioFile, lyrics, vocalFile?): Promise<TimedLyric[]>
- getAudioDuration(audioFile): Promise<number>
- alignWithFFmpeg(audioFile, lyrics, vocalFile?): Promise<TimedLyric[]>
```

### 2. Image Generation Module
```typescript
// Location: src/imageGenerator.ts
Class: ImageGenerator
Responsibilities:
- Canvas-based image creation
- Text rendering with effects
- Multi-language support
- Background image processing

Key Methods:
- generate(text, outputPath, style, nextLine?): Promise<void>
- createGradient(ctx, colors): void
- drawTextWithEffects(ctx, text, style): void
- wrapText(ctx, text, maxWidth): string[]

Configuration:
- Default resolution: 1920x1080
- Supported formats: PNG
- Text rendering: Canvas 2D context
- Font support: System fonts + custom registration
```

### 3. Export Engine Module
```typescript
// Location: src/exporter.ts
Class: TimestampExporter
Responsibilities:
- Multi-format export generation
- Format-specific timestamp formatting
- File I/O operations
- Metadata management

Export Formats:
- JSON: Complete metadata + file paths
- LRC: Karaoke format [mm:ss.xx]
- SRT: Subtitle format hh:mm:ss,ms

Key Methods:
- export(timedLyrics, outputPath, format): Promise<void>
- toJSON(timedLyrics): string
- toLRC(timedLyrics): string
- toSRT(timedLyrics): string
```

### 4. Web UI Backend
```typescript
// Location: web-ui/server.js
Framework: Express.js
Port: 3000 (default)
Middleware:
- multer: File upload handling
- express.json: Request body parsing
- cors: Cross-origin resource sharing

API Endpoints:
- POST /api/setup: Project creation and file upload
- POST /api/time-lyrics: Interactive timing tool
- POST /api/generate-images: Image generation
- POST /api/apply-timing: Manual timing adjustment
- POST /api/create-video: Video compilation
- POST /api/play-video: Video playback

File Management:
- Project directory: ../projects/[projectName]/
- Upload handling: Temporary files → project directory
- Cleanup: Automatic old file removal
```

### 5. Web UI Frontend
```javascript
// Location: web-ui/app.js
Architecture: Single Page Application
State Management: Global state object
Communication: Fetch API + Server-Sent Events

UI Components:
- Project management interface
- File upload with drag & drop
- Real-time console output
- Progress indicators
- Video playback controls

Event Handling:
- Form submissions via fetch()
- Real-time updates via EventSource
- File validation and error handling
- Progress tracking and status updates
```

## Data Models

### Core Data Structures
```typescript
// Timed Lyric Interface
interface TimedLyric {
    index: number;
    startTime: number;
    endTime: number;
    text: string;
    imagePath?: string;
}

// Image Style Configuration
interface ImageStyle {
    width: number;
    height: number;
    fontSize: number;
    fontFamily: string;
    textColor: string;
    backgroundColor: string;
    useGradient?: boolean;
    gradientColors?: string[];
}

// Processor Configuration
interface ProcessorConfig {
    audioFile: string;
    lyricsFile: string;
    vocalFile?: string;
    outputDir: string;
    format: 'json' | 'lrc' | 'srt';
}
```

### Export Format Specifications
```typescript
// JSON Export Format
interface JSONExport {
    version: string;
    metadata: {
        generatedAt: string;
        totalLines: number;
        duration: number;
    };
    lyrics: TimedLyric[];
}

// LRC Export Format
interface LRCExport {
    headers: {
        title: string;
        artist: string;
        album: string;
        creator: string;
    };
    lyrics: string[]; // [mm:ss.xx]Lyric text
}

// SRT Export Format
interface SRTExport {
    sequence: number;
    startTime: string; // hh:mm:ss,ms
    endTime: string;   // hh:mm:ss,ms
    text: string;
}
```

## Security Implementation

### Input Sanitization
```typescript
// Command Injection Protection
function sanitizePath(path: string): string {
    return path
        .replace(/"/g, '\\"')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$')
        .replace(/;/g, '\\;');
}

// File Validation
function validateAudioFile(filePath: string): boolean {
    const supportedFormats = ['.mp3', '.wav', '.m4a', '.flac'];
    const ext = path.extname(filePath).toLowerCase();
    return supportedFormats.includes(ext);
}
```

### Security Measures
- **Command sanitization**: All shell commands sanitized
- **File path validation**: Prevent directory traversal
- **Input validation**: File type and size limits
- **Error handling**: Secure error message display
- **Dependency management**: Regular vulnerability scanning

## Performance Optimization

### Processing Pipeline
```typescript
// Alignment Strategy Priority
1. Aeneas (Python) - Highest accuracy
2. FFmpeg Analysis - Medium accuracy, fast
3. Time Distribution - Fallback, always works

// Image Generation Optimization
- Canvas reuse for batch processing
- Text measurement cache
- Gradient pre-computation
- Async file operations
```

### Memory Management
- **Stream processing**: Large files processed in chunks
- **Garbage collection**: Manual cleanup for large operations
- **Resource limits**: Memory and CPU usage monitoring
- **Async operations**: Non-blocking I/O throughout

## Testing Strategy

### Unit Testing
```typescript
// Framework: Vitest
// Coverage Target: 80%+
Test Files:
- processor.test.ts: Core logic testing
- imageGenerator.test.ts: Canvas mocking
- exporter.test.ts: Format validation
- alignment.test.ts: Strategy testing

Mock Strategy:
- Canvas: Mocked for CI/CD
- FFmpeg: Stubbed for reliability
- File system: Temporary directories
```

### Integration Testing
```bash
# End-to-end workflow testing
- Complete lyric processing pipeline
- Multi-format export validation
- Web UI API endpoint testing
- Error recovery scenarios
```

### Security Testing
```bash
# Vulnerability scanning
- npm audit: Dependency vulnerabilities
- Snyk scanning: Security assessment
- Command injection testing
- File system access validation
```

## Deployment Architecture

### Local Development
```bash
# Environment Setup
Node.js 18+
Python 3.8+
FFmpeg system installation

# Development Commands
npm run dev        # TypeScript watch mode
npm run test:watch # Test watch mode
npm run build      # Production build
npm start          # Production start
```

### Web UI Deployment
```typescript
// Server Configuration
Port: 3000
Environment: development/production
Static files: Built frontend assets
Upload directory: Configurable path
Logging: Winston or console output

// Process Management
PM2: Process management
Docker: Containerization support
Nginx: Reverse proxy option
```

### Production Considerations
- **Error logging**: Structured logging implementation
- **Monitoring**: Health check endpoints
- **Scalability**: Horizontal scaling options
- **Backup**: Project data backup strategies

## API Documentation

### Core API Endpoints
```typescript
// Project Management
POST /api/setup           // Create project
GET  /api/projects        // List projects
DELETE /api/project       // Delete project

// Processing Pipeline
POST /api/time-lyrics     // Interactive timing
POST /api/generate-images // Image generation
POST /api/apply-timing    // Manual timing
POST /api/create-video    // Video compilation

// File Operations
POST /api/upload          // File upload
GET  /api/download/:format // File download
```

### Request/Response Formats
```typescript
// Standard Response
interface APIResponse {
    success: boolean;
    data?: any;
    error?: string;
    timestamp: string;
}

// Project Creation Request
interface CreateProjectRequest {
    projectName: string;
    audioFile: File;
    lyricsFile: File;
}
```

## Future Enhancements

### Phase 1: Multi-Format Export
- LRC/SRT export in Web UI
- Format selection interface
- Bulk download capabilities
- ZIP archive generation

### Phase 2: Advanced Features
- Real-time collaboration
- Cloud storage integration
- Advanced image effects
- Template system

### Phase 3: Enterprise Features
- API rate limiting
- User authentication
- Project sharing
- Analytics dashboard

## Maintenance Guidelines

### Code Quality
- **Linting**: ESLint configuration
- **Formatting**: Prettier integration
- **Type safety**: Strict TypeScript mode
- **Documentation**: JSDoc comments

### Dependency Management
- **Updates**: Monthly dependency updates
- **Security**: Weekly vulnerability scans
- **Testing**: Continuous integration testing
- **Monitoring**: Performance metrics tracking

### Backup and Recovery
- **Code**: Git version control
- **Projects**: Automated backup system
- **Configuration**: Environment-specific configs
- **Disaster recovery**: Restoration procedures

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-24  
**Maintainer**: Santosh Kulkarni
