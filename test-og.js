// Simple script to test the Open Graph image
const fetch = require('node-fetch');

async function testOGImage() {
  try {
    console.log('🧪 Testing Open Graph image...');
    
    // Test the dynamic OG image
    const response = await fetch('http://localhost:3000/api/og');
    
    if (response.ok) {
      console.log('✅ Dynamic OG image is working!');
      console.log('📊 Response status:', response.status);
      console.log('📊 Content type:', response.headers.get('content-type'));
    } else {
      console.log('❌ Dynamic OG image failed:', response.status, response.statusText);
    }
    
    // Test the static HTML file
    const htmlResponse = await fetch('http://localhost:3000/og-image.html');
    
    if (htmlResponse.ok) {
      console.log('✅ Static HTML preview is working!');
      console.log('📊 Response status:', htmlResponse.status);
    } else {
      console.log('❌ Static HTML preview failed:', htmlResponse.status, htmlResponse.statusText);
    }
    
  } catch (error) {
    console.error('❌ Error testing OG image:', error.message);
  }
}

// Wait a moment for the server to start, then test
setTimeout(testOGImage, 3000);
