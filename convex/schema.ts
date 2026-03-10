import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * BugScribe Database Schema
 *
 * Entity Map:
 *   projects  (1) ──── (many)  bugs
 *   bugs      (1) ──── (many)  comments
 *
 * Index Strategy:
 *   - by_api_key  → Widget authentication (exact match)
 *   - by_project  → Dashboard listing (range scan per project)
 *   - by_status   → Kanban column filtering
 *   - by_bug      → Comment thread retrieval
 */
export default defineSchema({
    // ── Users ─────────────────────────────────────────────────────────────────
    users: defineTable({
        tokenIdentifier: v.string(),      // Unique user ID (e.g. user:email)
        email: v.string(),
        password: v.optional(v.string()),
        name: v.optional(v.string()),
        role: v.union(v.literal("super_admin"), v.literal("user")),
    })
        .index("by_token_identifier", ["tokenIdentifier"])
        .index("by_email", ["email"]),

    // ── Project Memberships ──────────────────────────────────────────────────
    projectMembers: defineTable({
        projectId: v.id("projects"),
        userId: v.string(),               // Clerk user ID
        role: v.union(v.literal("owner"), v.literal("admin"), v.literal("editor"), v.literal("viewer")),
        invitedBy: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_project", ["projectId"])
        .index("by_user", ["userId"])
        .index("by_project_user", ["projectId", "userId"]),

    // ── Projects ──────────────────────────────────────────────────────────────
    projects: defineTable({
        userId: v.string(),               // The creator's Clerk ID (legacy / owner)
        name: v.string(),
        domain: v.optional(v.string()),
        apiKey: v.string(),
        description: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_user_id", ["userId"])
        .index("by_api_key", ["apiKey"]),

    // ── Bugs ───────────────────────────────────────────────────────────────────
    bugs: defineTable({
        projectId: v.id("projects"),

        // Core fields
        title: v.string(),
        description: v.optional(v.string()),

        // Workflow
        status: v.union(
            v.literal("open"),
            v.literal("in_progress"),
            v.literal("resolved"),
            v.literal("closed")
        ),
        priority: v.union(
            v.literal("low"),
            v.literal("medium"),
            v.literal("high"),
            v.literal("critical")
        ),
        assigneeId: v.optional(v.string()), // assigned user's tokenIdentifier
        tags: v.optional(v.array(v.string())),
        dueDate: v.optional(v.number()), // timestamp

        // Reporter context
        reporterName: v.optional(v.string()),
        reporterEmail: v.optional(v.string()),

        // Environment metadata (auto-captured by widget)
        browser: v.string(),
        os: v.optional(v.string()),
        url: v.string(),
        screenWidth: v.optional(v.number()),
        screenHeight: v.optional(v.number()),
        consoleErrors: v.optional(v.array(v.string())),

        // Visual evidence
        screenshotStorageId: v.optional(v.id("_storage")),
        mediaType: v.optional(v.string()), // 'image' or 'video'
        steps: v.optional(v.array(v.string())), // auto-generated steps
        environmentData: v.optional(v.any()), // auto-captured local storage, cookies, etc.

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_project", ["projectId"])
        .index("by_status", ["status"])
        .index("by_project_status", ["projectId", "status"]),

    // ── Comments ──────────────────────────────────────────────────────────────
    comments: defineTable({
        bugId: v.id("bugs"),
        author: v.string(),
        body: v.string(),
        createdAt: v.number(),
    })
        .index("by_bug", ["bugId"]),

    // ── Global Role Permissions ───────────────────────────────────────────────
    rolePermissions: defineTable({
        role: v.string(), // "admin", "editor", "viewer", "owner"
        permissions: v.array(v.string()), // e.g. ["view_api", "view_users", "manage_settings", "delete_bugs", "move_bugs"]
    })
        .index("by_role", ["role"]),
});
