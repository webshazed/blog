const https = require('https');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.BLOG_API_KEY;
if (!API_KEY) {
    console.error('❌ Error: BLOG_API_KEY not found in .env.local');
    process.exit(1);
}

const url = 'https://blog1-roan.vercel.app/api/blog';
const timestamp = Date.now();

const data = JSON.stringify({
    content: `
# Test Post ${timestamp}

This is a verified test post to check if the Malicious Path error is resolved.

## Details
- Time: ${new Date().toISOString()}
- Fix: Slug sanitization and encoding
- Deploy: Vercel + Render

The previous error "Malicious Path" should be gone now.
    `,
    title: `API Test Post ${timestamp}`,
    author: "Evergreen Tester",
    category: "Testing",
    // Explicitly providing a clean slug to test
    slug: `api-test-post-${timestamp}`
});

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'api': API_KEY,
        'Content-Length': data.length
    }
};

console.log(`🚀 Sending POST request to ${url}...`);

const req = https.request(url, options, (res) => {
    console.log(`\n📥 Response Status: ${res.statusCode} ${res.statusMessage}`);

    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(responseBody);
            console.log('\n📦 Response Body:');
            console.log(JSON.stringify(json, null, 2));

            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log('\n✅ SUCCESS: API call worked!');
            } else {
                console.log('\n❌ FAILED: API call returned error.');
            }
        } catch (e) {
            console.log('\n📦 Raw Response:', responseBody);
        }
    });
});

req.on('error', (error) => {
    console.error('\n❌ Error sending request:', error);
});

req.write(data);
req.end();
