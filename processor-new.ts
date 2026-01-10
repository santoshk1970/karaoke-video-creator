    async process(): Promise<void> {
        console.log('🔄 Step 1: Reading lyrics file...');
        const lyrics = this.readLyrics();
        console.log(`   Found ${lyrics.length} lines\n`);
        
        console.log('🔄 Step 2: Analyzing audio and aligning lyrics...');
        
        // Check if manual timing script exists
        const manualTimingScriptPath = path.join(path.dirname(this.config.outputDir), 'set-manual-timing.js');
        const timestampsPath = path.join(this.config.outputDir, 'timestamps.json');
        let timedLyrics: TimedLyric[];
        
        if (fs.existsSync(manualTimingScriptPath)) {
            console.log('   Manual timing script exists, creating minimal timestamps.json...');
            // Create minimal timestamps.json with just duration metadata
            // The manual timing script will populate the lyrics array
            const duration = await this.getAudioDuration(this.config.audioFile);
            const minimalData = {
                version: "1.0",
                metadata: {
                    generatedAt: new Date().toISOString(),
                    totalLines: 0,
                    duration: duration
                },
                lyrics: []
            };
            fs.writeFileSync(timestampsPath, JSON.stringify(minimalData, null, 2));
            console.log(`   Created minimal timestamps.json with duration ${duration.toFixed(1)}s\n`);
            
            // Skip to manual timing application
            let manualTimedLyrics: TimedLyric[] = [];
            
            // STEP 2a: MANUAL TIMING APPLICATION
            console.log('\n🔄 Applying manual timing adjustment...');
            
            const { execSync: execSyncCmd } = require('child_process');
            try {
                // Run the script
                execSyncCmd(`node "${manualTimingScriptPath}"`, {
                    cwd: path.dirname(this.config.outputDir),
                    stdio: 'inherit'
                });
                
                // Reload updated timestamps (now includes prelude, countdowns, etc.)
                const updatedData = JSON.parse(fs.readFileSync(timestampsPath, 'utf-8'));
                manualTimedLyrics = updatedData.lyrics.map((lyric: any) => ({
                    index: lyric.index,
                    startTime: lyric.startTime,
                    endTime: lyric.endTime,
                    text: lyric.text
                }));
                console.log('   ✅ Manual timing applied successfully\n');
            } catch (error: any) {
                console.error('   ❌ Failed to apply manual timing:', error.message);
                throw new Error(`Manual timing script failed. Fix the script or delete it to proceed. Error: ${error.message}`);
            }
        } else if (fs.existsSync(timestampsPath)) {
            console.log('   Using existing timestamps from timestamps.json...');
            const timestampsData = JSON.parse(fs.readFileSync(timestampsPath, 'utf-8'));
            manualTimedLyrics = timestampsData.lyrics.map((lyric: any) => ({
                index: lyric.index,
                startTime: lyric.startTime,
                endTime: lyric.endTime,
                text: lyric.text
            }));
            console.log(`   Loaded ${manualTimedLyrics.length} pre-timed segments\n`);
            
            // Save to ensure we have minimal data structure for manual timing
            await this.exportTimestamps(manualTimedLyrics);
        } else {
            manualTimedLyrics = await this.alignmentEngine.align(
                this.config.audioFile,
                lyrics,
                this.config.vocalFile
            );
            console.log(`   Aligned ${manualTimedLyrics.length} lyric segments\n`);
            
            // Save initial alignment (unexpanded)
            await this.exportTimestamps(manualTimedLyrics);
        }
        
        // PASS 1: Virtual pass - calculate splits without generating anything
        console.log('🔄 Step 3a: Planning image generation (analyzing splits)...');
        const expandedLyrics = this.planImageGeneration(manualTimedLyrics);
        console.log(`   Planned ${expandedLyrics.length} images (${expandedLyrics.length - manualTimedLyrics.length} splits)\n`);
        
        // PASS 2: Execution pass - generate images based on plan
        console.log('🔄 Step 3b: Generating lyric images...');
        await this.generateImages(expandedLyrics);
        console.log(`   Generated ${expandedLyrics.length} images\n`);

        // Export Render Manifest (Expanded) for video creation
        console.log('🔄 Step 4: Exporting render manifest...');
        const renderManifestPath = path.join(this.config.outputDir, 'timestamps-render.json');
        await this.exporter.export(expandedLyrics, renderManifestPath, 'json');
        console.log('   Render manifest exported to timestamps-render.json');

        // Also save unexpanded timestamps to timestamps.json to preserve manual timing structure
        await this.exportTimestamps(manualTimedLyrics);
        console.log('   Source timestamps saved to timestamps.json');

        // Generate video if requested
        if (this.config.generateVideo) {
            console.log('🔄 Step 5: Creating video...');
            await this.videoGenerator.generate(
                expandedLyrics,
                path.join(this.config.outputDir, 'images'),
                this.config.audioFile,
                path.join(this.config.outputDir, 'karaoke.mp4')
            );
        }
    }
