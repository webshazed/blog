import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
        return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    }

    try {
        const post = await prisma.post.findUnique({
            where: { slug },
            include: {
                comments: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!post) {
            return NextResponse.json({ comments: [] });
        }

        return NextResponse.json({ comments: post.comments });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { slug, name, email, content } = body;

        if (!slug || !content || !name) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const post = await prisma.post.findUnique({ where: { slug } });
        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                name,
                email: email || 'anon@example.com',
                postId: post.id
            }
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Comment error:", error);
        return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
    }
}
