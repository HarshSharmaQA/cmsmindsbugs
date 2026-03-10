import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getEffectiveIdentity } from "./users";

// Default permissions if not found
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
    owner: ["view_api", "view_settings", "manage_users", "delete_bugs", "update_bugs", "view_bugs"],
    admin: ["view_settings", "manage_users", "delete_bugs", "update_bugs", "view_bugs"],
    editor: ["update_bugs", "view_bugs"],
    viewer: ["view_bugs"],
};

export const getGlobal = query({
    args: { devToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        // Fetch all current permissions
        const savedPermissions = await ctx.db.query("rolePermissions").collect();
        const rolePermissionsMap: Record<string, string[]> = {};

        savedPermissions.forEach(p => {
            rolePermissionsMap[p.role] = p.permissions;
        });

        // Merge defaults in memory if the role isn't present in DB yet
        const finalPermissions = { ...DEFAULT_ROLE_PERMISSIONS, ...rolePermissionsMap };
        return finalPermissions;
    },
});

export const setGlobal = mutation({
    args: {
        role: v.string(),
        permissions: v.array(v.string()),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        const hardcodedAdmins = ["harshsharmaqa@gmail.com"];
        const isSuperAdmin = user?.role === "super_admin" || hardcodedAdmins.includes(identity.email ?? "");

        if (!isSuperAdmin) {
            throw new Error("Unauthorized: Super Admin access required to change permissions.");
        }

        // Check if role exists in our rolePermissions
        const existing = await ctx.db
            .query("rolePermissions")
            .withIndex("by_role", q => q.eq("role", args.role))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { permissions: args.permissions });
        } else {
            await ctx.db.insert("rolePermissions", { role: args.role, permissions: args.permissions });
        }
    }
});

export const getMyPermissions = query({
    args: {
        projectId: v.id("projects"),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) return [];

        // Check super admin bypass
        const user = await ctx.db
            .query("users")
            .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        const hardcodedAdmins = ["harshsharmaqa@gmail.com"];
        const isSuperAdmin = user?.role === "super_admin" || hardcodedAdmins.includes(identity.email ?? "");

        if (isSuperAdmin) {
            return ["view_api", "view_settings", "manage_users", "delete_bugs", "update_bugs", "view_bugs"];
        }

        const projectMember = await ctx.db
            .query("projectMembers")
            .withIndex("by_project_user", (q) =>
                q.eq("projectId", args.projectId).eq("userId", identity.subject)
            )
            .unique();

        if (!projectMember) return []; // No access if not a member

        const role = projectMember.role; // "owner", "admin", "editor", "viewer"

        const roleData = await ctx.db
            .query("rolePermissions")
            .withIndex("by_role", q => q.eq("role", role))
            .unique();

        if (roleData) {
            return roleData.permissions;
        }

        // Fallback to defaults
        return DEFAULT_ROLE_PERMISSIONS[role] || [];
    }
});
