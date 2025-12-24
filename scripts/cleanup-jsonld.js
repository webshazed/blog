/**
 * Cleanup Corrupted JSON-LD Schemas Script
 * 
 * Removes <a> tags that were accidentally inserted inside JSON-LD schema
 * by the internal linking script, restoring valid JSON for SEO.
 * 
 * Usage:
 *   node scripts/cleanup-jsonld.js          # Dry run (preview only)
 *   node scripts/cleanup-jsonld.js --apply  # Apply fixes
 *   node scripts/cleanup-jsonld.js --apply --token=YOUR_TOKEN  # With custom token
 */

require('dotenv').config();

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

// Support --token=xxx argument to override env token
const tokenArg = process.argv.find(arg => arg.startsWith('--token='));
const STRAPI_API_TOKEN = tokenArg
    ? tokenArg.split('=')[1]
    : process.env.STRAPI_API_TOKEN;

const DRY_RUN = !process.argv.includes('--apply');

// ============================================
// API HELPERS
// ============================================

async function fetchAPI(endpoint, options = {}) {
    const url = `${STRAPI_URL}/api${endpoint}`;
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
            };
        }));

        if (response.data.length < pageSize) break;
        page++;
    }

    console.log(`   Found ${articles.length} published articles\n`);
    return articles;
}

async function updateArticleContent(id, documentId, newContent) {
    if (DRY_RUN) {
        console.log(`   [DRY RUN] Would update article ID ${id}`);
        return true;
    }

    try {
        const identifier = documentId || id;
        await fetchAPI(`/articles/${identifier}`, {
            method: 'PUT',
            body: JSON.stringify({
                data: { content: newContent }
            }),
        });
        console.log(`   ✅ Fixed article ID ${id}`);
        return true;
    } catch (error) {
        console.log(`   ⚠️ Failed to update article ID ${id}: ${error.message}`);
        return false;
    }
}

// ============================================
// CLEANUP LOGIC
// ============================================

function cleanupJsonLD(content) {
    if (!content) return { content, fixed: false };

    let updatedContent = content;
    let fixed = false;

    // Find all script tags with JSON-LD
    const scriptRegex = /(<script\s+type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/gi;

    updatedContent = content.replace(scriptRegex, (match, openTag, jsonContent, closeTag) => {
        // Check if JSON is corrupted with <a> tags
        if (jsonContent.includes('<a ') || jsonContent.includes('</a>')) {
            // Remove <a> tags but keep link text
            const cleanedJson = jsonContent.replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1');

            // Verify the cleaned JSON is valid
            try {
                JSON.parse(cleanedJson.trim());
                fixed = true;
                console.log(`      🔧 Removed internal links from JSON-LD schema`);
                return openTag + cleanedJson + closeTag;
            } catch (e) {
                console.log(`      ⚠️ Could not fully repair JSON-LD (may need manual repair)`);
                return match; // Return original if we can't fix it
            }
        }
        return match;
    });

    return { content: updatedContent, fixed };
}

// ============================================
// MAIN PROCESS
// ============================================

async function main() {
    console.log('\n🛠️  JSON-LD Schema Cleanup Script');
    console.log('================================\n');

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

        console.log('🔄 Scanning articles for corrupted JSON-LD...\n');

        let articlesFixed = 0;
        let articlesScanned = 0;

        for (const article of articles) {
            articlesScanned++;

            // Check if article has JSON-LD with links inside
            if (!article.content?.includes('application/ld+json')) {
                continue;
            }

            const { content: cleanedContent, fixed } = cleanupJsonLD(article.content);

            if (fixed) {
                console.log(`📝 ${article.title}`);
                articlesFixed++;

                await updateArticleContent(article.id, article.documentId, cleanedContent);

                // Delay between updates
                if (!DRY_RUN) {
                    await new Promise(r => setTimeout(r, 500));
                }
            }
        }

        // Summary
        console.log('\n================================');
        console.log('📊 Summary');
        console.log('================================');
        console.log(`   Articles scanned: ${articlesScanned}`);
        console.log(`   Articles fixed: ${articlesFixed}`);

        if (articlesFixed === 0) {
            console.log('\n✅ No corrupted JSON-LD schemas found!');
        } else if (DRY_RUN) {
            console.log('\n💡 Run with --apply flag to save these fixes.');
        } else {
            console.log('\n✅ All corrupted schemas fixed!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
