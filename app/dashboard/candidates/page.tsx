"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import Link from "next/link";

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

export default function CandidatesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [tradeFilter, setTradeFilter] = useState<string>("");

  // Query candidates with filters
  const candidatesData = useQuery(api.candidates.getCandidates, {
    searchTerm: searchTerm.trim() || undefined,
    screeningStatus: statusFilter as any || undefined,
    tradeCategory: tradeFilter as any || undefined,
    limit: 50,
  });

  if (!candidatesData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { candidates, total } = candidatesData;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Candidates</h2>
        <p className="text-gray-600">Manage and review candidate applications and screening results</p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Name, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              <option value="invited">Invited</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="pending_review">Pending Review</option>
            </select>
          </div>

          {/* Trade Filter */}
          <div>
            <label htmlFor="trade" className="block text-sm font-medium text-gray-700">
              Trade Category
            </label>
            <select
              id="trade"
              value={tradeFilter}
              onChange={(e) => setTradeFilter(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Trades</option>
              <option value="construction">Construction</option>
              <option value="electrical">Electrical</option>
              <option value="plumbing">Plumbing</option>
              <option value="welding">Welding</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="maintenance">Maintenance</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setTradeFilter("");
              }}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-700">
          Showing {candidates.length} of {total} candidates
        </p>
      </div>

      {/* Candidates Table */}
      {candidates.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="text-gray-400 text-4xl mb-2">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Candidates Found</h3>
          <p className="text-gray-500">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position & Trade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Contact
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates.map((candidate) => (
                  <tr key={candidate._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {candidate.firstName?.charAt(0) || candidate.email.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            <Link 
                              href={`/dashboard/candidates/${candidate._id}`}
                              className="hover:text-blue-600 hover:underline"
                            >
                              {candidate.firstName && candidate.lastName 
                                ? `${candidate.firstName} ${candidate.lastName}`
                                : "No name provided"}
                            </Link>
                            {candidate.flagged && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                🚩 Flagged
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{candidate.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{candidate.position}</div>
                      <TradeBadge category={candidate.tradeCategory} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={candidate.screeningStatus} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {candidate.stats.totalSessions} total
                      {candidate.stats.completedSessions > 0 && (
                        <div className="text-xs text-gray-500">
                          {candidate.stats.completedSessions} completed
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {candidate.latestAssessment ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {candidate.latestAssessment.overallScore}%
                          </div>
                          <StatusBadge status={candidate.latestAssessment.passed ? "passed" : "failed"} />
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No assessment</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.lastContactAt 
                        ? new Date(candidate.lastContactAt).toLocaleDateString()
                        : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
