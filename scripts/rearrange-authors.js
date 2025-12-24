const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

// Strategy Mapping: Category Name -> Author Name (Partial matches allowed)
const STRATEGY = {
    'Beverages': 'Oliver-Brewwell',
    'Appliance Recipes': 'Kevin-HomeChef',
    'Kitchen Tips': 'Daniel-Cooksmith',
    'Baking': 'Liam-Dougherty', // "Baking & Sweets" in CSV, checking "Baking" match
    'Sweets': 'Liam-Dougherty',
    'Budget': 'Sarah-Pennywise', // "Budget Friendly"
    'Healthy': 'Ava-Kitchenfield', // "Healthy Living"
    'Pet': 'Milo-PetBowl', // "Pet Corner"
    'Pantry': 'Nora-Cultiva', // "Pantry & DIY"
    'DIY': 'Nora-Cultiva',
    'Main Courses': 'Marcus-Flamewood',
    'World Flavors': 'Alex-Flavorcraft',
    'Breakfast': 'Ella-Morningtable', // "Breakfast & Brunch"
    'Brunch': 'Ella-Morningtable'
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
        // Handle 404s gracefully
        if (response.status === 404) return { data: [] };
        const err = await response.json().catch(() => ({}));
        throw new Error(`Strapi Error ${response.status}: ${JSON.stringify(err)}`);
    }
    return response.json();
}

async function run() {
    const mode = process.argv[2] || 'dry-run'; // default to dry-run
    console.log(`--- Rearranging Authors Strategy (${mode.toUpperCase()}) ---`);

    // 1. Get Categories
    console.log('Fetching Categories...');
    const catRes = await fetchAPI('/categories?pagination[pageSize]=100');
    const categories = catRes.data;
    const catMap = {}; // ID -> Name
    categories.forEach(c => catMap[c.id] = c.attributes?.name || c.name);

    // 2. Get Authors
    console.log('Fetching Authors...');
    const authRes = await fetchAPI('/authors?pagination[pageSize]=100');
    const authors = authRes.data;
    const authorNameMap = {}; // Name -> ID
    authors.forEach(a => {
        const name = a.attributes?.name || a.name;
        authorNameMap[name] = a.id;
        // Also map hyphenated versions if not already
        // But CSV has specific names, we must match them against Strapi names
    });

    console.log('\n--- Detected Mappings ---');

    const catToAuthorId = {}; // Category ID -> Target Author ID

    for (const cat of categories) {
        const catName = cat.attributes?.name || cat.name;
        let targetAuthorName = null;

        // Find match in STRATEGY
        for (const [key, auth] of Object.entries(STRATEGY)) {
            if (catName.toLowerCase().includes(key.toLowerCase())) {
                targetAuthorName = auth;
                break;
            }
        }

        if (targetAuthorName) {
            // Find Author ID
            // We need to match targetAuthorName (e.g. "Oliver-Brewwell") to Strapi Author Name
            // Step 56 showed Strapi names like "Oliver-Brewwell" (ID 25) AND "Oliver Brewwell" (ID 7)
            // We'll prefer exact match, then loose match
            let authorId = authorNameMap[targetAuthorName];

            if (!authorId) {
                // Try fuzzy match
                const looseName = targetAuthorName.replace(/-/g, ' ');
                authorId = authorNameMap[looseName]; // Try "Oliver Brewwell"

                if (!authorId) {
                    // Reverse direction?
                    const key = Object.keys(authorNameMap).find(n => n.includes(targetAuthorName) || targetAuthorName.includes(n));
                    if (key) authorId = authorNameMap[key];
                }
            }

            if (authorId) {
                catToAuthorId[cat.id] = authorId;
                console.log(`Category "${catName}" -> Author "${targetAuthorName}" (ID: ${authorId})`);
            } else {
                console.warn(`⚠️  Category "${catName}" matches strategy "${targetAuthorName}" but Author not found in Strapi.`);
            }
        }
    }

    if (Object.keys(catToAuthorId).length === 0) {
        console.error("No strategies could be mapped. Exiting.");
        return;
    }

    // 3. Update Articles
    console.log('\nFetching Articles (all pages)...');
    let articles = []; // Use 'articles' variable name to minimize changes below
    let page = 1;
    let pageCount = 1;

    do {
        // Updated URL to include pagination
        const artRes = await fetchAPI(`/articles?status=draft&populate=category&populate=author&pagination[pageSize]=100&pagination[page]=${page}`);
        const data = artRes.data;
        const meta = artRes.meta;

        if (data && data.length > 0) {
            articles = articles.concat(data);
        }

        pageCount = meta?.pagination?.pageCount || 1;
        process.stdout.write(`\rFetched page ${page} of ${pageCount} (${articles.length} articles total)`);
        page++;
    } while (page <= pageCount);

    console.log(`\nProcessing ${articles.length} articles...`);

    let updateCount = 0;

    for (const article of articles) {
        const artId = article.id;
        const artDocId = article.documentId;
        const title = article.attributes?.title || article.title;

        // Get current Category
        const catData = article.attributes?.category?.data || article.category;
        const currentCatId = catData?.id;

        // Get current Author
        const authData = article.attributes?.author?.data || article.author;
        const currentAuthId = authData?.id;

        if (!currentCatId) continue;

        const targetAuthId = catToAuthorId[currentCatId];

        if (targetAuthId && targetAuthId !== currentAuthId) {
            const targetAuthName = authors.find(a => a.id === targetAuthId)?.name || authors.find(a => a.id === targetAuthId)?.attributes?.name;

            console.log(`[${mode}] Article "${title}" (Cat: ${currentCatId}) needs update.`);
            console.log(`    Current Author: ${currentAuthId} -> New Author: ${targetAuthId} (${targetAuthName})`);

            if (mode === 'execute') {
                try {
                    const updateEndpoint = artDocId ? `/articles/${artDocId}` : `/articles/${artId}`;
                    await fetchAPI(updateEndpoint, {
                        method: 'PUT',
                        body: JSON.stringify({
                            data: { author: targetAuthId }
                        })
                    });
                    console.log('    ✅ Updated.');
                    updateCount++;
                } catch (e) {
                    console.error(`    ❌ Failed: ${e.message}`);
                }
            }
        }
    }

    if (mode === 'execute') {
        console.log(`\nRearrangement Complete. Updated ${updateCount} articles.`);
    } else {
        console.log(`\nDry run complete. Use 'node scripts/rearrange-authors.js execute' to apply.`);
    }
}

run();
