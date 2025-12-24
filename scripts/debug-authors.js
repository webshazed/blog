const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

async function fetchAPI(endpoint) {
    const response = await fetch(`${STRAPI_URL}/api${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        },
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
}

async function debugAuthors() {
    console.log('--- Debugging Authors ---');
    try {
        // Fetch exactly as the app does: /authors?populate=*
        // Note: Strapi v5 might need explicit status params for relations
        const res = await fetchAPI('/authors?populate=*');
        const authors = res.data;

        console.log(`Found ${authors.length} authors.`);

        authors.forEach(a => {
            const data = a.attributes || a;
            const articles = data.articles?.data || data.articles || [];
            console.log(`[ID: ${a.id}] ${data.name} - Articles: ${articles.length}`);
        });

        console.log('\n--- Checking with explicit draft population ---');
        // Try with status=draft in the populate if possible, or just standard draft query
        // Strapi v4/v5 usually requires &publicationState=preview to see draft relations in standard find
        const resPreview = await fetchAPI('/authors?populate[articles][count]=true&publicationState=preview');
        // Note: we can't deep filter relations easily in one go, but let's see if publicationState helps

        // Actually, let's try to count articles per author using the Article endpoint to be sure
        console.log('\n--- Actual Article Counts (via Articles API) ---');
        for (const author of authors) {
            const countRes = await fetchAPI(`/articles?filters[author][id][$eq]=${author.id}&status=draft&pagination[pageSize]=1`);
            console.log(`[ID: ${author.id}] ${author.attributes?.name || author.name} - Real Count: ${countRes.meta?.pagination?.total}`);
        }

    } catch (e) {
        console.error(e);
    }
}

debugAuthors();
