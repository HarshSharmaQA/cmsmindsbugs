import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getEffectiveIdentity } from "./users";

/**
 * Check if user has permission for a project
 */
async function checkProjectPermission(ctx: any, projectId: Id<"projects">, identity: any, permission: string): Promise<boolean> {
    // Check super admin
    const user = await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q: any) => q.eq("tokenIdentifier", identity.subject))
        .unique();

    const hardcodedAdmins = ["harshsharmaqa@gmail.com"];
    const isSuperAdmin = user?.role === "super_admin" || hardcodedAdmins.includes(identity.email ?? "");

    if (isSuperAdmin) return true;

    // Check project membership
    const projectMember = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q: any) =>
            q.eq("projectId", projectId).eq("userId", identity.subject)
        )
        .unique();

    if (!projectMember) return false;

    // Get role permissions
    const roleData = await ctx.db
        .query("rolePermissions")
        .withIndex("by_role", (q: any) => q.eq("role", projectMember.role))
        .unique();

    const DEFAULT_PERMISSIONS: Record<string, string[]> = {
        owner: ["view_api", "view_settings", "manage_users", "create_bugs", "update_bugs", "delete_bugs", "view_bugs"],
        admin: ["view_settings", "manage_users", "create_bugs", "update_bugs", "delete_bugs", "view_bugs"],
        editor: ["create_bugs", "update_bugs", "view_bugs"],
        viewer: ["view_bugs"],
    };

    const permissions = roleData?.permissions || DEFAULT_PERMISSIONS[projectMember.role] || [];
    return permissions.includes(permission);
}

/**
 * Import bugs from CSV/JSON data
 */
export const importBugs = mutation({
    args: {
        projectId: v.id("projects"),
        bugs: v.array(v.object({
            title: v.string(),
            description: v.optional(v.string()),
            status: v.optional(v.string()),
            priority: v.optional(v.union(
                v.literal("low"),
                v.literal("medium"),
                v.literal("high"),
                v.literal("critical")
            )),
            type: v.optional(v.string()),
            category: v.optional(v.string()),
            assigneeEmail: v.optional(v.string()),
            tags: v.optional(v.array(v.string())),
            reporterName: v.optional(v.string()),
            reporterEmail: v.optional(v.string()),
            browser: v.optional(v.string()),
            os: v.optional(v.string()),
            url: v.optional(v.string()),
            dueDate: v.optional(v.string()), // ISO date string
        })),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, { projectId, bugs, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) throw new Error("Unauthorized");

        const hasPermission = await checkProjectPermission(ctx, projectId, identity, "create_bugs");
        if (!hasPermission) {
            throw new Error("You don't have permission to import bugs");
        }

        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");

        // Get all project members to map emails to user IDs
        const members = await ctx.db
            .query("projectMembers")
            .withIndex("by_project", (q) => q.eq("projectId", projectId))
            .collect();

        const emailToUserId: Record<string, string> = {};
        for (const member of members) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", member.userId))
                .first();
            if (user?.email) {
                emailToUserId[user.email.toLowerCase()] = member.userId;
            }
        }

        // Get valid statuses for this project
        const projectStatuses = await ctx.db
            .query("projectStatuses")
            .withIndex("by_project", (q) => q.eq("projectId", projectId))
            .collect();
        
        const validStatuses = new Set(projectStatuses.map(s => s.value));
        const defaultStatus = projectStatuses.find(s => s.value === "open")?.value || "open";

        const results = {
            imported: 0,
            failed: 0,
            errors: [] as string[],
        };

        for (let i = 0; i < bugs.length; i++) {
            const bug = bugs[i];
            try {
                // Validate and normalize data
                const status = bug.status && validStatuses.has(bug.status) 
                    ? bug.status 
                    : defaultStatus;

                const priority = bug.priority || "medium";

                // Map assignee email to user ID
                let assigneeId: string | undefined;
                if (bug.assigneeEmail) {
                    assigneeId = emailToUserId[bug.assigneeEmail.toLowerCase()];
                }

                // Parse due date
                let dueDate: number | undefined;
                if (bug.dueDate) {
                    const parsed = new Date(bug.dueDate);
                    if (!isNaN(parsed.getTime())) {
                        dueDate = parsed.getTime();
                    }
                }

                // Get next issue number
                const lastIssueNumber = project.lastIssueNumber || 0;
                const issueNumber = lastIssueNumber + 1;

                // Create the bug
                await ctx.db.insert("bugs", {
                    projectId,
                    issueNumber,
                    title: bug.title,
                    description: bug.description || "",
                    status,
                    priority,
                    type: bug.type || "general",
                    category: bug.category,
                    assigneeId,
                    tags: bug.tags || [],
                    reporterName: bug.reporterName,
                    reporterEmail: bug.reporterEmail,
                    browser: bug.browser || "Unknown",
                    os: bug.os,
                    url: bug.url || "Imported",
                    dueDate,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });

                // Update project's last issue number
                await ctx.db.patch(projectId, {
                    lastIssueNumber: issueNumber,
                });

                results.imported++;
            } catch (error: any) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: ${error.message}`);
            }
        }

        return results;
    },
});

/**
 * Get import template/example
 */
export const getImportTemplate = query({
    args: {
        projectId: v.id("projects"),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, { projectId, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) throw new Error("Unauthorized");

        const hasPermission = await checkProjectPermission(ctx, projectId, identity, "view_bugs");
        if (!hasPermission) {
            throw new Error("Unauthorized");
        }

        // Get valid statuses for this project
        const projectStatuses = await ctx.db
            .query("projectStatuses")
            .withIndex("by_project", (q) => q.eq("projectId", projectId))
            .collect();

        const statusOptions = projectStatuses.map(s => s.value).join(" | ");

        return {
            csvTemplate: `title,description,status,priority,type,category,assigneeEmail,tags,reporterName,reporterEmail,browser,os,url,dueDate
"Login button not working","Users cannot click the login button on mobile devices","open","high","ui_ux","authentication","john@example.com","login,mobile","Jane Doe","jane@example.com","Chrome Mobile","iOS 17","https://example.com/login","2024-12-31"
"Slow page load","Homepage takes 5+ seconds to load","in_progress","medium","performance","","","performance,optimization","","","Chrome","Windows 11","https://example.com","2024-12-25"`,
            jsonTemplate: [
                {
                    title: "Login button not working",
                    description: "Users cannot click the login button on mobile devices",
                    status: "open",
                    priority: "high",
                    type: "ui_ux",
                    category: "authentication",
                    assigneeEmail: "john@example.com",
                    tags: ["login", "mobile"],
                    reporterName: "Jane Doe",
                    reporterEmail: "jane@example.com",
                    browser: "Chrome Mobile",
                    os: "iOS 17",
                    url: "https://example.com/login",
                    dueDate: "2024-12-31"
                },
                {
                    title: "Slow page load",
                    description: "Homepage takes 5+ seconds to load",
                    status: "in_progress",
                    priority: "medium",
                    type: "performance",
                    tags: ["performance", "optimization"],
                    browser: "Chrome",
                    os: "Windows 11",
                    url: "https://example.com",
                    dueDate: "2024-12-25"
                }
            ],
            validStatuses: projectStatuses.map(s => s.value),
            validPriorities: ["low", "medium", "high", "critical"],
            notes: [
                "Required fields: title",
                "Optional fields: description, status, priority, type, category, assigneeEmail, tags, reporterName, reporterEmail, browser, os, url, dueDate",
                `Valid statuses for this project: ${statusOptions}`,
                "Valid priorities: low, medium, high, critical",
                "Tags should be comma-separated in CSV or array in JSON",
                "Date format: YYYY-MM-DD or ISO 8601",
                "Assignee email must match a project member's email"
            ]
        };
    },
});
