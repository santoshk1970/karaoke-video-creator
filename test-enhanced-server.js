#!/usr/bin/env node

// Test script for the enhanced server

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
    console.log('🧪 Testing Enhanced Karaoke Server...\n');
    
    try {
        // Test 1: Check server is running
        console.log('1. Testing server connection...');
        const response = await fetch(BASE_URL);
        if (response.ok) {
            console.log('✅ Server is running');
        } else {
            throw new Error('Server not responding');
        }
        
        // Test 2: Check audio files
        console.log('\n2. Checking audio files...');
        const checkResponse = await fetch(`${BASE_URL}/api/check-audio-files?project=merineendometum`);
        const checkResult = await checkResponse.json();
        console.log('Audio check result:', checkResult);
        
        // Test 3: Test SeamlessM4T transcription
        console.log('\n3. Testing SeamlessM4T transcription...');
        if (checkResult.success && checkResult.hasVocal) {
            const transcribeResponse = await fetch(`${BASE_URL}/api/seamless-transcribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audioFile: checkResult.vocalFile,
                    language: 'hi'
                })
            });
            
            const transcribeResult = await transcribeResponse.json();
            console.log('Transcription result:', transcribeResult);
            
            if (transcribeResult.success) {
                console.log('✅ SeamlessM4T transcription working');
            } else {
                console.log('❌ Transcription failed:', transcribeResult.error);
            }
        } else {
            console.log('❌ No vocal file found, skipping transcription test');
        }
        
        // Test 4: Test hybrid timing
        console.log('\n4. Testing hybrid timing...');
        if (checkResult.success && checkResult.hasVocal) {
            // Read lyrics file
            const fs = require('fs');
            const lyricsPath = '/Users/santosh/development/songs/merineendonmetum.txt';
            
            if (fs.existsSync(lyricsPath)) {
                const lyrics = fs.readFileSync(lyricsPath, 'utf8');
                
                const hybridResponse = await fetch(`${BASE_URL}/api/generate-hybrid-timing`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        audioFile: checkResult.vocalFile,
                        lyrics: lyrics,
                        language: 'hi'
                    })
                });
                
                const hybridResult = await hybridResponse.json();
                console.log('Hybrid timing result:', hybridResult);
                
                if (hybridResult.success) {
                    console.log('✅ Hybrid timing working');
                } else {
                    console.log('❌ Hybrid timing failed:', hybridResult.error);
                }
            } else {
                console.log('❌ Lyrics file not found');
            }
        }
        
        console.log('\n🎉 API testing completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run tests
testAPI();
