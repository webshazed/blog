const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

async function debugArticle(idOrDocId) {
    const url = `${STRAPI_URL}/api/articles/${idOrDocId}?status=draft`;
    console.log(`Checking ${url}...`);

    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(STRAPI_API_TOKEN && { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` }),
        }
    });

    if (!response.ok) {
        console.error(`Error ${response.status}:`, await response.text());
        return;
    }

    const json = await response.json();
    console.log(JSON.stringify(json, null, 2));
}

async function run() {
    // Failing articles from user terminal:
    // 94: mh1in3ksos3jrt1wyxjikz2x
    // 112: ml06cmf0uhcvw91m0xjd5un6
    // 130: e8vtcdpupqfiqa4yv0sswm5v
    // 141: xe01j75r77q9rtyjegwf7xv8

    const failingDocIds = [
        'mh1in3ksos3jrt1wyxjikz2x',
        'ml06cmf0uhcvw91m0xjd5un6',
        'e8vtcdpupqfiqa4yv0sswm5v',
        'xe01j75r77q9rtyjegwf7xv8'
    ];

    for (const docId of failingDocIds) {
        await debugArticle(docId);
        console.log('-------------------');
    }
}

run();
