const http = require('http');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.BLOG_API_KEY;
const url = 'http://localhost:3000/api/blog';

const data = JSON.stringify({
    content: `
# Test Post for Local Debug

Testing if the "Malicious Path" error is resolved locally.

## Checks
- Slug encoding
- Author upsert
- Category upsert
    `,
    title: "Local Debug Fix",
    author: "Debug User",
    category: "Debug Category"
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

const req = http.request(url, options, (res) => {
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
