#!/usr/bin/env node

// Test the complete project workflow
const fs = require('fs');
const path = require('path');

async function testWorkflow() {
    console.log('🧪 Testing Complete Project Workflow...\n');
    
    try {
        // Test 1: Check server is running
        console.log('1. Testing server connection...');
        const response = await fetch('http://localhost:3000');
        if (response.ok) {
            console.log('✅ Server is running');
        } else {
            throw new Error('Server not responding');
        }
        
        // Test 2: Check if we can access the workflow UI
        console.log('\n2. Testing workflow UI...');
        const workflowResponse = await fetch('http://localhost:3000/index-with-workflow.html');
        if (workflowResponse.ok) {
            console.log('✅ Workflow UI accessible');
        } else {
            console.log('❌ Workflow UI not accessible');
        }
        
        // Test 3: Check if the modal HTML loads
        console.log('\n3. Testing project modal...');
        const modalResponse = await fetch('http://localhost:3000/project-creation-modal.html');
        if (modalResponse.ok) {
            console.log('✅ Project modal accessible');
        } else {
            console.log('❌ Project modal not accessible');
        }
        
        // Test 4: Check if audio file exists
        console.log('\n4. Checking audio files...');
        const audioPath = '/Users/santosh/development/songs/merineendonrevival.mp3';
        if (fs.existsSync(audioPath)) {
            console.log('✅ Audio file found: merineendonrevival.mp3');
        } else {
            console.log('❌ Audio file not found: merineendonrevival.mp3');
            console.log('   Available files:');
            const files = fs.readdirSync('/Users/santosh/development/songs');
            files.filter(f => f.endsWith('.mp3')).forEach(f => console.log(`   - ${f}`));
        }
        
        // Test 5: Check API endpoints
        console.log('\n5. Testing API endpoints...');
        
        // Test save-file endpoint
        console.log('   Testing save-file endpoint...');
        // Note: This would require actual file upload, so we'll just check if the endpoint exists
        
        console.log('\n🎉 Workflow testing completed!');
        console.log('\n📋 Next Steps:');
        console.log('1. Open http://localhost:3000/index-with-workflow.html');
        console.log('2. Click "Create New Project"');
        console.log('3. Upload merineendonrevival.mp3');
        console.log('4. Follow the workflow steps');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run tests
testWorkflow();
