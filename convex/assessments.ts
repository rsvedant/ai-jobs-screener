import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ========================================
// ASSESSMENT QUERIES
// ========================================

/**
 * Get assessment by session ID
 */
export const getAssessmentBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const assessment = await ctx.db
      .query("assessments")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();
    
    return assessment;
  },
});

/**
 * Get assessments by candidate ID
 */
export const getAssessmentsByCandidate = query({
  args: { candidateId: v.id("candidates") },
  handler: async (ctx, { candidateId }) => {
    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_candidate", (q) => q.eq("candidateId", candidateId))
      .order("desc")
      .collect();
    
    return assessments;
  },
});

/**
 * Get recent assessments for dashboard
 */
export const getRecentAssessments = query({
  args: {
    limit: v.optional(v.number()),
    passed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    let assessments = await ctx.db
      .query("assessments")
      .order("desc")
      .collect();
    
    // Filter by passed status if provided
    if (args.passed !== undefined) {
      assessments = assessments.filter(a => a.passed === args.passed);
    }
    
    // Apply limit
    assessments = assessments.slice(0, limit);
    
    // Enrich with candidate data
    const enrichedAssessments = await Promise.all(
      assessments.map(async (assessment) => {
        const candidate = await ctx.db.get(assessment.candidateId);
        return {
          ...assessment,
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
    
    return enrichedAssessments;
  },
});

// ========================================
// BASIC SCORING ENGINE (MVP)
// ========================================

/**
 * Calculate basic assessment score from session data (simplified for MVP)
 */
export const calculateBasicScore = mutation({
  args: {
    sessionId: v.id("sessions"),
    candidateId: v.id("candidates"),
  },
  handler: async (ctx, { sessionId, candidateId }) => {
    // Get session data
    const session = await ctx.db.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    const candidate = await ctx.db.get(candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }
    
    // Basic scoring criteria (MVP)
    const transcripts = session.transcripts || [];
    
    // 1. Basic participation scoring
    const candidateResponses = transcripts.filter((t: any) => t.role === "user");
    const totalResponses = candidateResponses.length;
    const totalWords = candidateResponses.reduce((sum: number, t: any) => sum + t.text.split(" ").length, 0);
    const avgWordsPerResponse = totalResponses > 0 ? totalWords / totalResponses : 0;
    
    // 2. Session completion scoring
    const sessionDuration = session.duration || 0;
    const minRequiredDuration = 2 * 60 * 1000; // 2 minutes minimum
    const completionScore = sessionDuration >= minRequiredDuration ? 100 : (sessionDuration / minRequiredDuration) * 100;
    
    // 3. Basic engagement scoring
    const engagementScore = Math.min(100, (totalResponses * 10) + (avgWordsPerResponse * 2));
    
    // 4. Simple keyword scoring based on trade category
    const keywordScore = calculateTradeKeywordScore(candidateResponses, candidate.tradeCategory);
    
    // Calculate overall score (simplified)
    const weights = {
      completion: 0.3,
      engagement: 0.4,
      keywords: 0.3,
    };
    
    const overallScore = Math.round(
      (completionScore * weights.completion) +
      (engagementScore * weights.engagement) +
      (keywordScore * weights.keywords)
    );
    
    // Simple pass/fail threshold
    const passThreshold = 60;
    const passed = overallScore >= passThreshold;
    
    // Create simplified assessment record
    const assessmentId = await ctx.db.insert("assessments", {
      sessionId,
      candidateId,
      overallScore,
      passed,
      scores: {
        technicalSkills: {
          score: keywordScore,
          toolKnowledge: keywordScore,
          processUnderstanding: keywordScore,
          problemSolving: keywordScore,
          details: [],
        },
        safetyKnowledge: {
          score: keywordScore, // Simplified - same as technical for MVP
          protocolAwareness: keywordScore,
          hazardRecognition: keywordScore,
          emergencyResponse: keywordScore,
          criticalFailures: [],
          details: [],
        },
        experience: {
          score: engagementScore,
          relevantExperience: engagementScore,
          projectExamples: engagementScore,
          troubleshootingAbility: engagementScore,
          details: [],
        },
        communication: {
          score: engagementScore,
          clarity: engagementScore,
          professionalism: engagementScore,
          teamworkIndicators: engagementScore,
          details: [],
        },
      },
      questionResponses: candidateResponses.map((response: any, index: number) => ({
        questionId: `q${index + 1}`,
        question: `Question ${index + 1}`,
        response: response.text,
        category: "general",
        score: Math.min(100, response.text.split(" ").length * 5), // Simple word count scoring
        responseTime: 30, // Placeholder
        confidence: response.confidence || 0.8,
        keywordMatches: [],
        redFlags: [],
      })),
      aiInsights: {
        strengths: generateBasicStrengths(overallScore, engagementScore, keywordScore),
        weaknesses: generateBasicWeaknesses(overallScore, engagementScore, keywordScore),
        recommendations: generateBasicRecommendations(passed, overallScore),
        riskFactors: [],
        nextSteps: passed ? "Proceed to next round" : "Consider alternative opportunities",
      },
      completedAt: Date.now(),
    });
    
    // Update candidate status
    await ctx.db.patch(candidateId, {
      screeningStatus: passed ? "passed" : "failed",
      lastContactAt: Date.now(),
    });
    
    return {
      assessmentId,
      overallScore,
      passed,
      details: {
        completionScore,
        engagementScore,
        keywordScore,
        totalResponses,
        avgWordsPerResponse,
        sessionDuration: sessionDuration / 1000 / 60, // minutes
      },
    };
  },
});

/**
 * Simple keyword scoring based on trade category
 */
function calculateTradeKeywordScore(responses: Array<{text: string}>, tradeCategory: string): number {
  const allText = responses.map(r => r.text.toLowerCase()).join(" ");
  
  // Basic keyword lists for each trade (MVP version)
  const tradeKeywords: Record<string, string[]> = {
    construction: ["build", "construction", "concrete", "foundation", "frame", "blueprint", "safety", "hard hat"],
    electrical: ["wire", "electrical", "circuit", "voltage", "power", "outlet", "breaker", "safety", "shock"],
    plumbing: ["pipe", "plumbing", "water", "drain", "fixture", "pressure", "leak", "wrench", "safety"],
    welding: ["weld", "welding", "metal", "torch", "steel", "arc", "safety", "protective", "gas"],
    manufacturing: ["machine", "assembly", "production", "quality", "process", "equipment", "safety", "procedure"],
    maintenance: ["repair", "maintenance", "fix", "inspect", "service", "equipment", "safety", "troubleshoot"],
    general: ["work", "job", "task", "team", "safety", "experience", "skill", "professional"],
  };
  
  const keywords = tradeKeywords[tradeCategory] || tradeKeywords.general;
  const matches = keywords.filter(keyword => allText.includes(keyword)).length;
  
  // Score based on keyword matches
  return Math.min(100, (matches / keywords.length) * 100);
}

/**
 * Generate basic strengths based on scores
 */
function generateBasicStrengths(overall: number, engagement: number, keywords: number): string[] {
  const strengths: string[] = [];
  
  if (overall >= 80) strengths.push("Strong overall performance");
  if (engagement >= 70) strengths.push("Good communication and engagement");
  if (keywords >= 60) strengths.push("Demonstrates relevant trade knowledge");
  if (strengths.length === 0) strengths.push("Completed the assessment");
  
  return strengths;
}

/**
 * Generate basic weaknesses based on scores
 */
function generateBasicWeaknesses(overall: number, engagement: number, keywords: number): string[] {
  const weaknesses: string[] = [];
  
  if (overall < 60) weaknesses.push("Below minimum performance threshold");
  if (engagement < 50) weaknesses.push("Limited verbal communication");
  if (keywords < 40) weaknesses.push("Could demonstrate more trade-specific knowledge");
  
  return weaknesses;
}

/**
 * Generate basic recommendations
 */
function generateBasicRecommendations(passed: boolean, score: number): string[] {
  if (passed) {
    if (score >= 80) {
      return ["Strong candidate - proceed to next interview round", "Consider for senior-level positions"];
    } else {
      return ["Suitable candidate - proceed with standard process", "May benefit from additional training"];
    }
  } else {
    return ["Does not meet minimum requirements", "Consider for entry-level positions with training"];
  }
}

// ========================================
// ASSESSMENT MUTATIONS
// ========================================

/**
 * Create assessment manually (for testing or manual scoring)
 */
export const createAssessment = mutation({
  args: {
    sessionId: v.id("sessions"),
    candidateId: v.id("candidates"),
    overallScore: v.number(),
    passed: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Create basic assessment record
    const assessmentId = await ctx.db.insert("assessments", {
      sessionId: args.sessionId,
      candidateId: args.candidateId,
      overallScore: args.overallScore,
      passed: args.passed,
      scores: {
        technicalSkills: {
          score: args.overallScore,
          toolKnowledge: args.overallScore,
          processUnderstanding: args.overallScore,
          problemSolving: args.overallScore,
          details: [],
        },
        safetyKnowledge: {
          score: args.overallScore,
          protocolAwareness: args.overallScore,
          hazardRecognition: args.overallScore,
          emergencyResponse: args.overallScore,
          criticalFailures: [],
          details: [],
        },
        experience: {
          score: args.overallScore,
          relevantExperience: args.overallScore,
          projectExamples: args.overallScore,
          troubleshootingAbility: args.overallScore,
          details: [],
        },
        communication: {
          score: args.overallScore,
          clarity: args.overallScore,
          professionalism: args.overallScore,
          teamworkIndicators: args.overallScore,
          details: [],
        },
      },
      questionResponses: [],
      aiInsights: {
        strengths: args.passed ? ["Manual assessment - passed"] : [],
        weaknesses: args.passed ? [] : ["Manual assessment - did not pass"],
        recommendations: args.passed ? ["Proceed to next round"] : ["Consider alternative opportunities"],
        riskFactors: [],
        nextSteps: args.notes || (args.passed ? "Proceed" : "Do not proceed"),
      },
      completedAt: Date.now(),
    });
    
    return assessmentId;
  },
});

/**
 * Update assessment results
 */
export const updateAssessment = mutation({
  args: {
    assessmentId: v.id("assessments"),
    overallScore: v.optional(v.number()),
    passed: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment) {
      throw new Error("Assessment not found");
    }
    
    const updates: Partial<typeof assessment> = {};
    
    if (args.overallScore !== undefined) {
      updates.overallScore = args.overallScore;
    }
    
    if (args.passed !== undefined) {
      updates.passed = args.passed;
    }
    
    if (args.notes) {
      // Update AI insights with notes
      updates.aiInsights = {
        ...assessment.aiInsights,
        nextSteps: args.notes,
      };
    }
    
    await ctx.db.patch(args.assessmentId, updates);
    
    return { success: true };
  },
});

// ========================================
// BATCH PROCESSING FOR MVP
// ========================================

/**
 * Process completed sessions that need assessment (simplified for MVP)
 */
export const processCompletedSessions = mutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    // Get completed sessions without assessments
    const completedSessions = await ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .order("desc")
      .collect();
    
    const sessionsToProcess = [];
    
    // Check which sessions don't have assessments yet
    for (const session of completedSessions.slice(0, limit)) {
      const existingAssessment = await ctx.db
        .query("assessments")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .first();
      
      if (!existingAssessment) {
        sessionsToProcess.push(session);
      }
    }
    
    // For MVP, just return the sessions that need processing
    // In a full version, this would actually process them
    return {
      processed: 0,
      total: sessionsToProcess.length,
      sessionsNeedingAssessment: sessionsToProcess.map(s => s._id),
    };
  },
});
