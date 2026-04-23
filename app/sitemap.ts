import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bugscribe.io";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static core pages
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1.0,
        },
    ];

    // Dynamic builder pages
    let dynamicRoutes: MetadataRoute.Sitemap = [];
    try {
        const pages: Array<{ isPublished?: boolean; slug?: string; updatedAt?: number }> = await fetchQuery(api.pages.list, {});
        dynamicRoutes = pages
            .filter((p) => p.isPublished && p.slug !== undefined)
            .map((p) => ({
                url: `${SITE_URL}/${p.slug}`.replace(/\/+$/, ""),
                lastModified: new Date(p.updatedAt ?? Date.now()),
                changeFrequency: "weekly" as const,
                priority: p.slug === "" ? 1.0 : 0.8,
            }));
    } catch {
        // If Convex is unavailable (e.g. during static export), skip dynamic routes
    }

    return [...staticRoutes, ...dynamicRoutes];
}
