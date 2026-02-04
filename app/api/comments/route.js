import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
    return NextResponse.json([], { status: 200 });
}

export async function POST() {
    return NextResponse.json({ error: 'Comments disabled in static mode' }, { status: 405 });
}
