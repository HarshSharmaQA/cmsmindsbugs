"use client";

import { ConvexReactClient, ConvexProvider } from "convex/react";
import React, { useMemo } from "react";

/**
 * ConvexClientProvider wraps the application with the Convex client.
 * It's structured to prevent build-time SSR errors by only instantiating the 
 * client when a deployment URL is provided.
 */
export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
    // During Next.js build-time prerendering, environment variables starting with NEXT_PUBLIC_
    // might not be available yet. We avoid creating the client if the URL is missing.
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    const convex = useMemo(() => {
        if (!convexUrl) return null;
        return new ConvexReactClient(convexUrl);
    }, [convexUrl]);

    if (!convex) {
        // Fallback for SSR / Build-time when URL is missing
        return <>{children}</>;
    }

    return (
        <ConvexProvider client={convex}>
            {children}
        </ConvexProvider>
    );
}
