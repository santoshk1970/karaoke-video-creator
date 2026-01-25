# 🏗️ Lyric Sync Architecture

## System Overview

```mermaid
graph LR
    A[Input Files] --> B[Processing]
    B --> C[Output Files]
    
    subgraph A[Input Files]
        A1[audio.mp3]
        A2[lyrics.txt]
        A3[vocals.mp3<br/>optional]
    end
    
    subgraph B[Processing]
        B1[Alignment Engine]
        B1 --> B2[FFmpeg Analysis]
        B1 --> B3[Simple Distribution]
    end
    
    subgraph C[Output Files]
        C1[001.png]
        C2[002.png]
        C3[timestamps.json]
    end
```

## Core Components

```mermaid
graph TB
    subgraph LyricSyncSystem[Lyric Sync System]
        subgraph Processing[Core Processing Pipeline]
            Audio[Audio Processing] --> Alignment[Lyrics Alignment] --> Images[Image Generation]
            
            subgraph Audio[Audio Processing]
                A1[FFmpeg]
                A2[Duration]
                A3[Analysis]
            end
            
            subgraph Alignment[Lyrics Alignment]
                L1[FFmpeg Analysis]
                L2[Timing]
                L3[Segments]
            end
            
            subgraph Images[Image Generation]
                I1[Canvas]
                I2[PNG 1920x1080]
                I3[Gradients]
            end
        end
        
        subgraph Support[Supporting Components]
            Export[Export Engine] --> Security[Security Layer] --> Web[Web UI]
            
            subgraph Export[Export Engine]
                E1[JSON]
            end
            
            subgraph Security[Security Layer]
                S1[Sanitized Commands]
                S2[Validation]
            end
            
            subgraph Web[Web UI]
                W1[Express]
                W2[Upload]
                W3[Real-time]
            end
        end
    end
```

## Data Flow

```mermaid
flowchart TD
    Start([Start]) --> Input[Input Validation]
    Input --> AudioCheck{Check Audio}
    AudioCheck -->|Valid| Alignment[Alignment Engine]
    AudioCheck -->|Invalid| Error1[Error: Invalid Audio]
    
    Alignment --> FFmpegTry{Try FFmpeg}
    FFmpegTry -->|Success| Images[Image Generation]
    FFmpegTry -->|Fail| Simple[Simple Distribution]
    Simple --> Images
    
    Images --> Canvas[Canvas Rendering]
    Canvas --> Export[Export Formats]
    Export --> JSON[JSON Output]
    
    JSON --> End([End])
    
    Error1 --> End
```

## Technology Stack

```mermaid
graph LR
    subgraph Frontend[Frontend]
        F1[Web UI]
        F2[Drag & Drop]
        F3[Real-time]
        F4[Console]
    end
    
    subgraph Backend[Backend]
        B1[TypeScript]
        B2[Node.js]
        B3[Express]
        B4[Vitest]
    end
    
    subgraph External[External Tools]
        E1[FFmpeg]
        E2[Canvas]
    end
    
    Frontend --> Backend --> External
```

## Security Architecture

```mermaid
flowchart LR
    Input[User Input] --> Sanitize[Sanitization]
    Sanitize --> Validate[Validation]
    Validate --> Process[Processing]
    Process --> Output[Secure Output]
    
    subgraph Security[🔒 Security Measures]
        S1[Command Injection Protection]
        S2[File Path Sanitization]
        S3[Input Validation]
        S4[Error Handling]
        S5[Secure Defaults]
    end
```

## Deployment Options

```mermaid
graph TD
    subgraph Deploy[Deployment Options]
        CLI[Local CLI]
        Web[Web Server]
        Cloud[Cloud]
        
        CLI --> C1[npm start]
        CLI --> C2[--audio file]
        CLI --> C3[--lyrics file]
        
        Web --> W1[cd web-ui]
        Web --> W2[npm start]
        Web --> W3[localhost:3000]
        
        Cloud --> CLOUD1[Docker]
        Cloud --> CLOUD2[VPS]
        Cloud --> CLOUD3[GitHub Pages]
    end
```

## Project Statistics

```mermaid
pie title Project Quality Metrics
    "Tests Passing" : 56
    "Code Coverage" : 31
    "Vulnerabilities" : 0
    "Security Score" : 100
```

## Architecture Benefits

```mermaid
mindmap
  root((Lyric Sync))
    Modularity
      Clear separation
      Reusable components
      Easy testing
    Reliability
      Multiple alignment strategies
      Fallback mechanisms
      Error handling
    Security
      Input sanitization
      Command protection
      Validation layers
    Flexibility
      Multiple export formats
      CLI and Web UI
      Deployment options
```