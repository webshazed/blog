const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

// --- CONFIGURATION ---
// Edit these values or pass as command line args
const CONFIG = {
    // Mode: 'list', 'dry-run', or 'execute'
    mode: process.argv[2] || 'list',

    // Target Field to Update: 'author' or 'category'
    targetField: process.argv[3] || 'author', // or 'category'

    // The ID you want to set the field TO
    newValueId: process.argv[4] ? parseInt(process.argv[4]) : null,

    // Optional: Only update articles that currently have this OLD ID for the target field
    // Set to null to update ALL articles regardless of current value
    oldValueId: process.argv[5] ? parseInt(process.argv[5]) : null,
};

async function fetchAPI(endpoint, options = {}) {
    const baseUrl = STRAPI_URL.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}/api${cleanEndpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...(STRAPI_API_TOKEN && { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` }),
    };

    const response = await fetch(url, { headers, ...options });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Strapi Error ${response.status}: ${JSON.stringify(err)}`);
    }
    return response.json();
}

async function listResources() {
    console.log('\n--- Available Authors ---');
    try {
        const authors = await fetchAPI('/authors?pagination[pageSize]=100');
        authors.data.forEach(a => console.log(`[ID: ${a.id}] ${a.attributes?.name || a.name || 'Unknown'}`));
    } catch (e) { console.error("Failed to list authors:", e.message); }

    console.log('\n--- Available Categories ---');
    try {
        const categories = await fetchAPI('/categories?pagination[pageSize]=100');
        categories.data.forEach(c => console.log(`[ID: ${c.id}] ${c.attributes?.name || c.name || 'Unknown'}`));
    } catch (e) { console.error("Failed to list categories:", e.message); }

    console.log('\n--------------------------------');
    console.log('Usage: node scripts/bulk-update-articles.js <mode> <targetField> <newValueId> [oldValueId]');
    console.log('Modes: list, dry-run, execute');
    console.log('Example: node scripts/bulk-update-articles.js dry-run author 2 5');
    console.log('         (Changes Author to ID 2 for all articles that currently have Author ID 5)');
}

async function bulkUpdate() {
    if (!CONFIG.newValueId) {
        console.error('Error: You must specify a newValueId.');
        console.log('Usage: node scripts/bulk-update-articles.js <mode> <field> <newId> [oldId]');
        return;
    }

    console.log(`\n--- Starting Bulk Update (${CONFIG.mode.toUpperCase()}) ---`);
    console.log(`Target Field: ${CONFIG.targetField}`);
    console.log(`Setting to ID: ${CONFIG.newValueId}`);
    if (CONFIG.oldValueId) console.log(`Only for articles with ID: ${CONFIG.oldValueId}`);
    else console.log(`Updating ALL articles (dangerous!)`);

    // Fetch all articles
    // Strapi v5: populate is needed to see current relations
    const populate = CONFIG.targetField === 'author' ? 'author' : 'category';
    const endpoint = `/articles?status=draft&populate=${populate}&pagination[pageSize]=100`;

    console.log(`Fetching articles...`);
    const response = await fetchAPI(endpoint);
    const articles = response.data;

    console.log(`Found ${articles.length} total articles.`);

    let toUpdate = [];

    for (const article of articles) {
        const currentRel = article.attributes?.[CONFIG.targetField] || article[CONFIG.targetField]?.data || article[CONFIG.targetField];
        const currentId = currentRel?.id;

        // Filter logic
        let shouldUpdate = false;

        if (CONFIG.oldValueId) {
            // Update only if matches old ID
            if (currentId === CONFIG.oldValueId) shouldUpdate = true;
        } else {
            // Update ALL (unless already has the new ID)
            if (currentId !== CONFIG.newValueId) shouldUpdate = true;
        }

        if (shouldUpdate) {
            toUpdate.push({
                id: article.id,
                documentId: article.documentId,
                title: article.attributes?.title || article.title,
                currentId
            });
        }
    }

    console.log(`\nFound ${toUpdate.length} articles to update.`);

    if (CONFIG.mode === 'dry-run') {
        toUpdate.forEach(item => {
            console.log(`[Dry Run] Would update: "${item.title}" (ID: ${item.id}) - Current ${CONFIG.targetField} ID: ${item.currentId} -> New: ${CONFIG.newValueId}`);
        });
        return;
    }

    if (CONFIG.mode === 'execute') {
        let successCount = 0;
        for (const item of toUpdate) {
            try {
                process.stdout.write(`Updating "${item.title}"... `);

                const updateEndpoint = item.documentId ? `/articles/${item.documentId}` : `/articles/${item.id}`;
                const payload = {
                    data: {
                        [CONFIG.targetField]: CONFIG.newValueId
                    }
                };

                await fetchAPI(updateEndpoint, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });

                console.log('DONE');
                successCount++;
            } catch (err) {
                console.log('FAILED');
                console.error(`  Error: ${err.message}`);
            }
        }
        console.log(`\nSuccessfully updated ${successCount} articles.`);
    }
}

if (!STRAPI_API_TOKEN) {
    console.error('Error: STRAPI_API_TOKEN is missing in .env.local');
    process.exit(1);
}

if (CONFIG.mode === 'list') {
    listResources();
} else {
    bulkUpdate();
}
