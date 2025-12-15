/**
 * Strapi API Client
 * Handles all communication with Strapi CMS
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

/**
 * Make a request to Strapi API
 */
async function fetchAPI(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Add authorization if token exists
    if (STRAPI_API_TOKEN) {
        defaultOptions.headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const mergedOptions = {
        next: { revalidate: 3600 }, // Default cache: 1 hour
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    // Construct URL safely using URL object
    // Remove trailing slash from base if present to avoid double slashes
    const baseUrl = STRAPI_URL.replace(/\/$/, '');
    const urlString = `${baseUrl}/api${endpoint}`;

    // Log request for debugging
    console.log(`[Strapi] Fetching: ${urlString}`);

    try {
        const response = await fetch(urlString, mergedOptions);

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error(`[Strapi] Error ${response.status}:`, JSON.stringify(error));
            throw new Error(`Strapi API error: ${response.status} - ${JSON.stringify(error)}`);
        }

        return response.json();
    } catch (error) {
        throw error;
    }
}

// ============================================
// ARTICLE FUNCTIONS
// ============================================

/**
 * Get all published articles with optional pagination
 */
export async function getAllArticles(page = 1, pageSize = 10) {
    try {
        const response = await fetchAPI(
            `/articles?populate=*&sort=id:desc&filters[publishedAt][$notNull]=true&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
        );
        return {
            articles: response.data.map(formatArticle),
            pagination: response.meta?.pagination || { page: 1, pageSize: 10, total: 0 }
        };
    } catch (error) {
        console.error('Error fetching articles from Strapi:', error);
        return { articles: [], pagination: { page: 1, pageSize: 10, total: 0 } };
    }
}

/**
 * Get a single article by slug
 */
export async function getArticleBySlug(slug) {
    try {
        const response = await fetchAPI(`/articles?filters[slug][$eq]=${slug}&populate=*`);
        if (!response.data || response.data.length === 0) {
            return null;
        }
        return formatArticle(response.data[0]);
    } catch (error) {
        console.error(`Error fetching article ${slug} from Strapi:`, error);
        return null;
    }
}

/**
 * Get articles by author slug
 */
export async function getArticlesByAuthor(authorSlug, page = 1, pageSize = 10) {
    try {
        const response = await fetchAPI(
            `/articles?populate=*&filters[author][slug][$eq]=${authorSlug}&filters[publishedAt][$notNull]=true&sort=id:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
        );
        return {
            articles: response.data.map(formatArticle),
            pagination: response.meta?.pagination || { page: 1, pageSize: 10, total: 0 }
        };
    } catch (error) {
        console.error(`Error fetching articles by author ${authorSlug}:`, error);
        return { articles: [], pagination: { page: 1, pageSize: 10, total: 0 } };
    }
}

/**
 * Get articles by category slug
 */
export async function getArticlesByCategory(categorySlug, page = 1, pageSize = 10) {
    try {
        const response = await fetchAPI(
            `/articles?populate=*&filters[category][slug][$eq]=${categorySlug}&filters[publishedAt][$notNull]=true&sort=id:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
        );
        return {
            articles: response.data.map(formatArticle),
            pagination: response.meta?.pagination || { page: 1, pageSize: 10, total: 0 }
        };
    } catch (error) {
        console.error(`Error fetching articles by category ${categorySlug}:`, error);
        return { articles: [], pagination: { page: 1, pageSize: 10, total: 0 } };
    }
}

/**
 * Search articles by title or content
 */
export async function searchArticles(query, page = 1, pageSize = 10) {
    try {
        const response = await fetchAPI(
            `/articles?populate=*&filters[$or][0][title][$containsi]=${encodeURIComponent(query)}&filters[$or][1][content][$containsi]=${encodeURIComponent(query)}&filters[publishedAt][$notNull]=true&sort=id:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
        );
        return {
            articles: response.data.map(formatArticle),
            pagination: response.meta?.pagination || { page: 1, pageSize: 10, total: 0 }
        };
    } catch (error) {
        console.error(`Error searching articles for "${query}":`, error);
        return { articles: [], pagination: { page: 1, pageSize: 10, total: 0 } };
    }
}

/**
 * Get featured/popular articles (by views)
 */
export async function getFeaturedArticles(limit = 5) {
    try {
        const response = await fetchAPI(
            `/articles?populate=*&filters[publishedAt][$notNull]=true&sort=views:desc&pagination[limit]=${limit}`
        );
        return response.data.map(formatArticle);
    } catch (error) {
        console.error('Error fetching featured articles:', error);
        return [];
    }
}

/**
 * Create or update an article in Strapi
 */
export async function saveArticle(articleData) {
    try {
        // First, ensure author and category exist
        const authorId = await upsertAuthor(articleData.author);
        const categoryId = await upsertCategory(articleData.category);

        // Check if article exists
        const existing = await fetchAPI(`/articles?filters[slug][$eq]=${encodeURIComponent(articleData.slug)}`);

        const payload = {
            data: {
                title: articleData.title,
                slug: articleData.slug,
                content: articleData.content,
                excerpt: articleData.excerpt,
                image: articleData.image,
                imageAlt: articleData.image_alt || articleData.imageAlt,
                imageTitle: articleData.image_title || articleData.imageTitle,
                date: articleData.date,
                views: articleData.views || 0,
                adCodeTop: articleData.adCodeTop || null,
                adCodeMiddle: articleData.adCodeMiddle || null,
                adCodeBottom: articleData.adCodeBottom || null,
                enableAds: articleData.enableAds !== false,
                author: authorId,
                category: categoryId,
            }
        };

        let response;
        if (existing.data && existing.data.length > 0) {
            // Update existing
            const existingId = existing.data[0].id;
            response = await fetchAPI(`/articles/${existingId}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
        } else {
            // Create new
            response = await fetchAPI('/articles', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        }

        return formatArticle(response.data);
    } catch (error) {
        console.error('Error saving article to Strapi:', error);
        throw error;
    }
}

/**
 * Increment article views
 */
export async function incrementViews(slug) {
    try {
        // Use a softer approach that doesn't throw on empty results
        const url = `${process.env.STRAPI_URL || 'http://localhost:1337'}/api/articles?filters[slug][$eq]=${encodeURIComponent(slug)}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...(process.env.STRAPI_API_TOKEN && { 'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}` })
            }
        });

        if (!response.ok) {
            // Silently ignore - article might not exist yet
            return;
        }

        const existing = await response.json();

        if (existing.data && existing.data.length > 0) {
            const article = existing.data[0];
            const currentViews = article.views || 0;

            const updateUrl = `${process.env.STRAPI_URL || 'http://localhost:1337'}/api/articles/${article.id}`;
            await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(process.env.STRAPI_API_TOKEN && { 'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}` })
                },
                body: JSON.stringify({
                    data: { views: currentViews + 1 }
                }),
            });
        }
    } catch (error) {
        // Silently ignore view increment errors - not critical
        console.warn('View increment skipped:', slug);
    }
}

// ============================================
// AUTHOR FUNCTIONS
// ============================================

/**
 * Get all authors
 */
export async function getAllAuthors() {
    try {
        const response = await fetchAPI('/authors?populate=*');
        return response.data.map(formatAuthor);
    } catch (error) {
        console.error('Error fetching authors:', error);
        return [];
    }
}

/**
 * Get author by slug
 */
export async function getAuthorBySlug(slug) {
    try {
        const response = await fetchAPI(`/authors?filters[slug][$eq]=${slug}&populate=*`);
        if (!response.data || response.data.length === 0) {
            return null;
        }
        return formatAuthor(response.data[0]);
    } catch (error) {
        console.error(`Error fetching author ${slug}:`, error);
        return null;
    }
}

/**
 * Get or create an author
 */
async function upsertAuthor(name) {
    if (!name) name = 'Evergreen Team';

    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    try {
        // First check if author exists by slug (slug is unique)
        const existingBySlug = await fetchAPI(`/authors?filters[slug][$eq]=${encodeURIComponent(slug)}`);

        if (existingBySlug.data && existingBySlug.data.length > 0) {
            return existingBySlug.data[0].id;
        }

        // Also check by name (in case slug differs)
        const existingByName = await fetchAPI(`/authors?filters[name][$eq]=${encodeURIComponent(name)}`);

        if (existingByName.data && existingByName.data.length > 0) {
            return existingByName.data[0].id;
        }

        // Create new author
        const email = `${slug}-${Date.now()}@example.com`; // Unique email

        const response = await fetchAPI('/authors', {
            method: 'POST',
            body: JSON.stringify({
                data: {
                    name: name,
                    slug: slug,
                    email: email,
                    bio: 'Expert writer.',
                }
            }),
        });

        return response.data.id;
    } catch (error) {
        console.error('Error upserting author:', error);

        // If it's a unique constraint error, try to find the existing author
        if (error.message && error.message.includes('unique')) {
            try {
                const fallback = await fetchAPI(`/authors?filters[slug][$eq]=${encodeURIComponent(slug)}`);
                if (fallback.data && fallback.data.length > 0) {
                    return fallback.data[0].id;
                }
            } catch (e) {
                console.error('Fallback author lookup failed:', e);
            }
        }
        throw error;
    }
}

// ============================================
// CATEGORY FUNCTIONS
// ============================================

/**
 * Get all categories
 */
export async function getAllCategories() {
    try {
        const response = await fetchAPI('/categories?populate=*');
        return response.data.map(formatCategory);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug) {
    try {
        const response = await fetchAPI(`/categories?filters[slug][$eq]=${slug}&populate=*`);
        if (!response.data || response.data.length === 0) {
            return null;
        }
        return formatCategory(response.data[0]);
    } catch (error) {
        console.error(`Error fetching category ${slug}:`, error);
        return null;
    }
}

/**
 * Get or create a category
 */
async function upsertCategory(name) {
    if (!name) name = 'General';

    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    try {
        // First check if category exists by slug (slug is unique)
        const existingBySlug = await fetchAPI(`/categories?filters[slug][$eq]=${encodeURIComponent(slug)}`);

        if (existingBySlug.data && existingBySlug.data.length > 0) {
            return existingBySlug.data[0].id;
        }

        // Also check by name as fallback
        const existingByName = await fetchAPI(`/categories?filters[name][$eq]=${encodeURIComponent(name)}`);

        if (existingByName.data && existingByName.data.length > 0) {
            return existingByName.data[0].id;
        }

        // Create new category
        const response = await fetchAPI('/categories', {
            method: 'POST',
            body: JSON.stringify({
                data: {
                    name: name,
                    slug: slug,
                }
            }),
        });

        return response.data.id;
    } catch (error) {
        console.error('Error upserting category:', error);

        // If it's a unique constraint error, try to find the existing category
        if (error.message && error.message.includes('unique')) {
            try {
                const fallback = await fetchAPI(`/categories?filters[slug][$eq]=${encodeURIComponent(slug)}`);
                if (fallback.data && fallback.data.length > 0) {
                    return fallback.data[0].id;
                }
            } catch (e) {
                console.error('Fallback category lookup failed:', e);
            }
        }
        throw error;
    }
}

// ============================================
// FORMATTING HELPERS
// ============================================

/**
 * Format Strapi article response to match frontend format
 */
function formatArticle(article) {
    if (!article) return null;

    // Handle Strapi v5 response structure
    const data = article.attributes || article;
    const author = data.author?.data?.attributes || data.author || {};
    const category = data.category?.data?.attributes || data.category || {};

    return {
        id: article.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        image: data.image,
        image_alt: data.imageAlt,
        image_title: data.imageTitle,
        date: data.date,
        views: data.views || 0,
        published: !!data.publishedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        // Ad codes
        adCodeTop: data.adCodeTop,
        adCodeMiddle: data.adCodeMiddle,
        adCodeBottom: data.adCodeBottom,
        enableAds: data.enableAds !== false,
        // Relations (include slug for linking)
        author: author.name || 'Unknown',
        authorSlug: author.slug || '',
        category: category.name || 'General',
        categorySlug: category.slug || '',
    };
}

/**
 * Format Strapi author response
 */
function formatAuthor(author) {
    if (!author) return null;

    const data = author.attributes || author;
    const articles = data.articles?.data || data.articles || [];

    return {
        id: author.id,
        name: data.name,
        slug: data.slug,
        email: data.email,
        bio: data.bio,
        avatar: data.avatar,
        twitter: data.twitter,
        linkedin: data.linkedin,
        website: data.website,
        articleCount: articles.length,
    };
}

/**
 * Format Strapi category response
 */
function formatCategory(category) {
    if (!category) return null;

    const data = category.attributes || category;
    const articles = data.articles?.data || data.articles || [];

    return {
        id: category.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
        articleCount: articles.length,
    };
}

// ============================================
// AD SETTINGS FUNCTIONS
// ============================================

/**
 * Get AdSense settings from Strapi single-type
 */
export async function getAdSettings() {
    try {
        const response = await fetchAPI('/ad-setting');
        if (!response.data) return null;

        const data = response.data;
        return {
            enabled: data.adsenseEnabled || false,
            publisherId: data.adsensePublisherId || '',
            adSlot: data.inArticleAdSlot || '',
            adFormat: data.inArticleAdFormat || 'auto',
            paragraphInterval: data.paragraphInterval || 3,
            customScript: data.customAdScript || '',
        };
    } catch (error) {
        console.error('[Ad Settings] Error fetching:', error);
        return null;
    }
}

export default {
    // Articles
    getAllArticles,
    getArticleBySlug,
    getArticlesByAuthor,
    getArticlesByCategory,
    searchArticles,
    getFeaturedArticles,
    saveArticle,
    incrementViews,
    // Authors
    getAllAuthors,
    getAuthorBySlug,
    // Categories
    getAllCategories,
    getCategoryBySlug,
    // Ads
    getAdSettings,
};

