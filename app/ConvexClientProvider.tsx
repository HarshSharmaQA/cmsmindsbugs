"use client";

import { ConvexReactClient, ConvexProvider } from "convex/react";
import React from "react";

// Instantiating the client at the top level with a fallback URL.
// This ensures that the ConvexProvider always has a client instance,
// even during build-time SSR where environment variables might be missing.
// This prevents the "Could not find Convex client!" and "No address provided" errors.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://build-time-ssr-fallback.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <ConvexProvider client={convex}>
            {children}
        </ConvexProvider>
    );
}
