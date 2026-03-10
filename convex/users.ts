import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Get the current active identity, checking devToken or Clerk auth
 */
export async function getEffectiveIdentity(ctx: QueryCtx, devToken?: string) {
    if (devToken) {
        const user = await ctx.db
            .query("users")
            .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", devToken))
            .unique();

        if (user) {
            return {
                subject: user.tokenIdentifier,
                email: user.email,
                name: user.name,
            };
        }
    }
    return await ctx.auth.getUserIdentity();
}

/**
 * Login or create a user in the Convex database.
 */
export const loginUser = mutation({
    args: { email: v.string(), name: v.optional(v.string()), password: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com")
            .split(",")
            .map((e) => e.trim());

        const isSuperAdmin = superAdminEmails.includes(args.email);
        const realToken = `user:${args.email}`;

        if (existing) {
            // If this was a pending-invited user, they may have no password yet
            const isPending = existing.tokenIdentifier.startsWith("pending:");

            if (!isPending && existing.password !== args.password) {
                throw new Error("Invalid password");
            }

            // Migrate pending token → real token for all project memberships
            if (isPending) {
                const pendingToken = existing.tokenIdentifier;
                const memberships = await ctx.db
                    .query("projectMembers")
                    .withIndex("by_user", (q) => q.eq("userId", pendingToken))
                    .collect();
                for (const m of memberships) {
                    await ctx.db.patch(m._id, { userId: realToken });
                }
            }

            await ctx.db.patch(existing._id, {
                tokenIdentifier: realToken,
                role: isSuperAdmin ? "super_admin" : existing.role,
                name: args.name ?? existing.name,
                password: args.password,
            });
            return realToken;
        }

        await ctx.db.insert("users", {
            tokenIdentifier: realToken,
            email: args.email,
            password: args.password,
            name: args.name ?? args.email.split("@")[0],
            role: isSuperAdmin ? "super_admin" : "user",
        });
        return realToken;
    },
});

/**
 * Check if an email already has an account (to show name field only for new users)
 */
export const checkEmailExists = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        if (!args.email) return null;
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email.trim().toLowerCase()))
            .unique();
        return !!user;
    },
});

/**
 * Get current user info based on identity
 */
export const currentUser = query({
    args: { devToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) return null;

        return await ctx.db
            .query("users")
            .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.subject))
            .unique();
    },
});

/**
 * Super Admin tool: Give role to a user by email
 */
export const setUserRole = mutation({
    args: {
        email: v.string(),
        role: v.union(v.literal("super_admin"), v.literal("user")),
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
            throw new Error("Unauthorized: Only super admins can manage roles");
        }

        const targetUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (!targetUser) {
            throw new Error("User not found");
        }

        await ctx.db.patch(targetUser._id, { role: args.role });
    },
});

/**
 * Super Admin tool: Set a password for a user by email
 */
export const setUserPassword = mutation({
    args: {
        email: v.string(),
        password: v.string(),
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
            throw new Error("Unauthorized: Only super admins can manage passwords");
        }

        const targetUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (!targetUser) {
            throw new Error("User not found");
        }

        await ctx.db.patch(targetUser._id, { password: args.password });
    },
});

/**
 * Helper to check access (supporting dev tokens)
 */
export async function checkProjectAccess(ctx: QueryCtx, projectId: Id<"projects">, minimumRole: "owner" | "admin" | "editor" | "viewer", devToken?: string) {
    const identity = await getEffectiveIdentity(ctx, devToken);
    if (!identity) return false;

    const user = await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.subject))
        .unique();

    const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
    const isSuperAdmin = superAdminEmails.includes(identity.email ?? "");

    if (user?.role === "super_admin" || isSuperAdmin) return true;

    const membership = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", identity.subject))
        .unique();

    if (!membership) {
        const project = await ctx.db.get(projectId);
        if (project?.userId === identity.subject) return true;
        return false;
    }

    const roleOrder = ["owner", "admin", "editor", "viewer"];
    const userRoleIndex = roleOrder.indexOf(membership.role);
    const minRoleIndex = roleOrder.indexOf(minimumRole);

    return userRoleIndex <= minRoleIndex;
}
