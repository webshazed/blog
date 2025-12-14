const https = require('https');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.BLOG_API_KEY;
if (!API_KEY) {
    console.error('❌ Error: BLOG_API_KEY not found in .env.local');
    process.exit(1);
}

const url = 'https://blog1-roan.vercel.app/api/blog';

// User's HTML content
const htmlContent = `<h1 id="theultimateguidetomakingrestaurantqualitypizzaathome">The Ultimate Guide to Making Restaurant-Quality Pizza at Home</h1>
<p>Let's be honest: there is nothing quite like biting into a slice of fresh, hot pizza. Whether it's the memory of a family Friday night tradition or a craving sparked by a Japanese game show highlighting a deep love for food, pizza connects us all.</p>
<p>But making it at home? That can feel intimidating. You might read that a true Neapolitan pizza requires a wood-fired oven blazing at <strong>700 to 1000 degrees</strong> to cook properly. Since most of us don't have a commercial brick oven in our backyard, does that mean we settle for mediocrity?</p>
<p>Absolutely not. By combining the convenience of modern home cooking with artisan techniques, you can turn your standard oven into a pizza powerhouse.</p>
<img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800" alt="Pizza" />
<h2>The Secret is in the Lean Dough</h2>
<p>Forget the frozen stuff. The best pizza dough is what bakers call a <strong>lean dough</strong>.</p>`;

const data = JSON.stringify({
    content: htmlContent,
    author: "shazed",
    category: "Food"
});

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'api': API_KEY,
        'Content-Length': Buffer.byteLength(data)
    }
};

console.log(`🚀 Sending POST request to ${url}...`);
console.log(`📦 Payload size: ${Buffer.byteLength(data)} bytes`);

const req = https.request(url, options, (res) => {
    console.log(`\n📥 Response Status: ${res.statusCode} ${res.statusMessage}`);

    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log('\n📦 Response Body:');
        console.log(responseBody);

        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('\n✅ SUCCESS!');
        } else {
            console.log('\n❌ FAILED');
        }
    });
});

req.on('error', (error) => {
    console.error('\n❌ Error sending request:', error);
});

req.write(data);
req.end();
