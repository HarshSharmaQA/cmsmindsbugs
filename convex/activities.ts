import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getEffectiveIdentity } from "./users";

/** Get activity log for a bug (newest first) */
export const getActivities = query({
    args: { bugId: v.id("bugs"), devToken: v.optional(v.string()) },
    handler: async (ctx, { bugId, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) return [];

        return ctx.db
            .query("activities")
            .withIndex("by_bug", (q) => q.eq("bugId", bugId))
            .order("desc")
            .collect();
    },
});

/** Internal: log an activity event (called from other mutations) */
export const logActivity = internalMutation({
    args: {
        bugId: v.id("bugs"),
        projectId: v.id("projects"),
        actorName: v.string(),
        actorEmail: v.optional(v.string()),
        type: v.string(),
        detail: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("activities", {
            bugId: args.bugId,
            projectId: args.projectId,
            actorName: args.actorName,
            actorEmail: args.actorEmail,
            type: args.type,
            detail: args.detail,
            createdAt: Date.now(),
        });
    },
});

/** Public mutation to log activity (comment added, etc.) */
export const addActivity = mutation({
    args: {
        bugId: v.id("bugs"),
        type: v.string(),
        detail: v.optional(v.string()),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, { bugId, type, detail, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) throw new Error("Unauthenticated");

        const bug = await ctx.db.get(bugId);
        if (!bug) throw new Error("Bug not found");

        // Resolve display name
        const user = await ctx.db
            .query("users")
            .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        const actorName = user?.name || user?.email || identity.email || "Team";

        await ctx.db.insert("activities", {
            bugId,
            projectId: bug.projectId,
            actorName,
            actorEmail: user?.email || identity.email,
            type,
            detail,
            createdAt: Date.now(),
        });
    },
});
