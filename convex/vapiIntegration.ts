import { action, mutation, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Process VAPI session completion and create assessment
 * Called when a VAPI session ends
 */
export const processVapiSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    vapiSessionId: v.string(),
    vapiCallData: v.any(), // The VAPI response object you showed
  },
  handler: async (ctx, args) => {
    try {
      // Get the session to get candidate info
      const session = await ctx.db.get(args.sessionId);
      if (!session) throw new Error("Session not found");

      // Extract key data from VAPI response
      const vapiData = args.vapiCallData;
      
      // Extract overall score from VAPI's successEvaluation (0-100)
      const overallScore = vapiData.analysis?.successEvaluation || 0;
      const passed = overallScore >= 70; // 70% threshold for passing
      
      // Convert VAPI messages to our transcript format
      const transcripts = vapiData.messages
        ?.filter((msg: any) => msg.role === "user" || msg.role === "bot")
        .map((msg: any, index: number) => ({
          id: `transcript_${index}`,
          text: msg.message || "",
          role: msg.role === "bot" ? "assistant" : "user",
          timestamp: msg.time || Date.now(),
          confidence: 1.0,
          isFinal: true,
        })) || [];

      // For MVP, create simplified scores based on overall score
      const baseScore = overallScore;
      const scores = {
        technicalSkills: {
          score: baseScore,
          toolKnowledge: baseScore,
          processUnderstanding: baseScore,
          problemSolving: baseScore,
          details: [{ area: "General Technical", score: baseScore, notes: "Based on voice interview" }]
        },
        safetyKnowledge: {
          score: baseScore,
          protocolAwareness: baseScore,
          hazardRecognition: baseScore,
          emergencyResponse: baseScore,
          criticalFailures: [],
          details: [{ area: "Safety Awareness", score: baseScore, notes: "Based on voice interview" }]
        },
        experience: {
          score: baseScore,
          relevantExperience: baseScore,
          projectExamples: baseScore,
          troubleshootingAbility: baseScore,
          details: [{ area: "Experience Assessment", score: baseScore, notes: "Based on voice interview" }]
        },
        communication: {
          score: baseScore,
          clarity: baseScore,
          professionalism: baseScore,
          teamworkIndicators: baseScore,
          details: [{ area: "Communication Skills", score: baseScore, notes: "Based on voice interview" }]
        }
      };

      // Create assessment record
      const assessmentId = await ctx.db.insert("assessments", {
        sessionId: args.sessionId,
        candidateId: session.candidateId,
        overallScore: baseScore,
        passed,
        scores,
        voiceAnalysis: {
          confidenceScore: baseScore,
          fluencyScore: baseScore,
          hesitationCount: 0,
          fillerWordCount: 0,
          speakingRate: 150, // Default WPM
          totalPauseTime: 0,
        },
        questionResponses: [], // MVP: simplified
        aiInsights: {
          strengths: passed ? ["Successful interview completion"] : [],
          weaknesses: !passed ? ["Areas for improvement identified"] : [],
          recommendations: passed ? ["Candidate shows potential"] : ["Consider additional screening"],
          riskFactors: [],
          overallAssessment: passed ? "RECOMMENDED" : "NOT_RECOMMENDED",
        },
        evaluatedAt: Date.now(),
        completedAt: Date.now(),
      });

      // Update session with VAPI data
      await ctx.db.patch(args.sessionId, {
        transcripts,
        recordingUrl: vapiData.recordingUrl,
        status: "completed",
        endTime: Date.now(),
      });

      // Update candidate status
      await ctx.db.patch(session.candidateId, {
        screeningStatus: passed ? "passed" : "failed",
        lastContactAt: Date.now(),
      });

      return { success: true, score: baseScore, passed };
    } catch (error) {
      console.error("Failed to process VAPI session:", error);
      throw error;
    }
  },
});

/**
 * Webhook endpoint for VAPI to call when session completes
 */
export const vapiWebhook = action({
  args: {
    sessionId: v.string(),
    callData: v.any(),
  },
  handler: async (ctx, args) => {
    try {
      // Find our session by VAPI session ID
      const sessions = await ctx.db.query("sessions").collect();
      const session = sessions.find(s => s.vapiSessionId === args.sessionId);
      
      if (!session) {
        console.error("Session not found for VAPI ID:", args.sessionId);
        return { success: false, error: "Session not found" };
      }

      // Process the session
      await ctx.runAction("vapiIntegration.processVapiSession", {
        sessionId: session._id,
        vapiSessionId: args.sessionId,
        vapiCallData: args.callData,
      });

      return { success: true };
    } catch (error) {
      console.error("VAPI webhook error:", error);
      return { success: false, error: error.message };
    }
  },
});
