/**
 * Bulk Disable Ads Script
 * Sets enableAds to false for all articles
 * 
 * Usage:
 *   node scripts/bulk-disable-ads.js          # Dry run
 *   node scripts/bulk-disable-ads.js --apply  # Apply changes
 */

require('dotenv').config({ path: '.env.local' });

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

const tokenArg = process.argv.find(arg => arg.startsWith('--token='));
const STRAPI_API_TOKEN = tokenArg
    ? tokenArg.split('=')[1]
    : process.env.STRAPI_API_TOKEN;

const DRY_RUN = !process.argv.includes('--apply');

async function fetchAPI(endpoint, options = {}) {
    const baseUrl = STRAPI_URL.replace(/\/$/, '');
    const url = `${baseUrl}/api${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(STRAPI_API_TOKEN && { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` }),
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`API Error ${response.status}: ${JSON.stringify(error)}`);
    }

    return response.json();
}

async function getAllArticles() {
    console.log('📚 Fetching all articles...');
    const articles = [];
    let page = 1;
    const pageSize = 100;

    while (true) {
        const response = await fetchAPI(
            `/articles?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
        );

        if (!response.data || response.data.length === 0) break;

        articles.push(...response.data.map(article => {
            const data = article.attributes || article;
            return {
                id: article.id,
                documentId: article.documentId || data.documentId || article.id,
                title: data.title,
                enableAds: data.enableAds,
            };
        }));

        if (response.data.length < pageSize) break;
        page++;
    }

    console.log(`   Found ${articles.length} articles\n`);
    return articles;
}

async function updateArticle(id, documentId) {
    if (DRY_RUN) {
        return true;
    }

    try {
        const identifier = documentId || id;
        await fetchAPI(`/articles/${identifier}`, {
            method: 'PUT',
            body: JSON.stringify({ data: { enableAds: false } }),
        });
        return true;
    } catch (error) {
        console.log(`   ⚠️ Failed to update article ID ${id}: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('\n🚫 Bulk Disable Ads Script');
    console.log('==========================\n');

    if (DRY_RUN) {
        console.log('⚠️  DRY RUN MODE - No changes will be saved');
        console.log('   Run with --apply flag to save changes\n');
    } else {
        console.log('🚨 APPLY MODE - Changes will be saved to Strapi!\n');
    }

    try {
        const articles = await getAllArticles();

        // Filter articles with enableAds = true
        const articlesToUpdate = articles.filter(a => a.enableAds === true);

        console.log(`📊 Articles with enableAds=true: ${articlesToUpdate.length} of ${articles.length}\n`);

        if (articlesToUpdate.length === 0) {
            console.log('✅ All articles already have ads disabled!');
            return;
        }

        let updated = 0;
        for (const article of articlesToUpdate) {
            const success = await updateArticle(article.id, article.documentId);
            if (success) updated++;

            if (!DRY_RUN) {
                await new Promise(r => setTimeout(r, 200));
            }
        }

        console.log('\n==========================');
        console.log('📊 Summary');
        console.log('==========================');
        console.log(`   Articles with ads enabled: ${articlesToUpdate.length}`);
        console.log(`   Articles updated: ${updated}`);

        if (DRY_RUN) {
            console.log('\n💡 Run with --apply flag to disable ads on all articles.');
        } else {
            console.log('\n✅ Ads disabled for all articles!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
