/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getEffectiveIdentity } from "./users";

function buildTrackerUrl(bug: any) {
    const rawUrl = bug?.page_url || bug?.url;
    if (!rawUrl || rawUrl === "Unknown" || rawUrl === "Dashboard") return "";
    const x = bug?.x_coordinate ?? bug?.scrollX;
    const y = bug?.y_coordinate ?? bug?.scrollY;
    if (x === undefined || y === undefined) return String(rawUrl);
    const scrollPosition = bug?.scroll_position ?? bug?.scrollY ?? 0;
    const params = new URLSearchParams();
    params.set("bugscribe-highlight", `${Math.round(x)},${Math.round(y)}`);
    params.set("bugscribe-scroll", String(Math.round(scrollPosition)));
    if (bug?.element_selector) params.set("bugscribe-selector", encodeURIComponent(bug.element_selector));
    return `${String(rawUrl).split("#")[0]}#${params.toString()}`;
}

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
    owner: [
        "view_api", "view_settings", "manage_users", "manage_roles", "manage_integrations", "view_audit",
        "view_reports", "manage_modules", "manage_buckets", "export_bugs",
        "create_bugs", "update_bugs", "delete_bugs", "assign_bugs", "add_comments", "view_bugs"
    ],
    admin: [
        "view_settings", "manage_users", "manage_integrations", "view_audit",
        "view_reports", "manage_modules", "manage_buckets", "export_bugs",
        "create_bugs", "update_bugs", "delete_bugs", "assign_bugs", "add_comments", "view_bugs"
    ],
    editor: ["create_bugs", "update_bugs", "assign_bugs", "add_comments", "view_bugs"],
    viewer: ["view_bugs", "view_reports"],
};

async function getProjectPermissionContext(ctx: any, projectId: any, identity: any) {
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    const user = await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q: any) => q.eq("tokenIdentifier", identity.subject))
        .unique();

    const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "harshsharmaqa@gmail.com").split(",").map((e: string) => e.trim());
    const isSuperAdmin = user?.role === "super_admin" || adminEmails.includes(identity.email ?? "");
    if (isSuperAdmin) {
        return { project, isSuperAdmin: true, permissions: new Set(Object.values(DEFAULT_ROLE_PERMISSIONS).flat()) };
    }

    const membership = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q: any) => q.eq("projectId", projectId).eq("userId", identity.subject))
        .unique();

    let role = membership?.role;
    if (!role && project.userId === identity.subject) {
        role = "owner";
    }

    if (!role) {
        throw new Error("Unauthorized");
    }

    const roleData = await ctx.db
        .query("rolePermissions")
        .withIndex("by_role", (q: any) => q.eq("role", role))
        .unique();

    const permissions = new Set(roleData?.permissions || DEFAULT_ROLE_PERMISSIONS[role] || []);
    return { project, isSuperAdmin: false, permissions };
}

/** 
 * Increment the sequential issue number for a project and return it 
 */
async function getNextIssueNumber(ctx: any, projectId: any) {
    const project = await ctx.db.get(projectId);
    if (!project) return 1;

    const nextNumber = (project.lastIssueNumber ?? 0) + 1;
    await ctx.db.patch(projectId, { lastIssueNumber: nextNumber });
    return nextNumber;
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Get all bugs for a project (with screenshot URLs resolved) */
export const getBugs = query({
    args: { projectId: v.id("projects"), devToken: v.optional(v.string()) },
    handler: async (ctx, { projectId, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) return [];

        const permissionContext = await getProjectPermissionContext(ctx, projectId, identity);
        if (!permissionContext.isSuperAdmin && !permissionContext.permissions.has("view_bugs")) throw new Error("Unauthorized");

        const bugs = await ctx.db
            .query("bugs")
            .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
            .order("desc")
            .collect();

        // Resolve Convex storage URLs for screenshots in parallel
        return Promise.all(
            bugs.map(async (bug: any) => ({
                ...bug,
                trackerUrl: buildTrackerUrl(bug),
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

        const permissionContext = await getProjectPermissionContext(ctx, bug.projectId, identity);
        if (!permissionContext.isSuperAdmin && !permissionContext.permissions.has("view_bugs")) return null;

        const screenshotUrl = bug.screenshotStorageId
            ? await ctx.storage.getUrl(bug.screenshotStorageId)
            : null;

        const comments = await ctx.db
            .query("comments")
            .withIndex("by_bug", (q: any) => q.eq("bugId", bugId))
            .order("asc")
            .collect();

        return { ...bug, trackerUrl: buildTrackerUrl(bug), screenshotUrl, comments };
    },
});

/** Stats: count bugs by status for a project */
export const getBugStats = query({
    args: { projectId: v.id("projects"), devToken: v.optional(v.string()) },
    handler: async (ctx, { projectId, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) return null;

        const permissionContext = await getProjectPermissionContext(ctx, projectId, identity);
        if (!permissionContext.isSuperAdmin && !permissionContext.permissions.has("view_bugs")) throw new Error("Unauthorized");

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
        page_url: v.optional(v.string()),
        screenWidth: v.optional(v.number()),
        screenHeight: v.optional(v.number()),
        scrollX: v.optional(v.number()),
        scrollY: v.optional(v.number()),
        x_coordinate: v.optional(v.number()),
        y_coordinate: v.optional(v.number()),
        scroll_position: v.optional(v.number()),
        element_selector: v.optional(v.string()),
        consoleErrors: v.optional(v.array(v.any())),
        networkLogs: v.optional(v.array(v.any())),
        screenResolution: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        pageLoadTime: v.optional(v.union(v.number(), v.string())),
        deviceType: v.optional(v.string()),
        screenshotStorageId: v.optional(v.id("_storage")),
        mediaType: v.optional(v.string()),
        steps: v.optional(v.array(v.string())),
        environmentData: v.optional(v.any()),
        reporterName: v.optional(v.string()),
        reporterEmail: v.optional(v.string()),
        created_at: v.optional(v.number()),
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
        const createdAt = args.created_at ?? now;
        const issueNumber = await getNextIssueNumber(ctx, args.projectId);
        // Smart Assignment Logic
        let assignedId: string | undefined = undefined;
        if (args.page_url) {
            const url = args.page_url.toLowerCase();
            const members = await ctx.db
                .query("projectMembers")
                .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
                .collect();

            // Example rule: /checkout or /payment goes to the first admin/editor found
            // In a real app, you'd have a rules table
            if (url.includes("/checkout") || url.includes("/payment") || url.includes("/admin")) {
                const potentialAssignee = members.find(m => m.role === "admin" || m.role === "editor");
                if (potentialAssignee) {
                    assignedId = potentialAssignee.userId;
                }
            }
        }

        const bugId = await ctx.db.insert("bugs", {
            projectId: args.projectId,
            issueNumber,
            title: args.title,
            description: args.description,
            browser: args.browser,
            os: args.os,
            url: args.url,
            page_url: args.page_url ?? args.url,
            screenWidth: args.screenWidth,
            screenHeight: args.screenHeight,
            scrollX: args.scrollX,
            scrollY: args.scrollY,
            x_coordinate: args.x_coordinate,
            y_coordinate: args.y_coordinate,
            scroll_position: args.scroll_position ?? args.scrollY,
            element_selector: args.element_selector,
            consoleErrors: args.consoleErrors ?? [],
            networkLogs: args.networkLogs ?? [],
            screenResolution: args.screenResolution,
            userAgent: args.userAgent,
            pageLoadTime: args.pageLoadTime,
            deviceType: args.deviceType,
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
            assigneeId: assignedId,
            createdAt,
            created_at: createdAt,
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
            detail: assignedId ? `Created and auto-assigned` : `Created bug via widget`,
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
        const issueNumber = await getNextIssueNumber(ctx, args.projectId);
        const bugId = await ctx.db.insert("bugs", {
            projectId: args.projectId,
            issueNumber,
            title: args.title,
            description: args.description || "Manual bug report created from dashboard.",
            browser: "Manual",
            os: "Dashboard",
            url: "Dashboard",
            page_url: "Dashboard",
            scroll_position: 0,
            status: "open",
            priority: args.priority || "medium",
            type: args.type || "general",
            category: args.category,
            createdAt: now,
            created_at: now,
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

        const permissionContext = await getProjectPermissionContext(ctx, bug.projectId, identity);
        if (!permissionContext.isSuperAdmin && !permissionContext.permissions.has("update_bugs")) throw new Error("Unauthorized");

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
