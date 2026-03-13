import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bugscribe.io";
const SITE_NAME = "BugScribe";

// ─── Extract best description from blocks when admin hasn't set one ────────────
function extractDescriptionFromBlocks(blocks: any[]): string {
    for (const block of blocks) {
        const d = block.data ?? {};
        // Prefer explicit meta-like fields
        const candidates = [
            d.subheading,
            d.subtext,
            d.description,
            d.sectionSubheading,
            d.subheadingText,
            d.body,
        ];
        for (const c of candidates) {
            if (typeof c === "string" && c.trim().length > 30) {
                return c.trim().slice(0, 160);
            }
        }
    }
    return "Explore this page on BugScribe \u2014 the modern visual bug tracking platform for software teams.";
}

// ─── Extract first image found across blocks for OG image ─────────────────────
function extractOgImage(blocks: any[]): string | null {
    for (const block of blocks) {
        const d = block.data ?? {};
        const imgCandidates = [d.src, d.image, d.hostAvatar, d.img1Src, d.logo1Url];
        for (const img of imgCandidates) {
            if (typeof img === "string" && img.startsWith("http")) return img;
        }
    }
    return null;
}

// ─── Build keyword list from page blocks ──────────────────────────────────────
function extractKeywords(blocks: any[]): string[] {
    const words = new Set<string>(["BugScribe", "bug tracking", "visual feedback"]);
    for (const block of blocks) {
        const d = block.data ?? {};
        const text = [d.heading, d.heading1, d.badge, d.sectionHeading]
            .filter(Boolean)
            .join(" ");
        text.split(/\s+/)
            .filter((w: string) => w.length > 4)
            .slice(0, 6)
            .forEach((w: string) => words.add(w.replace(/[^a-zA-Z0-9 ]/g, "").toLowerCase()));
    }
    return [...words].slice(0, 10);
}

// ─── generateMetadata — runs SERVER-SIDE ──────────────────────────────────────
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
    const resolvedParams = await params;
    const slugArr = resolvedParams?.slug ?? [];
    const slug = slugArr.join("/");
    const pageUrl = `${SITE_URL}/${slug}`;

    let page: any = null;
    try {
        page = await fetchQuery(api.pages.getBySlug, { slug });
    } catch {
        // fetchQuery may fail in non-Convex environments; degrade gracefully
    }

    if (!page || !page.isPublished) {
        return {
            title: "Page Not Found",
            description: "This page does not exist or has not been published.",
            robots: { index: false, follow: false },
        };
    }

    const title = page.title || SITE_NAME;
    const description =
        page.metaDescription?.trim() || extractDescriptionFromBlocks(page.blocks ?? []);
    const keywords = extractKeywords(page.blocks ?? []);
    const ogImage = extractOgImage(page.blocks ?? []) ?? "/og-image.png";

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
        description,
        url: pageUrl,
        isPartOf: {
            "@type": "WebSite",
            name: SITE_NAME,
            url: SITE_URL,
        },
        publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
        },
        dateModified: page.updatedAt
            ? new Date(page.updatedAt).toISOString()
            : undefined,
    };

    return {
        title,
        description,
        keywords,
        alternates: {
            canonical: pageUrl,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-image-preview": "large",
                "max-snippet": -1,
            },
        },
        openGraph: {
            type: "website",
            locale: "en_US",
            url: pageUrl,
            siteName: SITE_NAME,
            title,
            description,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImage],
            site: "@bugscribe",
        },
        other: {
            "application/ld+json": JSON.stringify(jsonLd),
        },
    };
}

// ─── Inject JSON-LD as a script tag in the per-page layout ───────────────────
export default async function SlugLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug?: string[] }>;
}) {
    const resolvedParams = await params;
    const slugArr = resolvedParams?.slug ?? [];
    const slug = slugArr.join("/");
    const pageUrl = `${SITE_URL}/${slug}`;

    let page: any = null;
    try {
        page = await fetchQuery(api.pages.getBySlug, { slug });
    } catch {
        // degrade gracefully
    }

    const title = page?.title || SITE_NAME;
    const description =
        page?.metaDescription?.trim() ||
        (page ? extractDescriptionFromBlocks(page.blocks ?? []) : "");

    const jsonLd = page?.isPublished
        ? {
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: title,
              description,
              url: pageUrl,
              isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
              publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
              dateModified: page.updatedAt
                  ? new Date(page.updatedAt).toISOString()
                  : undefined,
          }
        : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {children}
        </>
    );
}
