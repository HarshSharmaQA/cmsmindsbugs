import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
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

/** Security audit stats — real data from DB */
export const getSecurityStats = query({
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
        if (!isSuperAdmin) return null;

        const now = Date.now();
        const users = await ctx.db.query("users").collect();
        const projects = await ctx.db.query("projects").collect();

        // Active sessions: users with a valid, non-expired session token
        const activeSessions = users.filter(
            (u) => u.sessionToken && u.sessionTokenExpiry && u.sessionTokenExpiry > now
        ).length;

        // Unique IPs from recent activities (last 50 activity records)
        const recentActivities = await ctx.db
            .query("activities")
            .order("desc")
            .take(50);

        // Recent security events: pull from activities table (login, status changes, etc.)
        const securityEvents = recentActivities.map((a) => ({
            id: a._id,
            event: a.type === "created" ? "Bug Created" :
                   a.type === "status_changed" ? "Status Changed" :
                   a.type === "priority_changed" ? "Priority Changed" :
                   a.type === "assignee_changed" ? "Assignee Changed" :
                   a.type === "comment_added" ? "Comment Added" :
                   a.type === "tags_changed" ? "Tags Changed" :
                   a.type === "asset_added" ? "Asset Attached" :
                   a.type,
            user: a.actorEmail || a.actorName || "System",
            detail: a.detail || "",
            time: a.createdAt,
        }));

        return {
            activeSessions,
            totalApiKeys: projects.length,
            totalUsers: users.length,
            recentEvents: securityEvents,
        };
    },
});

/** Analytics stats — real data from DB */
export const getAnalyticsStats = query({
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
        if (!isSuperAdmin) return null;

        const bugs = await ctx.db.query("bugs").collect();
        const projects = await ctx.db.query("projects").collect();
        const users = await ctx.db.query("users").collect();
        const activities = await ctx.db.query("activities").collect();

        // Average resolution time for resolved/closed bugs (in hours)
        const resolvedBugs = bugs.filter((b) => b.status === "resolved" || b.status === "closed");
        let avgResolutionHours = 0;
        if (resolvedBugs.length > 0) {
            const totalMs = resolvedBugs.reduce((sum, b) => sum + (b.updatedAt - b.createdAt), 0);
            avgResolutionHours = totalMs / resolvedBugs.length / 3_600_000;
        }

        // Bugs by priority
        const byPriority = {
            critical: bugs.filter((b) => b.priority === "critical").length,
            high: bugs.filter((b) => b.priority === "high").length,
            medium: bugs.filter((b) => b.priority === "medium").length,
            low: bugs.filter((b) => b.priority === "low").length,
        };

        // Bugs by status
        const byStatus = {
            open: bugs.filter((b) => b.status === "open").length,
            in_progress: bugs.filter((b) => b.status === "in_progress").length,
            resolved: bugs.filter((b) => b.status === "resolved").length,
            closed: bugs.filter((b) => b.status === "closed").length,
        };

        // Last 7 days bug creation trend
        const sevenDaysAgo = Date.now() - 7 * 24 * 3_600_000;
        const recentBugs = bugs.filter((b) => b.createdAt >= sevenDaysAgo).length;

        return {
            totalBugs: bugs.length,
            totalProjects: projects.length,
            totalUsers: users.length,
            totalActivities: activities.length,
            avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
            byPriority,
            byStatus,
            recentBugs,
        };
    },
});

/**
 * Super Admin tool: Deactivate/Reactivate a user account.
 * This mutation is now located in admin.ts for improved visibility.
 */
export const toggleUserDeactivation = mutation({
    args: {
        email: v.string(),
        deactivate: v.boolean(),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) throw new Error("Unauthenticated");

        const requester = await ctx.db
            .query("users")
            .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!requester || requester.role !== "super_admin") {
            throw new Error("Unauthorized: Only super admins can deactivate users");
        }

        const targetUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (!targetUser) throw new Error("User not found");
        if (targetUser.role === "super_admin" && args.deactivate) {
            throw new Error("Cannot deactivate a Super Admin");
        }

        await ctx.db.patch(targetUser._id, { isDeactivated: args.deactivate });
    },
});
