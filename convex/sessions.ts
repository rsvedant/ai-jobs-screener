import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ========================================
// ACTIVE SESSION QUERIES
// ========================================

/**
 * Get all currently active voice interview sessions
 * Used by HR dashboard for real-time monitoring
 */
export const getActiveSessions = query({
  args: {},
  handler: async (ctx) => {
    const activeSessions = await ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc") // Most recent first
      .collect();

    // Enrich with candidate information
    const enrichedSessions = await Promise.all(
      activeSessions.map(async (session) => {
        const candidate = await ctx.db.get(session.candidateId);
        return {
          ...session,
          candidate: candidate ? {
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
            position: candidate.position,
            tradeCategory: candidate.tradeCategory,
          } : null,
        };
      })
    );

    return enrichedSessions;
  },
});

/**
 * Get active session count for dashboard metrics
 */
export const getActiveSessionCount = query({
  args: {},
  handler: async (ctx) => {
    const count = await ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect()
      .then(sessions => sessions.length);

    return { count, timestamp: Date.now() };
  },
});

/**
 * Get specific active session by ID with real-time data
 */
export const getActiveSessionById = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    
    if (!session || session.status !== "active") {
      return null;
    }

    const candidate = await ctx.db.get(session.candidateId);
    
    return {
      ...session,
      candidate: candidate ? {
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        position: candidate.position,
        tradeCategory: candidate.tradeCategory,
        screeningStatus: candidate.screeningStatus,
      } : null,
    };
  },
});

// ========================================
// SESSION HISTORY & FILTERING
// ========================================

/**
 * Get session history with comprehensive filtering options
 */
export const getSessionHistory = query({
  args: {
    // Pagination
    limit: v.optional(v.number()), // Default 50
    cursor: v.optional(v.string()), // For pagination
    
    // Filtering options
    status: v.optional(v.union(
      v.literal("created"),
      v.literal("active"), 
      v.literal("completed"),
      v.literal("failed"),
      v.literal("abandoned")
    )),
    tradeCategory: v.optional(v.union(
      v.literal("construction"),
      v.literal("electrical"),
      v.literal("plumbing"),
      v.literal("welding"),
      v.literal("manufacturing"),
      v.literal("maintenance"),
      v.literal("general")
    )),
    candidateId: v.optional(v.id("candidates")),
    
    // Date range filtering
    startDateFrom: v.optional(v.number()), // Unix timestamp
    startDateTo: v.optional(v.number()),   // Unix timestamp
    
    // Duration filtering
    minDuration: v.optional(v.number()), // Minimum duration in minutes
    maxDuration: v.optional(v.number()), // Maximum duration in minutes
    
    // Quality filters
    hasRecording: v.optional(v.boolean()),
    hasErrors: v.optional(v.boolean()),
    hrMonitored: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    // Start with base query
    let query = ctx.db.query("sessions").order("desc");
    
    // Apply status filter if provided
    if (args.status) {
      query = ctx.db
        .query("sessions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc");
    }
    
    // Apply date range filter if provided
    if (args.startDateFrom || args.startDateTo) {
      query = ctx.db
        .query("sessions")
        .withIndex("by_start_time", (q) => {
          if (args.startDateFrom && args.startDateTo) {
            return q.gte("startTime", args.startDateFrom).lte("startTime", args.startDateTo);
          } else if (args.startDateFrom) {
            return q.gte("startTime", args.startDateFrom);
          } else if (args.startDateTo) {
            return q.lte("startTime", args.startDateTo);
          }
          return q;
        })
        .order("desc");
    }

    let sessions = await query.collect();

    // Apply additional filters that require post-query filtering
    if (args.candidateId) {
      sessions = sessions.filter(session => session.candidateId === args.candidateId);
    }

    if (args.minDuration !== undefined || args.maxDuration !== undefined) {
      sessions = sessions.filter(session => {
        if (!session.duration) return false;
        const durationMinutes = session.duration / (1000 * 60);
        
        if (args.minDuration !== undefined && durationMinutes < args.minDuration) {
          return false;
        }
        if (args.maxDuration !== undefined && durationMinutes > args.maxDuration) {
          return false;
        }
        return true;
      });
    }

    if (args.hasRecording !== undefined) {
      sessions = sessions.filter(session => 
        args.hasRecording ? !!session.recordingUrl : !session.recordingUrl
      );
    }

    if (args.hasErrors !== undefined) {
      sessions = sessions.filter(session => 
        args.hasErrors ? (session.errors && session.errors.length > 0) : (!session.errors || session.errors.length === 0)
      );
    }

    if (args.hrMonitored !== undefined) {
      sessions = sessions.filter(session => session.hrMonitored === args.hrMonitored);
    }

    // Apply pagination
    sessions = sessions.slice(0, limit);

    // Enrich with candidate and assessment data
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const [candidate, assessment] = await Promise.all([
          ctx.db.get(session.candidateId),
          ctx.db
            .query("assessments")
            .withIndex("by_session", (q) => q.eq("sessionId", session._id))
            .first()
        ]);

        // Apply trade category filter if candidate data is available
        if (args.tradeCategory && candidate && candidate.tradeCategory !== args.tradeCategory) {
          return null; // Will be filtered out
        }

        return {
          ...session,
          candidate: candidate ? {
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
            position: candidate.position,
            tradeCategory: candidate.tradeCategory,
            screeningStatus: candidate.screeningStatus,
          } : null,
          assessment: assessment ? {
            overallScore: assessment.overallScore,
            passed: assessment.passed,
            completedAt: assessment.completedAt,
          } : null,
        };
      })
    );

    // Filter out null entries (trade category mismatch)
    const validSessions = enrichedSessions.filter(session => session !== null);

    return {
      sessions: validSessions,
      hasMore: sessions.length === limit,
      total: validSessions.length,
    };
  },
});

/**
 * Get sessions by candidate ID
 */
export const getSessionsByCandidate = query({
  args: { candidateId: v.id("candidates") },
  handler: async (ctx, { candidateId }) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_candidate", (q) => q.eq("candidateId", candidateId))
      .order("desc")
      .collect();

    // Enrich with assessment data
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const assessment = await ctx.db
          .query("assessments")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .first();

        return {
          ...session,
          assessment: assessment ? {
            overallScore: assessment.overallScore,
            passed: assessment.passed,
            completedAt: assessment.completedAt,
          } : null,
        };
      })
    );

    return enrichedSessions;
  },
});

// ========================================
// SESSION ANALYTICS & REPORTING
// ========================================

/**
 * Get session analytics and statistics
 */
export const getSessionAnalytics = query({
  args: {
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    tradeCategory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const dateFrom = args.dateFrom || (Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const dateTo = args.dateTo || Date.now();

    // Get sessions in date range
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_start_time", (q) => 
        q.gte("startTime", dateFrom).lte("startTime", dateTo)
      )
      .collect();

    // Filter by trade category if provided
    let filteredSessions = sessions;
    if (args.tradeCategory) {
      const candidateIds = new Set(sessions.map(s => s.candidateId));
      const candidates = await Promise.all(
        Array.from(candidateIds).map(id => ctx.db.get(id))
      );
      const tradeCandidateIds = new Set(
        candidates
          .filter(c => c && c.tradeCategory === args.tradeCategory)
          .map(c => c!._id)
      );
      
      filteredSessions = sessions.filter(s => tradeCandidateIds.has(s.candidateId));
    }

    // Calculate statistics
    const totalSessions = filteredSessions.length;
    const completedSessions = filteredSessions.filter(s => s.status === "completed").length;
    const abandonedSessions = filteredSessions.filter(s => s.status === "abandoned").length;
    const failedSessions = filteredSessions.filter(s => s.status === "failed").length;
    
    const sessionsWithDuration = filteredSessions.filter(s => s.duration);
    const avgDuration = sessionsWithDuration.length > 0 
      ? sessionsWithDuration.reduce((sum, s) => sum + (s.duration || 0), 0) / sessionsWithDuration.length
      : 0;

    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    const abandonmentRate = totalSessions > 0 ? (abandonedSessions / totalSessions) * 100 : 0;

    // Session counts by status
    const statusCounts = {
      created: filteredSessions.filter(s => s.status === "created").length,
      active: filteredSessions.filter(s => s.status === "active").length,
      completed: completedSessions,
      failed: failedSessions,
      abandoned: abandonedSessions,
    };

    // Daily session counts
    const dailyCounts: Record<string, number> = {};
    filteredSessions.forEach(session => {
      const date = new Date(session.startTime).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return {
      summary: {
        totalSessions,
        completedSessions,
        abandonedSessions,
        failedSessions,
        completionRate: Math.round(completionRate * 100) / 100,
        abandonmentRate: Math.round(abandonmentRate * 100) / 100,
        avgDurationMinutes: Math.round((avgDuration / (1000 * 60)) * 100) / 100,
      },
      statusCounts,
      dailyCounts,
      dateRange: { from: dateFrom, to: dateTo },
    };
  },
});

// ========================================
// SESSION MUTATIONS (CREATE, UPDATE, COMPLETE)
// ========================================

/**
 * Create a new voice interview session
 */
export const createSession = mutation({
  args: {
    candidateId: v.id("candidates"),
    sessionId: v.string(), // From Vapi
    vapiSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }

    const sessionId = await ctx.db.insert("sessions", {
      sessionId: args.sessionId,
      candidateId: args.candidateId,
      status: "created",
      startTime: Date.now(),
      vapiSessionId: args.vapiSessionId,
      transcripts: [],
      hrMonitored: false,
    });

    // Update candidate status
    await ctx.db.patch(args.candidateId, {
      screeningStatus: "in_progress",
      lastContactAt: Date.now(),
    });

    return sessionId;
  },
});

/**
 * Start an active session
 */
export const startSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    vapiSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    await ctx.db.patch(args.sessionId, {
      status: "active",
      startTime: Date.now(),
      vapiSessionId: args.vapiSessionId,
    });

    return { success: true };
  },
});

/**
 * Update session with real-time data (transcripts, connection quality)
 */
export const updateSessionData = mutation({
  args: {
    sessionId: v.id("sessions"),
    transcripts: v.optional(v.array(v.object({
      id: v.string(),
      text: v.string(),
      role: v.union(v.literal("user"), v.literal("assistant")),
      timestamp: v.number(),
      confidence: v.optional(v.number()),
      isFinal: v.boolean()
    }))),
    connectionQuality: v.optional(v.object({
      latency: v.number(),
      audioQuality: v.string(),
      connectionStability: v.number(),
      disconnectCount: v.number()
    })),
    recordingUrl: v.optional(v.string()),
    errors: v.optional(v.array(v.object({
      code: v.string(),
      message: v.string(),
      timestamp: v.number(),
      details: v.optional(v.record(v.string(), v.any()))
    }))),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const updates: Partial<typeof session> = {};

    if (args.transcripts !== undefined) {
      updates.transcripts = args.transcripts;
    }

    if (args.connectionQuality !== undefined) {
      updates.connectionQuality = args.connectionQuality;
    }

    if (args.recordingUrl !== undefined) {
      updates.recordingUrl = args.recordingUrl;
    }

    if (args.errors !== undefined) {
      updates.errors = args.errors;
    }

    await ctx.db.patch(args.sessionId, updates);

    return { success: true };
  },
});

/**
 * Complete a session (successful completion)
 */
export const completeSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    recordingUrl: v.optional(v.string()),
    finalTranscripts: v.optional(v.array(v.object({
      id: v.string(),
      text: v.string(),
      role: v.union(v.literal("user"), v.literal("assistant")),
      timestamp: v.number(),
      confidence: v.optional(v.number()),
      isFinal: v.boolean()
    }))),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const endTime = Date.now();
    const duration = endTime - session.startTime;

    await ctx.db.patch(args.sessionId, {
      status: "completed",
      endTime,
      duration,
      recordingUrl: args.recordingUrl || session.recordingUrl,
      transcripts: args.finalTranscripts || session.transcripts,
    });

    // Update candidate status
    await ctx.db.patch(session.candidateId, {
      screeningStatus: "completed",
      lastContactAt: endTime,
    });

    return { success: true, duration };
  },
});

/**
 * Mark session as failed or abandoned
 */
export const failSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    reason: v.union(v.literal("failed"), v.literal("abandoned")),
    errorDetails: v.optional(v.object({
      code: v.string(),
      message: v.string(),
      details: v.optional(v.record(v.string(), v.any()))
    })),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const endTime = Date.now();
    const duration = endTime - session.startTime;

    const updates: Partial<typeof session> = {
      status: args.reason,
      endTime,
      duration,
    };

    if (args.errorDetails) {
      const existingErrors = session.errors || [];
      updates.errors = [...existingErrors, {
        ...args.errorDetails,
        timestamp: endTime,
      }];
    }

    await ctx.db.patch(args.sessionId, updates);

    // Update candidate status based on reason
    const candidateStatus = args.reason === "abandoned" ? "invited" : "pending_review";
    await ctx.db.patch(session.candidateId, {
      screeningStatus: candidateStatus,
      lastContactAt: endTime,
    });

    return { success: true };
  },
});

// ========================================
// HR MONITORING & REAL-TIME FEATURES
// ========================================

/**
 * Enable HR monitoring for a session
 */
export const enableHRMonitoring = mutation({
  args: {
    sessionId: v.id("sessions"),
    hrUserId: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      hrMonitored: true,
      hrNotes: args.notes,
    });

    return { success: true };
  },
});

/**
 * Add HR notes to a session
 */
export const addHRNotes = mutation({
  args: {
    sessionId: v.id("sessions"),
    notes: v.string(),
    hrUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const existingNotes = session.hrNotes || "";
    const timestamp = new Date().toISOString();
    const newNotes = existingNotes 
      ? `${existingNotes}\n\n[${timestamp}]: ${args.notes}`
      : `[${timestamp}]: ${args.notes}`;

    await ctx.db.patch(args.sessionId, {
      hrNotes: newNotes,
    });

    return { success: true };
  },
});

/**
 * Get real-time session updates for dashboard
 */
export const getSessionUpdates = query({
  args: {
    lastUpdateTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cutoffTime = args.lastUpdateTime || (Date.now() - 5 * 60 * 1000); // 5 minutes ago

    // Get recently updated sessions
    const recentSessions = await ctx.db
      .query("sessions")
      .order("desc")
      .filter((q) => q.gte(q.field("startTime"), cutoffTime))
      .collect();

    // Enrich with candidate data
    const enrichedSessions = await Promise.all(
      recentSessions.map(async (session) => {
        const candidate = await ctx.db.get(session.candidateId);
        return {
          ...session,
          candidate: candidate ? {
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
            position: candidate.position,
            tradeCategory: candidate.tradeCategory,
          } : null,
        };
      })
    );

    return {
      sessions: enrichedSessions,
      timestamp: Date.now(),
    };
  },
});
