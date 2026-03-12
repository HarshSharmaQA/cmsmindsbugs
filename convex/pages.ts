/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getEffectiveIdentity } from "./users";

// ── Helper: resolve dev token to user ─────────────────────────────────────────
async function resolveUser(ctx: any, devToken: string | undefined) {
    if (!devToken) return null;
    const identity = await getEffectiveIdentity(ctx, devToken);
    if (!identity) return null;
    return await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q: any) => q.eq("tokenIdentifier", identity.subject))
        .first();
}

// ── List all pages (super admin gets all, public gets published only) ──────────
export const list = query({
    args: { devToken: v.optional(v.string()) },
    handler: async (ctx, { devToken }) => {
        const user = await resolveUser(ctx, devToken);
        if (user?.role === "super_admin") {
            return await ctx.db.query("pages").order("desc").collect();
        }
        return await ctx.db
            .query("pages")
            .withIndex("by_published", (q: any) => q.eq("isPublished", true))
            .order("desc")
            .collect();
    },
});

// ── Get single page by slug (public) ───────────────────────────────────────────
export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, { slug }) => {
        return await ctx.db
            .query("pages")
            .withIndex("by_slug", (q: any) => q.eq("slug", slug))
            .first();
    },
});

// ── Get single page by ID (admin) ─────────────────────────────────────────────
export const getById = query({
    args: { id: v.id("pages"), devToken: v.optional(v.string()) },
    handler: async (ctx, { id, devToken }) => {
        const user = await resolveUser(ctx, devToken);
        if (!user || user.role !== "super_admin") throw new Error("Unauthorized");
        return await ctx.db.get(id);
    },
});

// ── Create page ───────────────────────────────────────────────────────────────
export const create = mutation({
    args: {
        devToken: v.string(),
        title: v.string(),
        slug: v.string(),
        metaDescription: v.optional(v.string()),
        isPublished: v.boolean(),
        showInMenu: v.optional(v.boolean()),
        blocks: v.array(v.object({ id: v.string(), type: v.string(), data: v.any() })),
    },
    handler: async (ctx, { devToken, title, slug, metaDescription, isPublished, showInMenu, blocks }) => {
        const user = await resolveUser(ctx, devToken);
        if (!user || user.role !== "super_admin") throw new Error("Unauthorized");

        const cleanSlug = slug === "" ? "" : slug.toLowerCase().replace(/[^a-z0-9-\/]/g, "").replace(/\/{2,}/g, "/").replace(/-+/g, "-").replace(/^\/+|\/+$/g, "");
        const existing = await ctx.db.query("pages").withIndex("by_slug", (q: any) => q.eq("slug", cleanSlug)).first();
        if (existing) throw new Error(`A page with slug "${cleanSlug}" already exists.`);

        const now = Date.now();
        return await ctx.db.insert("pages", {
            title, slug: cleanSlug, metaDescription, isPublished, showInMenu: showInMenu ?? false, blocks,
            createdBy: user.tokenIdentifier, createdAt: now, updatedAt: now,
        });
    },
});

// ── Update page ───────────────────────────────────────────────────────────────
export const update = mutation({
    args: {
        devToken: v.string(),
        id: v.id("pages"),
        title: v.optional(v.string()),
        slug: v.optional(v.string()),
        metaDescription: v.optional(v.string()),
        isPublished: v.optional(v.boolean()),
        showInMenu: v.optional(v.boolean()),
        blocks: v.optional(v.array(v.object({ id: v.string(), type: v.string(), data: v.any() }))),
    },
    handler: async (ctx, { devToken, id, title, slug, metaDescription, isPublished, showInMenu, blocks }) => {
        const user = await resolveUser(ctx, devToken);
        if (!user || user.role !== "super_admin") throw new Error("Unauthorized");

        const patch: any = { updatedAt: Date.now() };
        if (title !== undefined) patch.title = title;
        if (metaDescription !== undefined) patch.metaDescription = metaDescription;
        if (isPublished !== undefined) patch.isPublished = isPublished;
        if (showInMenu !== undefined) patch.showInMenu = showInMenu;
        if (blocks !== undefined) patch.blocks = blocks;
        if (slug !== undefined) {
            const cleanSlug = slug === "" ? "" : slug.toLowerCase().replace(/[^a-z0-9-\/]/g, "").replace(/\/{2,}/g, "/").replace(/-+/g, "-").replace(/^\/+|\/+$/g, "");
            const existing = await ctx.db.query("pages").withIndex("by_slug", (q: any) => q.eq("slug", cleanSlug)).first();
            if (existing && existing._id !== id) throw new Error(`Slug "${cleanSlug}" already in use.`);
            patch.slug = cleanSlug;
        }
        await ctx.db.patch(id, patch);
    },
});

// ── Delete page ───────────────────────────────────────────────────────────────
export const remove = mutation({
    args: { devToken: v.string(), id: v.id("pages") },
    handler: async (ctx, { devToken, id }) => {
        const user = await resolveUser(ctx, devToken);
        if (!user || user.role !== "super_admin") throw new Error("Unauthorized");
        const existing = await ctx.db.get(id);
        if (existing) {
            await ctx.db.delete(id);
        }
    },
});

// ── Toggle publish state ──────────────────────────────────────────────────────
export const togglePublish = mutation({
    args: { devToken: v.string(), id: v.id("pages") },
    handler: async (ctx, { devToken, id }) => {
        const user = await resolveUser(ctx, devToken);
        if (!user || user.role !== "super_admin") throw new Error("Unauthorized");
        const page = await ctx.db.get(id);
        if (!page) throw new Error("Page not found");
        await ctx.db.patch(id, { isPublished: !page.isPublished, updatedAt: Date.now() });
    },
});

// ── Create default home page ──────────────────────────────────────────────────
export const createDefaultHome = mutation({
    args: { devToken: v.string() },
    handler: async (ctx, { devToken }) => {
        const user = await resolveUser(ctx, devToken);
        if (!user || user.role !== "super_admin") throw new Error("Unauthorized");

        const existing = await ctx.db.query("pages").withIndex("by_slug", (q: any) => q.eq("slug", "")).first();
        if (existing) return existing._id;

        const now = Date.now();
        const defaultBlocks = [
            {
                id: `hero-${now}`,
                type: "hero",
                data: {
                    heading: "Build Fast, Ship Confidently",
                    subheading: "The all-in-one platform for visual bug reporting and project management. Designed for modern developers who love beautiful interfaces.",
                    ctaText: "Get Started Free",
                    ctaUrl: "/",
                    badge: "Trusted by 10,000+ Developers"
                }
            },
            {
                id: `marquee-${now}`,
                type: "marquee_ticker",
                data: {
                    row1: "Capture Bugs Instantly, Screenshot & Annotate, Drag & Drop Kanban, Priority Tracking, Team Collaboration, One-Click Reports, Chrome Extension",
                    row2: "Visual Bug Reports, Designed for Developers, Beautiful Interfaces, Zero Config Setup, Responsive Components, Secure by Default"
                }
            },
            {
                id: `cta-${now}`,
                type: "cta",
                data: {
                    heading: "Ready to accelerate your workflow?",
                    subtext: "Join the thousands of teams already using BugScribe to ship better software faster.",
                    primaryBtnText: "Start My Trial",
                    primaryBtnUrl: "/",
                    secondaryBtnText: "Watch Demo",
                    secondaryBtnUrl: "/"
                }
            },
            {
                id: `login-${now}`,
                type: "login",
                data: {
                    heading: "Already have an account?",
                    subheading: "Sign in to your dashboard to manage your projects and track bugs.",
                    btnText: "Sign In to Dashboard"
                }
            }
        ];

        return await ctx.db.insert("pages", {
            title: "Home", 
            slug: "", 
            metaDescription: "Welcome to BugScribe - The modern platform for visual bug tracking and project management.", 
            isPublished: false, 
            showInMenu: false, 
            blocks: defaultBlocks,
            createdBy: user.tokenIdentifier, 
            createdAt: now, 
            updatedAt: now,
        });
    }
});
