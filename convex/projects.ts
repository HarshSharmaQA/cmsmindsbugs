/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getEffectiveIdentity } from "./users";

// ── Queries ───────────────────────────────────────────────────────────────────

/** List all projects for the logged-in user (dashboard home) */
export const listProjects = query({
    args: { devToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) return [];

        const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = adminEmails.includes(identity.email ?? "");

        if (isSuperAdmin) {
            return ctx.db.query("projects").order("desc").collect();
        }

        const memberships = await ctx.db
            .query("projectMembers")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .collect();

        const projectIds = memberships.map((m) => m.projectId);

        // Also fetch legacy owned projects
        const legacyProjects = await ctx.db
            .query("projects")
            .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
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

/** Get a single project by ID, verifying ownership */
export const getProject = query({
    args: { projectId: v.id("projects"), devToken: v.optional(v.string()) },
    handler: async (ctx, { projectId, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) return null;

        const project = await ctx.db.get(projectId);
        if (!project) return null;

        const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = adminEmails.includes(identity.email ?? "");
        if (isSuperAdmin) return project;

        // Check membership
        const membership = await ctx.db
            .query("projectMembers")
            .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", identity.subject))
            .unique();

        if (!membership && project.userId !== identity.subject) return null;

        return project;
    },
});

/** Find project by API key (used by the widget to authenticate) */
export const getProjectByApiKey = query({
    args: { apiKey: v.string(), projectId: v.optional(v.string()) },
    handler: async (ctx, { apiKey }) => {
        return ctx.db
            .query("projects")
            .withIndex("by_api_key", (q) => q.eq("apiKey", apiKey))
            .unique();
    },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Create a new project with a generated API key, tied to the user */
export const createProject = mutation({
    args: {
        name: v.string(),
        domain: v.optional(v.string()),
        description: v.optional(v.string()),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) {
            throw new Error("Unauthenticated");
        }

        // Generate a cryptographically random API key (128-bit entropy)
        const apiKey = crypto.randomUUID().replace(/-/g, "");

        const projectId = await ctx.db.insert("projects", {
            userId: identity.subject,
            name: args.name,
            domain: args.domain,
            description: args.description,
            apiKey,
            createdAt: Date.now(),
        });

        // Add creator as owner in membership table
        await ctx.db.insert("projectMembers", {
            projectId,
            userId: identity.subject,
            role: "owner",
            createdAt: Date.now(),
        });

        return { projectId, apiKey };
    },
});

/** Invite a new member to the project */
export const inviteMember = mutation({
    args: {
        projectId: v.id("projects"),
        email: v.string(),
        role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) throw new Error("Unauthenticated");

        const project = await ctx.db.get(args.projectId);
        if (!project) throw new Error("Project not found");

        const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = adminEmails.includes(identity.email ?? "");

        // Only owners or admins can invite (or super admin)
        const currentMembership = await ctx.db
            .query("projectMembers")
            .withIndex("by_project_user", (q) => q.eq("projectId", args.projectId).eq("userId", identity.subject))
            .unique();

        const canInvite = isSuperAdmin ||
            (currentMembership && (currentMembership.role === "owner" || currentMembership.role === "admin")) ||
            (project.userId === identity.subject);

        if (!canInvite) throw new Error("Unauthorized to invite members");

        // Find user by email — or create a pending placeholder so they can be invited
        let targetUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (!targetUser) {
            // Create a pending user record keyed by email
            // When this user logs in for the first time, the upsertUser mutation
            // will merge their auth token with this existing record.
            const pendingTokenId = `pending:${args.email}`;
            const userId = await ctx.db.insert("users", {
                tokenIdentifier: pendingTokenId,
                email: args.email,
                name: args.email.split("@")[0], // Placeholder name
                role: "user",
                isApproved: false,
            });
            targetUser = await ctx.db.get(userId);
        }

        if (!targetUser) throw new Error("Failed to create pending user record.");

        // Check if already a member
        const existingMember = await ctx.db
            .query("projectMembers")
            .withIndex("by_project_user", (q) => q.eq("projectId", args.projectId).eq("userId", targetUser!.tokenIdentifier))
            .unique();

        if (existingMember) {
            await ctx.db.patch(existingMember._id, { role: args.role });
            return { memberId: existingMember._id, updated: true };
        }

        const memberId = await ctx.db.insert("projectMembers", {
            projectId: args.projectId,
            userId: targetUser.tokenIdentifier,
            role: args.role,
            invitedBy: identity.subject,
            createdAt: Date.now(),
        });

        return { memberId, updated: false };
    },
});

/** List project members */
export const listMembers = query({
    args: { projectId: v.id("projects"), devToken: v.optional(v.string()) },
    handler: async (ctx, { projectId, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) return [];

        const members = await ctx.db
            .query("projectMembers")
            .withIndex("by_project", (q) => q.eq("projectId", projectId))
            .collect();

        // Resolve names/emails from users table
        return Promise.all(
            members.map(async (member) => {
                const user = await ctx.db
                    .query("users")
                    .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", member.userId))
                    .unique();
                return {
                    ...member,
                    email: user?.email,
                    name: user?.name,
                };
            })
        );
    },
});

/** Remove a member from the project */
export const removeMember = mutation({
    args: { membershipId: v.id("projectMembers"), devToken: v.optional(v.string()) },
    handler: async (ctx, { membershipId, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) throw new Error("Unauthenticated");

        const membership = await ctx.db.get(membershipId);
        if (!membership) throw new Error("Membership not found");

        const project = await ctx.db.get(membership.projectId);
        if (!project) throw new Error("Project not found");

        const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = adminEmails.includes(identity.email ?? "");

        const myMembership = await ctx.db
            .query("projectMembers")
            .withIndex("by_project_user", (q) => q.eq("projectId", membership.projectId).eq("userId", identity.subject))
            .unique();

        const canRemove = isSuperAdmin ||
            (myMembership && (myMembership.role === "owner" || myMembership.role === "admin")) ||
            (project.userId === identity.subject);

        if (!canRemove) throw new Error("Unauthorized to remove members");
        if (membership.role === "owner" && !isSuperAdmin) throw new Error("Cannot remove owner");

        await ctx.db.delete(membershipId);
    },
});

/** Update project details (name, domain, description) */
export const updateProject = mutation({
    args: {
        projectId: v.id("projects"),
        name: v.optional(v.string()),
        domain: v.optional(v.string()),
        description: v.optional(v.string()),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) throw new Error("Unauthenticated");

        const project = await ctx.db.get(args.projectId);
        if (!project) throw new Error("Project not found");

        const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = adminEmails.includes(identity.email ?? "");

        const myMembership = await ctx.db
            .query("projectMembers")
            .withIndex("by_project_user", (q) => q.eq("projectId", args.projectId).eq("userId", identity.subject))
            .unique();

        const canEdit = isSuperAdmin ||
            (myMembership && (myMembership.role === "owner" || myMembership.role === "admin")) ||
            (project.userId === identity.subject);

        if (!canEdit) throw new Error("Unauthorized to update project");

        const patch: any = {};
        if (args.name !== undefined) patch.name = args.name;
        if (args.domain !== undefined) patch.domain = args.domain;
        if (args.description !== undefined) patch.description = args.description;

        await ctx.db.patch(args.projectId, patch);
    },
});

/** Delete a project and all its bugs/comments, verifying ownership */
export const deleteProject = mutation({
    args: { projectId: v.id("projects"), devToken: v.optional(v.string()) },
    handler: async (ctx, { projectId, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) throw new Error("Unauthenticated");

        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");

        const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = adminEmails.includes(identity.email ?? "");

        const myMembership = await ctx.db
            .query("projectMembers")
            .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", identity.subject))
            .unique();

        const isOwner = isSuperAdmin ||
            (myMembership && myMembership.role === "owner") ||
            (project.userId === identity.subject);

        if (!project || !isOwner) {
            throw new Error("Unauthorized or not found");
        }

        // Delete all memberships
        const memberships = await ctx.db
            .query("projectMembers")
            .withIndex("by_project", (q) => q.eq("projectId", projectId))
            .collect();
        for (const m of memberships) await ctx.db.delete(m._id);

        // Delete all bugs and their comments
        const bugs = await ctx.db
            .query("bugs")
            .withIndex("by_project", (q) => q.eq("projectId", projectId))
            .collect();

        for (const bug of bugs) {
            const comments = await ctx.db
                .query("comments")
                .withIndex("by_bug", (q) => q.eq("bugId", bug._id))
                .collect();

            for (const comment of comments) {
                await ctx.db.delete(comment._id);
            }
            await ctx.db.delete(bug._id);
        }

        await ctx.db.delete(projectId);
    },
});

/** Delete a specific bucket (status) from a project */
export const deleteBucket = mutation({
    args: { 
        projectId: v.id("projects"), 
        status: v.string(),
        devToken: v.optional(v.string()) 
    },
    handler: async (ctx, { projectId, status, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) throw new Error("Unauthenticated");

        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");

        const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = adminEmails.includes(identity.email ?? "");

        const myMembership = await ctx.db
            .query("projectMembers")
            .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", identity.subject))
            .unique();

        const canDeleteBucket = isSuperAdmin ||
            (myMembership && (myMembership.role === "owner" || myMembership.role === "admin")) ||
            (project.userId === identity.subject);

        if (!canDeleteBucket) throw new Error("Unauthorized to delete buckets");

        // 1. Move all bugs in this bucket to "backlog" or "open"
        const bugsInBucket = await ctx.db
            .query("bugs")
            .withIndex("by_project_status", (q) => q.eq("projectId", projectId).eq("status", status))
            .collect();

        for (const bug of bugsInBucket) {
            await ctx.db.patch(bug._id, { status: "open" });
        }

        // 2. Remove from projectStatuses if it exists
        const projectStatus = await ctx.db
            .query("projectStatuses")
            .withIndex("by_project", (q) => q.eq("projectId", projectId))
            .filter((q) => q.eq(q.field("value"), status))
            .unique();

        if (projectStatus) {
            await ctx.db.delete(projectStatus._id);
        }

        return { movedCount: bugsInBucket.length };
    },
});
