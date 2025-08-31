import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Include authentication tables required by Convex Auth
  ...authTables,

  // Voice interview sessions
  sessions: defineTable({
    // Session identification
    sessionId: v.string(), // Unique session identifier from Vapi
    candidateId: v.id("candidates"),
    
    // Session metadata
    status: v.union(
      v.literal("created"),
      v.literal("active"), 
      v.literal("completed"),
      v.literal("failed"),
      v.literal("abandoned")
    ),
    startTime: v.number(), // Unix timestamp
    endTime: v.optional(v.number()), // Unix timestamp
    duration: v.optional(v.number()), // Duration in milliseconds
    
    // Voice interaction data
    vapiSessionId: v.optional(v.string()), // Vapi-specific session ID
    recordingUrl: v.optional(v.string()), // Audio recording URL
    transcripts: v.array(v.object({
      id: v.string(),
      text: v.string(),
      role: v.union(v.literal("user"), v.literal("assistant")),
      timestamp: v.number(),
      confidence: v.optional(v.number()),
      isFinal: v.boolean()
    })),
    
    // Connection and quality metrics
    connectionQuality: v.optional(v.object({
      latency: v.number(),
      audioQuality: v.string(),
      connectionStability: v.number(),
      disconnectCount: v.number()
    })),
    
    // Error tracking
    errors: v.optional(v.array(v.object({
      code: v.string(),
      message: v.string(),
      timestamp: v.number(),
      details: v.optional(v.record(v.string(), v.any()))
    }))),
    
    // HR monitoring
    hrMonitored: v.boolean(), // Whether HR was monitoring this session
    hrNotes: v.optional(v.string())
  })
  .index("by_candidate", ["candidateId"])
  .index("by_status", ["status"])
  .index("by_start_time", ["startTime"])
  .index("by_vapi_session", ["vapiSessionId"]),

  // Candidate information and profiles
  candidates: defineTable({
    // Basic information
    email: v.string(),
    phone: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    
    // Job application details
    position: v.string(), // Position applied for
    tradeCategory: v.union(
      v.literal("construction"),
      v.literal("electrical"),
      v.literal("plumbing"),
      v.literal("welding"),
      v.literal("manufacturing"),
      v.literal("maintenance"),
      v.literal("general")
    ),
    
    // Screening status
    screeningStatus: v.union(
      v.literal("invited"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("passed"),
      v.literal("failed"),
      v.literal("pending_review")
    ),
    
    // Contact and scheduling
    invitedAt: v.optional(v.number()),
    lastContactAt: v.optional(v.number()),
    preferredContactMethod: v.optional(v.union(
      v.literal("email"),
      v.literal("phone"),
      v.literal("sms")
    )),
    timezone: v.optional(v.string()),
    
    // Application source
    source: v.optional(v.string()), // Where they applied from
    referralCode: v.optional(v.string()),
    
    // Flags and notes
    flagged: v.boolean(),
    flagReason: v.optional(v.string()),
    hrNotes: v.optional(v.string()),
    
    // Compliance and consent
    consentGiven: v.boolean(),
    consentTimestamp: v.optional(v.number()),
    gdprConsent: v.optional(v.boolean())
  })
  .index("by_email", ["email"])
  .index("by_phone", ["phone"])
  .index("by_position", ["position"])
  .index("by_trade_category", ["tradeCategory"])
  .index("by_screening_status", ["screeningStatus"])
  .index("by_invited_at", ["invitedAt"])
  .index("by_flagged", ["flagged"]),

  // Comprehensive assessment results and scoring
  assessments: defineTable({
    sessionId: v.id("sessions"),
    candidateId: v.id("candidates"),
    
    // Overall assessment results
    overallScore: v.number(), // 0-100 score
    passed: v.boolean(),
    
    // Category-specific scores
    scores: v.object({
      // Technical competency (0-100)
      technicalSkills: v.object({
        score: v.number(),
        toolKnowledge: v.number(),
        processUnderstanding: v.number(),
        problemSolving: v.number(),
        details: v.array(v.object({
          area: v.string(),
          score: v.number(),
          notes: v.string()
        }))
      }),
      
      // Safety awareness (0-100) - Critical for blue-collar roles
      safetyKnowledge: v.object({
        score: v.number(),
        protocolAwareness: v.number(),
        hazardRecognition: v.number(),
        emergencyResponse: v.number(),
        criticalFailures: v.array(v.string()), // Critical safety failures
        details: v.array(v.object({
          area: v.string(),
          score: v.number(),
          notes: v.string()
        }))
      }),
      
      // Experience validation (0-100)
      experience: v.object({
        score: v.number(),
        relevantExperience: v.number(),
        projectExamples: v.number(),
        troubleshootingAbility: v.number(),
        details: v.array(v.object({
          area: v.string(),
          score: v.number(),
          notes: v.string()
        }))
      }),
      
      // Communication and cultural fit (0-100)
      communication: v.object({
        score: v.number(),
        clarity: v.number(),
        professionalism: v.number(),
        teamworkIndicators: v.number(),
        customerService: v.optional(v.number()),
        details: v.array(v.object({
          area: v.string(),
          score: v.number(),
          notes: v.string()
        }))
      })
    }),
    
    // Voice analysis metrics
    voiceAnalysis: v.optional(v.object({
      confidenceScore: v.number(), // 0-100
      fluencyScore: v.number(), // 0-100
      hesitationCount: v.number(),
      fillerWordCount: v.number(),
      speakingRate: v.number(), // Words per minute
      totalPauseTime: v.number(), // In milliseconds
      sentimentAnalysis: v.optional(v.object({
        overall: v.string(), // positive, neutral, negative
        confidence: v.number(),
        emotional_tone: v.array(v.string())
      }))
    })),
    
    // Question-specific responses and scoring
    questionResponses: v.array(v.object({
      questionId: v.string(),
      question: v.string(),
      response: v.string(),
      category: v.string(), // technical, safety, experience, communication
      score: v.number(), // 0-100
      responseTime: v.number(), // Time to respond in seconds
      confidence: v.number(), // AI confidence in response quality
      keywordMatches: v.array(v.string()),
      redFlags: v.array(v.string())
    })),
    
    // AI-generated insights and recommendations
    aiInsights: v.object({
      strengths: v.array(v.string()),
      weaknesses: v.array(v.string()),
      recommendations: v.array(v.string()),
      riskFactors: v.array(v.string()),
      nextSteps: v.string()
    }),
    
    // Final assessment timestamp
    completedAt: v.number()
  })
  .index("by_session", ["sessionId"])
  .index("by_candidate", ["candidateId"])
  .index("by_overall_score", ["overallScore"])
  .index("by_passed", ["passed"])
  .index("by_completed_at", ["completedAt"]),

  // HR dashboard notifications and alerts
  notifications: defineTable({
    // Notification details
    type: v.union(
      v.literal("candidate_completed"),
      v.literal("top_performer"),
      v.literal("safety_failure"),
      v.literal("system_alert"),
      v.literal("session_abandoned"),
      v.literal("technical_issue")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"), 
      v.literal("high"),
      v.literal("critical")
    ),
    
    // Content
    title: v.string(),
    message: v.string(),
    data: v.optional(v.record(v.string(), v.any())), // Additional context data
    
    // Targeting
    targetUserId: v.optional(v.id("users")), // Specific HR user, if any
    targetRole: v.optional(v.string()), // HR role, if broadcast
    
    // Related entities
    candidateId: v.optional(v.id("candidates")),
    sessionId: v.optional(v.id("sessions")),
    assessmentId: v.optional(v.id("assessments")),
    
    // Status tracking
    read: v.boolean(),
    readAt: v.optional(v.number()),
    acknowledged: v.boolean(),
    acknowledgedAt: v.optional(v.number()),
    acknowledgedBy: v.optional(v.id("users")),
    
    // Delivery tracking
    deliveryMethod: v.array(v.union(
      v.literal("dashboard"),
      v.literal("email"),
      v.literal("sms"),
      v.literal("push")
    )),
    deliveryStatus: v.optional(v.record(v.string(), v.string())),
    
    // Expiration
    expiresAt: v.optional(v.number()),
    
    // Timestamps
    createdAt: v.number()
  })
  .index("by_type", ["type"])
  .index("by_priority", ["priority"])
  .index("by_target_user", ["targetUserId"])
  .index("by_read", ["read"])
  .index("by_candidate", ["candidateId"])
  .index("by_session", ["sessionId"])
  .index("by_created_at", ["createdAt"]),

  // System configuration and settings
  systemConfig: defineTable({
    key: v.string(), // Configuration key
    value: v.any(), // Configuration value
    category: v.string(), // Group configurations
    description: v.optional(v.string()),
    lastModifiedBy: v.optional(v.id("users")),
    lastModifiedAt: v.number()
  })
  .index("by_key", ["key"])
  .index("by_category", ["category"]),

  // Interview question templates and flows
  questionTemplates: defineTable({
    // Template identification
    templateId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    
    // Targeting
    tradeCategory: v.union(
      v.literal("construction"),
      v.literal("electrical"),
      v.literal("plumbing"),
      v.literal("welding"),
      v.literal("manufacturing"),
      v.literal("maintenance"),
      v.literal("general"),
      v.literal("all")
    ),
    difficulty: v.union(
      v.literal("entry"),
      v.literal("intermediate"),
      v.literal("experienced"),
      v.literal("expert")
    ),
    
    // Question content
    questions: v.array(v.object({
      id: v.string(),
      text: v.string(),
      category: v.union(
        v.literal("technical"),
        v.literal("safety"),
        v.literal("experience"),
        v.literal("communication")
      ),
      expectedAnswerElements: v.array(v.string()),
      scoringCriteria: v.array(v.object({
        criterion: v.string(),
        weight: v.number(), // 0-1
        description: v.string()
      })),
      followUpQuestions: v.optional(v.array(v.string())),
      timeLimit: v.optional(v.number()) // Seconds
    })),
    
    // Template metadata
    isActive: v.boolean(),
    version: v.string(),
    createdBy: v.id("users"),
    lastModifiedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    lastModifiedAt: v.optional(v.number())
  })
  .index("by_trade_category", ["tradeCategory"])
  .index("by_difficulty", ["difficulty"])
  .index("by_active", ["isActive"])
  .index("by_template_id", ["templateId"]),

  // Audit log for compliance and tracking
  auditLog: defineTable({
    // Event details
    event: v.string(), // What happened
    entityType: v.string(), // What was affected (candidate, session, etc.)
    entityId: v.string(), // ID of the affected entity
    
    // Actor information
    userId: v.optional(v.id("users")), // Who performed the action
    userEmail: v.optional(v.string()),
    userRole: v.optional(v.string()),
    
    // Action details
    action: v.union(
      v.literal("create"),
      v.literal("read"),
      v.literal("update"),
      v.literal("delete"),
      v.literal("invite"),
      v.literal("screen"),
      v.literal("score"),
      v.literal("flag"),
      v.literal("export")
    ),
    
    // Data tracking
    changes: v.optional(v.object({
      before: v.optional(v.record(v.string(), v.any())),
      after: v.optional(v.record(v.string(), v.any()))
    })),
    
    // Context
    sessionContext: v.optional(v.string()), // Browser session, IP, etc.
    requestId: v.optional(v.string()),
    
    // Metadata
    metadata: v.optional(v.record(v.string(), v.any())),
    
    // Timestamp
    timestamp: v.number()
  })
  .index("by_event", ["event"])
  .index("by_entity", ["entityType", "entityId"])
  .index("by_user", ["userId"])
  .index("by_action", ["action"])
  .index("by_timestamp", ["timestamp"])
});
