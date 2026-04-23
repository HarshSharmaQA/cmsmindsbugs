import { query } from "./_generated/server";
import { v } from "convex/values";

export const getFirstProject = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("projects").first();
    },
});

/**
 * Fetch all projects for a user based on their session token.
 */
export const listProjectsForExtension = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_session_token", (q) => q.eq("sessionToken", args.sessionToken))
            .unique();

        if (!user) return [];

        const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = adminEmails.includes(user.email ?? "");

        if (isSuperAdmin) {
            return ctx.db.query("projects").order("desc").collect();
        }

        const memberships = await ctx.db
            .query("projectMembers")
            .withIndex("by_user", (q) => q.eq("userId", user.tokenIdentifier))
            .collect();

        const projectIds = memberships.map((m) => m.projectId);

        // Also fetch legacy owned projects
        const legacyProjects = await ctx.db
            .query("projects")
            .withIndex("by_user_id", (q) => q.eq("userId", user.tokenIdentifier))
            .collect();

        const allProjectsMap = new Map();
        [...legacyProjects].forEach(p => allProjectsMap.set(p._id, p));

        for (const pid of projectIds) {
            const p = await ctx.db.get(pid);
            if (p) allProjectsMap.set(p._id, p);
        }

        return Array.from(allProjectsMap.values()).sort((a, b) => b.createdAt - a.createdAt);
    },
});
