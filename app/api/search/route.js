import { NextResponse } from 'next/server';
import { searchArticles } from '@/lib/strapi';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json({ articles: [] });
    }

    try {
        const { articles } = await searchArticles(query, 1, 10);
        return NextResponse.json({ articles });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
