/**
 * Auto Internal Linking Script
 * 
 * Automatically adds internal links to all published articles
 * by matching keywords from other article titles.
 * 
 * Usage:
 *   node scripts/auto-internal-links.js          # Dry run (preview only)
 *   node scripts/auto-internal-links.js --apply  # Actually apply changes
 */

require('dotenv').config();

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

// Support --token=xxx argument to override env token
const tokenArg = process.argv.find(arg => arg.startsWith('--token='));
const STRAPI_API_TOKEN = tokenArg
    ? tokenArg.split('=')[1]
    : process.env.STRAPI_API_TOKEN;

// Configuration
const CONFIG = {
    MAX_LINKS_PER_ARTICLE: 5,      // Maximum internal links to add per article
    MIN_KEYWORD_LENGTH: 4,          // Minimum keyword length to consider
    MIN_TITLE_WORDS: 2,             // Minimum words in title to use as keyword
    DELAY_BETWEEN_UPDATES: 1000,    // Delay between API calls (ms)
    DRY_RUN: !process.argv.includes('--apply'),
};

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

        articles.push(...response.data.map(formatArticle));

        if (response.data.length < pageSize) break;
        page++;
    }

    console.log(`   Found ${articles.length} published articles\n`);
    return articles;
}

function formatArticle(article) {
    const data = article.attributes || article;
    return {
        id: article.id,
        documentId: article.documentId || data.documentId || article.id,
        title: data.title,
        slug: data.slug,
        content: data.content || '',
    };
}

async function updateArticleContent(id, documentId, newContent) {
    if (CONFIG.DRY_RUN) {
        console.log(`   [DRY RUN] Would update article ID ${id}`);
        return true;
    }

    try {
        // Try documentId first (Strapi v5), fallback to numeric ID
        const identifier = documentId || id;
        await fetchAPI(`/articles/${identifier}`, {
            method: 'PUT',
            body: JSON.stringify({
                data: { content: newContent }
            }),
        });
        console.log(`   ✅ Updated article ID ${id}`);
        return true;
    } catch (error) {
        console.log(`   ⚠️ Failed to update article ID ${id}: ${error.message}`);
        return false;
    }
}

// ============================================
// KEYWORD EXTRACTION
// ============================================

function extractKeywords(articles) {
    console.log('🔑 Building keyword index from article titles...\n');
    const keywords = [];

    for (const article of articles) {
        // Use full title as primary keyword
        keywords.push({
            keyword: article.title.toLowerCase(),
            slug: article.slug,
            title: article.title,
        });

        // Extract significant phrases (2+ words)
        const words = article.title
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length >= CONFIG.MIN_KEYWORD_LENGTH);

        // Add 2-word and 3-word phrases
        for (let i = 0; i < words.length - 1; i++) {
            const twoWord = `${words[i]} ${words[i + 1]}`.toLowerCase();
            if (twoWord.length >= 8) {
                keywords.push({
                    keyword: twoWord,
                    slug: article.slug,
                    title: article.title,
                });
            }

            if (i < words.length - 2) {
                const threeWord = `${words[i]} ${words[i + 1]} ${words[i + 2]}`.toLowerCase();
                keywords.push({
                    keyword: threeWord,
                    slug: article.slug,
                    title: article.title,
                });
            }
        }
    }

    // Sort by keyword length (longer = more specific = better match)
    keywords.sort((a, b) => b.keyword.length - a.keyword.length);

    console.log(`   Built ${keywords.length} keyword phrases\n`);
    return keywords;
}

// ============================================
// LINK INSERTION
// ============================================

function insertInternalLinks(content, keywords, currentSlug) {
    if (!content) return { content, linksAdded: 0 };

    let updatedContent = content;
    let linksAdded = 0;
    const linkedSlugs = new Set();

    // Skip if article already has many internal links
    const existingInternalLinks = (content.match(/href="\/blog\//g) || []).length;
    if (existingInternalLinks >= CONFIG.MAX_LINKS_PER_ARTICLE) {
        return { content, linksAdded: 0 };
    }

    const maxNewLinks = CONFIG.MAX_LINKS_PER_ARTICLE - existingInternalLinks;

    // Protect script tags from modifications by replacing them with placeholders
    const scriptTags = [];
    updatedContent = updatedContent.replace(/<script[\s\S]*?<\/script>/gi, (match) => {
        const placeholder = `__SCRIPT_PLACEHOLDER_${scriptTags.length}__`;
        scriptTags.push(match);
        return placeholder;
    });

    for (const { keyword, slug, title } of keywords) {
        // Don't link to self
        if (slug === currentSlug) continue;

        // Don't add duplicate links to same article
        if (linkedSlugs.has(slug)) continue;

        // Stop if we've added enough links
        if (linksAdded >= maxNewLinks) break;

        // Create regex to find keyword (case insensitive, whole words)
        // Skip if inside existing <a> tags, headings, or other protected elements
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(
            `(?<!<a[^>]*>)(?<![\\w-])(?<!href=")(?<!src=")(${escapedKeyword})(?![\\w-])(?![^<]*<\\/a>)(?![^<]*<\\/h[1-6]>)`,
            'gi'
        );

        // Check if keyword exists in content (outside of links and headings)
        const matches = updatedContent.match(regex);

        if (matches && matches.length > 0) {
            // Only replace the first occurrence
            let replaced = false;
            updatedContent = updatedContent.replace(regex, (match) => {
                if (replaced) return match;
                replaced = true;
                return `<a href="/blog/${slug}" title="${title}">${match}</a>`;
            });

            if (replaced) {
                linkedSlugs.add(slug);
                linksAdded++;
                console.log(`      + Linked: "${keyword}" → /blog/${slug}`);
            }
        }
    }

    // Restore script tags from placeholders
    scriptTags.forEach((script, index) => {
        updatedContent = updatedContent.replace(`__SCRIPT_PLACEHOLDER_${index}__`, script);
    });

    return { content: updatedContent, linksAdded };
}

// ============================================
// MAIN PROCESS
// ============================================

async function main() {
    console.log('\n🔗 Auto Internal Linking Script');
    console.log('================================\n');

    if (CONFIG.DRY_RUN) {
        console.log('⚠️  DRY RUN MODE - No changes will be saved');
        console.log('   Run with --apply flag to save changes\n');
    } else {
        console.log('🚨 APPLY MODE - Changes will be saved to Strapi!\n');
    }

    try {
        // Step 1: Fetch all articles
        const articles = await getAllArticles();

        if (articles.length === 0) {
            console.log('No articles found. Exiting.');
            return;
        }

        // Step 2: Build keyword index
        const keywords = extractKeywords(articles);

        // Step 3: Process each article
        console.log('🔄 Processing articles...\n');

        let totalLinksAdded = 0;
        let articlesModified = 0;

        for (const article of articles) {
            console.log(`📝 ${article.title}`);

            const { content: newContent, linksAdded } = insertInternalLinks(
                article.content,
                keywords,
                article.slug
            );

            if (linksAdded > 0) {
                totalLinksAdded += linksAdded;
                articlesModified++;

                // Update the article
                const success = await updateArticleContent(article.id, article.documentId, newContent);

                // Delay between updates
                if (!CONFIG.DRY_RUN) {
                    await new Promise(r => setTimeout(r, CONFIG.DELAY_BETWEEN_UPDATES));
                }
            } else {
                console.log('      (no new links needed)');
            }

            console.log('');
        }

        // Summary
        console.log('================================');
        console.log('📊 Summary');
        console.log('================================');
        console.log(`   Articles processed: ${articles.length}`);
        console.log(`   Articles modified: ${articlesModified}`);
        console.log(`   Total links added: ${totalLinksAdded}`);

        if (CONFIG.DRY_RUN) {
            console.log('\n💡 Run with --apply flag to save these changes.');
        } else {
            console.log('\n✅ All changes saved to Strapi!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
