const content = `
# Local Image Test
This post contains a local image.
<img src="x:/BLOG/test-image.png" alt="Local Image Test" />
`;

const API_URL = 'http://localhost:3000/api/blog';
// Get key from .env.local manually if needed or assume user knows it
const REAL_KEY = 'sk_blog_SFLtpeTEYghPjxOz7Ju1KnryB46vocN5';

async function testLocalImage() {
    console.log('--- LOCAL IMAGE SUPPORT TEST ---');

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api': REAL_KEY },
            body: JSON.stringify({
                content,
                author: 'Test Bot',
                category: 'Testing',
                featured_image: 'x:/BLOG/test-image.png'
            })
        });

        if (res.status === 201) {
            const data = await res.json();
            console.log('✅ PASS: Request Accepted (201 Created)');
            console.log('   Post saved as:', data.post.slug);
            console.log('   Featured Image:', data.post.image);
            console.log('   Content Image Path:', data.post.content.match(/src="(\/uploads\/[^"]+)"/)?.[1] || 'Not Found');
        } else {
            console.error(`❌ FAIL: Expected 201, but got ${res.status}`);
            console.log(await res.text());
        }
    } catch (e) { console.error('Error:', e); }
}

testLocalImage();
