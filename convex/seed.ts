import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Hash a password using SHA-256 with a salt for secure storage.
 * Format: "sha256:<salt>:<hash>"
 */
async function hashPassword(password: string): Promise<string> {
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, "0")).join("");
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0")).join("");
    return `sha256:${salt}:${hash}`;
}

/**
 * One-time mutation to seed the initial Super Admin user.
 * This can be run from the Convex dashboard or CLI.
 */
export const seedSuperAdmin = mutation({
    args: {},
    handler: async (ctx) => {
        const email = "harshsharmaqa@gmail.com";
        const password = "Admin@123";
        const name = "Harsh Sharma";
        const role = "super_admin";
        const isApproved = true;
        const realTokenIdentifier = `user:${email}`;

        const existing = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();

        const hashedPassword = await hashPassword(password);

        if (existing) {
            await ctx.db.patch(existing._id, {
                tokenIdentifier: realTokenIdentifier,
                password: hashedPassword,
                name,
                role,
                isApproved,
            });
            return { status: "updated", userId: existing._id };
        } else {
            const userId = await ctx.db.insert("users", {
                tokenIdentifier: realTokenIdentifier,
                email,
                password: hashedPassword,
                name,
                role,
                isApproved,
            } as any);
            return { status: "created", userId };
        }
    },
});
