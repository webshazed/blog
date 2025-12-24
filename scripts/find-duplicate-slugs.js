const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

async function findArticlesWithSlug(slug) {
    const baseUrl = STRAPI_URL.replace(/\/$/, '');
    const url = `${baseUrl}/api/articles?filters[slug][$eq]=${encodeURIComponent(slug)}&status=draft&populate=*`;
    console.log(`Searching for slug "${slug}" at ${url}...`);

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
    console.log(`Found ${json.data.length} articles with slug "${slug}".`);
    for (const article of json.data) {
        console.log(`- ID: ${article.id}, DocumentID: ${article.documentId}, Title: ${article.title}, Status: ${article.publishedAt ? 'Published' : 'Draft'}`);
    }
}

async function run() {
    const slugs = [
        'brazilian-lemonade-condensed-milk',
        'leftover-rice-recipes-vegetarian',
        'high-protein-vegan-breakfast-no-soy',
        'dash-diet-dinner-recipes-low-sodium'
    ];

    for (const slug of slugs) {
        await findArticlesWithSlug(slug);
        console.log('-------------------');
    }
}

run();
