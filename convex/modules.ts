import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { getEffectiveIdentity } from "./users";

// ── Super Admin Checks ──────────────────────────────────────────────────────

async function isSuperAdmin(ctx: QueryCtx, devToken?: string) {
    const identity = await getEffectiveIdentity(ctx, devToken);
    if (!identity) return false;

    const user = await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.subject))
        .unique();

    return user?.role === "super_admin";
}

// ── Modules Management ──────────────────────────────────────────────────────

export const listModules = query({
    args: { devToken: v.optional(v.string()) },
    handler: async (ctx, _args) => {
        // Anyone logged in can see the modules, they just define the tabs
        return await ctx.db
            .query("dashboardModules")
            .withIndex("by_order")
            .collect();
    },
});

export const addModule = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        icon: v.string(),
        order: v.number(),
        description: v.optional(v.string()),
        isWiki: v.optional(v.boolean()),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!await isSuperAdmin(ctx, args.devToken)) {
            throw new Error("Unauthorized: Super Admin only");
        }

        const { devToken, ...data } = args;
        return await ctx.db.insert("dashboardModules", {
            ...data,
            createdAt: Date.now(),
        });
    },
});

export const updateModule = mutation({
    args: {
        moduleId: v.id("dashboardModules"),
        name: v.optional(v.string()),
        icon: v.optional(v.string()),
        order: v.optional(v.number()),
        description: v.optional(v.string()),
        isWiki: v.optional(v.boolean()),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!await isSuperAdmin(ctx, args.devToken)) {
            throw new Error("Unauthorized: Super Admin only");
        }

        const { moduleId, devToken, ...updates } = args;
        await ctx.db.patch(moduleId, updates);
    },
});

export const deleteModule = mutation({
    args: {
        moduleId: v.id("dashboardModules"),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!await isSuperAdmin(ctx, args.devToken)) {
            throw new Error("Unauthorized: Super Admin only");
        }

        // Also delete entries? The requirements didn't specify, but it's safer.
        const entries = await ctx.db
            .query("moduleEntries")
            .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
            .collect();
        
        for (const entry of entries) {
            await ctx.db.delete(entry._id);
        }

        await ctx.db.delete(args.moduleId);
    },
});

// ── Module Entries Management ──────────────────────────────────────────────

export const listEntries = query({
    args: {
        moduleId: v.id("dashboardModules"),
        projectId: v.id("projects"),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // We could check project access here if needed
        return await ctx.db
            .query("moduleEntries")
            .withIndex("by_project_module", (q) => 
                q.eq("projectId", args.projectId).eq("moduleId", args.moduleId)
            )
            .collect();
    },
});

export const getEntry = query({
    args: {
        entryId: v.id("moduleEntries"),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.entryId);
    },
});

export const addEntry = mutation({
    args: {
        moduleId: v.id("dashboardModules"),
        projectId: v.id("projects"),
        title: v.string(),
        content: v.string(),
        status: v.optional(v.string()),
        metadata: v.optional(v.any()),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) throw new Error("Unauthenticated");

        const { devToken, ...data } = args;
        return await ctx.db.insert("moduleEntries", {
            ...data,
            authorId: identity.subject,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const updateEntry = mutation({
    args: {
        entryId: v.id("moduleEntries"),
        title: v.optional(v.string()),
        content: v.optional(v.string()),
        status: v.optional(v.string()),
        metadata: v.optional(v.any()),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) throw new Error("Unauthenticated");

        const { entryId, devToken, ...updates } = args;
        await ctx.db.patch(entryId, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

export const deleteEntry = mutation({
    args: {
        entryId: v.id("moduleEntries"),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) throw new Error("Unauthenticated");

        await ctx.db.delete(args.entryId);
    },
});
