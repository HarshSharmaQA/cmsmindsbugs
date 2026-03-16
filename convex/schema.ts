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
        tokenIdentifier: v.string(),          // Unique user ID (e.g. user:email)
        email: v.string(),
        password: v.optional(v.string()),      // Stored as "sha256:<salt>:<hash>" (never plaintext)
        name: v.optional(v.string()),
        role: v.union(v.literal("super_admin"), v.literal("user")),
        isApproved: v.optional(v.boolean()),
        sessionToken: v.optional(v.string()), // Cryptographically random session token (128-bit)
        sessionTokenExpiry: v.optional(v.number()), // Unix timestamp (ms) when token expires
        isDeactivated: v.optional(v.boolean()),
    })
        .index("by_token_identifier", ["tokenIdentifier"])
        .index("by_email", ["email"])
        .index("by_session_token", ["sessionToken"]),

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
        type: v.optional(v.string()),     // "general" | "ui" | "performance" | "security" | "crash"
        category: v.optional(v.string()), // Free-form category label

        // Workflow
        status: v.string(),
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

        // Visual evidence
        screenshotStorageId: v.optional(v.id("_storage")),
        mediaType: v.optional(v.string()), // 'image' or 'video'
        steps: v.optional(v.array(v.string())), // auto-generated steps
        environmentData: v.optional(v.any()), // auto-captured local storage, cookies, etc.

        createdAt: v.number(),
        created_at: v.optional(v.number()),
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

    // ── Bug Activity / Audit Log ───────────────────────────────────────────────
    activities: defineTable({
        bugId: v.id("bugs"),
        projectId: v.id("projects"),
        actorName: v.string(),          // display name (e.g. "Harsh Sharma")
        actorEmail: v.optional(v.string()),
        type: v.string(),               // "status_changed" | "priority_changed" | "comment_added" | "assignee_changed" | "created" | "tags_changed" | "type_changed" | "category_changed"
        detail: v.optional(v.string()), // human-readable description, e.g. "Open → In Progress"
        createdAt: v.number(),
    })
        .index("by_bug", ["bugId"])
        .index("by_project", ["projectId"]),

    // ── Global Role Permissions ───────────────────────────────────────────────
    rolePermissions: defineTable({
        role: v.string(), // "admin", "editor", "viewer", "owner"
        permissions: v.array(v.string()), // e.g. ["view_api", "view_users", "manage_settings", "delete_bugs", "move_bugs"]
    })
        .index("by_role", ["role"]),

    // ── Map Locations (managed by super admin) ────────────────────────────────
    mapLocations: defineTable({
        name: v.string(),
        productBy: v.optional(v.string()),
        subtitle: v.optional(v.string()),
        image: v.optional(v.string()),
        price: v.number(),
        priceLabel: v.optional(v.string()),
        priceSubtext: v.optional(v.string()),
        rating: v.optional(v.number()),
        lat: v.number(),
        lng: v.number(),
        purchases: v.optional(v.number()),
        state: v.optional(v.string()),
        city: v.optional(v.string()),
        buyLink: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    }),

    // ── Global System Settings (managed by super admin) ──────────────────────
    globalSettings: defineTable({
        key: v.string(),
        value: v.any(),
        updatedAt: v.number(),
    }).index("by_key", ["key"]),

    // ── Admin-Created Pages (Page Builder) ────────────────────────────────
    pages: defineTable({
        slug: v.string(),           // URL-safe slug e.g. "about", "team"
        title: v.string(),
        metaDescription: v.optional(v.string()),
        isPublished: v.boolean(),
        showInMenu: v.optional(v.boolean()),
        createdBy: v.string(),      // user tokenIdentifier
        blocks: v.array(v.object({
            id: v.string(),
            type: v.string(),       // "hero" | "text" | "two_col" | "cta" | "stats" | "divider" | "image"
            data: v.any(),          // block-specific payload
        })),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_slug", ["slug"])
        .index("by_published", ["isPublished"]),

    // ── Appointment Bookings (via Page Builder booking block) ─────────────
    bookings: defineTable({
        pageSlug: v.string(),           // which page the booking came from
        service: v.string(),            // service/event type name
        date: v.string(),               // ISO date string "YYYY-MM-DD"
        time: v.string(),               // e.g. "10:00 AM"
        timezone: v.string(),           // e.g. "America/New_York"
        name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        company: v.optional(v.string()),
        message: v.optional(v.string()),
        status: v.string(),             // "pending" | "confirmed" | "cancelled"
        createdAt: v.number(),
    })
        .index("by_page", ["pageSlug"])
        .index("by_status", ["status"])
        .index("by_date", ["date"]),

    // ── Super Admin Managed Modules (Suggestions, Wiki, etc.) ───────────────
    dashboardModules: defineTable({
        name: v.string(),
        slug: v.string(),
        icon: v.string(), // Lucide icon name
        order: v.number(),
        description: v.optional(v.string()),
        isWiki: v.optional(v.boolean()),
        createdAt: v.number(),
    })
        .index("by_order", ["order"])
        .index("by_slug", ["slug"]),

    moduleEntries: defineTable({
        moduleId: v.id("dashboardModules"),
        projectId: v.id("projects"),
        title: v.string(),
        content: v.string(), // Markdown/HTML/Text
        authorId: v.string(), // user tokenIdentifier
        status: v.optional(v.string()), // e.g. "pending", "published"
        metadata: v.optional(v.any()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_module", ["moduleId"])
        .index("by_project_module", ["projectId", "moduleId"]),

    // ── Project Statuses ──────────────────────────────────────────────────────
    projectStatuses: defineTable({
        projectId: v.id("projects"),
        value: v.string(),           // e.g. "open"
        label: v.string(),           // e.g. "New Issues"
        color: v.string(),           // Tailwind text color class, e.g. "text-blue-400"
        icon: v.optional(v.string()), // Lucide icon name
        order: v.number(),
    })
        .index("by_project", ["projectId"])
        .index("by_project_order", ["projectId", "order"]),
});
