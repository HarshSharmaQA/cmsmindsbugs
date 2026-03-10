import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── Super Admin Validation ───────────────────────────────────────────────────
import { getEffectiveIdentity } from "./users";

async function assertSuperAdmin(ctx: any, devToken?: string) {
    const identity = await getEffectiveIdentity(ctx, devToken);
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q: any) =>
            q.eq("tokenIdentifier", identity.subject)
        )
        .unique();

    if (!user || user.role !== "super_admin") {
        throw new Error("Unauthorized");
    }
}

// ── API Functions ────────────────────────────────────────────────────────────

export const get = query({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        const setting = await ctx.db
            .query("globalSettings")
            .withIndex("by_key", (q: any) => q.eq("key", args.key))
            .unique();
        return setting ? setting.value : undefined;
    },
});

export const setSetting = mutation({
    args: {
        key: v.string(),
        value: v.any(),
        devToken: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        await assertSuperAdmin(ctx, args.devToken);

        const existing = await ctx.db
            .query("globalSettings")
            .withIndex("by_key", (q) => q.eq("key", args.key))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { value: args.value, updatedAt: Date.now() });
        } else {
            await ctx.db.insert("globalSettings", {
                key: args.key,
                value: args.value,
                updatedAt: Date.now()
            });
        }
    },
});
