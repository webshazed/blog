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
        const response = await fetch(
            `${baseUrl}/api/comments?filters[articleSlug][$eq]=${encodeURIComponent(slug)}&filters[approved][$eq]=true&sort=createdAt:desc`,
            {
                headers: {
                    'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
                },
                cache: 'no-store', // Don't cache comments
            }
        );

        if (!response.ok) {
            console.error('Strapi fetch error:', response.status);
            return NextResponse.json({ comments: [] });
        }

        const data = await response.json();

        // Format comments for frontend
        const comments = (data.data || []).map(item => ({
            id: item.id,
            name: item.name,
            content: item.content,
            createdAt: item.createdAt,
        }));

        return NextResponse.json({ comments });
    } catch (error) {
        console.error('Error fetching comments:', error);
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
        const response = await fetch(`${baseUrl}/api/comments`, {
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
                    approved: true, // Auto-approve for now
                }
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Strapi create error:', error);
            return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
        }

        const data = await response.json();

        // Return the created comment
        return NextResponse.json({
            id: data.data.id,
            name: data.data.name,
            content: data.data.content,
            createdAt: data.data.createdAt,
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
