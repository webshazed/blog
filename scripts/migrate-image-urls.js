const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

const OLD_DOMAIN = 'pub-16a6dcf973b04106af01c2136d91f92e.r2.dev';
const NEW_DOMAIN = 'kitchenalgo.com';

async function fetchAPI(endpoint, options = {}) {
    const baseUrl = STRAPI_URL.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}/api${cleanEndpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(STRAPI_API_TOKEN && { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` }),
        },
    };

    console.log(`[Fetch Debug] Fetching ${url}`);
    if (typeof fetch !== 'function') {
        console.error('[Fetch Debug] fetch is NOT a function. Type:', typeof fetch);
        // Fallback for some Node versions if global.fetch is weird
        if (typeof global.fetch === 'function') {
            console.log('[Fetch Debug] Using global.fetch instead');
            return fetchAPI_with(global.fetch, url, defaultOptions, options);
        }
        throw new Error('fetch is not available');
    }

    const response = await fetch(url, { ...defaultOptions, ...options });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Strapi Error ${response.status}: ${JSON.stringify(err)}`);
    }
    return response.json();
}

async function fetchAPI_with(fn, url, defaultOptions, options) {
    const response = await fn(url, { ...defaultOptions, ...options });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Strapi Error ${response.status}: ${JSON.stringify(err)}`);
    }
    return response.json();
}

async function runMigration() {
    console.log('--- Starting Image URL Migration ---');
    console.log(`Replacing "${OLD_DOMAIN}" with "${NEW_DOMAIN}"`);

    try {
        // 1. Fetch all articles (including drafts)
        // In Strapi v5, use ?status=draft to include drafts
        const response = await fetchAPI('/articles?status=draft&pagination[pageSize]=100');
        const articles = response.data;

        console.log(`Found ${articles.length} articles to check.`);

        let updateCount = 0;

        for (const article of articles) {
            const { id, documentId } = article;
            const data = article.attributes || article;
            let { content, image, title } = data;

            let needsUpdate = false;

            // Check content
            if (content && content.includes(OLD_DOMAIN)) {
                console.log(`[Article ${id}] Found old domain in content: "${title}"`);
                content = content.split(OLD_DOMAIN).join(NEW_DOMAIN);
                needsUpdate = true;
            }

            // Check featured image
            if (image && image.includes(OLD_DOMAIN)) {
                console.log(`[Article ${id}] Found old domain in featured image: "${title}"`);
                image = image.split(OLD_DOMAIN).join(NEW_DOMAIN);
                needsUpdate = true;
            }

            if (needsUpdate) {
                try {
                    console.log(`Updating article ${id}...`);
                    const updateEndpoint = documentId ? `/articles/${documentId}` : `/articles/${id}`;

                    await fetchAPI(updateEndpoint, {
                        method: 'PUT',
                        body: JSON.stringify({
                            data: { content, image }
                        })
                    });

                    console.log(`✅ Article ${id} updated.`);
                    updateCount++;
                } catch (articleError) {
                    console.error(`❌ Failed to update article ${id} (${title}):`, articleError.message);
                    // Continue to next article
                }
            }
        }

        console.log(`\nMigration finished. Updated ${updateCount} articles.`);

    } catch (error) {
        console.error('Migration failed during fetch or initialization:', error);
    }
}

if (!STRAPI_API_TOKEN) {
    console.error('Error: STRAPI_API_TOKEN environment variable is missing.');
    process.exit(1);
}

runMigration();
