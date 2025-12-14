/**
 * Data Layer - Powered by Strapi CMS
 * Maintains backwards compatibility with existing frontend
 */

import {
    getAllArticles,
    getArticleBySlug,
    saveArticle,
    incrementViews,
    getArticlesByAuthor,
    getArticlesByCategory,
    searchArticles,
    getFeaturedArticles,
    getAllAuthors,
    getAuthorBySlug,
    getAllCategories,
    getCategoryBySlug,
} from './strapi.js';

// ============================================
// ARTICLE/POST FUNCTIONS
// ============================================

/**
 * Get all published posts (backwards compatible)
 */
export const getAllPosts = async (page = 1, pageSize = 10) => {
    try {
        const result = await getAllArticles(page, pageSize);
        return result.articles;
    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
};

/**
 * Get all posts with pagination info
 */
export const getPostsWithPagination = async (page = 1, pageSize = 10) => {
    try {
        return await getAllArticles(page, pageSize);
    } catch (error) {
        console.error("Error fetching posts:", error);
        return { articles: [], pagination: { page: 1, pageSize: 10, total: 0 } };
    }
};

/**
 * Get a single post by slug
 */
export const getPostBySlug = async (slug) => {
    try {
        // Fire-and-forget view increment
        incrementViews(slug).catch(err =>
            console.error(`View increment failed for ${slug}`, err)
        );

        const article = await getArticleBySlug(slug);
        return article;
    } catch (error) {
        console.warn(`Post not found or error: ${slug}`, error);
        return null;
    }
};

/**
 * Get posts by author slug
 */
export const getPostsByAuthor = async (authorSlug, page = 1, pageSize = 10) => {
    try {
        return await getArticlesByAuthor(authorSlug, page, pageSize);
    } catch (error) {
        console.error(`Error fetching posts by author: ${authorSlug}`, error);
        return { articles: [], pagination: { page: 1, pageSize: 10, total: 0 } };
    }
};

/**
 * Get posts by category slug
 */
export const getPostsByCategory = async (categorySlug, page = 1, pageSize = 10) => {
    try {
        return await getArticlesByCategory(categorySlug, page, pageSize);
    } catch (error) {
        console.error(`Error fetching posts by category: ${categorySlug}`, error);
        return { articles: [], pagination: { page: 1, pageSize: 10, total: 0 } };
    }
};

/**
 * Search posts
 */
export const searchPosts = async (query, page = 1, pageSize = 10) => {
    try {
        return await searchArticles(query, page, pageSize);
    } catch (error) {
        console.error(`Error searching posts: ${query}`, error);
        return { articles: [], pagination: { page: 1, pageSize: 10, total: 0 } };
    }
};

/**
 * Get featured/popular posts
 */
export const getFeaturedPosts = async (limit = 5) => {
    try {
        return await getFeaturedArticles(limit);
    } catch (error) {
        console.error("Error fetching featured posts:", error);
        return [];
    }
};

/**
 * Save a new post (used by API route)
 */
export const savePost = async (newPost) => {
    console.log("savePost received:", JSON.stringify(newPost, null, 2));
    try {
        const savedArticle = await saveArticle(newPost);
        return savedArticle;
    } catch (error) {
        console.error("Error saving post:", error);
        throw new Error(`Save failed for slug '${newPost.slug}': ${error.message}`);
    }
};

// ============================================
// AUTHOR FUNCTIONS
// ============================================

export const getAuthors = async () => {
    try {
        return await getAllAuthors();
    } catch (error) {
        console.error("Error fetching authors:", error);
        return [];
    }
};

export const getAuthor = async (slug) => {
    try {
        return await getAuthorBySlug(slug);
    } catch (error) {
        console.error(`Error fetching author: ${slug}`, error);
        return null;
    }
};

// ============================================
// CATEGORY FUNCTIONS
// ============================================

export const getCategories = async () => {
    try {
        return await getAllCategories();
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
};

export const getCategory = async (slug) => {
    try {
        return await getCategoryBySlug(slug);
    } catch (error) {
        console.error(`Error fetching category: ${slug}`, error);
        return null;
    }
};

// Re-export for direct use
export { incrementViews };
