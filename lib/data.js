/**
 * Data Layer - Fully Static (Local JSON)
 * Disconnected from Strapi CMS
 */

import articles from '../data/json/articles.json';
import authors from '../data/json/authors.json';
import categories from '../data/json/categories.json';
import adSettings from '../data/json/ad-settings.json';
import siteSettings from '../data/json/site-settings.json';

// ============================================
// ARTICLE/POST FUNCTIONS
// ============================================

/**
 * Get all published posts (backwards compatible)
 */
export const getAllPosts = async (page = 1, pageSize = 10) => {
    const start = (page - 1) * pageSize;
    return articles.slice(start, start + pageSize);
};

/**
 * Get all posts with pagination info
 */
export const getPostsWithPagination = async (page = 1, pageSize = 10) => {
    const start = (page - 1) * pageSize;
    const paginatedArticles = articles.slice(start, start + pageSize);

    return {
        articles: paginatedArticles,
        pagination: {
            page,
            pageSize,
            total: articles.length,
            pageCount: Math.ceil(articles.length / pageSize)
        }
    };
};

/**
 * Get a single post by slug
 */
export const getPostBySlug = async (slug) => {
    return articles.find(a => a.slug === slug) || null;
};

/**
 * Get posts by author slug
 */
export const getPostsByAuthor = async (authorSlug, page = 1, pageSize = 10) => {
    const authorArticles = articles.filter(a => a.authorSlug === authorSlug);
    const start = (page - 1) * pageSize;
    const paginatedArticles = authorArticles.slice(start, start + pageSize);

    return {
        articles: paginatedArticles,
        pagination: {
            page,
            pageSize,
            total: authorArticles.length,
            pageCount: Math.ceil(authorArticles.length / pageSize)
        }
    };
};

/**
 * Get posts by category slug
 */
export const getPostsByCategory = async (categorySlug, page = 1, pageSize = 10) => {
    const categoryArticles = articles.filter(a => a.categorySlug === categorySlug);
    const start = (page - 1) * pageSize;
    const paginatedArticles = categoryArticles.slice(start, start + pageSize);

    return {
        articles: paginatedArticles,
        pagination: {
            page,
            pageSize,
            total: categoryArticles.length,
            pageCount: Math.ceil(categoryArticles.length / pageSize)
        }
    };
};

/**
 * Search posts
 */
export const searchPosts = async (query, page = 1, pageSize = 10) => {
    if (!query) return { articles: [], pagination: { page, pageSize, total: 0, pageCount: 0 } };

    const searchTerms = query.toLowerCase().split(' ');
    const results = articles.filter(article => {
        const text = `${article.title} ${article.content} ${article.excerpt}`.toLowerCase();
        return searchTerms.every(term => text.includes(term));
    });

    const start = (page - 1) * pageSize;
    return {
        articles: results.slice(start, start + pageSize),
        pagination: {
            page,
            pageSize,
            total: results.length,
            pageCount: Math.ceil(results.length / pageSize)
        }
    };
};

/**
 * Get featured/popular posts
 */
export const getFeaturedPosts = async (limit = 5) => {
    // Return posts sorted by views (exported from Strapi)
    return [...articles]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, limit);
};

/**
 * Save a new post (Disabled in static mode)
 */
export const savePost = async (newPost) => {
    console.warn("savePost is disabled in static mode.");
    return null;
};

// ============================================
// AUTHOR FUNCTIONS
// ============================================

export const getAuthors = async () => {
    return authors;
};

export const getAuthor = async (slug) => {
    return authors.find(a => a.slug === slug) || null;
};

// ============================================
// CATEGORY FUNCTIONS
// ============================================

export const getCategories = async () => {
    return categories;
};

export const getCategory = async (slug) => {
    return categories.find(c => c.slug === slug) || null;
};

/**
 * View increment (Disabled in static mode)
 */
export const incrementViews = async (slug) => {
    // No-op in static mode
    return;
};

/**
 * Get ABSOLUTELY all posts (recursive) for static build
 */
export const getAllPostsRecursive = async () => {
    return articles;
};

// Site and Ad Settings
export const getAdSettings = async () => adSettings;
export const getSiteSettings = async () => siteSettings;

export default {
    getAllPosts,
    getPostsWithPagination,
    getPostBySlug,
    getPostsByAuthor,
    getPostsByCategory,
    searchPosts,
    getFeaturedPosts,
    savePost,
    getAuthors,
    getAuthor,
    getCategories,
    getCategory,
    incrementViews,
    getAllPostsRecursive,
    getAdSettings,
    getSiteSettings,
};
