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
            // Update existing article (keep its current publish status)
            const existingId = existing.data[0].id;
            response = await fetchAPI(`/articles/${existingId}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
        } else {
            // Create new article as DRAFT (Strapi 5: use ?status=draft query param)
            response = await fetchAPI('/articles?status=draft', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            console.log('[saveArticle] Created new article as DRAFT');
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

    // Normalize slug: lowercase, replace spaces and underscores with dashes, remove special chars
    const slug = name.toLowerCase()
        .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with dashes
        .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric except dashes
        .replace(/-+/g, '-')  // Collapse multiple dashes
        .replace(/^-|-$/g, ''); // Trim leading/trailing dashes

    console.log(`[upsertAuthor] Looking for: name="${name}", slug="${slug}"`);

    try {
        // First check if author exists by slug
        const existingBySlug = await fetchAPI(`/authors?filters[slug][$eq]=${encodeURIComponent(slug)}`);
        if (existingBySlug.data && existingBySlug.data.length > 0) {
            console.log(`[upsertAuthor] Found by slug: id=${existingBySlug.data[0].id}`);
            return existingBySlug.data[0].id;
        }

        // Also check by name (in case slug differs)
        const existingByName = await fetchAPI(`/authors?filters[name][$eq]=${encodeURIComponent(name)}`);
        if (existingByName.data && existingByName.data.length > 0) {
            console.log(`[upsertAuthor] Found by name: id=${existingByName.data[0].id}`);
            return existingByName.data[0].id;
        }

        // Create new author
        console.log(`[upsertAuthor] Creating new author: ${name}`);
        const email = `${slug}-${Date.now()}@example.com`;

        const response = await fetchAPI('/authors', {
            method: 'POST',
            body: JSON.stringify({
                data: { name, slug, email, bio: 'Expert writer.' }
            }),
        });

        console.log(`[upsertAuthor] Created: id=${response.data.id}`);
        return response.data.id;
    } catch (error) {
        console.error('[upsertAuthor] Error:', error.message);

        // If it's a unique constraint error, fetch ALL authors and find match
        if (error.message && (error.message.includes('unique') || error.message.includes('400'))) {
            console.log('[upsertAuthor] Unique constraint - fetching all authors to find match');
            try {
                const allAuthors = await fetchAPI('/authors?pagination[pageSize]=100');
                if (allAuthors.data) {
                    const match = allAuthors.data.find(a =>
                        a.name?.toLowerCase() === name.toLowerCase() ||
                        a.slug?.toLowerCase() === slug.toLowerCase()
                    );
                    if (match) {
                        console.log(`[upsertAuthor] Found via full scan: id=${match.id}`);
                        return match.id;
                    }
                }
            } catch (e) {
                console.error('[upsertAuthor] Fallback scan failed:', e.message);
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

    // Normalize slug: lowercase, replace spaces and underscores with dashes, remove special chars
    const slug = name.toLowerCase()
        .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with dashes
        .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric except dashes
        .replace(/-+/g, '-')  // Collapse multiple dashes
        .replace(/^-|-$/g, ''); // Trim leading/trailing dashes

    console.log(`[upsertCategory] Looking for: name="${name}", slug="${slug}"`);

    try {
        // First check if category exists by slug
        const existingBySlug = await fetchAPI(`/categories?filters[slug][$eq]=${encodeURIComponent(slug)}`);
        if (existingBySlug.data && existingBySlug.data.length > 0) {
            console.log(`[upsertCategory] Found by slug: id=${existingBySlug.data[0].id}`);
            return existingBySlug.data[0].id;
        }

        // Also check by name as fallback
        const existingByName = await fetchAPI(`/categories?filters[name][$eq]=${encodeURIComponent(name)}`);
        if (existingByName.data && existingByName.data.length > 0) {
            console.log(`[upsertCategory] Found by name: id=${existingByName.data[0].id}`);
            return existingByName.data[0].id;
        }

        // Create new category
        console.log(`[upsertCategory] Creating new category: ${name}`);
        const response = await fetchAPI('/categories', {
            method: 'POST',
            body: JSON.stringify({
                data: { name, slug }
            }),
        });

        console.log(`[upsertCategory] Created: id=${response.data.id}`);
        return response.data.id;
    } catch (error) {
        console.error('[upsertCategory] Error:', error.message);

        // If it's a unique constraint error, fetch ALL categories and find match
        if (error.message && (error.message.includes('unique') || error.message.includes('400'))) {
            console.log('[upsertCategory] Unique constraint - fetching all categories to find match');
            try {
                const allCategories = await fetchAPI('/categories?pagination[pageSize]=100');
                if (allCategories.data) {
                    const match = allCategories.data.find(c =>
                        c.name?.toLowerCase() === name.toLowerCase() ||
                        c.slug?.toLowerCase() === slug.toLowerCase()
                    );
                    if (match) {
                        console.log(`[upsertCategory] Found via full scan: id=${match.id}`);
                        return match.id;
                    }
                }
            } catch (e) {
                console.error('[upsertCategory] Fallback scan failed:', e.message);
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
 * Returns null if not available (graceful degradation)
 */
export async function getAdSettings() {
    try {
        const baseUrl = STRAPI_URL.replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/api/ad-setting`, {
            headers: {
                'Content-Type': 'application/json',
                ...(STRAPI_API_TOKEN && { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` }),
            },
            next: { revalidate: 3600 },
        });

        // Gracefully handle 404 (endpoint doesn't exist yet)
        if (!response.ok) {
            console.log('[Ad Settings] Not available (404 or not configured)');
            return null;
        }

        const json = await response.json();
        if (!json.data) return null;

        const data = json.data;
        return {
            enabled: data.adsenseEnabled || false,
            publisherId: data.adsensePublisherId || '',
            adSlot: data.inArticleAdSlot || '',
            adFormat: data.inArticleAdFormat || 'auto',
            paragraphInterval: data.paragraphInterval || 3,
            customScript: data.customAdScript || '',
        };
    } catch (error) {
        console.log('[Ad Settings] Error fetching (may not exist yet):', error.message);
        return null;
    }
}
/**
 * Get Site Settings from Strapi single-type
 * Returns null if not available (graceful degradation)
 */
export async function getSiteSettings() {
    try {
        const baseUrl = STRAPI_URL.replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/api/site-setting`, {
            headers: {
                'Content-Type': 'application/json',
                ...(STRAPI_API_TOKEN && { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` }),
            },
            next: { revalidate: 3600 },
        });

        // Gracefully handle 404 (endpoint doesn't exist yet)
        if (!response.ok) {
            console.log('[Site Settings] Not available (404 or not configured)');
            return null;
        }

        const json = await response.json();
        if (!json.data) return null;

        const data = json.data;
        return {
            siteName: data.siteName || 'My Blog',
            siteDescription: data.siteDescription || '',
            googleAnalyticsId: data.googleAnalyticsId || '',
            googleSearchConsoleCode: data.googleSearchConsoleCode || '',
            bingVerificationCode: data.bingVerificationCode || '',
            metaPixelId: data.metaPixelId || '',
            adsensePublisherId: data.adsensePublisherId || '',
            customHeadCode: data.customHeadCode || '',
            customBodyCode: data.customBodyCode || '',
        };
    } catch (error) {
        console.log('[Site Settings] Error fetching (may not exist yet):', error.message);
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
    // Settings
    getAdSettings,
    getSiteSettings,
};

