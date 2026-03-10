import { v } from "convex/values";
import { query } from "./_generated/server";
import { getEffectiveIdentity } from "./users";

export const getStats = query({
    args: { devToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        const hardcodedAdmins = ["harshsharmaqa@gmail.com"];
        const isSuperAdmin = user?.role === "super_admin" || hardcodedAdmins.includes(identity.email ?? "");

        if (!isSuperAdmin) {
            return null;
        }

        const projects = await ctx.db.query("projects").collect();
        const users = await ctx.db.query("users").collect();
        const bugs = await ctx.db.query("bugs").collect();

        return {
            totalProjects: projects.length,
            totalUsers: users.length,
            totalBugs: bugs.length,
            recentUsers: users.slice(-5).reverse(),
            recentProjects: projects.slice(-5).reverse(),
        };
    },
});
