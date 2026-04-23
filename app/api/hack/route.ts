import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionToken = searchParams.get('token');
        
        if (!sessionToken) {
            return NextResponse.json({ success: false, error: 'Session token required' }, { status: 400 });
        }

        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || 'https://careful-dove-148.convex.cloud');
        
        // Use the new query that filters by session token
        const projects = await convex.query(api.temp.listProjectsForExtension, { sessionToken });
        
        return NextResponse.json({ success: true, projects });
    } catch (e: unknown) {
        return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
    }
}
