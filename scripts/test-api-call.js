require('dotenv').config({ path: '.env.local' });

async function testApi() {
    const apiKey = process.env.BLOG_API_KEY;
    console.log("Using API Key:", apiKey ? "FOUND" : "MISSING");

    if (!apiKey) {
        console.error("Please set BLOG_API_KEY in .env.local");
        return;
    }

    const payload = {
        title: "Demo Post via API",
        category: "Technology",
        author: "API Tester",
        content: `
# This is a Test Post
This content should be saved to valid HTML file.

## Features
- **File Storage**: Content is in a file.
- **DB Storage**: Metadata is in Supabase.

![Placeholder Image](https://via.placeholder.com/300)
        `
    };

    try {
        console.log("Sending POST request to http://localhost:3000/api/blog...");
        const res = await fetch('http://localhost:3000/api/blog', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api': apiKey
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Request Failed:", error.message);
        if (error.cause) console.error("Cause:", error.cause);
    }
}

testApi();
