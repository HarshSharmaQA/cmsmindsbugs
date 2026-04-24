import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the current user's tokenIdentifier, or null if unauthenticated. */
async function getTokenIdentifier(ctx: { auth: { getUserIdentity: () => Promise<{ tokenIdentifier: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.tokenIdentifier ?? null;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Get the current user's notifications, newest first, capped at 50.
 */
export const getUserNotifications = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getTokenIdentifier(ctx);
    if (!tokenIdentifier) return [];

    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", tokenIdentifier))
      .order("desc")
      .take(50);
  },
});

/**
 * Get the count of unread notifications for the current user.
 */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getTokenIdentifier(ctx);
    if (!tokenIdentifier) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", tokenIdentifier).eq("read", false)
      )
      .take(100);

    return unread.length;
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Store per-user notification rows when a new bug is created.
 * Returns the list of tokenIdentifiers so the caller can send a OneSignal push.
 */
export const notifyNewBug = mutation({
  args: {
    bugId: v.id("bugs"),
    projectId: v.id("projects"),
    title: v.string(),
    priority: v.string(),
  },
  handler: async (ctx, args) => {
    const bug = await ctx.db.get(args.bugId);
    const project = await ctx.db.get(args.projectId);
    if (!bug || !project) throw new Error("Bug or project not found");

    // Notify all approved users (extend this to project members as needed)
    const users = await ctx.db
      .query("users")
      .withIndex("by_token_identifier")
      .filter((q) => q.eq(q.field("isApproved"), true))
      .take(500);

    const now = Date.now();
    const actionUrl = `/dashboard/${args.projectId}`;

    for (const user of users) {
      await ctx.db.insert("notifications", {
        type: "new_bug",
        bugId: args.bugId,
        projectId: args.projectId,
        userId: user.tokenIdentifier,
        title: `New ${args.priority} priority bug`,
        message: args.title,
        sentAt: now,
        read: false,
        actionUrl,
      });
    }

    return { success: true, userIds: users.map((u) => u.tokenIdentifier) };
  },
});

/**
 * Store per-user notification rows when a bug's status changes.
 */
export const notifyBugStatusChange = mutation({
  args: {
    bugId: v.id("bugs"),
    oldStatus: v.string(),
    newStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const bug = await ctx.db.get(args.bugId);
    if (!bug) throw new Error("Bug not found");

    const project = await ctx.db.get(bug.projectId);
    if (!project) throw new Error("Project not found");

    const users = await ctx.db
      .query("users")
      .withIndex("by_token_identifier")
      .filter((q) => q.eq(q.field("isApproved"), true))
      .take(500);

    const now = Date.now();
    const actionUrl = `/dashboard/${bug.projectId}`;

    for (const user of users) {
      await ctx.db.insert("notifications", {
        type: "bug_status_change",
        bugId: args.bugId,
        projectId: bug.projectId,
        userId: user.tokenIdentifier,
        title: "Bug status updated",
        message: `"${bug.title}" moved from ${args.oldStatus} to ${args.newStatus}`,
        sentAt: now,
        read: false,
        actionUrl,
      });
    }

    return { success: true, userIds: users.map((u) => u.tokenIdentifier) };
  },
});

/**
 * Store per-user notification rows when a comment is added.
 */
export const notifyCommentAdded = mutation({
  args: {
    bugId: v.id("bugs"),
    commentAuthor: v.string(),
    commentPreview: v.string(),
  },
  handler: async (ctx, args) => {
    const bug = await ctx.db.get(args.bugId);
    if (!bug) throw new Error("Bug not found");

    const users = await ctx.db
      .query("users")
      .withIndex("by_token_identifier")
      .filter((q) => q.eq(q.field("isApproved"), true))
      .take(500);

    const now = Date.now();
    const actionUrl = `/dashboard/${bug.projectId}`;

    for (const user of users) {
      await ctx.db.insert("notifications", {
        type: "comment_added",
        bugId: args.bugId,
        projectId: bug.projectId,
        userId: user.tokenIdentifier,
        title: `${args.commentAuthor} commented on a bug`,
        message: args.commentPreview,
        sentAt: now,
        read: false,
        actionUrl,
      });
    }

    return { success: true, userIds: users.map((u) => u.tokenIdentifier) };
  },
});

/**
 * Store a notification when a bug is assigned to a specific user.
 */
export const notifyBugAssigned = mutation({
  args: {
    bugId: v.id("bugs"),
    assigneeTokenIdentifier: v.string(),
    assignedByName: v.string(),
  },
  handler: async (ctx, args) => {
    const bug = await ctx.db.get(args.bugId);
    if (!bug) throw new Error("Bug not found");

    const now = Date.now();
    await ctx.db.insert("notifications", {
      type: "bug_assigned",
      bugId: args.bugId,
      projectId: bug.projectId,
      userId: args.assigneeTokenIdentifier,
      title: "Bug assigned to you",
      message: `${args.assignedByName} assigned "${bug.title}" to you`,
      sentAt: now,
      read: false,
      actionUrl: `/dashboard/${bug.projectId}`,
    });

    return { success: true, userIds: [args.assigneeTokenIdentifier] };
  },
});

/**
 * Mark a single notification as read.
 */
export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getTokenIdentifier(ctx);
    if (!tokenIdentifier) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");

    // Only allow users to mark their own notifications
    if (notification.userId !== tokenIdentifier) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.notificationId, {
      read: true,
      readAt: Date.now(),
    });
  },
});

/**
 * Mark all of the current user's notifications as read.
 */
export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getTokenIdentifier(ctx);
    if (!tokenIdentifier) throw new Error("Not authenticated");

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", tokenIdentifier).eq("read", false)
      )
      .take(100);

    const now = Date.now();
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true, readAt: now });
    }

    return { updated: unread.length };
  },
});

/**
 * Store the OneSignal notification ID back on the in-app notification rows.
 * Called after a successful OneSignal API push.
 */
export const attachOneSignalId = mutation({
  args: {
    projectId: v.id("projects"),
    bugId: v.optional(v.id("bugs")),
    type: v.string(),
    oneSignalId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the most recent batch of notifications for this event
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(200);

    const targets = rows.filter(
      (n) => n.type === args.type && !n.oneSignalId
    );

    for (const n of targets) {
      await ctx.db.patch(n._id, { oneSignalId: args.oneSignalId });
    }

    return { updated: targets.length };
  },
});
