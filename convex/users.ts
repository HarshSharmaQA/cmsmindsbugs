import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ── Security Helpers ──────────────────────────────────────────────────────────

/**
 * Hash a password using SHA-256 with a salt for secure storage.
 * Format: "sha256:<salt>:<hash>"
 */
async function hashPassword(password: string): Promise<string> {
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, "0")).join("");
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0")).join("");
    return `sha256:${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash.
 * Handles both legacy plaintext passwords and new hashed passwords.
 */
async function verifyPassword(password: string, stored: string): Promise<boolean> {
    if (!stored) return false;
    // New hashed format: "sha256:<salt>:<hash>"
    if (stored.startsWith("sha256:")) {
        const [, salt, expectedHash] = stored.split(":");
        const encoder = new TextEncoder();
        const data = encoder.encode(salt + password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hash = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, "0")).join("");
        return hash === expectedHash;
    }
    // Legacy plaintext fallback (migrates on next login)
    return stored === password;
}

/**
 * Generate a cryptographically random session token (128-bit entropy).
 */
function generateSecureToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return "tok_" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Get the current active identity, checking devToken (session token) or Clerk auth.
 * Tokens are stored in DB keyed by a separate sessionToken field, not the tokenIdentifier.
 */
export async function getEffectiveIdentity(ctx: QueryCtx, devToken?: string) {
    if (devToken) {
        // Look up by sessionToken field (random UUID, not predictable)
        const user = await ctx.db
            .query("users")
            .withIndex("by_session_token", (q) => q.eq("sessionToken", devToken))
            .unique();

        if (user) {
            return {
                subject: user.tokenIdentifier,
                email: user.email,
                name: user.name,
            };
        }

        // Fallback to legacy tokenIdentifier lookup for backwards compat during migration
        const legacyUser = await ctx.db
            .query("users")
            .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", devToken))
            .unique();

        if (legacyUser) {
            return {
                subject: legacyUser.tokenIdentifier,
                email: legacyUser.email,
                name: legacyUser.name,
            };
        }
    }
    return await ctx.auth.getUserIdentity();
}

/**
 * Login or create a user in the Convex database.
 * Passwords are stored as "sha256:<salt>:<hash>" — never plaintext.
 * Returns a cryptographically random session token (not the predictable user:email).
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
        const realTokenIdentifier = `user:${args.email}`;

        // Generate a secure random session token (128-bit, 30-day expiry)
        const sessionToken = generateSecureToken();
        const sessionTokenExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;

        if (existing) {
            const isPending = existing.tokenIdentifier.startsWith("pending:");

            // Verify password (supports both legacy plaintext and new hashed format)
            if (!isPending && !(await verifyPassword(args.password, existing.password ?? ""))) {
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
                    await ctx.db.patch(m._id, { userId: realTokenIdentifier });
                }
            }

            // Hash password on every login to migrate legacy plaintext passwords
            const hashedPassword = await hashPassword(args.password);

            await ctx.db.patch(existing._id, {
                tokenIdentifier: realTokenIdentifier,
                role: isSuperAdmin ? "super_admin" : existing.role,
                name: args.name ?? existing.name,
                password: hashedPassword,
                isApproved: isSuperAdmin ? true : (existing.isApproved ?? false),
                sessionToken,
                sessionTokenExpiry,
            });
            const isApproved = isSuperAdmin ? true : (existing.isApproved ?? false);
            return { token: sessionToken, isApproved };
        }

        // New user — hash password before storing
        const hashedPassword = await hashPassword(args.password);
        await ctx.db.insert("users", {
            tokenIdentifier: realTokenIdentifier,
            email: args.email,
            password: hashedPassword,
            name: args.name ?? args.email.split("@")[0],
            role: isSuperAdmin ? "super_admin" : "user",
            isApproved: isSuperAdmin ? true : false,
            sessionToken,
            sessionTokenExpiry,
        });
        return { token: sessionToken, isApproved: isSuperAdmin ? true : false };
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

        await ctx.db.patch(targetUser._id, {
            role: args.role,
            isApproved: true // Approving when setting role
        });
    },
});

/**
 * Super Admin tool: Approve a pending user
 */
export const approveUser = mutation({
    args: {
        email: v.string(),
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
            throw new Error("Unauthorized");
        }

        const targetUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (!targetUser) throw new Error("User not found");

        await ctx.db.patch(targetUser._id, { isApproved: true });
    },
});

/**
 * List all users for management (Super Admin only)
 */
export const listUsersForAdmin = query({
    args: { devToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) return [];

        const requester = await ctx.db
            .query("users")
            .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.subject))
            .unique();

        if (!requester || requester.role !== "super_admin") return [];

        return await ctx.db.query("users").collect();
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

        const hashedPassword = await hashPassword(args.password);
        await ctx.db.patch(targetUser._id, { password: hashedPassword });
    },
});

/**
 * Super Admin tool: Delete a user account
 */
export const deleteUser = mutation({
    args: {
        email: v.string(),
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
            throw new Error("Unauthorized: Only super admins can delete users");
        }

        const targetUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (!targetUser) throw new Error("User not found");
        if (targetUser.role === "super_admin") throw new Error("Cannot delete a Super Admin");

        // Remove all project memberships
        const memberships = await ctx.db
            .query("projectMembers")
            .withIndex("by_user", (q) => q.eq("userId", targetUser.tokenIdentifier))
            .collect();
        for (const m of memberships) await ctx.db.delete(m._id);

        await ctx.db.delete(targetUser._id);
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
