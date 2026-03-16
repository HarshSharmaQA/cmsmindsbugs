import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getEffectiveIdentity } from "./users";

const DEFAULT_STATUSES = [
    { value: "open", label: "New Issues", color: "text-blue-400", order: 0 },
    { value: "in_progress", label: "In Progress", color: "text-amber-400", order: 1 },
    { value: "resolved", label: "Resolved", color: "text-green-400", order: 2 },
    { value: "closed", label: "Closed", color: "text-slate-500", order: 3 },
];

/** List all statuses for a project */
export const getProjectStatuses = query({
    args: { projectId: v.id("projects"), devToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const statuses = await ctx.db
            .query("projectStatuses")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .order("asc")
            .collect();

        if (statuses.length === 0) {
            return DEFAULT_STATUSES;
        }

        return statuses.sort((a, b) => a.order - b.order);
    },
});

/** Add a new status to a project */
export const addStatus = mutation({
    args: {
        projectId: v.id("projects"),
        label: v.string(),
        color: v.string(),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = user?.role === "super_admin" || superAdminEmails.includes(identity.email ?? "");

        // Only project admins/owners or super admins can add statuses
        const membership = await ctx.db
            .query("projectMembers")
            .withIndex("by_project_user", (q) => q.eq("projectId", args.projectId).eq("userId", identity.subject))
            .unique();

        const canAdd = isSuperAdmin || (membership && (membership.role === "admin" || membership.role === "owner"));
        if (!canAdd) throw new Error("Unauthorized to add statuses");

        // If it's the first custom status, we might want to seed the defaults first
        // But for simplicity, we'll just add it. If defaults are needed, they will be handled by getProjectStatuses fallback or explicit seed.
        
        // Let's check if we need to seed defaults first to avoid losing them
        const existingStatuses = await ctx.db
            .query("projectStatuses")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();
        
        if (existingStatuses.length === 0) {
            for (const s of DEFAULT_STATUSES) {
                await ctx.db.insert("projectStatuses", {
                    projectId: args.projectId,
                    ...s,
                });
            }
        }

        const value = args.label.toLowerCase().replace(/\s+/g, "_");
        const nextOrder = (await ctx.db
            .query("projectStatuses")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect()).length;

        return await ctx.db.insert("projectStatuses", {
            projectId: args.projectId,
            label: args.label,
            value,
            color: args.color,
            order: nextOrder,
        });
    },
});

/** Remove a status from a project (Super Admin only as requested) */
export const removeStatus = mutation({
    args: {
        statusId: v.id("projectStatuses"),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = user?.role === "super_admin" || superAdminEmails.includes(identity.email ?? "");

        if (!isSuperAdmin) {
            throw new Error("Only Super Admins can remove statuses");
        }

        const status = await ctx.db.get(args.statusId);
        if (!status) throw new Error("Status not found");

        // Before removing, we should update all bugs with this status to 'open' or another default?
        // Let's find bugs with this status
        const affectedBugs = await ctx.db
            .query("bugs")
            .withIndex("by_project_status", (q) => q.eq("projectId", status.projectId).eq("status", status.value))
            .collect();
        
        for (const bug of affectedBugs) {
            await ctx.db.patch(bug._id, { status: "open" });
        }

        await ctx.db.delete(args.statusId);
    },
});
