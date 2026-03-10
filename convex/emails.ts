"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/** Action to send an email notification when a bug is reported */
export const notifyBugCreated = internalAction({
    handler: async (ctx, args: {
        title: string;
        url: string;
        projectName: string;
        toEmail: string;
        reporterEmail?: string;
    }) => {
        try {
            await resend.emails.send({
                from: "BugScribe Notifications <onboarding@resend.dev>",
                to: args.toEmail,
                subject: `New Bug in ${args.projectName}: ${args.title}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #6366f1;">New Bug Reported in ${args.projectName}</h2>
                        <p><strong>Title:</strong> ${args.title}</p>
                        <p><strong>Reporter Email:</strong> ${args.reporterEmail || "Anonymous"}</p>
                        <p><strong>Occurred on:</strong> <a href="${args.url}" style="color: #6366f1;">${args.url}</a></p>
                        <br/>
                        <p style="color: #666;">Log into your BugScribe dashboard to view the full details and screenshot.</p>
                    </div>
                `,
            });
        } catch (error) {
            console.error("Failed to send Resend email:", error);
        }
    }
});

/** Action to send an email notification when a comment is added */
export const notifyCommentAdded = internalAction({
    handler: async (ctx, args: {
        toEmail: string;
        projectName: string;
        bugTitle: string;
        commentAuthor: string;
        commentBody: string;
    }) => {
        try {
            await resend.emails.send({
                from: "BugScribe Notifications <onboarding@resend.dev>",
                to: args.toEmail,
                subject: `New Comment on "${args.bugTitle}"`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #6366f1;">New Comment in ${args.projectName}</h2>
                        <p><strong>Bug:</strong> ${args.bugTitle}</p>
                        <p><strong>From:</strong> ${args.commentAuthor}</p>
                        <p><strong>Comment:</strong> ${args.commentBody}</p>
                        <br/>
                        <p style="color: #666;">Log into your BugScribe dashboard to reply.</p>
                    </div>
                `,
            });
        } catch (error) {
            console.error("Failed to send Resend email:", error);
        }
    }
});
