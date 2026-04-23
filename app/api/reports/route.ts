import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { decode as toonDecode } from "@/lib/toon";

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;        // max requests
const RATE_WINDOW = 60_000;   // per 60 seconds

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

const ALLOWED_ORIGINS = [
    "chrome-extension://",
    "moz-extension://", // Firefox support
    "http://localhost",
    "http://127.0.0.1",
    "https://bug-higt.vercel.app",
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "",
].filter(Boolean);

function getCorsHeaders(origin: string | null): Record<string, string> {
    const isAllowed = !origin || ALLOWED_ORIGINS.some(o => origin.startsWith(o));
    return {
        "Access-Control-Allow-Origin": isAllowed ? (origin ?? "*") : "null",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Vary": "Origin",
    };
}

function getConvexClient() {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set.");
    return new ConvexHttpClient(url);
}

function tryParseData(data: string | null): any {
    if (!data) return undefined;
    try {
        return JSON.parse(data);
    } catch (e) {
        if (data.includes("[") || data.includes(":")) {
            try {
                return toonDecode(data);
            } catch (err) {
                return data;
            }
        }
        return data;
    }
}

export async function POST(req: Request) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    if (!checkRateLimit(ip)) {
        return NextResponse.json(
            { error: "Too many requests. Please slow down." },
            { status: 429, headers: { ...corsHeaders, "Retry-After": "60" } }
        );
    }

    const convex = getConvexClient();
    try {
        const formData = await req.formData();

        const projectId = formData.get("projectId") as string;
        const apiKey = formData.get("apiKey") as string;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const priority = formData.get("priority") as "low" | "medium" | "high" | "critical" || "medium";
        const browser = formData.get("browser") as string || "Chrome (Extension)";
        const os = formData.get("os") as string || "Unknown";
        const url = formData.get("url") as string || "Unknown";
        const pageUrl = formData.get("page_url") as string || url;
        const screenWidth = parseInt(formData.get("screenWidth") as string) || undefined;
        const screenHeight = parseInt(formData.get("screenHeight") as string) || undefined;
        const xCoordinateRaw = formData.get("x_coordinate") as string;
        const yCoordinateRaw = formData.get("y_coordinate") as string;
        const scrollPositionRaw = formData.get("scroll_position") as string;
        const scrollXRaw = formData.get("scrollX") as string;
        const scrollYRaw = formData.get("scrollY") as string;
        const elementSelector = (formData.get("element_selector") as string) || undefined;
        const createdAtRaw = formData.get("created_at") as string;
        const xCoordinate = Number.isFinite(Number(xCoordinateRaw)) ? Number(xCoordinateRaw) : undefined;
        const yCoordinate = Number.isFinite(Number(yCoordinateRaw)) ? Number(yCoordinateRaw) : undefined;
        const scrollPosition = Number.isFinite(Number(scrollPositionRaw)) ? Number(scrollPositionRaw) : undefined;
        const scrollX = Number.isFinite(Number(scrollXRaw)) ? Number(scrollXRaw) : undefined;
        const scrollY = Number.isFinite(Number(scrollYRaw)) ? Number(scrollYRaw) : undefined;
        const createdAt = Number.isFinite(Number(createdAtRaw)) ? Number(createdAtRaw) : Date.now();

        const screenshot = formData.get("screenshot") as File | null;

        if (!projectId || !apiKey || !title) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const mediaType = formData.get("mediaType") as string || "image";
        const stepsStr = formData.get("steps") as string;
        let steps: string[] = [];
        if (stepsStr) {
            try { steps = tryParseData(stepsStr); } catch (e) { }
        }

        const envDataStr = formData.get("environmentData") as string;
        let environmentData;
        let consoleErrors: any[] = [];
        let networkLogs: any[] = [];
        let screenResolution: string | undefined;
        let userAgent: string | undefined;
        let pageLoadTime: number | string | undefined;
        let deviceType: string | undefined;

        if (envDataStr) {
            try {
                const rawEnv = tryParseData(envDataStr);
                screenResolution = rawEnv.screenResolution;
                userAgent = rawEnv.userAgent;
                pageLoadTime = rawEnv.pageLoadTime;
                deviceType = rawEnv.deviceType;

                if (rawEnv.consoleErrors) {
                    consoleErrors = typeof rawEnv.consoleErrors === 'string' 
                        ? tryParseData(rawEnv.consoleErrors) 
                        : rawEnv.consoleErrors;
                }
                if (rawEnv.networkLogs) {
                    networkLogs = typeof rawEnv.networkLogs === 'string'
                        ? tryParseData(rawEnv.networkLogs)
                        : rawEnv.networkLogs;
                }

                const truncateEntries = (str: string, maxEntries = 20, maxLen = 200) => {
                    try {
                        const entries = JSON.parse(str);
                        if (Array.isArray(entries)) {
                            return JSON.stringify(
                                entries.slice(0, maxEntries).map(([k, v]: [string, string]) => [
                                    k,
                                    typeof v === 'string' && v.length > maxLen ? v.substring(0, maxLen) + '...' : v
                                ])
                            );
                        }
                        return str.substring(0, 2000);
                    } catch { return str.substring(0, 2000); }
                };
                environmentData = {
                    localStorage: rawEnv.localStorage ? truncateEntries(rawEnv.localStorage) : undefined,
                    sessionStorage: rawEnv.sessionStorage ? truncateEntries(rawEnv.sessionStorage) : undefined,
                    cookies: typeof rawEnv.cookies === 'string' ? rawEnv.cookies.substring(0, 2000) : rawEnv.cookies,
                    windowSize: rawEnv.windowSize,
                };
                const envStr = JSON.stringify(environmentData);
                if (envStr.length > 50000) {
                    environmentData = { windowSize: rawEnv.windowSize, note: "Environment data too large, truncated" };
                }
            } catch (e) { }
        }

        let screenshotStorageId: Id<"_storage"> | undefined;
        if (screenshot && screenshot.size > 0) {
            try {
                const uploadUrl = await convex.mutation(api.bugs.generateUploadUrl, {
                    projectId: projectId as Id<"projects">,
                    apiKey
                });
                const res = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": screenshot.type },
                    body: screenshot,
                });
                if (res.ok) {
                    const { storageId } = await res.json();
                    screenshotStorageId = storageId;
                }
            } catch (err: any) {
                console.error("Screenshot upload failed:", err);
            }
        }

        const bugId = await convex.mutation(api.bugs.createBug, {
            projectId: projectId as Id<"projects">,
            apiKey,
            title,
            description,
            priority,
            browser,
            os,
            url,
            page_url: pageUrl,
            screenWidth,
            screenHeight,
            x_coordinate: xCoordinate,
            y_coordinate: yCoordinate,
            scroll_position: scrollPosition,
            scrollX,
            scrollY,
            element_selector: elementSelector,
            screenshotStorageId,
            mediaType,
            steps,
            environmentData,
            consoleErrors,
            networkLogs,
            screenResolution,
            userAgent,
            pageLoadTime,
            deviceType,
            created_at: createdAt,
        });

        return NextResponse.json({ success: true, bugId }, { headers: corsHeaders });
    } catch (error: any) {
        console.error("Error creating bug report:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, {
            status: 500,
            headers: corsHeaders
        });
    }
}

export async function OPTIONS(req: Request) {
    const origin = req.headers.get("origin");
    return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}
