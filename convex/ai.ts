import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { encode as toonEncode, decode as toonDecode, generateStructure } from "../lib/toon";

export const classifyBug = internalAction({
  args: { bugId: v.id("bugs") },
  handler: async (ctx, args) => {
    // 1. Fetch the bug details via a query
    const bug = await ctx.runQuery(internal.ai.getBugForClassification, { bugId: args.bugId });
    if (!bug) return;

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY is not set in Convex variables. Skipping classification.");
      return;
    }

    try {
      // Use TOON for more token-efficient bug report representation
      const bugData = {
        title: bug.title,
        description: bug.description || "N/A",
        consoleErrors: bug.consoleErrors || [],
        url: bug.url,
        browserOS: `${bug.browser} on ${bug.os}`
      };

      const toonBugReport = toonEncode(bugData);

      // Generate the expected output structure using TOON's generator
      const outputStructure = generateStructure({
        priority: "one of [low, medium, high, critical]",
        type: "one of [UI/UX, Network, Logic, Crash, general]"
      });

      const prompt = `
You are an expert software triage engineer. Analyze the following bug report in TOON (Token-Oriented Object Notation) format and determine its "priority" and "type".

${toonBugReport}

Valid Priorities: ["low", "medium", "high", "critical"]
Valid Types: ["UI/UX", "Network", "Logic", "Crash", "general"]

Respond strictly in TOON format matching this structure:
${outputStructure}
`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2, // Low temp for more deterministic classification
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API failed: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("No content received from AI");

      // Decode the TOON response
      const parsed = toonDecode(content) as any;

      // Validate parsed outputs against acceptable schema
      const validPriorities = ["low", "medium", "high", "critical"];
      const priority = validPriorities.includes(parsed?.priority) ? parsed.priority : undefined;
      const type = parsed?.type;

      // Update the bug with the AI's classification
      if (priority || type) {
        await ctx.runMutation(internal.ai.updateBugClassification, {
          bugId: args.bugId,
          priority,
          type,
        });
      }
    } catch (err) {
      console.error("AI Classification failed:", err);
    }
  },
});

export const getBugForClassification = internalQuery({
  args: { bugId: v.id("bugs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.bugId);
  },
});

export const updateBugClassification = internalMutation({
  args: {
    bugId: v.id("bugs"),
    priority: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: any = { updatedAt: Date.now() };
    if (args.priority) patch.priority = args.priority;
    if (args.type) patch.type = args.type;

    await ctx.db.patch(args.bugId, patch);

    const bug = await ctx.db.get(args.bugId);
    if (!bug) return;
    
    // Log the activity
    const pStr = args.priority ? "Priority " + args.priority : "";
    const tStr = args.type ? "Type " + args.type : "";
    
    await ctx.scheduler.runAfter(0, internal.activities.logActivity, {
      bugId: args.bugId,
      projectId: bug.projectId,
      actorName: "AI Assessor",
      actorEmail: "ai@bugscribe.com",
      type: "updated",
      detail: "AI categorized: " + pStr + " " + tStr,
    });
  },
});
