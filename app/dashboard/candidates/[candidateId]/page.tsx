"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import TranscriptViewer from "./components/TranscriptViewer";

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusColors = {
    invited: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800", 
    completed: "bg-gray-100 text-gray-800",
    passed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    pending_review: "bg-purple-100 text-purple-800",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// Trade category badge component
function TradeBadge({ category }: { category: string }) {
  const tradeColors = {
    construction: "bg-orange-100 text-orange-800",
    electrical: "bg-yellow-100 text-yellow-800",
    plumbing: "bg-blue-100 text-blue-800",
    welding: "bg-red-100 text-red-800",
    manufacturing: "bg-green-100 text-green-800",
    maintenance: "bg-purple-100 text-purple-800",
    general: "bg-gray-100 text-gray-800",
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${tradeColors[category as keyof typeof tradeColors] || "bg-gray-100 text-gray-800"}`}>
      {category}
    </span>
  );
}

// Session row component
function SessionRow({ session, onCreateAssessment, isCreatingAssessment }: { 
  session: any, 
  onCreateAssessment: (sessionId: string) => void,
  isCreatingAssessment: string | null 
}) {
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      created: "text-blue-600",
      active: "text-yellow-600",
      completed: "text-green-600",
      failed: "text-red-600",
      abandoned: "text-gray-600",
    };
    return colors[status as keyof typeof colors] || "text-gray-600";
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {new Date(session.startTime).toLocaleDateString()} {new Date(session.startTime).toLocaleTimeString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`text-sm font-medium ${getStatusColor(session.status)}`}>
          {session.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {session.duration ? formatDuration(session.duration) : "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {session.assessment ? (
          <div className="flex items-center space-x-2">
            <span className="font-medium">{session.assessment.overallScore}%</span>
            <StatusBadge status={session.assessment.passed ? "passed" : "failed"} />
          </div>
        ) : (
          <span className="text-gray-500">No assessment</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {session.transcripts && session.transcripts.length > 0 ? (
          <span className="text-blue-600 cursor-pointer hover:text-blue-800">
            View Transcript ({session.transcripts.length} entries)
          </span>
        ) : session.vapiSessionId ? (
          <span className="text-yellow-600">Available from VAPI</span>
        ) : (
          <span className="text-gray-500">No transcript</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {session.status === "completed" && !session.assessment && session.vapiSessionId && (
          <button
            onClick={() => onCreateAssessment(session._id)}
            disabled={isCreatingAssessment === session._id}
            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreatingAssessment === session._id ? "Creating..." : "Create Assessment"}
          </button>
        )}
      </td>
    </tr>
  );
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.candidateId as Id<"candidates">;
  
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "assessments">("overview");
  const [isCreatingAssessment, setIsCreatingAssessment] = useState<string | null>(null);

  // Query candidate details
  const candidate = useQuery(api.candidates.getCandidateById, {
    candidateId,
  });

  // Mutation for creating assessments from transcripts
  const createAssessmentFromTranscripts = useMutation(api.assessments.triggerTranscriptAssessment);
  const createAssessmentFromVapi = useAction(api.vapiApi.fetchVapiDataAndCreateAssessment);

  const handleCreateAssessment = async (sessionId: Id<"sessions">) => {
    setIsCreatingAssessment(sessionId);
    try {
      // Find the session to get vapiSessionId
      const session = candidate?.sessions.find(s => s._id === sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      if (session.vapiCallId) {
        // Use VAPI API to fetch data and create assessment
        console.log("📞 Creating assessment from VAPI data using call ID:", session.vapiCallId);
        await createAssessmentFromVapi({ 
          sessionId, 
          vapiCallId: session.vapiCallId 
        });
      } else {
        // Fallback to transcript-based evaluation
        console.log("📝 Creating assessment from stored transcripts");
        await createAssessmentFromTranscripts({ sessionId });
      }
      console.log("✅ Assessment created successfully");
    } catch (error) {
      console.error("❌ Failed to create assessment:", error);
      alert(`Failed to create assessment: ${error.message}`);
    } finally {
      setIsCreatingAssessment(null);
    }
  };

  if (candidate === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (candidate === null) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Candidate Not Found</h3>
        <p className="text-gray-500 mb-4">The candidate you're looking for doesn't exist.</p>
        <button
          onClick={() => router.back()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const fullName = candidate.firstName && candidate.lastName 
    ? `${candidate.firstName} ${candidate.lastName}`
    : "No name provided";

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 mb-4 flex items-center"
        >
          ← Back to Candidates
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xl font-medium text-gray-600">
                {candidate.firstName?.charAt(0) || candidate.email.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                {fullName}
                {candidate.flagged && (
                  <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    🚩 Flagged
                  </span>
                )}
              </h1>
              <p className="text-gray-600">{candidate.email}</p>
              <div className="mt-2 flex items-center space-x-3">
                <span className="text-sm text-gray-600">{candidate.position}</span>
                <TradeBadge category={candidate.tradeCategory} />
                <StatusBadge status={candidate.screeningStatus} />
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500">Last Contact</div>
            <div className="text-sm font-medium text-gray-900">
              {candidate.lastContactAt 
                ? new Date(candidate.lastContactAt).toLocaleDateString()
                : "Never"}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: "overview", label: "Overview" },
            { key: "sessions", label: `Sessions (${candidate.stats.totalSessions})` },
            { key: "assessments", label: `Assessments (${candidate.assessments.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{candidate.email}</dd>
              </div>
              {candidate.phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">{candidate.phone}</dd>
                </div>
              )}
              {candidate.timezone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Timezone</dt>
                  <dd className="text-sm text-gray-900">{candidate.timezone}</dd>
                </div>
              )}
              {candidate.preferredContactMethod && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Preferred Contact</dt>
                  <dd className="text-sm text-gray-900">{candidate.preferredContactMethod}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Application Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Application Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Position</dt>
                <dd className="text-sm text-gray-900">{candidate.position}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Trade Category</dt>
                <dd className="text-sm text-gray-900">
                  <TradeBadge category={candidate.tradeCategory} />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm text-gray-900">
                  <StatusBadge status={candidate.screeningStatus} />
                </dd>
              </div>
              {candidate.source && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Source</dt>
                  <dd className="text-sm text-gray-900">{candidate.source}</dd>
                </div>
              )}
              {candidate.referralCode && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Referral Code</dt>
                  <dd className="text-sm text-gray-900">{candidate.referralCode}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Invited At</dt>
                <dd className="text-sm text-gray-900">
                  {candidate.invitedAt 
                    ? new Date(candidate.invitedAt).toLocaleDateString()
                    : "Unknown"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Performance Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Sessions</dt>
                <dd className="text-lg font-semibold text-gray-900">{candidate.stats.totalSessions}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Completed Sessions</dt>
                <dd className="text-lg font-semibold text-gray-900">{candidate.stats.completedSessions}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Passed Assessments</dt>
                <dd className="text-lg font-semibold text-gray-900">{candidate.stats.passedAssessments}</dd>
              </div>
              {candidate.stats.averageScore !== null && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Average Score</dt>
                  <dd className="text-lg font-semibold text-gray-900">{candidate.stats.averageScore.toFixed(1)}%</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {activeTab === "sessions" && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {candidate.sessions.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-400 text-4xl mb-2">📞</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Yet</h3>
              <p className="text-gray-500">This candidate hasn't started any interview sessions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assessment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transcript
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {candidate.sessions.map((session) => (
                    <SessionRow 
                      key={session._id} 
                      session={session} 
                      onCreateAssessment={handleCreateAssessment}
                      isCreatingAssessment={isCreatingAssessment}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "assessments" && (
        <div className="space-y-6">
          {candidate.assessments.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <div className="text-gray-400 text-4xl mb-2">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessments Yet</h3>
              <p className="text-gray-500">This candidate hasn't completed any assessments.</p>
            </div>
          ) : (
            candidate.assessments.map((assessment) => (
              <div key={assessment._id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Assessment Results
                  </h3>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-gray-900">{assessment.overallScore}%</span>
                    <StatusBadge status={assessment.passed ? "passed" : "failed"} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Technical Score</dt>
                    <dd className="text-lg font-semibold text-gray-900">{assessment.scores.technicalSkills.score}%</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Safety Score</dt>
                    <dd className="text-lg font-semibold text-gray-900">{assessment.scores.safetyKnowledge.score}%</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Communication Score</dt>
                    <dd className="text-lg font-semibold text-gray-900">{assessment.scores.communication.score}%</dd>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Completed on {new Date(assessment.completedAt).toLocaleDateString()} at {new Date(assessment.completedAt).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* HR Notes Section */}
      {candidate.hrNotes && (
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">HR Notes</h3>
          <div className="bg-gray-50 rounded-md p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-700">{candidate.hrNotes}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
