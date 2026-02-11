const fs = require('fs');
const path = require('path');

// Configuration
const ARTICLES_PATH = path.join(__dirname, '../data/json/articles.json');
const CATEGORIES_PATH = path.join(__dirname, '../data/json/categories.json');
const HTML_DIR = path.join(__dirname, '../KitchenAlgo Articles HTML');
const NEW_TRACKING_ID = 'kitchenalgo07-20';
const OLD_TRACKING_ID = 'kitchenalgo-20';
const TARGET_CATEGORY_NAME = 'Reviews';
const TARGET_CATEGORY_SLUG = 'reviews';

// Helper: Generate Slug from Filename
function generateSlug(filename) {
    return filename
        .replace(/\.html$/i, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Helper: Parse HTML
function parseHtml(content) {
    // Extract Title
    const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract Body
    const bodyMatch = content.match(/<body>([\s\S]*?)<\/body>/i);
    let bodyContent = bodyMatch ? bodyMatch[1].trim() : '';

    // Remove first H1 to avoid duplication with blog title
    bodyContent = bodyContent.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '');

    // Extract First Image
    const imgMatch = bodyContent.match(/<img[^>]+src="([^">]+)"/i);
    const image = imgMatch ? imgMatch[1] : null;

    return { title, bodyContent, image };
}

// Main Function
function main() {
    console.log('🚀 Starting Affiliate Article Publishing Process...');

    // 1. Load Data
    if (!fs.existsSync(ARTICLES_PATH)) {
        console.error('❌ Articles JSON not found!');
        process.exit(1);
    }
    const articles = JSON.parse(fs.readFileSync(ARTICLES_PATH, 'utf8'));
    const categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf8'));

    // 2. Ensure Category Exists
    let category = categories.find(c => c.slug === TARGET_CATEGORY_SLUG);
    if (!category) {
        const maxId = Math.max(...categories.map(c => c.id), 0);
        category = {
            id: maxId + 1,
            name: TARGET_CATEGORY_NAME,
            slug: TARGET_CATEGORY_SLUG,
            description: 'Product reviews and buying guides.',
            image: null,
            articleCount: 0
        };
        categories.push(category);
        console.log(`✅ Created new category: ${TARGET_CATEGORY_NAME}`);
    } else {
        console.log(`ℹ️ Category '${TARGET_CATEGORY_NAME}' already exists.`);
    }

    // 3. Process HTML Files
    if (!fs.existsSync(HTML_DIR)) {
        console.error('❌ HTML Directory not found!');
        process.exit(1);
    }

    const files = fs.readdirSync(HTML_DIR).filter(f => f.endsWith('.html'));
    console.log(`Found ${files.length} HTML files to process.`);

    let addedCount = 0;
    let maxArticleId = Math.max(...articles.map(a => a.id), 0);
    const existingSlugs = new Set(articles.map(a => a.slug));

    files.forEach(file => {
        const filePath = path.join(HTML_DIR, file);
        let rawContent = fs.readFileSync(filePath, 'utf8');

        // Replace Affiliate Tag
        if (rawContent.includes(OLD_TRACKING_ID)) {
            // Global replace
            rawContent = rawContent.split(OLD_TRACKING_ID).join(NEW_TRACKING_ID);
        }

        // Parse HTML
        const { title, bodyContent, image } = parseHtml(rawContent);
        const slug = generateSlug(file);

        if (existingSlugs.has(slug)) {
            console.log(`⚠️ Skipping duplicate slug: ${slug}`);
            return;
        }

        // Create Article Object
        maxArticleId++;
        const newArticle = {
            id: maxArticleId,
            title: title || file.replace('.html', ''),
            slug: slug,
            content: bodyContent,
            excerpt: `Read our detailed review of the ${title}. We test and analyze the best products to help you decide.`, // Generic excerpt
            image: image || null,
            image_alt: title,
            image_title: title,
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            views: 0,
            published: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            adCodeTop: null,
            adCodeMiddle: null,
            adCodeBottom: null,
            enableAds: true,
            author: 'Kitchen Algo Team',
            authorSlug: 'kitchen-algo-team',
            authorBio: 'Expert review team at Kitchen Algo.',
            authorAvatar: null,
            category: TARGET_CATEGORY_NAME,
            categorySlug: TARGET_CATEGORY_SLUG
        };

        articles.unshift(newArticle); // Add to beginning
        existingSlugs.add(slug);
        addedCount++;
        category.articleCount++; // Increment category count
    });

    // 4. Save Data
    fs.writeFileSync(ARTICLES_PATH, JSON.stringify(articles, null, 2));
    fs.writeFileSync(CATEGORIES_PATH, JSON.stringify(categories, null, 2));

    console.log(`\n🎉 Success! Added ${addedCount} new articles.`);
    console.log(`📁 Updated ${ARTICLES_PATH}`);
    console.log(`📁 Updated ${CATEGORIES_PATH}`);
}

main();
