import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getEffectiveIdentity } from "./users";

/** Get comments for a bug thread */
export const getComments = query({
    args: { bugId: v.id("bugs") },
    handler: async (ctx, { bugId }) => {
        return ctx.db
            .query("comments")
            .withIndex("by_bug", (q) => q.eq("bugId", bugId))
            .order("asc")
            .collect();
    },
});

/** Add a comment to a bug */
export const addComment = mutation({
    args: {
        bugId: v.id("bugs"),
        author: v.string(),
        body: v.string(),
    },
    handler: async (ctx, args) => {
        const commentId = await ctx.db.insert("comments", {
            bugId: args.bugId,
            author: args.author,
            body: args.body,
            createdAt: Date.now(),
        });

        // Fetch context to notify owner
        const bug = await ctx.db.get(args.bugId);
        if (bug) {
            const project = await ctx.db.get(bug.projectId);
            if (project && project.userId) {
                const owner = await ctx.db
                    .query("users")
                    .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", project.userId))
                    .unique();

                const toEmail = owner?.email || (process.env.SUPER_ADMIN_EMAILS || "").split(",")[0].trim();

                await ctx.scheduler.runAfter(0, internal.emails.notifyCommentAdded, {
                    toEmail,
                    projectName: project.name,
                    bugTitle: bug.title,
                    commentAuthor: args.author,
                    commentBody: args.body,
                });
            }
        }

        return commentId;
    },
});

/** Update a comment's body */
export const updateComment = mutation({
    args: {
        commentId: v.id("comments"),
        body: v.string(),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) throw new Error("Unauthenticated");

        const comment = await ctx.db.get(args.commentId);
        if (!comment) throw new Error("Comment not found");

        // Simple check: only allowed if user is logged in for now.
        // In a real app, we'd check if identity.name matching comment.author or project admin.
        await ctx.db.patch(args.commentId, { body: args.body });
    },
});

/** Delete a comment */
export const deleteComment = mutation({
    args: { commentId: v.id("comments"), devToken: v.optional(v.string()) },
    handler: async (ctx, { commentId, devToken }) => {
        const identity = await getEffectiveIdentity(ctx, devToken);
        if (!identity) throw new Error("Unauthenticated");
        await ctx.db.delete(commentId);
    },
});
