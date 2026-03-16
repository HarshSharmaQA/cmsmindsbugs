/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getEffectiveIdentity } from "./users";

// ── Queries ───────────────────────────────────────────────────────────────────

/** Get all bugs for a project (with screenshot URLs resolved) */
export const getBugs = query({
    args: { projectId: v.id("projects"), devToken: v.optional(v.string()) },
    handler: async (ctx, { projectId, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) return [];

        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");

        const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = adminEmails.includes(identity.email ?? "");

        const membership = await ctx.db
            .query("projectMembers")
            .withIndex("by_project_user", (q: any) => q.eq("projectId", projectId).eq("userId", identity.subject))
            .unique();

        if (!isSuperAdmin && !membership && project.userId !== identity.subject) {
            throw new Error("Unauthorized");
        }

        const bugs = await ctx.db
            .query("bugs")
            .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
            .order("desc")
            .collect();

        // Resolve Convex storage URLs for screenshots in parallel
        return Promise.all(
            bugs.map(async (bug: any) => ({
                ...bug,
                screenshotUrl: bug.screenshotStorageId
                    ? await ctx.storage.getUrl(bug.screenshotStorageId)
                    : null,
            }))
        );
    },
});

/** Get a single bug with comment count */
export const getBug = query({
    args: { bugId: v.id("bugs"), devToken: v.optional(v.string()) },
    handler: async (ctx, { bugId, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) return null;

        const bug = await ctx.db.get(bugId);
        if (!bug) return null;

        const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = adminEmails.includes(identity.email ?? "");

        const project = await ctx.db.get(bug.projectId);
        if (!project) return null;

        const membership = await ctx.db
            .query("projectMembers")
            .withIndex("by_project_user", (q) => q.eq("projectId", bug.projectId).eq("userId", identity.subject))
            .unique();

        if (!isSuperAdmin && !membership && project.userId !== identity.subject) {
            return null;
        }

        const screenshotUrl = bug.screenshotStorageId
            ? await ctx.storage.getUrl(bug.screenshotStorageId)
            : null;

        const comments = await ctx.db
            .query("comments")
            .withIndex("by_bug", (q: any) => q.eq("bugId", bugId))
            .order("asc")
            .collect();

        return { ...bug, screenshotUrl, comments };
    },
});

/** Stats: count bugs by status for a project */
export const getBugStats = query({
    args: { projectId: v.id("projects"), devToken: v.optional(v.string()) },
    handler: async (ctx, { projectId, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) return null;

        const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = adminEmails.includes(identity.email ?? "");

        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");

        const membership = await ctx.db
            .query("projectMembers")
            .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", identity.subject))
            .unique();

        if (!isSuperAdmin && !membership && project.userId !== identity.subject) {
            throw new Error("Unauthorized");
        }

        const bugs = await ctx.db
            .query("bugs")
            .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
            .collect();

        return {
            total: bugs.length,
            open: bugs.filter((b: any) => b.status === "open").length,
            in_progress: bugs.filter((b: any) => b.status === "in_progress").length,
            resolved: bugs.filter((b: any) => b.status === "resolved").length,
            closed: bugs.filter((b: any) => b.status === "closed").length,
            critical: bugs.filter((b: any) => b.priority === "critical").length,
        };
    },
});

/** Lightweight: just total + open count for project cards */
export const getBugCount = query({
    args: { projectId: v.id("projects"), devToken: v.optional(v.string()) },
    handler: async (ctx, { projectId, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) return { total: 0, open: 0, critical: 0 };

        const bugs = await ctx.db
            .query("bugs")
            .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
            .collect();

        return {
            total: bugs.length,
            open: bugs.filter((b: any) => b.status === "open").length,
            critical: bugs.filter((b: any) => b.priority === "critical").length,
        };
    },
});



// ── Mutations ─────────────────────────────────────────────────────────────────

/** Generate an upload URL for the screenshot (called before createBug) */
export const generateUploadUrl = mutation({
    args: {
        projectId: v.id("projects"),
        apiKey: v.string(),
    },
    handler: async (ctx, args) => {
        const project = await ctx.db.get(args.projectId);
        if (!project || project.apiKey !== args.apiKey) {
            throw new Error("Invalid project ID or API key");
        }
        return await ctx.storage.generateUploadUrl();
    },
});

/** Create a bug report (called by the widget after uploading screenshot) */
export const createBug = mutation({
    args: {
        projectId: v.id("projects"),
        apiKey: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        browser: v.string(),
        os: v.optional(v.string()),
        url: v.string(),
        screenWidth: v.optional(v.number()),
        screenHeight: v.optional(v.number()),
        scrollX: v.optional(v.number()),
        scrollY: v.optional(v.number()),
        consoleErrors: v.optional(v.array(v.string())),
        screenshotStorageId: v.optional(v.id("_storage")),
        mediaType: v.optional(v.string()),
        steps: v.optional(v.array(v.string())),
        environmentData: v.optional(v.any()),
        reporterName: v.optional(v.string()),
        reporterEmail: v.optional(v.string()),
        priority: v.optional(
            v.union(
                v.literal("low"),
                v.literal("medium"),
                v.literal("high"),
                v.literal("critical")
            )
        ),
        type: v.optional(v.string()),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const project = await ctx.db.get(args.projectId);
        if (!project || project.apiKey !== args.apiKey) {
            throw new Error("Invalid project ID or API key");
        }
        const now = Date.now();
        const bugId = await ctx.db.insert("bugs", {
            projectId: args.projectId,
            title: args.title,
            description: args.description,
            browser: args.browser,
            os: args.os,
            url: args.url,
            screenWidth: args.screenWidth,
            screenHeight: args.screenHeight,
            scrollX: args.scrollX,
            scrollY: args.scrollY,
            consoleErrors: args.consoleErrors ?? [],
            screenshotStorageId: args.screenshotStorageId,
            mediaType: args.mediaType,
            steps: args.steps ?? [],
            environmentData: args.environmentData,
            reporterName: args.reporterName,
            reporterEmail: args.reporterEmail,
            type: args.type ?? "general",
            category: args.category,
            status: "open",
            priority: args.priority ?? "medium",
            createdAt: now,
            updatedAt: now,
        });

        // Log creation activity
        const actorName = args.reporterName || args.reporterEmail || "Widget";
        await ctx.scheduler.runAfter(0, internal.activities.logActivity, {
            bugId,
            projectId: args.projectId,
            actorName,
            actorEmail: args.reporterEmail,
            type: "created",
            detail: `Created bug via widget`,
        });

        // Log asset addition if applicable
        if (args.screenshotStorageId) {
            await ctx.scheduler.runAfter(0, internal.activities.logActivity, {
                bugId,
                projectId: args.projectId,
                actorName,
                actorEmail: args.reporterEmail,
                type: "asset_added",
                detail: `${args.mediaType === "video" ? "Video" : "Screenshot"} attached`,
            });
        }

        if (project.userId) {
            const owner = await ctx.db
                .query("users")
                .withIndex("by_token_identifier", (q: any) => q.eq("tokenIdentifier", project.userId))
                .unique();

            const toEmail = owner?.email || (process.env.SUPER_ADMIN_EMAILS || "").split(",")[0].trim();

            await ctx.scheduler.runAfter(0, internal.emails.notifyBugCreated, {
                title: args.title,
                url: args.url,
                projectName: project.name,
                reporterEmail: args.reporterEmail,
                toEmail: toEmail,
            });
        }

        return bugId;
    },
});

/** Manual bug creation from dashboard */
export const dashboardManualCreateBug = mutation({
    args: {
        projectId: v.id("projects"),
        title: v.string(),
        description: v.optional(v.string()),
        priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
        type: v.optional(v.string()),
        category: v.optional(v.string()),
        devToken: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) throw new Error("Unauthenticated");

        const project = await ctx.db.get(args.projectId);
        if (!project) throw new Error("Project not found");

        const now = Date.now();
        const bugId = await ctx.db.insert("bugs", {
            projectId: args.projectId,
            title: args.title,
            description: args.description || "Manual bug report created from dashboard.",
            browser: "Manual",
            os: "Dashboard",
            url: "Dashboard",
            status: "open",
            priority: args.priority || "medium",
            type: args.type || "general",
            category: args.category,
            createdAt: now,
            updatedAt: now,
        });

        // Resolve actor for activity log
        const user = await ctx.db
            .query("users")
            .withIndex("by_token_identifier", (q: any) => q.eq("tokenIdentifier", identity.subject))
            .unique();
        const actorName = user?.name || user?.email || identity.email || "Team";

        await ctx.scheduler.runAfter(0, internal.activities.logActivity, {
            bugId,
            projectId: args.projectId,
            actorName,
            actorEmail: user?.email || identity.email,
            type: "created",
            detail: `Created bug manually from dashboard`,
        });

        return bugId;
    },
});

/** Update bug status (Kanban drag-drop) */
export const updateStatus = mutation({
    args: {
        bugId: v.id("bugs"),
        status: v.string(),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, { bugId, status, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) throw new Error("Unauthenticated");

        const bug = await ctx.db.get(bugId);
        if (!bug) throw new Error("Bug not found");

        const project = await ctx.db.get(bug.projectId);
        if (!project) throw new Error("Project not found");

        const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = adminEmails.includes(identity.email ?? "");

        const membership = await ctx.db
            .query("projectMembers")
            .withIndex("by_project_user", (q) => q.eq("projectId", bug.projectId).eq("userId", identity.subject))
            .unique();

        const canEdit = isSuperAdmin ||
            (membership && (membership.role === "owner" || membership.role === "admin" || membership.role === "editor")) ||
            (project.userId === identity.subject);

        if (!canEdit) throw new Error("Unauthorized");

        const oldStatus = bug.status;
        await ctx.db.patch(bugId, { status, updatedAt: Date.now() });

        // Log activity
        if (oldStatus !== status) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.subject))
                .unique();
            const actorName = user?.name || user?.email || identity.email || "Team";
            const statusLabels: Record<string, string> = {
                open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed"
            };
            await ctx.scheduler.runAfter(0, internal.activities.logActivity, {
                bugId,
                projectId: bug.projectId,
                actorName,
                actorEmail: user?.email || identity.email,
                type: "status_changed",
                detail: `Moved to ${statusLabels[status] ?? status}`,
            });
        }
    },
});

/** Update bug priority */
export const updatePriority = mutation({
    args: {
        bugId: v.id("bugs"),
        priority: v.union(
            v.literal("low"),
            v.literal("medium"),
            v.literal("high"),
            v.literal("critical")
        ),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, { bugId, priority, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) throw new Error("Unauthenticated");

        const bug = await ctx.db.get(bugId);
        if (!bug) throw new Error("Bug not found");

        const project = await ctx.db.get(bug.projectId);
        if (!project) throw new Error("Project not found");

        const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = adminEmails.includes(identity.email ?? "");

        const membership = await ctx.db
            .query("projectMembers")
            .withIndex("by_project_user", (q) => q.eq("projectId", bug.projectId).eq("userId", identity.subject))
            .unique();

        const canEdit = isSuperAdmin ||
            (membership && (membership.role === "owner" || membership.role === "admin" || membership.role === "editor")) ||
            (project.userId === identity.subject);

        if (!canEdit) throw new Error("Unauthorized");

        const oldPriority = bug.priority;
        await ctx.db.patch(bugId, { priority, updatedAt: Date.now() });

        // Log activity
        if (oldPriority !== priority) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.subject))
                .unique();
            const actorName = user?.name || user?.email || identity.email || "Team";
            await ctx.scheduler.runAfter(0, internal.activities.logActivity, {
                bugId,
                projectId: bug.projectId,
                actorName,
                actorEmail: user?.email || identity.email,
                type: "priority_changed",
                detail: `${oldPriority} → ${priority}`,
            });
        }
    },
});

/** Update bug details (title, description, tags, assignee, due date, type, category) */
export const updateBug = mutation({
    args: {
        bugId: v.id("bugs"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        assigneeId: v.optional(v.union(v.string(), v.null())),
        tags: v.optional(v.array(v.string())),
        dueDate: v.optional(v.union(v.number(), v.null())),
        type: v.optional(v.string()),
        category: v.optional(v.string()),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) throw new Error("Unauthenticated");

        const bug = await ctx.db.get(args.bugId);
        if (!bug) throw new Error("Bug not found");

        const project = await ctx.db.get(bug.projectId);
        if (!project) throw new Error("Project not found");

        const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = adminEmails.includes(identity.email ?? "");

        const currentMembership = await ctx.db
            .query("projectMembers")
            .withIndex("by_project_user", (q: any) => q.eq("projectId", bug.projectId).eq("userId", identity.subject))
            .unique();

        const canEdit = isSuperAdmin ||
            (currentMembership && (currentMembership.role === "owner" || currentMembership.role === "admin" || currentMembership.role === "editor")) ||
            (project.userId === identity.subject);

        if (!canEdit) throw new Error("Unauthorized to edit bug details");

        const patch: any = { updatedAt: Date.now() };
        if (args.title !== undefined) patch.title = args.title;
        if (args.description !== undefined) patch.description = args.description;
        if (args.assigneeId !== undefined) {
            patch.assigneeId = args.assigneeId === null ? undefined : args.assigneeId;
        }
        if (args.tags !== undefined) patch.tags = args.tags;
        if (args.dueDate !== undefined) {
            patch.dueDate = args.dueDate === null ? undefined : args.dueDate;
        }
        if (args.type !== undefined) patch.type = args.type;
        if (args.category !== undefined) patch.category = args.category;

        await ctx.db.patch(args.bugId, patch);

        // Log assignee change
        const user = await ctx.db
            .query("users")
            .withIndex("by_token_identifier", (q: any) => q.eq("tokenIdentifier", identity.subject))
            .unique();
        const actorName = user?.name || user?.email || identity.email || "Team";

        if (args.assigneeId !== undefined && args.assigneeId !== bug.assigneeId) {
            let assigneeName = "Unassigned";
            if (args.assigneeId) {
                const assignee = await ctx.db
                    .query("users")
                    .withIndex("by_token_identifier", (q: any) => q.eq("tokenIdentifier", args.assigneeId as string))
                    .unique();
                assigneeName = assignee?.name || assignee?.email || args.assigneeId;
            }
            await ctx.scheduler.runAfter(0, internal.activities.logActivity, {
                bugId: args.bugId,
                projectId: bug.projectId,
                actorName,
                actorEmail: user?.email || identity.email,
                type: "assignee_changed",
                detail: `Assigned to ${assigneeName}`,
            });
        }

        if (args.tags !== undefined) {
            await ctx.scheduler.runAfter(0, internal.activities.logActivity, {
                bugId: args.bugId,
                projectId: bug.projectId,
                actorName,
                actorEmail: user?.email || identity.email,
                type: "tags_changed",
                detail: args.tags.length > 0 ? args.tags.join(", ") : "Tags cleared",
            });
        }

        if (args.type !== undefined && args.type !== bug.type) {
            await ctx.scheduler.runAfter(0, internal.activities.logActivity, {
                bugId: args.bugId,
                projectId: bug.projectId,
                actorName,
                actorEmail: user?.email || identity.email,
                type: "type_changed",
                detail: `Type set to ${args.type}`,
            });
        }

        if (args.category !== undefined && args.category !== bug.category) {
            await ctx.scheduler.runAfter(0, internal.activities.logActivity, {
                bugId: args.bugId,
                projectId: bug.projectId,
                actorName,
                actorEmail: user?.email || identity.email,
                type: "category_changed",
                detail: `Category set to ${args.category || "None"}`,
            });
        }
    },
});


/** Delete a bug and its comments */
export const deleteBug = mutation({
    args: { bugId: v.id("bugs"), devToken: v.optional(v.string()) },
    handler: async (ctx, { bugId, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) throw new Error("Unauthenticated");

        const bug = await ctx.db.get(bugId);
        if (!bug) throw new Error("Bug not found");

        const project = await ctx.db.get(bug.projectId);
        if (!project) throw new Error("Project not found");

        const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map(e => e.trim());
        const isSuperAdmin = adminEmails.includes(identity.email ?? "");

        const membership = await ctx.db
            .query("projectMembers")
            .withIndex("by_project_user", (q) => q.eq("projectId", bug.projectId).eq("userId", identity.subject))
            .unique();

        // Project.userId uses Identity.tokenIdentifier, verify it.
        const canDelete = isSuperAdmin ||
            (membership && (membership.role === "owner" || membership.role === "admin")) ||
            (project.userId === identity.subject);

        if (!canDelete) throw new Error("Unauthorized to delete this bug.");

        const comments = await ctx.db
            .query("comments")
            .withIndex("by_bug", (q: any) => q.eq("bugId", bugId))
            .collect();

        for (const comment of comments) {
            await ctx.db.delete(comment._id);
        }
        await ctx.db.delete(bugId);
    },
});
