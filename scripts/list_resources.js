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

async function listAll() {
    try {
        const cats = await fetchAPI('/categories?pagination[pageSize]=100');
        console.log('--- Categories ---');
        cats.data.forEach(c => console.log(`"${c.attributes.name}" (ID: ${c.id})`));

        const auths = await fetchAPI('/authors?pagination[pageSize]=100');
        console.log('\n--- Authors ---');
        auths.data.forEach(a => console.log(`"${a.attributes.name}" (ID: ${a.id})`));
    } catch (e) {
        console.error(e);
    }
}

listAll();
