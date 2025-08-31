"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

// Session status badge component
function StatusBadge({ status }: { status: string }) {
  const statusColors = {
    active: "bg-green-100 text-green-800",
    created: "bg-blue-100 text-blue-800",
    completed: "bg-gray-100 text-gray-800",
    failed: "bg-red-100 text-red-800",
    abandoned: "bg-yellow-100 text-yellow-800",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

// Individual session card component  
function SessionCard({ session }: { session: any }) {
  const duration = session.duration 
    ? Math.round(session.duration / 1000 / 60)
    : session.startTime 
      ? Math.round((Date.now() - session.startTime) / 1000 / 60)
      : 0;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {session.candidate?.firstName?.charAt(0) || session.candidate?.email?.charAt(0) || "?"}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {session.candidate?.firstName && session.candidate?.lastName 
                    ? `${session.candidate.firstName} ${session.candidate.lastName}`
                    : session.candidate?.email || "Unknown Candidate"}
                </h3>
                <StatusBadge status={session.status} />
              </div>
              <p className="text-sm text-gray-500">
                {session.candidate?.position} • {session.candidate?.tradeCategory}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{duration} min</p>
            <p className="text-sm text-gray-500">
              {new Date(session.startTime).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Session details */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Session ID:</span>
            <span className="font-mono text-gray-900">{session.sessionId}</span>
          </div>
          {session.transcripts && session.transcripts.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">Latest exchange:</p>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                "{session.transcripts[session.transcripts.length - 1]?.text || "No transcript yet"}"
              </p>
            </div>
          )}
        </div>

        {/* Action buttons for active sessions */}
        {session.status === "active" && (
          <div className="mt-4 flex space-x-3">
            <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
              Monitor Live
            </button>
            <button className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300">
              Add Notes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const activeSessions = useQuery(api.sessions.getActiveSessions);
  const recentSessions = useQuery(api.sessions.getSessionHistory, { 
    limit: 10,
    status: undefined // Get all recent sessions
  });

  if (!activeSessions || !recentSessions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Live Sessions</h2>
        <p className="text-gray-600">Monitor active voice screening sessions in real-time</p>
      </div>

      {/* Active Sessions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Active Sessions ({activeSessions.length})
          </h3>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">Live</span>
          </div>
        </div>

        {activeSessions.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <div className="text-gray-400 text-4xl mb-2">🎙️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h3>
            <p className="text-gray-500">All voice screening sessions have completed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeSessions.map((session) => (
              <SessionCard key={session._id} session={session} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Sessions */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sessions</h3>
        
        {recentSessions.sessions.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <div className="text-gray-400 text-4xl mb-2">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Sessions</h3>
            <p className="text-gray-500">No voice screening sessions found.</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {recentSessions.sessions.map((session) => (
                <div key={session._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {session.candidate?.firstName?.charAt(0) || session.candidate?.email?.charAt(0) || "?"}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {session.candidate?.firstName && session.candidate?.lastName 
                            ? `${session.candidate.firstName} ${session.candidate.lastName}`
                            : session.candidate?.email || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {session.candidate?.position} • {session.candidate?.tradeCategory}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {session.assessment && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {session.assessment.overallScore}%
                          </p>
                          <StatusBadge status={session.assessment.passed ? "passed" : "failed"} />
                        </div>
                      )}
                      <div className="text-right">
                        <StatusBadge status={session.status} />
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(session.startTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
