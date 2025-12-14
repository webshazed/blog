import { getAllArticles, getAllCategories, getAllAuthors } from '@/lib/strapi';

const BASE_URL = process.env.SITE_URL || 'https://blog1-roan.vercel.app';

export default async function sitemap() {
    // Fetch all data from Strapi
    const [articles, categories, authors] = await Promise.all([
        getAllArticles().catch(() => []),
        getAllCategories().catch(() => []),
        getAllAuthors().catch(() => []),
    ]);

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
