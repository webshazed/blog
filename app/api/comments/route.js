import { NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

/**
 * Helper to get article document ID from slug
 */
async function getArticleDocumentId(slug) {
    const baseUrl = STRAPI_URL.replace(/\/$/, '');
    const response = await fetch(
        `${baseUrl}/api/articles?filters[slug][$eq]=${encodeURIComponent(slug)}&fields[0]=documentId`,
        {
            headers: {
                'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
            },
        }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.data && data.data.length > 0) {
        // Strapi v5 uses documentId, v4 uses id
        return data.data[0].documentId || data.data[0].id;
    }
    return null;
}

// GET: Fetch comments for a specific article slug
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        if (!slug) {
            return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
        }

        // Get article document ID from slug
        const documentId = await getArticleDocumentId(slug);

        if (!documentId) {
            console.log(`[Comments] Article not found for slug: ${slug}`);
            return NextResponse.json({ comments: [] });
        }

        const baseUrl = STRAPI_URL.replace(/\/$/, '');

        // Try strapi-plugin-comments endpoint first
        let response = await fetch(
            `${baseUrl}/api/comments/api::article.article/${documentId}`,
            {
                headers: {
                    'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
                },
                cache: 'no-store',
            }
        );

        // Fallback to custom Comment content type if plugin not found
        if (!response.ok) {
            console.log('[Comments] Plugin endpoint failed, trying custom content type...');
            response = await fetch(
                `${baseUrl}/api/comments?filters[articleSlug][$eq]=${encodeURIComponent(slug)}&filters[approved][$eq]=true&sort=createdAt:desc`,
                {
                    headers: {
                        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
                    },
                    cache: 'no-store',
                }
            );
        }

        if (!response.ok) {
            console.error('[Comments] Both endpoints failed:', response.status);
            return NextResponse.json({ comments: [] });
        }

        const data = await response.json();

        // Format comments for frontend (handle both plugin and custom formats)
        let comments = [];

        if (data.data && Array.isArray(data.data)) {
            // Plugin format or custom content type
            comments = data.data.map(item => ({
                id: item.id,
                name: item.author?.name || item.authorName || item.name || 'Anonymous',
                content: item.content || item.message || '',
                createdAt: item.createdAt,
            }));
        } else if (Array.isArray(data)) {
            // Direct array from plugin
            comments = data.map(item => ({
                id: item.id,
                name: item.author?.name || item.authorName || 'Anonymous',
                content: item.content || item.message || '',
                createdAt: item.createdAt,
            }));
        }

        return NextResponse.json({ comments });
    } catch (error) {
        console.error('[Comments] Error fetching:', error);
        return NextResponse.json({ comments: [] });
    }
}

// POST: Create a new comment
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, content, slug } = body;

        if (!name || !content || !slug) {
            return NextResponse.json(
                { error: 'Missing required fields: name, content, slug' },
                { status: 400 }
            );
        }

        // Get article document ID from slug
        const documentId = await getArticleDocumentId(slug);

        if (!documentId) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        const baseUrl = STRAPI_URL.replace(/\/$/, '');

        // Try strapi-plugin-comments endpoint first
        let response = await fetch(
            `${baseUrl}/api/comments/api::article.article/${documentId}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
                },
                body: JSON.stringify({
                    author: {
                        name: name,
                        email: email || '',
                    },
                    content: content,
                }),
            }
        );

        // Fallback to custom Comment content type
        if (!response.ok) {
            console.log('[Comments] Plugin POST failed, trying custom content type...');
            response = await fetch(`${baseUrl}/api/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
                },
                body: JSON.stringify({
                    data: {
                        name,
                        email: email || '',
                        content,
                        articleSlug: slug,
                        approved: true,
                    }
                }),
            });
        }

        if (!response.ok) {
            const error = await response.text();
            console.error('[Comments] Create error:', error);
            return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
        }

        const data = await response.json();

        // Return the created comment
        const newComment = data.data || data;
        return NextResponse.json({
            id: newComment.id,
            name: newComment.author?.name || newComment.name || name,
            content: newComment.content || newComment.message || content,
            createdAt: newComment.createdAt || new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Comments] Error creating:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

