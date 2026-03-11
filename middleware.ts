import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that are public and don't require authentication
const PUBLIC_PATHS = [
    "/",
    "/sign-in",
    "/sign-up",
    "/login",
    "/api/reports",     // Widget bug submission endpoint (uses API key auth instead)
    "/api/public",
];

// Paths that must always be accessible (static files, Next.js internals)
const ALWAYS_PUBLIC = ["/_next", "/favicon", "/icons", "/manifest", "/widget"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always allow static assets and public API routes
    if (ALWAYS_PUBLIC.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // Always allow explicitly public pages
    if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        return NextResponse.next();
    }

    // For protected routes (/dashboard/*, /admin/*), check for a session token
    // The token is stored in localStorage by the extension — for Next.js pages we
    // rely on Convex's client-side auth for now, but we add a security header gate.
    // A full server-side redirect would require reading Clerk session cookies.
    // This middleware adds security headers to ALL responses.
    const response = NextResponse.next();

    // Enforce no-cache on sensitive dashboard pages to prevent back-button auth bypass
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};