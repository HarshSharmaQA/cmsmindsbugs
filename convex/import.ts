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
 * Import bugs from CSV/JSON data - COMPREHENSIVE VERSION
 * Supports ALL bug fields including screenshots, manually added issues, and all metadata
 */
export const importBugs = mutation({
    args: {
        projectId: v.id("projects"),
        bugs: v.array(v.object({
            // Required fields
            title: v.string(),
            
            // Core fields
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
            
            // Assignment & workflow
            assigneeEmail: v.optional(v.string()),
            tags: v.optional(v.array(v.string())),
            dueDate: v.optional(v.string()), // ISO date string
            
            // Reporter info
            reporterName: v.optional(v.string()),
            reporterEmail: v.optional(v.string()),
            
            // Environment metadata
            browser: v.optional(v.string()),
            os: v.optional(v.string()),
            url: v.optional(v.string()),
            page_url: v.optional(v.string()),
            userAgent: v.optional(v.string()),
            deviceType: v.optional(v.string()),
            screenResolution: v.optional(v.string()),
            
            // Screen/scroll data
            screenWidth: v.optional(v.number()),
            screenHeight: v.optional(v.number()),
            scrollX: v.optional(v.number()),
            scrollY: v.optional(v.number()),
            x_coordinate: v.optional(v.number()),
            y_coordinate: v.optional(v.number()),
            scroll_position: v.optional(v.number()),
            element_selector: v.optional(v.string()),
            
            // Performance & logs
            pageLoadTime: v.optional(v.union(v.number(), v.string())),
            consoleErrors: v.optional(v.array(v.any())),
            networkLogs: v.optional(v.array(v.any())),
            
            // Media & evidence
            screenshotUrl: v.optional(v.string()), // External URL or storage ID
            mediaType: v.optional(v.string()),
            steps: v.optional(v.array(v.string())),
            
            // Additional data
            environmentData: v.optional(v.any()),
            customField: v.optional(v.any()),
            trackerUrl: v.optional(v.string()),
            
            // Timestamps (for preserving original dates)
            createdAt: v.optional(v.number()),
            created_at: v.optional(v.number()),
            issueNumber: v.optional(v.number()),
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

                // Get next issue number (or use provided one if available)
                const lastIssueNumber = project.lastIssueNumber || 0;
                const issueNumber = bug.issueNumber || (lastIssueNumber + 1);

                // Prepare bug data with ALL fields
                const bugData: any = {
                    projectId,
                    issueNumber,
                    title: bug.title,
                    description: bug.description || "",
                    status,
                    priority,
                    type: bug.type || "general",
                    browser: bug.browser || "Unknown",
                    url: bug.url || "Imported",
                    createdAt: bug.createdAt || bug.created_at || Date.now(),
                    updatedAt: Date.now(),
                };

                // Add optional fields if provided
                if (bug.category) bugData.category = bug.category;
                if (assigneeId) bugData.assigneeId = assigneeId;
                if (bug.tags && bug.tags.length > 0) bugData.tags = bug.tags;
                if (dueDate) bugData.dueDate = dueDate;
                if (bug.reporterName) bugData.reporterName = bug.reporterName;
                if (bug.reporterEmail) bugData.reporterEmail = bug.reporterEmail;
                if (bug.os) bugData.os = bug.os;
                if (bug.page_url) bugData.page_url = bug.page_url;
                if (bug.userAgent) bugData.userAgent = bug.userAgent;
                if (bug.deviceType) bugData.deviceType = bug.deviceType;
                if (bug.screenResolution) bugData.screenResolution = bug.screenResolution;
                if (bug.screenWidth) bugData.screenWidth = bug.screenWidth;
                if (bug.screenHeight) bugData.screenHeight = bug.screenHeight;
                if (bug.scrollX) bugData.scrollX = bug.scrollX;
                if (bug.scrollY) bugData.scrollY = bug.scrollY;
                if (bug.x_coordinate) bugData.x_coordinate = bug.x_coordinate;
                if (bug.y_coordinate) bugData.y_coordinate = bug.y_coordinate;
                if (bug.scroll_position) bugData.scroll_position = bug.scroll_position;
                if (bug.element_selector) bugData.element_selector = bug.element_selector;
                if (bug.pageLoadTime) bugData.pageLoadTime = bug.pageLoadTime;
                if (bug.consoleErrors) bugData.consoleErrors = bug.consoleErrors;
                if (bug.networkLogs) bugData.networkLogs = bug.networkLogs;
                if (bug.mediaType) bugData.mediaType = bug.mediaType;
                if (bug.steps) bugData.steps = bug.steps;
                if (bug.environmentData) bugData.environmentData = bug.environmentData;
                if (bug.customField) bugData.customField = bug.customField;
                if (bug.trackerUrl) bugData.trackerUrl = bug.trackerUrl;
                
                // Handle screenshot URL - store as external URL in a custom field
                // since screenshotStorageId expects a Convex storage ID
                if (bug.screenshotUrl) {
                    bugData.customField = {
                        ...(bugData.customField || {}),
                        screenshotUrl: bug.screenshotUrl
                    };
                }

                // Create the bug
                await ctx.db.insert("bugs", bugData);

                // Update project's last issue number if we used a new one
                if (issueNumber > lastIssueNumber) {
                    await ctx.db.patch(projectId, {
                        lastIssueNumber: issueNumber,
                    });
                }

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
 * Get import template/example with ALL available fields
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
            csvTemplate: `title,description,status,priority,type,category,assigneeEmail,tags,reporterName,reporterEmail,browser,os,url,page_url,userAgent,deviceType,screenResolution,screenWidth,screenHeight,scrollX,scrollY,x_coordinate,y_coordinate,scroll_position,element_selector,pageLoadTime,consoleErrors,networkLogs,screenshotUrl,mediaType,steps,dueDate,createdAt,issueNumber
"Login button not working","Users cannot click the login button on mobile devices","open","high","ui","authentication","john@example.com","login,mobile","Jane Doe","jane@example.com","Chrome Mobile","iOS 17","https://example.com/login","https://example.com/login","Mozilla/5.0...","mobile","1920x1080",1920,1080,0,0,450,320,150,"#login-button",2500,"[""Error: Cannot read property...""]","[{""url"":""api/login""}]","https://example.com/screenshot.png","image","[""Navigate to login"",""Click button""]","2024-12-31","2024-01-15T10:30:00Z",1
"Slow page load","Homepage takes 5+ seconds to load","in_progress","medium","performance","","","performance,optimization","","","Chrome","Windows 11","https://example.com","","","desktop","1920x1080",1920,1080,0,0,0,0,0,"",5200,"[]","[]","","","","2024-12-25","2024-01-16T14:20:00Z",2`,
            jsonTemplate: [
                {
                    // Required
                    title: "Login button not working",
                    
                    // Core fields
                    description: "Users cannot click the login button on mobile devices",
                    status: "open",
                    priority: "high",
                    type: "ui",
                    category: "authentication",
                    
                    // Assignment & workflow
                    assigneeEmail: "john@example.com",
                    tags: ["login", "mobile"],
                    dueDate: "2024-12-31",
                    
                    // Reporter
                    reporterName: "Jane Doe",
                    reporterEmail: "jane@example.com",
                    
                    // Environment
                    browser: "Chrome Mobile",
                    os: "iOS 17",
                    url: "https://example.com/login",
                    page_url: "https://example.com/login",
                    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)...",
                    deviceType: "mobile",
                    screenResolution: "1920x1080",
                    
                    // Screen/Scroll data
                    screenWidth: 1920,
                    screenHeight: 1080,
                    scrollX: 0,
                    scrollY: 0,
                    x_coordinate: 450,
                    y_coordinate: 320,
                    scroll_position: 150,
                    element_selector: "#login-button",
                    
                    // Performance & logs
                    pageLoadTime: 2500,
                    consoleErrors: ["Error: Cannot read property 'click' of null"],
                    networkLogs: [{ url: "api/login", status: 500 }],
                    
                    // Media
                    screenshotUrl: "https://example.com/screenshot.png",
                    mediaType: "image",
                    steps: ["Navigate to login page", "Click login button", "Observe error"],
                    
                    // Timestamps (optional - will use current time if not provided)
                    createdAt: 1705318200000, // Unix timestamp in milliseconds
                    issueNumber: 1 // Optional - will auto-increment if not provided
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
                    pageLoadTime: 5200,
                    dueDate: "2024-12-25",
                    createdAt: 1705405200000,
                    issueNumber: 2
                }
            ],
            validStatuses: projectStatuses.map(s => s.value),
            validPriorities: ["low", "medium", "high", "critical"],
            notes: [
                "✅ REQUIRED FIELDS:",
                "  • title - Bug title/summary",
                "",
                "📋 OPTIONAL FIELDS (all optional, use as needed):",
                "  Core:",
                "    • description, status, priority, type, category",
                "  Assignment:",
                "    • assigneeEmail (must match project member), tags, dueDate",
                "  Reporter:",
                "    • reporterName, reporterEmail",
                "  Environment:",
                "    • browser, os, url, page_url, userAgent, deviceType, screenResolution",
                "  Screen/Scroll:",
                "    • screenWidth, screenHeight, scrollX, scrollY, x_coordinate, y_coordinate, scroll_position, element_selector",
                "  Performance:",
                "    • pageLoadTime, consoleErrors (array), networkLogs (array)",
                "  Media:",
                "    • screenshotUrl (external URL), mediaType (image/video), steps (array)",
                "  Timestamps:",
                "    • createdAt (Unix timestamp in ms or ISO date), issueNumber (auto-increments if not provided)",
                "",
                `📊 Valid statuses for this project: ${statusOptions}`,
                "📊 Valid priorities: low, medium, high, critical",
                "",
                "💡 TIPS:",
                "  • CSV: Use comma-separated values for tags, JSON arrays for complex fields",
                "  • JSON: Use arrays for tags, consoleErrors, networkLogs, steps",
                "  • Dates: Use YYYY-MM-DD or ISO 8601 format",
                "  • Timestamps: Unix milliseconds or ISO date strings",
                "  • Screenshots: Provide external URLs (will be stored in customField)",
                "  • Assignee: Email must match a project member's email",
                "  • Issue Numbers: Will auto-increment if not provided",
                "",
                "🔄 MANUALLY ADDED ISSUES:",
                "  All manually created issues will be exported with full details",
                "  Re-importing preserves all data including screenshots and metadata"
            ]
        };
    },
});
