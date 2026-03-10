import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Lazily initializes the ConvexHttpClient to prevent build-time evaluation errors.
 * Next.js evaluates API routes during `npm run build`, but environment variables
 * like `NEXT_PUBLIC_CONVEX_URL` are not available in the server process at build time.
 * This function ensures the client is only created when a request is actually received.
 */
function getConvexClient() {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
        throw new Error(
            "NEXT_PUBLIC_CONVEX_URL is not set. Check your .env.local file or Vercel Environment Variables."
        );
    }
    return new ConvexHttpClient(url);
}

export async function POST(req: Request) {
    // Initialize client at runtime for each request
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
        const screenWidth = parseInt(formData.get("screenWidth") as string) || undefined;
        const screenHeight = parseInt(formData.get("screenHeight") as string) || undefined;

        const screenshot = formData.get("screenshot") as File | null;

        if (!projectId || !apiKey || !title) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const mediaType = formData.get("mediaType") as string || "image";
        const stepsStr = formData.get("steps") as string;
        let steps: string[] = [];
        if (stepsStr) {
            try { steps = JSON.parse(stepsStr); } catch (e) { }
        }

        const envDataStr = formData.get("environmentData") as string;
        let environmentData;
        if (envDataStr) {
            try {
                const rawEnv = JSON.parse(envDataStr);
                // Truncate large values to stay under Convex 1 MiB doc limit
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
                // Final safety check — cap total size to 50KB
                const envStr = JSON.stringify(environmentData);
                if (envStr.length > 50000) {
                    environmentData = { windowSize: rawEnv.windowSize, note: "Environment data too large, truncated" };
                }
            } catch (e) { }
        }

        let screenshotStorageId: Id<"_storage"> | undefined;

        // 1. Upload screenshot if it exists
        if (screenshot && screenshot.size > 0) {
            try {
                // Generate upload URL
                const uploadUrl = await convex.mutation(api.bugs.generateUploadUrl, {
                    projectId: projectId as Id<"projects">,
                    apiKey
                });

                // Post the file to the upload URL
                const res = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": screenshot.type },
                    body: screenshot,
                });

                if (!res.ok) {
                    throw new Error(`Failed to upload screenshot: ${res.statusText}`);
                }

                const { storageId } = await res.json();
                screenshotStorageId = storageId;
            } catch (err: any) {
                console.error("Screenshot upload failed:", err);
                // Continue without screenshot if it fails
            }
        }

        // 2. Create the bug in Convex
        const bugId = await convex.mutation(api.bugs.createBug, {
            projectId: projectId as Id<"projects">,
            apiKey,
            title,
            description,
            priority,
            browser,
            os,
            url,
            screenWidth,
            screenHeight,
            screenshotStorageId,
            mediaType,
            steps,
            environmentData,
            consoleErrors: [],
        });

        return NextResponse.json({ success: true, bugId }, {
            headers: {
                "Access-Control-Allow-Origin": "*", // Allow the extension to call this
                "Access-Control-Allow-Methods": "POST, OPTIONS",
            }
        });

    } catch (error: any) {
        console.error("Error creating bug report:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, {
            status: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            }
        });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    });
}
