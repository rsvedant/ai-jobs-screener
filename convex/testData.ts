import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create sample test data for MVP testing
 * This will create candidates, sessions, and assessments to test the dashboard
 */
export const createTestData = mutation({
  args: {},
  handler: async (ctx) => {
    // Create sample candidates
    const candidates = [
      {
        email: "john.smith@example.com",
        firstName: "John",
        lastName: "Smith",
        position: "Construction Worker",
        tradeCategory: "construction" as const,
        screeningStatus: "completed" as const,
        invitedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        lastContactAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
        flagged: false,
        consentGiven: true,
        consentTimestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
      },
      {
        email: "sarah.jones@example.com",
        firstName: "Sarah",
        lastName: "Jones",
        position: "Electrician",
        tradeCategory: "electrical" as const,
        screeningStatus: "in_progress" as const,
        invitedAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
        lastContactAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        flagged: false,
        consentGiven: true,
        consentTimestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
      },
      {
        email: "mike.wilson@example.com",
        firstName: "Mike",
        lastName: "Wilson",
        position: "Welder",
        tradeCategory: "welding" as const,
        screeningStatus: "passed" as const,
        invitedAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
        lastContactAt: Date.now() - 3 * 60 * 60 * 1000, // 3 hours ago
        flagged: false,
        consentGiven: true,
        consentTimestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
      },
      {
        email: "anna.davis@example.com",
        firstName: "Anna",
        lastName: "Davis",
        position: "Plumber",
        tradeCategory: "plumbing" as const,
        screeningStatus: "failed" as const,
        invitedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
        lastContactAt: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
        flagged: true,
        flagReason: "Low technical knowledge",
        consentGiven: true,
        consentTimestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
      },
      {
        email: "tom.brown@example.com",
        firstName: "Tom",
        lastName: "Brown",
        position: "Maintenance Technician",
        tradeCategory: "maintenance" as const,
        screeningStatus: "invited" as const,
        invitedAt: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
        lastContactAt: Date.now() - 6 * 60 * 60 * 1000,
        flagged: false,
        consentGiven: true,
        consentTimestamp: Date.now() - 6 * 60 * 60 * 1000,
      },
    ];

    const candidateIds = [];
    for (const candidate of candidates) {
      const candidateId = await ctx.db.insert("candidates", candidate);
      candidateIds.push(candidateId);
    }

    // Create sample sessions
    const sessions = [
      {
        candidateId: candidateIds[0], // John Smith
        sessionId: "vapi_session_001",
        status: "completed" as const,
        startTime: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
        endTime: Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000, // 15 min session
        duration: 15 * 60 * 1000, // 15 minutes
        transcripts: [
          {
            id: "t1",
            text: "Hi John, can you tell me about your construction experience?",
            role: "assistant" as const,
            timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
            confidence: 0.95,
            isFinal: true,
          },
          {
            id: "t2",
            text: "I have 5 years of experience in residential construction. I'm skilled with concrete, framing, and blueprint reading. Safety is always my top priority on the job site.",
            role: "user" as const,
            timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 + 5000,
            confidence: 0.88,
            isFinal: true,
          },
          {
            id: "t3",
            text: "Great! Can you describe a challenging project you worked on?",
            role: "assistant" as const,
            timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 + 10000,
            confidence: 0.92,
            isFinal: true,
          },
          {
            id: "t4",
            text: "We built a foundation on difficult terrain. Had to use specialized equipment and follow strict safety protocols. Completed on time and within budget.",
            role: "user" as const,
            timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 + 20000,
            confidence: 0.85,
            isFinal: true,
          },
        ],
        hrMonitored: false,
      },
      {
        candidateId: candidateIds[1], // Sarah Jones - Active session
        sessionId: "vapi_session_002",
        status: "active" as const,
        startTime: Date.now() - 10 * 60 * 1000, // 10 minutes ago
        transcripts: [
          {
            id: "t5",
            text: "Hi Sarah, thank you for joining. Can you tell me about your electrical background?",
            role: "assistant" as const,
            timestamp: Date.now() - 10 * 60 * 1000,
            confidence: 0.94,
            isFinal: true,
          },
          {
            id: "t6",
            text: "I'm a licensed electrician with 3 years experience. I specialize in residential wiring and always follow electrical safety codes.",
            role: "user" as const,
            timestamp: Date.now() - 8 * 60 * 1000,
            confidence: 0.91,
            isFinal: true,
          },
        ],
        hrMonitored: true,
        hrNotes: "Strong technical responses so far",
      },
      {
        candidateId: candidateIds[2], // Mike Wilson
        sessionId: "vapi_session_003",
        status: "completed" as const,
        startTime: Date.now() - 4 * 24 * 60 * 60 * 1000, // 4 days ago
        endTime: Date.now() - 4 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000, // 20 min session
        duration: 20 * 60 * 1000, // 20 minutes
        transcripts: [
          {
            id: "t7",
            text: "Mike, tell me about your welding experience and safety practices.",
            role: "assistant" as const,
            timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
            confidence: 0.96,
            isFinal: true,
          },
          {
            id: "t8",
            text: "I'm certified in MIG and TIG welding. Always use proper protective equipment and follow welding safety protocols. I inspect all welds for quality and safety compliance.",
            role: "user" as const,
            timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000 + 3000,
            confidence: 0.89,
            isFinal: true,
          },
        ],
        hrMonitored: false,
      },
    ];

    const sessionIds = [];
    for (const session of sessions) {
      const sessionId = await ctx.db.insert("sessions", session);
      sessionIds.push(sessionId);
    }

    // Create sample assessments for completed sessions
    const assessments = [
      {
        sessionId: sessionIds[0], // John Smith's session
        candidateId: candidateIds[0],
        overallScore: 85,
        passed: true,
        scores: {
          technicalSkills: {
            score: 80,
            toolKnowledge: 85,
            processUnderstanding: 80,
            problemSolving: 75,
            details: [],
          },
          safetyKnowledge: {
            score: 90,
            protocolAwareness: 95,
            hazardRecognition: 85,
            emergencyResponse: 90,
            criticalFailures: [],
            details: [],
          },
          experience: {
            score: 85,
            relevantExperience: 90,
            projectExamples: 85,
            troubleshootingAbility: 80,
            details: [],
          },
          communication: {
            score: 85,
            clarity: 85,
            professionalism: 90,
            teamworkIndicators: 80,
            details: [],
          },
        },
        questionResponses: [
          {
            questionId: "q1",
            question: "Tell me about your construction experience",
            response: "I have 5 years of experience in residential construction...",
            category: "experience",
            score: 85,
            responseTime: 5,
            confidence: 0.88,
            keywordMatches: ["construction", "experience", "safety"],
            redFlags: [],
          },
        ],
        aiInsights: {
          strengths: ["Strong safety awareness", "Good technical knowledge", "Clear communication"],
          weaknesses: ["Could demonstrate more advanced problem-solving"],
          recommendations: ["Proceed to next interview round", "Consider for senior positions"],
          riskFactors: [],
          nextSteps: "Proceed to next round",
        },
        completedAt: Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000,
      },
      {
        sessionId: sessionIds[2], // Mike Wilson's session
        candidateId: candidateIds[2],
        overallScore: 92,
        passed: true,
        scores: {
          technicalSkills: {
            score: 95,
            toolKnowledge: 95,
            processUnderstanding: 90,
            problemSolving: 95,
            details: [],
          },
          safetyKnowledge: {
            score: 95,
            protocolAwareness: 95,
            hazardRecognition: 95,
            emergencyResponse: 95,
            criticalFailures: [],
            details: [],
          },
          experience: {
            score: 90,
            relevantExperience: 90,
            projectExamples: 90,
            troubleshootingAbility: 90,
            details: [],
          },
          communication: {
            score: 88,
            clarity: 90,
            professionalism: 90,
            teamworkIndicators: 85,
            details: [],
          },
        },
        questionResponses: [
          {
            questionId: "q1",
            question: "Tell me about your welding experience",
            response: "I'm certified in MIG and TIG welding...",
            category: "technical",
            score: 95,
            responseTime: 3,
            confidence: 0.89,
            keywordMatches: ["welding", "certified", "safety", "protective", "quality"],
            redFlags: [],
          },
        ],
        aiInsights: {
          strengths: ["Excellent technical skills", "Outstanding safety knowledge", "Professional communication"],
          weaknesses: [],
          recommendations: ["Top candidate - proceed immediately", "Consider for lead positions"],
          riskFactors: [],
          nextSteps: "Proceed to next round - high priority",
        },
        completedAt: Date.now() - 4 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000,
      },
    ];

    for (const assessment of assessments) {
      await ctx.db.insert("assessments", assessment);
    }

    // Update candidate statuses to match assessments
    await ctx.db.patch(candidateIds[0], { screeningStatus: "passed" });
    await ctx.db.patch(candidateIds[2], { screeningStatus: "passed" });

    return {
      message: "Test data created successfully!",
      created: {
        candidates: candidateIds.length,
        sessions: sessionIds.length,
        assessments: assessments.length,
      },
    };
  },
});

/**
 * Clear all test data
 */
export const clearTestData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all assessments
    const assessments = await ctx.db.query("assessments").collect();
    for (const assessment of assessments) {
      await ctx.db.delete(assessment._id);
    }

    // Delete all sessions
    const sessions = await ctx.db.query("sessions").collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Delete all candidates
    const candidates = await ctx.db.query("candidates").collect();
    for (const candidate of candidates) {
      await ctx.db.delete(candidate._id);
    }

    return { message: "All test data cleared!" };
  },
});
