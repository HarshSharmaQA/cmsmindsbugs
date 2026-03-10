import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function GET() {
    try {
        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || 'https://limitless-chinchilla-790.convex.cloud');
        const project = await convex.query(api.temp.getFirstProject);
        return NextResponse.json({ success: true, project });
    } catch (e: unknown) {
        return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' });
    }
}
