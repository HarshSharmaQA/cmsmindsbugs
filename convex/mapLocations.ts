/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getEffectiveIdentity } from "./users";

/** Helper: assert caller is super_admin */
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
        throw new Error("Unauthorized: Only super admins can manage map locations");
    }
}

/** List all map locations (public) */
export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("mapLocations").order("desc").collect();
    },
});

/** Create a new map location (super admin only) */
export const create = mutation({
    args: {
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
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await assertSuperAdmin(ctx, args.devToken);
        const now = Date.now();
        return await ctx.db.insert("mapLocations", {
            name: args.name,
            productBy: args.productBy,
            subtitle: args.subtitle,
            image: args.image,
            price: args.price,
            priceLabel: args.priceLabel,
            priceSubtext: args.priceSubtext,
            rating: args.rating,
            lat: args.lat,
            lng: args.lng,
            purchases: args.purchases,
            state: args.state,
            city: args.city,
            buyLink: args.buyLink,
            createdAt: now,
            updatedAt: now,
        });
    },
});

/** Update an existing map location (super admin only) */
export const update = mutation({
    args: {
        id: v.id("mapLocations"),
        name: v.optional(v.string()),
        productBy: v.optional(v.string()),
        subtitle: v.optional(v.string()),
        image: v.optional(v.string()),
        price: v.optional(v.number()),
        priceLabel: v.optional(v.string()),
        priceSubtext: v.optional(v.string()),
        rating: v.optional(v.number()),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        purchases: v.optional(v.number()),
        state: v.optional(v.string()),
        city: v.optional(v.string()),
        buyLink: v.optional(v.string()),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await assertSuperAdmin(ctx, args.devToken);
        const { id, devToken: _devToken, ...fields } = args;
        const patch: Record<string, any> = { updatedAt: Date.now() };
        for (const [key, val] of Object.entries(fields)) {
            if (val !== undefined) patch[key] = val;
        }
        await ctx.db.patch(id, patch);
    },
});

/** Delete a map location (super admin only) */
export const remove = mutation({
    args: {
        id: v.id("mapLocations"),
        devToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await assertSuperAdmin(ctx, args.devToken);
        await ctx.db.delete(args.id);
    },
});
