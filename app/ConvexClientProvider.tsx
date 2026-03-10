"use client";

import { ConvexReactClient, ConvexProvider } from "convex/react";
import React, { useMemo } from "react";

/**
 * ConvexClientProvider wraps the application with the Convex client.
 * It's structured to prevent build-time SSR errors by always providing a provider 
 * instance, even if the deployment URL is missing (fallback during build-time).
 */
export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
    // NEXT_PUBLIC_ variables are only available during the build phase if they are present in 
    // the .env files or the build environment. For Vercel, they are often missing until 
    // runtime. We provide a dummy URL during build to satisfy hook requirements (e.g. useQuery).
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://build-time-ssr-fallback.convex.cloud";

    const convex = useMemo(() => {
        return new ConvexReactClient(convexUrl);
    }, [convexUrl]);

    return (
        <ConvexProvider client={convex}>
            {children}
        </ConvexProvider>
    );
}
