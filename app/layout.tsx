import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { AppProvider } from "@/contexts/AppContext";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bugscribe.io";
const SITE_NAME = "BugScribe";
const DEFAULT_DESCRIPTION =
    "Visual feedback & bug tracking for modern software teams. Capture annotated screenshots, manage issues with Kanban, and resolve bugs faster — right from your browser.";

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: "#ef4444",
};

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: SITE_NAME,
        template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: [
        "bug tracking",
        "visual feedback",
        "QA automation",
        "screenshot annotation",
        "issue tracker",
        "software testing",
        "kanban board",
        "developer tools",
        "project management",
    ],
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    alternates: {
        canonical: SITE_URL,
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        url: SITE_URL,
        siteName: SITE_NAME,
        title: `${SITE_NAME} — Visual Bug Tracking for Dev Teams`,
        description: DEFAULT_DESCRIPTION,
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: `${SITE_NAME} — Visual Bug Tracking`,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: `${SITE_NAME} — Visual Bug Tracking`,
        description: DEFAULT_DESCRIPTION,
        images: ["/og-image.png"],
        creator: "@bugscribe",
        site: "@bugscribe",
    },
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon.ico",
        apple: "/apple-touch-icon.png",
    },
    manifest: "/manifest.json",
    category: "technology",
    // PWA Configuration
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: SITE_NAME,
    },
    formatDetection: {
        telephone: false,
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
        potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/?q={search_term_string}`,
            "query-input": "required name=search_term_string",
        },
    };

    return (
        <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                    suppressHydrationWarning
                />
                {/* PWA Meta Tags */}
                <meta name="application-name" content={SITE_NAME} />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="theme-color" content="#ef4444" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
            </head>
            <body suppressHydrationWarning>
                <ServiceWorkerRegistration />
                <ConvexClientProvider>
                    <AppProvider>
                        {children}
                        <PWAInstallPrompt />
                    </AppProvider>
                </ConvexClientProvider>
            </body>
        </html>
    );
}
