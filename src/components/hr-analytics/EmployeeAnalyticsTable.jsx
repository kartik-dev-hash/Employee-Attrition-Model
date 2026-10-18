import React, { useState } from "react";
import { Search, Eye, Filter, ArrowUpDown } from "lucide-react";

export const EmployeeAnalyticsTable = ({ employees, onSelectEmployee }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      (emp.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employeeCode || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "ALL") return true;
    if (statusFilter === "SUBMITTED") return emp.submitted;
    if (statusFilter === "PENDING") return !emp.submitted;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Individual Employee Analytics Roster</h3>
          <p className="text-xs text-slate-500">Select any employee to view their detailed ratings, feedback history, and risk assessment</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="SUBMITTED">Survey Submitted</option>
              <option value="PENDING">Survey Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-5">Employee</th>
              <th className="py-3 px-5">Employee Code</th>
              <th className="py-3 px-5">Survey Status</th>
              <th className="py-3 px-5">Overall Rating</th>
              <th className="py-3 px-5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400">
                  No matching employees found in your company roster.
                </td>
              </tr>
            ) : (
              filtered.map((emp) => {
                const avgScore = emp.avgScore ? Number(emp.avgScore) : null;
                return (
                  <tr key={emp._id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Employee Profile */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {emp.fullName?.charAt(0)?.toUpperCase() || "E"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{emp.fullName}</p>
                          <p className="text-[11px] text-slate-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Employee Code */}
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {emp.employeeCode || "N/A"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5">
                      {emp.submitted ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          Feedback Recorded
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                          Awaiting Response
                        </span>
                      )}
                    </td>

                    {/* Overall Rating */}
                    <td className="py-3.5 px-5">
                      {avgScore ? (
                        <span className={`font-bold ${
                          avgScore >= 3.5 ? "text-emerald-600" : avgScore >= 2.5 ? "text-amber-600" : "text-rose-600"
                        }`}>
                          ★ {avgScore} / 5.0
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-5 text-center">
                      <button
                        onClick={() => onSelectEmployee(emp._id)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Analytics</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
