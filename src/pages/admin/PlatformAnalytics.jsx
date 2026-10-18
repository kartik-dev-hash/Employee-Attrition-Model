import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import {
  BarChart3,
  Building2,
  Users,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  TrendingUp,
  Activity,
  Layers,
  PieChart,
} from "lucide-react";

export const PlatformAnalytics = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/platform-stats");
      setStats(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load platform analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchStats();
  }, [token]);

  const companyData = stats?.companies || { total: 0, approved: 0, pending: 0, rejected: 0 };
  const userData = stats?.users || { total: 0, hr: 0, employee: 0, admin: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            Platform Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time platform-wide usage metrics, company approvals, and account distributions.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium text-sm rounded-xl transition-all shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          Refresh Metrics
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Top Level Platform Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Companies
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 mt-2">{companyData.total}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-semibold">{companyData.approved} approved</span>
            <span>•</span>
            <span className="text-amber-600 font-semibold">{companyData.pending} pending</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Users
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 mt-2">{userData.total}</p>
          <p className="text-xs text-slate-500 mt-2">
            Across all roles and tenants
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Employees
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 mt-2">{userData.employee}</p>
          <p className="text-xs text-slate-500 mt-2">
            Registered feedback submitters
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              HR Administrators
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 mt-2">{userData.hr}</p>
          <p className="text-xs text-slate-500 mt-2">
            Company tenant administrators
          </p>
        </div>
      </div>

      {/* Two Columns: Company Status Distribution & User Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              Company Status Distribution
            </h3>
            <span className="text-xs text-slate-500">Live Database Counts</span>
          </div>

          <div className="space-y-3 pt-2">
            {/* Approved */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-emerald-700">Approved & Active</span>
                <span className="text-slate-800 font-bold">
                  {companyData.approved} ({companyData.total ? Math.round((companyData.approved / companyData.total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${companyData.total ? (companyData.approved / companyData.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Pending */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-amber-700">Pending Review</span>
                <span className="text-slate-800 font-bold">
                  {companyData.pending} ({companyData.total ? Math.round((companyData.pending / companyData.total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${companyData.total ? (companyData.pending / companyData.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Rejected */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-rose-700">Rejected / Suspended</span>
                <span className="text-slate-800 font-bold">
                  {companyData.rejected} ({companyData.total ? Math.round((companyData.rejected / companyData.total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-rose-500 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${companyData.total ? (companyData.rejected / companyData.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-100 mt-4">
            💡 Companies must be approved by Platform Admin before HR and Employees can access the portal.
          </div>
        </div>

        {/* User Role Distribution Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              User Role Distribution
            </h3>
            <span className="text-xs text-slate-500">Live Database Counts</span>
          </div>

          <div className="space-y-3 pt-2">
            {/* Employees */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-emerald-700">Employees</span>
                <span className="text-slate-800 font-bold">
                  {userData.employee} ({userData.total ? Math.round((userData.employee / userData.total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${userData.total ? (userData.employee / userData.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* HR Administrators */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-indigo-700">HR Administrators</span>
                <span className="text-slate-800 font-bold">
                  {userData.hr} ({userData.total ? Math.round((userData.hr / userData.total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${userData.total ? (userData.hr / userData.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Platform Admins */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-purple-700">Platform Admins</span>
                <span className="text-slate-800 font-bold">
                  {userData.admin} ({userData.total ? Math.round((userData.admin / userData.total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${userData.total ? (userData.admin / userData.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-100 mt-4">
            🔒 Role-based access ensures platform admins maintain tenant isolation across all enterprise tenants.
          </div>
        </div>
      </div>
    </div>
  );
};
