import { getAllPostsRecursive as getAllArticles, getCategories as getAllCategories, getAuthors as getAllAuthors } from '@/lib/data';

// Remove trailing slash from URL to prevent double slashes
const BASE_URL = (process.env.SITE_URL || 'https://www.kitchenalgo.com').replace(/\/$/, '');

export const dynamic = 'force-static';

export default async function sitemap() {
    // Fetch all data from local JSON via lib/data
    let articles = [];
    let categories = [];
    let authors = [];

    try {
        articles = await getAllArticles();
        console.log(`Sitemap: Loaded ${articles.length} articles`);
    } catch (e) {
        console.error('Sitemap: Failed to load articles', e);
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
        {
            url: `${BASE_URL}/accessibility`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/advertising`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/affiliate-disclosure`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/cookies`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/dmca`,
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
