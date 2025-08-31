import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal query to get session data for background tasks
 */
export const getSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

/**
 * Internal query to get candidate data for background tasks
 */
export const getCandidate = query({
  args: { candidateId: v.id("candidates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.candidateId);
  },
});
