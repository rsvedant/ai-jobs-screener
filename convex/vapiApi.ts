import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Fetch VAPI call data and create assessment
 */
export const fetchVapiDataAndCreateAssessment = action({
  args: {
    sessionId: v.id("sessions"),
    vapiCallId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; assessmentId: any; score: number; vapiSuccess: boolean | null; transcriptCount: number }> => {
    console.log("🔍 Fetching VAPI data for call ID:", args.vapiCallId);
    
    try {
            // Check if VAPI key is available from environment
      const vapiKey = process.env.VAPI_PRIVATE_KEY;
      console.log("🔑 VAPI Key available:", !!vapiKey);
      console.log("🔑 VAPI Key length:", vapiKey?.length || 0);

      if (!vapiKey) {
        throw new Error("VAPI_PRIVATE_KEY environment variable not set");
      }
      
      // Fetch data from VAPI API using the call ID
      const vapiResponse = await fetch(`https://api.vapi.ai/call/${args.vapiCallId}`, {
        headers: {
          'Authorization': `Bearer ${vapiKey}`,
        },
      });

      if (!vapiResponse.ok) {
        throw new Error(`VAPI API error: ${vapiResponse.status} ${vapiResponse.statusText}`);
      }

      const vapiData: any = await vapiResponse.json();
      console.log("✅ VAPI data fetched successfully");

      // Get session and candidate data
      const session: any = await ctx.runQuery(api.internal.getSession, { 
        sessionId: args.sessionId 
      });
      
      if (!session) {
        throw new Error("Session not found");
      }

      const candidate: any = await ctx.runQuery(api.internal.getCandidate, {
        candidateId: session.candidateId
      });

      if (!candidate) {
        throw new Error("Candidate not found");
      }

      // Parse VAPI messages into our transcript format
      const transcripts = vapiData.messages
        ?.filter((msg: any) => msg.role === "user" || msg.role === "bot")
        .map((msg: any, index: number) => ({
          id: `vapi_${index}`,
          text: msg.message || "",
          role: msg.role === "bot" ? "assistant" : "user",
          timestamp: msg.time || Date.now(),
          confidence: 1.0,
          isFinal: true,
        })) || [];

      // Update session with VAPI transcripts
      await ctx.runMutation(api.sessions.updateSessionData, {
        sessionId: args.sessionId,
        transcripts,
        recordingUrl: vapiData.recordingUrl,
      });

      // Extract conversation data for evaluation
      const userResponses = transcripts.filter((t: any) => t.role === "user");
      const assistantQuestions = transcripts.filter((t: any) => t.role === "assistant");

      // Get VAPI's success evaluation if available
      let vapiSuccess = null;
      if (vapiData.analysis?.successEvaluation) {
        // Parse VAPI's success evaluation (could be "true"/"false" string or boolean)
        const successEval = vapiData.analysis.successEvaluation;
        if (typeof successEval === "string") {
          vapiSuccess = successEval.toLowerCase() === "true";
        } else if (typeof successEval === "boolean") {
          vapiSuccess = successEval;
        }
      }

      // Perform our custom evaluation
      const evaluation: any = await evaluateFromVapiData(
        userResponses,
        assistantQuestions,
        candidate.tradeCategory,
        candidate.position,
        vapiSuccess
      );

      // Create assessment
      const assessmentId: any = await ctx.runMutation(api.assessments.createTranscriptBasedAssessment, {
        sessionId: args.sessionId,
        candidateId: session.candidateId,
        evaluation,
        transcripts: userResponses, // Pass user responses for questionResponses
      });

      console.log("✅ Assessment created from VAPI data:", assessmentId);

      return { 
        success: true, 
        assessmentId, 
        score: evaluation.overallScore,
        vapiSuccess,
        transcriptCount: transcripts.length
      };

    } catch (error: unknown) {
      console.error("❌ Failed to fetch VAPI data or create assessment:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to process VAPI data: ${errorMessage}`);
    }
  },
});

/**
 * Evaluate interview based on VAPI data
 */
async function evaluateFromVapiData(
  userResponses: Array<{text: string, timestamp: number}>,
  assistantQuestions: Array<{text: string, timestamp: number}>,
  tradeCategory: string,
  position: string,
  vapiSuccess: boolean | null
) {
  // Calculate basic metrics
  const totalUserWords = userResponses.reduce((sum, r) => sum + r.text.split(" ").length, 0);
  const avgWordsPerResponse = userResponses.length > 0 ? totalUserWords / userResponses.length : 0;
  
  // Communication scoring
  const communicationScore = Math.min(100, (avgWordsPerResponse * 4) + (userResponses.length * 6));
  
  // Technical keyword scoring
  const technicalScore = calculateAdvancedKeywordScore(userResponses, tradeCategory);
  
  // Experience scoring based on response depth
  const experienceScore = calculateExperienceScore(userResponses);
  
  // Engagement scoring
  const engagementScore = Math.min(100, userResponses.length * 10);
  
  // Overall score calculation - incorporate VAPI's success evaluation if available
  let baseScore = Math.round(
    (communicationScore * 0.25) +
    (technicalScore * 0.35) +
    (experienceScore * 0.25) +
    (engagementScore * 0.15)
  );

  // Adjust based on VAPI's success evaluation
  if (vapiSuccess === true) {
    baseScore = Math.max(baseScore, 70); // Boost if VAPI says successful
  } else if (vapiSuccess === false) {
    baseScore = Math.min(baseScore, 60); // Cap if VAPI says unsuccessful
  }

  const overallScore = Math.min(100, baseScore);
  const passed = overallScore >= 65;
  
  // Generate insights
  const keywordMatches = findTradeKeywords(userResponses, tradeCategory);
  
  const strengths = [];
  const weaknesses = [];
  
  if (communicationScore >= 70) strengths.push("Clear communication skills");
  if (technicalScore >= 70) strengths.push("Good technical knowledge");
  if (experienceScore >= 70) strengths.push("Relevant experience");
  if (engagementScore >= 70) strengths.push("Active participation");
  if (vapiSuccess === true) strengths.push("VAPI evaluated as successful interview");
  
  if (communicationScore < 50) weaknesses.push("Communication could be improved");
  if (technicalScore < 50) weaknesses.push("Limited technical knowledge demonstrated");
  if (experienceScore < 50) weaknesses.push("Needs more relevant experience");
  if (engagementScore < 50) weaknesses.push("Limited engagement in interview");
  if (vapiSuccess === false) weaknesses.push("VAPI flagged interview concerns");
  
  if (strengths.length === 0) strengths.push("Completed the interview");
  
  return {
    overallScore,
    passed,
    communicationScore,
    technicalScore,
    experienceScore,
    engagementScore,
    strengths,
    weaknesses,
    keywordMatches,
    responseQuality: overallScore >= 80 ? "Excellent" : overallScore >= 65 ? "Good" : "Needs Improvement",
  };
}

/**
 * Advanced keyword scoring for trade categories
 */
function calculateAdvancedKeywordScore(responses: Array<{text: string}>, tradeCategory: string): number {
  const allText = responses.map(r => r.text.toLowerCase()).join(" ");
  
  const tradeKeywords: Record<string, { primary: string[], secondary: string[], safety: string[] }> = {
    construction: {
      primary: ["build", "construction", "concrete", "foundation", "frame", "blueprint", "site"],
      secondary: ["tools", "materials", "project", "crew", "supervisor", "schedule"],
      safety: ["safety", "hard hat", "ppe", "osha", "hazard", "protection"]
    },
    electrical: {
      primary: ["electrical", "wire", "circuit", "voltage", "power", "breaker", "conduit"],
      secondary: ["installation", "troubleshoot", "panel", "outlet", "switch", "meter"],
      safety: ["lockout", "tagout", "grounding", "arc flash", "safety", "shock"]
    },
    plumbing: {
      primary: ["plumbing", "pipe", "water", "drain", "fixture", "pressure", "flow"],
      secondary: ["installation", "repair", "leak", "valve", "fitting", "joint"],
      safety: ["safety", "chemicals", "confined space", "ventilation", "ppe"]
    },
    welding: {
      primary: ["weld", "welding", "metal", "steel", "torch", "arc", "mig", "tig"],
      secondary: ["joint", "bead", "penetration", "strength", "quality", "inspection"],
      safety: ["ventilation", "fume", "protection", "shield", "safety", "fire"]
    },
    manufacturing: {
      primary: ["manufacturing", "machine", "assembly", "production", "quality", "process"],
      secondary: ["equipment", "maintenance", "efficiency", "standards", "procedures"],
      safety: ["safety", "lockout", "guarding", "ppe", "protocols", "procedures"]
    },
    maintenance: {
      primary: ["maintenance", "repair", "equipment", "troubleshoot", "service", "inspect"],
      secondary: ["preventive", "breakdown", "parts", "tools", "documentation"],
      safety: ["safety", "procedures", "lockout", "confined space", "hazard"]
    },
    general: {
      primary: ["work", "job", "experience", "skill", "team", "responsibility"],
      secondary: ["learning", "training", "communication", "problem", "solution"],
      safety: ["safety", "awareness", "procedures", "protocols", "training"]
    }
  };
  
  const keywords = tradeKeywords[tradeCategory] || tradeKeywords.general;
  
  const primaryMatches = keywords.primary.filter(k => allText.includes(k)).length;
  const secondaryMatches = keywords.secondary.filter(k => allText.includes(k)).length;
  const safetyMatches = keywords.safety.filter(k => allText.includes(k)).length;
  
  // Weighted scoring
  const score = (primaryMatches * 10) + (secondaryMatches * 5) + (safetyMatches * 8);
  return Math.min(100, score);
}

/**
 * Calculate experience score based on response depth and content
 */
function calculateExperienceScore(responses: Array<{text: string}>): number {
  const allText = responses.map(r => r.text.toLowerCase()).join(" ");
  
  const experienceIndicators = [
    "years", "experience", "worked", "project", "company", "job", "position",
    "responsible", "managed", "led", "trained", "supervised", "completed"
  ];
  
  const matches = experienceIndicators.filter(indicator => allText.includes(indicator)).length;
  const avgResponseLength = responses.reduce((sum, r) => sum + r.text.length, 0) / responses.length;
  
  // Score based on experience mentions and response depth
  return Math.min(100, (matches * 8) + (avgResponseLength / 5));
}

/**
 * Find matched keywords for insights
 */
function findTradeKeywords(responses: Array<{text: string}>, tradeCategory: string): string[] {
  const allText = responses.map(r => r.text.toLowerCase()).join(" ");
  
  const keywords = [
    "safety", "experience", "tools", "training", "quality", "procedures",
    "team", "communication", "problem", "solution", "responsibility"
  ];
  
  return keywords.filter(keyword => allText.includes(keyword));
}
