import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ========================================
// CANDIDATE QUERIES & SEARCH
// ========================================

/**
 * Get all candidates with comprehensive filtering and search
 */
export const getCandidates = query({
  args: {
    // Pagination
    limit: v.optional(v.number()), // Default 50
    cursor: v.optional(v.string()),
    
    // Search
    searchTerm: v.optional(v.string()), // Search by name, email, position
    
    // Filtering
    tradeCategory: v.optional(v.union(
      v.literal("construction"),
      v.literal("electrical"),
      v.literal("plumbing"),
      v.literal("welding"),
      v.literal("manufacturing"),
      v.literal("maintenance"),
      v.literal("general")
    )),
    screeningStatus: v.optional(v.union(
      v.literal("invited"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("passed"),
      v.literal("failed"),
      v.literal("pending_review")
    )),
    position: v.optional(v.string()),
    flagged: v.optional(v.boolean()),
    
    // Date filtering
    invitedAfter: v.optional(v.number()),
    invitedBefore: v.optional(v.number()),
    lastContactAfter: v.optional(v.number()),
    lastContactBefore: v.optional(v.number()),
    
    // Consent filtering
    consentGiven: v.optional(v.boolean()),
    gdprConsent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    // Start with base query
    let candidates = await ctx.db.query("candidates").order("desc").collect();
    
    // Apply search filter
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      candidates = candidates.filter(candidate => {
        const firstName = candidate.firstName?.toLowerCase() || "";
        const lastName = candidate.lastName?.toLowerCase() || "";
        const email = candidate.email.toLowerCase();
        const position = candidate.position.toLowerCase();
        
        return firstName.includes(searchLower) ||
               lastName.includes(searchLower) ||
               email.includes(searchLower) ||
               position.includes(searchLower);
      });
    }
    
    // Apply filters
    if (args.tradeCategory) {
      candidates = candidates.filter(c => c.tradeCategory === args.tradeCategory);
    }
    
    if (args.screeningStatus) {
      candidates = candidates.filter(c => c.screeningStatus === args.screeningStatus);
    }
    
    if (args.position) {
      candidates = candidates.filter(c => 
        c.position.toLowerCase().includes(args.position!.toLowerCase())
      );
    }
    
    if (args.flagged !== undefined) {
      candidates = candidates.filter(c => c.flagged === args.flagged);
    }
    
    if (args.consentGiven !== undefined) {
      candidates = candidates.filter(c => c.consentGiven === args.consentGiven);
    }
    
    if (args.gdprConsent !== undefined) {
      candidates = candidates.filter(c => c.gdprConsent === args.gdprConsent);
    }
    
    // Date filtering
    if (args.invitedAfter && args.invitedBefore) {
      candidates = candidates.filter(c => 
        c.invitedAt && c.invitedAt >= args.invitedAfter! && c.invitedAt <= args.invitedBefore!
      );
    } else if (args.invitedAfter) {
      candidates = candidates.filter(c => 
        c.invitedAt && c.invitedAt >= args.invitedAfter!
      );
    } else if (args.invitedBefore) {
      candidates = candidates.filter(c => 
        c.invitedAt && c.invitedAt <= args.invitedBefore!
      );
    }
    
    if (args.lastContactAfter && args.lastContactBefore) {
      candidates = candidates.filter(c => 
        c.lastContactAt && c.lastContactAt >= args.lastContactAfter! && c.lastContactAt <= args.lastContactBefore!
      );
    } else if (args.lastContactAfter) {
      candidates = candidates.filter(c => 
        c.lastContactAt && c.lastContactAt >= args.lastContactAfter!
      );
    } else if (args.lastContactBefore) {
      candidates = candidates.filter(c => 
        c.lastContactAt && c.lastContactAt <= args.lastContactBefore!
      );
    }
    
    // Apply pagination
    const paginatedCandidates = candidates.slice(0, limit);
    
    // Enrich with session and assessment data
    const enrichedCandidates = await Promise.all(
      paginatedCandidates.map(async (candidate) => {
        const sessions = await ctx.db
          .query("sessions")
          .withIndex("by_candidate", (q) => q.eq("candidateId", candidate._id))
          .order("desc")
          .collect();
        
        const latestSession = sessions[0] || null;
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.status === "completed").length;
        
        // Get latest assessment if available
        let latestAssessment = null;
        if (latestSession) {
          latestAssessment = await ctx.db
            .query("assessments")
            .withIndex("by_session", (q) => q.eq("sessionId", latestSession._id))
            .first();
        }
        
        return {
          ...candidate,
          stats: {
            totalSessions,
            completedSessions,
            latestSessionAt: latestSession?.startTime || null,
            latestSessionStatus: latestSession?.status || null,
          },
          latestAssessment: latestAssessment ? {
            overallScore: latestAssessment.overallScore,
            passed: latestAssessment.passed,
            completedAt: latestAssessment.completedAt,
          } : null,
        };
      })
    );
    
    return {
      candidates: enrichedCandidates,
      hasMore: candidates.length > limit,
      total: candidates.length,
    };
  },
});

/**
 * Get candidate by ID with full details
 */
export const getCandidateById = query({
  args: { candidateId: v.id("candidates") },
  handler: async (ctx, { candidateId }) => {
    const candidate = await ctx.db.get(candidateId);
    if (!candidate) {
      return null;
    }
    
    // Get all sessions for this candidate with assessment data
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_candidate", (q) => q.eq("candidateId", candidateId))
      .order("desc")
      .collect();
    
    // Enrich sessions with assessment data
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
    
    // Get all assessments for this candidate
    const assessments = await Promise.all(
      sessions.map(async (session) => {
        const assessment = await ctx.db
          .query("assessments")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .first();
        
        return assessment ? { ...assessment, session } : null;
      })
    );
    
    const validAssessments = assessments.filter(a => a !== null);
    
    return {
      ...candidate,
      sessions: enrichedSessions,
      assessments: validAssessments,
      stats: {
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.status === "completed").length,
        passedAssessments: validAssessments.filter(a => a.passed).length,
        averageScore: validAssessments.length > 0 
          ? validAssessments.reduce((sum, a) => sum + a.overallScore, 0) / validAssessments.length
          : null,
      },
    };
  },
});

/**
 * Get candidate by email
 */
export const getCandidateByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const candidate = await ctx.db
      .query("candidates")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    return candidate;
  },
});

/**
 * Get candidate analytics and statistics
 */
export const getCandidateAnalytics = query({
  args: {
    tradeCategory: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dateFrom = args.dateFrom || (Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const dateTo = args.dateTo || Date.now();
    
    // Get candidates in date range (by invitation date)
    let candidates = await ctx.db.query("candidates").collect();
    
    // Filter by trade category if provided
    if (args.tradeCategory) {
      candidates = candidates.filter(c => c.tradeCategory === args.tradeCategory);
    }
    
    // Filter by date range (invited within range)
    candidates = candidates.filter(c => 
      c.invitedAt && c.invitedAt >= dateFrom && c.invitedAt <= dateTo
    );
    
    // Calculate statistics
    const totalCandidates = candidates.length;
    const invited = candidates.filter(c => c.screeningStatus === "invited").length;
    const inProgress = candidates.filter(c => c.screeningStatus === "in_progress").length;
    const completed = candidates.filter(c => c.screeningStatus === "completed").length;
    const passed = candidates.filter(c => c.screeningStatus === "passed").length;
    const failed = candidates.filter(c => c.screeningStatus === "failed").length;
    const pendingReview = candidates.filter(c => c.screeningStatus === "pending_review").length;
    const flagged = candidates.filter(c => c.flagged).length;
    
    // Conversion rates
    const completionRate = totalCandidates > 0 ? (completed / totalCandidates) * 100 : 0;
    const passRate = totalCandidates > 0 ? (passed / totalCandidates) * 100 : 0;
    const flagRate = totalCandidates > 0 ? (flagged / totalCandidates) * 100 : 0;
    
    // Trade category breakdown
    const tradeCategoryBreakdown: Record<string, number> = {};
    candidates.forEach(candidate => {
      const category = candidate.tradeCategory;
      tradeCategoryBreakdown[category] = (tradeCategoryBreakdown[category] || 0) + 1;
    });
    
    // Daily invitation counts
    const dailyInvitations: Record<string, number> = {};
    candidates.forEach(candidate => {
      if (candidate.invitedAt) {
        const date = new Date(candidate.invitedAt).toISOString().split('T')[0];
        dailyInvitations[date] = (dailyInvitations[date] || 0) + 1;
      }
    });
    
    return {
      summary: {
        totalCandidates,
        invited,
        inProgress,
        completed,
        passed,
        failed,
        pendingReview,
        flagged,
        completionRate: Math.round(completionRate * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        flagRate: Math.round(flagRate * 100) / 100,
      },
      statusBreakdown: {
        invited,
        inProgress,
        completed,
        passed,
        failed,
        pendingReview,
      },
      tradeCategoryBreakdown,
      dailyInvitations,
      dateRange: { from: dateFrom, to: dateTo },
    };
  },
});

// ========================================
// CANDIDATE MUTATIONS (CREATE, UPDATE)
// ========================================

/**
 * Create a new candidate
 */
export const createCandidate = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    position: v.string(),
    tradeCategory: v.union(
      v.literal("construction"),
      v.literal("electrical"),
      v.literal("plumbing"),
      v.literal("welding"),
      v.literal("manufacturing"),
      v.literal("maintenance"),
      v.literal("general")
    ),
    source: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    timezone: v.optional(v.string()),
    preferredContactMethod: v.optional(v.union(
      v.literal("email"),
      v.literal("phone"),
      v.literal("sms")
    )),
    consentGiven: v.boolean(),
    gdprConsent: v.optional(v.boolean()),
    hrNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if candidate already exists
    const existingCandidate = await ctx.db
      .query("candidates")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existingCandidate) {
      throw new Error("Candidate with this email already exists");
    }
    
    const now = Date.now();
    
    const candidateId = await ctx.db.insert("candidates", {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      position: args.position,
      tradeCategory: args.tradeCategory,
      screeningStatus: "invited",
      invitedAt: now,
      lastContactAt: now,
      source: args.source,
      referralCode: args.referralCode,
      timezone: args.timezone,
      preferredContactMethod: args.preferredContactMethod,
      flagged: false,
      consentGiven: args.consentGiven,
      consentTimestamp: args.consentGiven ? now : undefined,
      gdprConsent: args.gdprConsent,
      hrNotes: args.hrNotes,
    });
    
    return candidateId;
  },
});

/**
 * Update candidate profile information
 */
export const updateCandidate = mutation({
  args: {
    candidateId: v.id("candidates"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    position: v.optional(v.string()),
    tradeCategory: v.optional(v.union(
      v.literal("construction"),
      v.literal("electrical"),
      v.literal("plumbing"),
      v.literal("welding"),
      v.literal("manufacturing"),
      v.literal("maintenance"),
      v.literal("general")
    )),
    timezone: v.optional(v.string()),
    preferredContactMethod: v.optional(v.union(
      v.literal("email"),
      v.literal("phone"),
      v.literal("sms")
    )),
    source: v.optional(v.string()),
    referralCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }
    
    const updates: Partial<typeof candidate> = {
      lastContactAt: Date.now(),
    };
    
    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.position !== undefined) updates.position = args.position;
    if (args.tradeCategory !== undefined) updates.tradeCategory = args.tradeCategory;
    if (args.timezone !== undefined) updates.timezone = args.timezone;
    if (args.preferredContactMethod !== undefined) updates.preferredContactMethod = args.preferredContactMethod;
    if (args.source !== undefined) updates.source = args.source;
    if (args.referralCode !== undefined) updates.referralCode = args.referralCode;
    
    await ctx.db.patch(args.candidateId, updates);
    
    return { success: true };
  },
});

/**
 * Update candidate screening status
 */
export const updateScreeningStatus = mutation({
  args: {
    candidateId: v.id("candidates"),
    status: v.union(
      v.literal("invited"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("passed"),
      v.literal("failed"),
      v.literal("pending_review")
    ),
    hrNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }
    
    const updates: Partial<typeof candidate> = {
      screeningStatus: args.status,
      lastContactAt: Date.now(),
    };
    
    if (args.hrNotes) {
      const existingNotes = candidate.hrNotes || "";
      const timestamp = new Date().toISOString();
      updates.hrNotes = existingNotes 
        ? `${existingNotes}\n\n[${timestamp}]: ${args.hrNotes}`
        : `[${timestamp}]: ${args.hrNotes}`;
    }
    
    await ctx.db.patch(args.candidateId, updates);
    
    return { success: true };
  },
});

// ========================================
// CANDIDATE FLAGGING & HR MANAGEMENT
// ========================================

/**
 * Flag a candidate for HR review
 */
export const flagCandidate = mutation({
  args: {
    candidateId: v.id("candidates"),
    flagReason: v.string(),
    hrNotes: v.optional(v.string()),
    flaggedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }
    
    const timestamp = new Date().toISOString();
    const flagNote = `[${timestamp}] FLAGGED: ${args.flagReason}`;
    
    const existingNotes = candidate.hrNotes || "";
    const newNotes = args.hrNotes 
      ? `${flagNote}\nNotes: ${args.hrNotes}`
      : flagNote;
    
    const updatedHRNotes = existingNotes 
      ? `${existingNotes}\n\n${newNotes}`
      : newNotes;
    
    await ctx.db.patch(args.candidateId, {
      flagged: true,
      flagReason: args.flagReason,
      hrNotes: updatedHRNotes,
      lastContactAt: Date.now(),
    });
    
    // Create a high-priority notification
    await ctx.db.insert("notifications", {
      type: "candidate_completed", // This should be updated to handle flagging
      priority: "high",
      title: "Candidate Flagged for Review",
      message: `Candidate ${candidate.firstName} ${candidate.lastName} (${candidate.email}) has been flagged: ${args.flagReason}`,
      candidateId: args.candidateId,
      read: false,
      acknowledged: false,
      deliveryMethod: ["dashboard"],
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Unflag a candidate
 */
export const unflagCandidate = mutation({
  args: {
    candidateId: v.id("candidates"),
    resolution: v.string(),
    resolvedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }
    
    const timestamp = new Date().toISOString();
    const resolutionNote = `[${timestamp}] FLAG RESOLVED: ${args.resolution}`;
    
    const existingNotes = candidate.hrNotes || "";
    const updatedHRNotes = existingNotes 
      ? `${existingNotes}\n\n${resolutionNote}`
      : resolutionNote;
    
    await ctx.db.patch(args.candidateId, {
      flagged: false,
      flagReason: undefined,
      hrNotes: updatedHRNotes,
      lastContactAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Add HR notes to a candidate
 */
export const addCandidateNotes = mutation({
  args: {
    candidateId: v.id("candidates"),
    notes: v.string(),
    addedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }
    
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}]: ${args.notes}`;
    
    const existingNotes = candidate.hrNotes || "";
    const updatedNotes = existingNotes 
      ? `${existingNotes}\n\n${newNote}`
      : newNote;
    
    await ctx.db.patch(args.candidateId, {
      hrNotes: updatedNotes,
      lastContactAt: Date.now(),
    });
    
    return { success: true };
  },
});

// ========================================
// SCORING & ASSESSMENT INTEGRATION
// ========================================

/**
 * Update candidate with assessment results and scoring
 */
export const updateCandidateScoring = mutation({
  args: {
    candidateId: v.id("candidates"),
    overallScore: v.number(),
    passed: v.boolean(),
    assessmentId: v.id("assessments"),
    autoAdvanceStatus: v.optional(v.boolean()), // Whether to auto-advance screening status
  },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }
    
    const updates: Partial<typeof candidate> = {
      lastContactAt: Date.now(),
    };
    
    // Auto-advance status based on assessment results
    if (args.autoAdvanceStatus !== false) {
      if (args.passed) {
        updates.screeningStatus = "passed";
      } else {
        updates.screeningStatus = "failed";
      }
    }
    
    await ctx.db.patch(args.candidateId, updates);
    
    // Create notifications based on performance
    if (args.passed && args.overallScore >= 90) {
      // Top performer notification
      await ctx.db.insert("notifications", {
        type: "top_performer",
        priority: "medium",
        title: "Top Performer Identified",
        message: `Candidate ${candidate.firstName} ${candidate.lastName} scored ${args.overallScore}% - excellent performance!`,
        candidateId: args.candidateId,
        read: false,
        acknowledged: false,
        deliveryMethod: ["dashboard"],
        createdAt: Date.now(),
      });
    } else if (!args.passed) {
      // Failed screening notification
      await ctx.db.insert("notifications", {
        type: "candidate_completed",
        priority: "low",
        title: "Candidate Failed Screening",
        message: `Candidate ${candidate.firstName} ${candidate.lastName} scored ${args.overallScore}% and did not pass screening.`,
        candidateId: args.candidateId,
        read: false,
        acknowledged: false,
        deliveryMethod: ["dashboard"],
        createdAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Get candidates by performance/scoring criteria
 */
export const getCandidatesByPerformance = query({
  args: {
    minScore: v.optional(v.number()),
    maxScore: v.optional(v.number()),
    passed: v.optional(v.boolean()),
    tradeCategory: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    // Get all assessments that match criteria
    let assessments = await ctx.db.query("assessments").collect();
    
    // Apply scoring filters
    if (args.minScore !== undefined) {
      assessments = assessments.filter(a => a.overallScore >= args.minScore!);
    }
    
    if (args.maxScore !== undefined) {
      assessments = assessments.filter(a => a.overallScore <= args.maxScore!);
    }
    
    if (args.passed !== undefined) {
      assessments = assessments.filter(a => a.passed === args.passed);
    }
    
    // Get candidate details for these assessments
    const candidatesWithScores = await Promise.all(
      assessments.slice(0, limit).map(async (assessment) => {
        const candidate = await ctx.db.get(assessment.candidateId);
        if (!candidate) return null;
        
        // Apply trade category filter
        if (args.tradeCategory && candidate.tradeCategory !== args.tradeCategory) {
          return null;
        }
        
        return {
          ...candidate,
          assessment: {
            overallScore: assessment.overallScore,
            passed: assessment.passed,
            completedAt: assessment.completedAt,
            scores: assessment.scores,
          },
        };
      })
    );
    
    const validCandidates = candidatesWithScores.filter(c => c !== null);
    
    // Sort by score descending
    validCandidates.sort((a, b) => b.assessment.overallScore - a.assessment.overallScore);
    
    return validCandidates;
  },
});

// ========================================
// BULK OPERATIONS & IMPORT
// ========================================

/**
 * Bulk create candidates from import data
 */
export const bulkCreateCandidates = mutation({
  args: {
    candidates: v.array(v.object({
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      phone: v.optional(v.string()),
      position: v.string(),
      tradeCategory: v.union(
        v.literal("construction"),
        v.literal("electrical"),
        v.literal("plumbing"),
        v.literal("welding"),
        v.literal("manufacturing"),
        v.literal("maintenance"),
        v.literal("general")
      ),
      source: v.optional(v.string()),
      consentGiven: v.boolean(),
    })),
    skipDuplicates: v.optional(v.boolean()), // Whether to skip existing emails
  },
  handler: async (ctx, args) => {
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };
    
    for (const candidateData of args.candidates) {
      try {
        // Check for existing candidate
        const existing = await ctx.db
          .query("candidates")
          .withIndex("by_email", (q) => q.eq("email", candidateData.email))
          .first();
        
        if (existing) {
          if (args.skipDuplicates) {
            results.skipped++;
            continue;
          } else {
            results.errors.push(`Duplicate email: ${candidateData.email}`);
            continue;
          }
        }
        
        const now = Date.now();
        
        await ctx.db.insert("candidates", {
          email: candidateData.email,
          firstName: candidateData.firstName,
          lastName: candidateData.lastName,
          phone: candidateData.phone,
          position: candidateData.position,
          tradeCategory: candidateData.tradeCategory,
          screeningStatus: "invited",
          invitedAt: now,
          lastContactAt: now,
          source: candidateData.source,
          flagged: false,
          consentGiven: candidateData.consentGiven,
          consentTimestamp: candidateData.consentGiven ? now : undefined,
        });
        
        results.created++;
      } catch (error) {
        results.errors.push(`Error creating candidate ${candidateData.email}: ${error}`);
      }
    }
    
    return results;
  },
});

/**
 * Update consent status for a candidate
 */
export const updateConsentStatus = mutation({
  args: {
    candidateId: v.id("candidates"),
    consentGiven: v.boolean(),
    gdprConsent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }
    
    const now = Date.now();
    
    await ctx.db.patch(args.candidateId, {
      consentGiven: args.consentGiven,
      consentTimestamp: args.consentGiven ? now : candidate.consentTimestamp,
      gdprConsent: args.gdprConsent,
      lastContactAt: now,
    });
    
    return { success: true };
  },
});

/**
 * Delete a candidate (soft delete by flagging)
 */
export const deleteCandidate = mutation({
  args: {
    candidateId: v.id("candidates"),
    reason: v.string(),
    deletedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }
    
    // For GDPR compliance, we'll flag for deletion rather than hard delete
    // This preserves audit trails while marking for removal
    await ctx.db.patch(args.candidateId, {
      flagged: true,
      flagReason: `DELETION REQUESTED: ${args.reason}`,
      screeningStatus: "pending_review",
      lastContactAt: Date.now(),
    });
    
    return { success: true };
  },
});
