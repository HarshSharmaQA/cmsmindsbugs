import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getEffectiveIdentity } from "./users";

// ─── Create Booking (public) ──────────────────────────────────────────────────

export const create = mutation({
    args: {
        pageSlug: v.string(),
        service: v.string(),
        date: v.string(),
        time: v.string(),
        timezone: v.string(),
        name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        company: v.optional(v.string()),
        message: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!args.name?.trim()) throw new Error("Name is required.");
        if (!args.email?.trim() || !args.email.includes("@")) throw new Error("Valid email is required.");
        if (!args.date) throw new Error("Date is required.");
        if (!args.time) throw new Error("Time is required.");

        // Check for duplicate booking on same date+time+page
        const existing = await ctx.db
            .query("bookings")
            .withIndex("by_page", q => q.eq("pageSlug", args.pageSlug))
            .filter(q =>
                q.and(
                    q.eq(q.field("date"), args.date),
                    q.eq(q.field("time"), args.time),
                    q.neq(q.field("status"), "cancelled")
                )
            )
            .first();

        if (existing) throw new Error("This time slot is already booked. Please choose another.");

        return await ctx.db.insert("bookings", {
            ...args,
            status: "pending",
            createdAt: Date.now(),
        });
    },
});

// ─── List Bookings (admin) ────────────────────────────────────────────────────

export const list = query({
    args: {
        devToken: v.optional(v.string()),
        pageSlug: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db.query("users").withIndex("by_token_identifier", q => q.eq("tokenIdentifier", identity.subject)).first();

        if (!user || user.role !== "super_admin") throw new Error("Unauthorized");

        const bookingsQuery = ctx.db.query("bookings").order("desc");
        const allBookings = await bookingsQuery.collect();

        return args.pageSlug
            ? allBookings.filter(b => b.pageSlug === args.pageSlug)
            : allBookings;
    },
});

// ─── Update Status (admin) ────────────────────────────────────────────────────

export const updateStatus = mutation({
    args: {
        devToken: v.optional(v.string()),
        id: v.id("bookings"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await getEffectiveIdentity(ctx, args.devToken);
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db.query("users").withIndex("by_token_identifier", q => q.eq("tokenIdentifier", identity.subject)).first();

        if (!user || user.role !== "super_admin") throw new Error("Unauthorized");

        await ctx.db.patch(args.id, { status: args.status });
    },
});

// ─── Get booked slots for a date (public) ────────────────────────────────────

export const getBookedSlots = query({
    args: { pageSlug: v.string(), date: v.string() },
    handler: async (ctx, args) => {
        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_page", q => q.eq("pageSlug", args.pageSlug))
            .filter(q =>
                q.and(
                    q.eq(q.field("date"), args.date),
                    q.neq(q.field("status"), "cancelled")
                )
            )
            .collect();
        return bookings.map(b => b.time);
    },
});
