import { query } from "./_generated/server";

export const getFirstProject = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("projects").first();
    },
});
