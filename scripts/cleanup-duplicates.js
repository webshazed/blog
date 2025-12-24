const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

async function deleteArticle(id) {
    const url = `${STRAPI_URL}/api/articles/${id}`;
    console.log(`Deleting article ${id} at ${url}...`);

    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        console.log(`✅ Article ${id} deleted successfully.`);
    } else {
        console.error(`❌ Failed to delete article ${id}. Status: ${response.status}`);
        const text = await response.text();
        console.error('Response:', text);
    }
}

async function run() {
    const targets = [93, 111, 129, 140];
    for (const id of targets) {
        await deleteArticle(id);
    }
    console.log('Cleanup finished.');
}

run();
