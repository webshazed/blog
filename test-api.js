const content = `
# Security Test Article
This is a test to verify API security.
`;

const API_URL = 'http://localhost:3000/api/blog';
const REAL_KEY = 'sk_blog_SFLtpeTEYghPjxOz7Ju1KnryB46vocN5';
const FAKE_KEY = 'nice_try_hacker';

async function testSecurity() {
    console.log('--- STRICT SECURITY CHECK ---');

    // TEST 1: INVALID KEY
    console.log('\n[1/2] Testing INVALID Key...');
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api': FAKE_KEY },
            body: JSON.stringify({ content, author: 'Hacker', category: 'Security' })
        });

        if (res.status === 401) {
            console.log('✅ PASS: Request Rejected as expected (401 Unauthorized)');
        } else {
            console.error(`❌ FAIL: Expected 401, but got ${res.status}`);
        }
    } catch (e) { console.error('Error:', e); }

    // TEST 2: VALID KEY
    console.log('\n[2/2] Testing VALID Key...');
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api': REAL_KEY },
            body: JSON.stringify({
                content,
                author: 'Admin',
                category: 'Security',
                featured_image: 'https://placehold.co/800x400/png'
            })
        });

        if (res.status === 201) {
            const data = await res.json();
            console.log('✅ PASS: Request Accepted (201 Created)');
            console.log('   Post saved as:', data.post.slug);
        } else {
            console.error(`❌ FAIL: Expected 201, but got ${res.status}`);
            console.log(await res.text());
        }
    } catch (e) { console.error('Error:', e); }
}

testSecurity();
