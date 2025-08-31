"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// Simple stat card component
function StatCard({ title, value, icon, color = "blue" }: {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center justify-center h-8 w-8 rounded-md ${colorClasses[color as keyof typeof colorClasses]}`}>
              {icon}
            </span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

// Recent activity item component
function ActivityItem({ candidate, action, time, status }: {
  candidate: string;
  action: string;
  time: string;
  status: "completed" | "active" | "passed" | "failed";
}) {
  const statusColors = {
    completed: "bg-gray-100 text-gray-800",
    active: "bg-blue-100 text-blue-800",
    passed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {candidate.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{candidate}</p>
          <p className="text-sm text-gray-500">{action}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {status}
        </span>
        <span className="text-sm text-gray-500">{time}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // Get dashboard data
  const activeSessionCount = useQuery(api.sessions.getActiveSessionCount);
  const candidateAnalytics = useQuery(api.candidates.getCandidateAnalytics, {});
  const recentAssessments = useQuery(api.assessments.getRecentAssessments, { limit: 5 });

  // Loading state
  if (!activeSessionCount || !candidateAnalytics || !recentAssessments) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      title: "Active Sessions",
      value: activeSessionCount.count,
      icon: "🎙️",
      color: "blue" as const,
    },
    {
      title: "Total Candidates",
      value: candidateAnalytics.summary.totalCandidates,
      icon: "👥",
      color: "green" as const,
    },
    {
      title: "Pass Rate",
      value: `${candidateAnalytics.summary.passRate}%`,
      icon: "✅",
      color: "green" as const,
    },
    {
      title: "Pending Review",
      value: candidateAnalytics.summary.pendingReview,
      icon: "⏳",
      color: "yellow" as const,
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600">Monitor voice screening sessions and candidate progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Assessments</h3>
          </div>
          <div className="px-6 py-4">
            {recentAssessments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent assessments</p>
            ) : (
              <div className="space-y-1">
                {recentAssessments.map((assessment, index) => (
                  <ActivityItem
                    key={assessment._id}
                    candidate={assessment.candidate?.firstName && assessment.candidate?.lastName 
                      ? `${assessment.candidate.firstName} ${assessment.candidate.lastName}`
                      : assessment.candidate?.email || "Unknown"}
                    action={`Scored ${assessment.overallScore}%`}
                    time={new Date(assessment.completedAt).toLocaleDateString()}
                    status={assessment.passed ? "passed" : "failed"}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <button
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => window.location.href = '/dashboard/sessions'}
              >
                <span className="mr-2">👀</span>
                View Live Sessions
              </button>
              
              <button
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => window.location.href = '/dashboard/candidates'}
              >
                <span className="mr-2">📋</span>
                Manage Candidates
              </button>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Status Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Invited:</span>
                    <span className="font-medium">{candidateAnalytics.summary.invited}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">In Progress:</span>
                    <span className="font-medium">{candidateAnalytics.summary.inProgress}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium">{candidateAnalytics.summary.completed}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
