import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
    try {
        const { projectId, apiKey } = await request.json();

        if (!projectId || !apiKey) {
            return NextResponse.json({ enabled: true });
        }

        const result = await convex.query(api.projects.checkReportingStatus, {
            projectId,
            apiKey,
        });

        return NextResponse.json({ enabled: result.enabled !== false });
    } catch (error) {
        // Default to enabled if anything fails
        return NextResponse.json({ enabled: true });
    }
}
