import { getAllArticles, getAllCategories, getAllAuthors } from '@/lib/strapi';

const BASE_URL = process.env.SITE_URL || 'https://blog1-roan.vercel.app';

/**
 * Fetch ALL articles with pagination
 * This ensures all articles are included in the sitemap
 */
async function fetchAllArticles() {
    const allArticles = [];
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
        try {
            const result = await getAllArticles(page, pageSize);
            const articles = result?.articles || [];

            if (articles.length > 0) {
                allArticles.push(...articles);
                // If we got less than pageSize, we've reached the end
                hasMore = articles.length === pageSize;
                page++;
            } else {
                hasMore = false;
            }
        } catch (e) {
            console.error(`Sitemap: Failed to fetch articles page ${page}`, e);
            hasMore = false;
        }
    }

    return allArticles;
}

export default async function sitemap() {
    // Fetch all data from Strapi
    let articles = [];
    let categories = [];
    let authors = [];

    try {
        articles = await fetchAllArticles();
        console.log(`Sitemap: Fetched ${articles.length} articles`);
    } catch (e) {
        console.error('Sitemap: Failed to fetch articles', e);
    }

    try {
        const categoriesResult = await getAllCategories();
        categories = Array.isArray(categoriesResult) ? categoriesResult : [];
    } catch (e) {
        console.error('Sitemap: Failed to fetch categories', e);
    }

    try {
        const authorsResult = await getAllAuthors();
        authors = Array.isArray(authorsResult) ? authorsResult : [];
    } catch (e) {
        console.error('Sitemap: Failed to fetch authors', e);
    }

    // Static pages
    const staticPages = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${BASE_URL}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/search`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/terms`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/disclaimer`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ];

    // Dynamic article pages
    const articlePages = articles.map((article) => ({
        url: `${BASE_URL}/blog/${article.slug}`,
        lastModified: article.updatedAt ? new Date(article.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
    }));

    // Category pages
    const categoryPages = categories.map((category) => ({
        url: `${BASE_URL}/category/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    // Author pages
    const authorPages = authors.map((author) => ({
        url: `${BASE_URL}/author/${author.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
    }));

    return [...staticPages, ...articlePages, ...categoryPages, ...authorPages];
}
