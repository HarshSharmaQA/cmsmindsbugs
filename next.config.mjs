/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

// Enhanced security headers with environment-aware CSP
const securityHeaders = [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-XSS-Protection", value: "1; mode=block" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { 
        key: "Permissions-Policy", 
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" 
    },
    {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
    },
    {
        key: "Content-Security-Policy",
        value: [
            "default-src 'self'",
            isDev 
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.accounts.dev https://*.clerk.accounts.dev" 
                : "script-src 'self' 'unsafe-inline' https://clerk.accounts.dev https://*.clerk.accounts.dev",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: blob: https://*.convex.cloud https://*.convex.site https://img.clerk.com",
            "connect-src 'self' https://*.convex.cloud https://*.convex.site wss://*.convex.cloud https://clerk.accounts.dev https://*.clerk.accounts.dev https://api.clerk.dev",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
            "upgrade-insecure-requests",
        ].join("; "),
    },
];

const nextConfig = {
    // Build optimization
    outputFileTracingRoot: process.cwd(),
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,
    
    // Silence Turbopack warning regarding existing webpack config
    turbopack: {},
    
    // Experimental features
    experimental: {
        optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    },

    // Image optimization
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*.convex.cloud",
            },
            {
                protocol: "https",
                hostname: "*.convex.site",
            },
            {
                protocol: "https",
                hostname: "img.clerk.com",
            },
        ],
        formats: ["image/avif", "image/webp"],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 60,
        dangerouslyAllowSVG: true,
        contentDispositionType: "attachment",
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },

    // Webpack configuration
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }
        return config;
    },

    // Security and performance headers
    async headers() {
        return [
            {
                source: "/:path*",
                headers: securityHeaders,
            },
            {
                source: "/api/:path*",
                headers: [
                    ...securityHeaders,
                    { key: "Cache-Control", value: "no-store, max-age=0" },
                ],
            },
            {
                source: "/fonts/:path*",
                headers: [
                    { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
                ],
            },
        ];
    },

    // Redirects for common patterns
    async redirects() {
        return [
            {
                source: "/home",
                destination: "/",
                permanent: true,
            },
        ];
    },

    // TypeScript configuration
    typescript: {
        ignoreBuildErrors: false,
    },

    // Logging
    logging: {
        fetches: {
            fullUrl: isDev,
        },
    },
};

export default nextConfig;
