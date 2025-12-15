import { NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

// GET: Fetch comments for a specific article slug
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        if (!slug) {
            return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
        }

        const baseUrl = STRAPI_URL.replace(/\/$/, '');
        const apiUrl = `${baseUrl}/api/comments?filters[articleSlug][$eq]=${encodeURIComponent(slug)}&filters[approved][$eq]=true&sort=createdAt:desc`;

        console.log(`[Comments] Fetching: ${apiUrl}`);

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
            },
            cache: 'no-store',
        });

        console.log(`[Comments] Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Comments] Fetch error:', errorText);
            return NextResponse.json({ comments: [] });
        }

        const data = await response.json();
        console.log(`[Comments] Raw response: ${JSON.stringify(data).substring(0, 500)}`);

        // Strapi v5 response format: { data: [ { id, documentId, name, content, ... } ] }
        const comments = (data.data || []).map(item => ({
            id: item.id || item.documentId,
            name: item.name || 'Anonymous',
            content: item.content || '',
            createdAt: item.createdAt,
        }));

        console.log(`[Comments] Returning ${comments.length} comments`);
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

        const baseUrl = STRAPI_URL.replace(/\/$/, '');
        const apiUrl = `${baseUrl}/api/comments`;

        const payload = {
            data: {
                name: name,
                email: email || '',
                content: content,
                articleSlug: slug,
                approved: true,
            }
        };

        console.log(`[Comments] Creating at: ${apiUrl}`);
        console.log(`[Comments] Payload: ${JSON.stringify(payload)}`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
            },
            body: JSON.stringify(payload),
        });

        console.log(`[Comments] POST Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Comments] Create error:', errorText);
            return NextResponse.json({ error: 'Failed to create comment', details: errorText }, { status: 500 });
        }

        const data = await response.json();
        console.log(`[Comments] Created: ${JSON.stringify(data).substring(0, 300)}`);

        // Return the created comment
        const newComment = data.data || data;
        return NextResponse.json({
            id: newComment.id || newComment.documentId,
            name: newComment.name || name,
            content: newComment.content || content,
            createdAt: newComment.createdAt || new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Comments] Error creating:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
