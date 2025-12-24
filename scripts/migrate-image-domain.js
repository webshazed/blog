/**
 * Migrate Image URLs Script
 * 
 * Replaces old image domain URLs with the new images.kitchenalgo.com domain.
 * 
 * Patterns replaced:
 *   - https://kitchenalgo.com/... → https://images.kitchenalgo.com/...
 *   - https://www.kitchenalgo.com/... → https://images.kitchenalgo.com/...
 *   - https://pub-16a6dcf973b04106af01c2136d91f92e.r2.dev/... → https://images.kitchenalgo.com/...
 * 
 * Usage:
 *   node scripts/migrate-image-domain.js          # Dry run
 *   node scripts/migrate-image-domain.js --apply  # Apply changes
 */

require('dotenv').config({ path: '.env.local' });

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

// Support --token=xxx argument
const tokenArg = process.argv.find(arg => arg.startsWith('--token='));
const STRAPI_API_TOKEN = tokenArg
    ? tokenArg.split('=')[1]
    : process.env.STRAPI_API_TOKEN;

const DRY_RUN = !process.argv.includes('--apply');

// New image domain
const NEW_DOMAIN = 'https://images.kitchenalgo.com';

// Old domains to replace (order matters - more specific first)
const OLD_DOMAINS = [
    'https://pub-16a6dcf973b04106af01c2136d91f92e.r2.dev',
    'https://www.kitchenalgo.com',
    'https://kitchenalgo.com',
];

// ============================================
// API HELPERS
// ============================================

async function fetchAPI(endpoint, options = {}) {
    const baseUrl = STRAPI_URL.replace(/\/$/, ''); // Remove trailing slash
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
    console.log('📚 Fetching all published articles...');
    const articles = [];
    let page = 1;
    const pageSize = 100;

    while (true) {
        const response = await fetchAPI(
            `/articles?populate=*&filters[publishedAt][$notNull]=true&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
        );

        if (!response.data || response.data.length === 0) break;

        articles.push(...response.data.map(article => {
            const data = article.attributes || article;
            return {
                id: article.id,
                documentId: article.documentId || data.documentId || article.id,
                title: data.title,
                slug: data.slug,
                content: data.content || '',
                image: data.image || '',
            };
        }));

        if (response.data.length < pageSize) break;
        page++;
    }

    console.log(`   Found ${articles.length} published articles\n`);
    return articles;
}

async function updateArticle(id, documentId, updates) {
    if (DRY_RUN) {
        console.log(`   [DRY RUN] Would update article ID ${id}`);
        return true;
    }

    try {
        const identifier = documentId || id;
        await fetchAPI(`/articles/${identifier}`, {
            method: 'PUT',
            body: JSON.stringify({ data: updates }),
        });
        console.log(`   ✅ Updated article ID ${id}`);
        return true;
    } catch (error) {
        console.log(`   ⚠️ Failed to update article ID ${id}: ${error.message}`);
        return false;
    }
}

// ============================================
// URL REPLACEMENT
// ============================================

function replaceImageUrls(text) {
    if (!text) return { text, count: 0 };

    let result = text;
    let count = 0;

    for (const oldDomain of OLD_DOMAINS) {
        // Count occurrences
        const regex = new RegExp(oldDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/([^"\\s<>]+\\.(?:webp|jpg|jpeg|png|gif))', 'gi');
        const matches = result.match(regex) || [];
        count += matches.length;

        // Replace
        result = result.replace(regex, `${NEW_DOMAIN}/$1`);
    }

    return { text: result, count };
}

// ============================================
// MAIN PROCESS
// ============================================

async function main() {
    console.log('\n🖼️  Image Domain Migration Script');
    console.log('==================================\n');
    console.log(`New domain: ${NEW_DOMAIN}\n`);

    if (DRY_RUN) {
        console.log('⚠️  DRY RUN MODE - No changes will be saved');
        console.log('   Run with --apply flag to save changes\n');
    } else {
        console.log('🚨 APPLY MODE - Changes will be saved to Strapi!\n');
    }

    try {
        const articles = await getAllArticles();

        if (articles.length === 0) {
            console.log('No articles found. Exiting.');
            return;
        }

        console.log('🔄 Scanning articles for old image URLs...\n');

        let articlesModified = 0;
        let totalUrlsReplaced = 0;

        for (const article of articles) {
            const updates = {};
            let articleUrlCount = 0;

            // Check content field
            if (article.content) {
                const { text: newContent, count: contentCount } = replaceImageUrls(article.content);
                if (contentCount > 0) {
                    updates.content = newContent;
                    articleUrlCount += contentCount;
                }
            }

            // Check image field (featured image URL)
            if (article.image && typeof article.image === 'string') {
                const { text: newImage, count: imageCount } = replaceImageUrls(article.image);
                if (imageCount > 0) {
                    updates.image = newImage;
                    articleUrlCount += imageCount;
                }
            }

            if (articleUrlCount > 0) {
                console.log(`📝 ${article.title}`);
                console.log(`      ${articleUrlCount} image URL(s) found`);

                await updateArticle(article.id, article.documentId, updates);

                articlesModified++;
                totalUrlsReplaced += articleUrlCount;

                // Delay between updates
                if (!DRY_RUN) {
                    await new Promise(r => setTimeout(r, 300));
                }
            }
        }

        // Summary
        console.log('\n==================================');
        console.log('📊 Summary');
        console.log('==================================');
        console.log(`   Articles scanned: ${articles.length}`);
        console.log(`   Articles modified: ${articlesModified}`);
        console.log(`   Total URLs replaced: ${totalUrlsReplaced}`);

        if (DRY_RUN) {
            console.log('\n💡 Run with --apply flag to save these changes.');
        } else {
            console.log('\n✅ All image URLs migrated!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
