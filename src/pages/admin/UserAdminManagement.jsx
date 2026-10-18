import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Modal } from "../../components/common/Modal";
import {
  UserCog,
  Search,
  Filter,
  RefreshCw,
  Users,
  ShieldCheck,
  UserCheck,
  Building2,
  Mail,
  Phone,
  Calendar,
  Eye,
  X,
  BadgeCheck,
  Shield,
} from "lucide-react";

const ROLE_BADGE = {
  platformAdmin: "bg-purple-50 text-purple-700 border-purple-200",
  hr: "bg-indigo-50 text-indigo-700 border-indigo-200",
  employee: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const ROLE_LABEL = {
  platformAdmin: "Platform Admin",
  hr: "HR Administrator",
  employee: "Employee",
};

export const UserAdminManagement = () => {
  const { token, user: loggedInUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.users || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      u.fullName?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.companyCode?.toLowerCase().includes(query) ||
      u.employeeCode?.toLowerCase().includes(query);

    return matchesRole && matchesSearch;
  });

  const counts = {
    all: users.length,
    platformAdmin: users.filter((u) => u.role === "platformAdmin").length,
    hr: users.filter((u) => u.role === "hr").length,
    employee: users.filter((u) => u.role === "employee").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <UserCog className="w-8 h-8 text-indigo-600" />
            User & Admin Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse all user accounts across organizations with role-based access verification.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium text-sm rounded-xl transition-all shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          Refresh Users
        </button>
      </div>

      {/* Role Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "All Users", key: "all", count: counts.all, color: "text-slate-700 bg-slate-50 border-slate-200" },
          { label: "Platform Admins", key: "platformAdmin", count: counts.platformAdmin, color: "text-purple-700 bg-purple-50/50 border-purple-200" },
          { label: "HR Admins", key: "hr", count: counts.hr, color: "text-indigo-700 bg-indigo-50/50 border-indigo-200" },
          { label: "Employees", key: "employee", count: counts.employee, color: "text-emerald-700 bg-emerald-50/50 border-emerald-200" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setRoleFilter(item.key)}
            className={`p-4 rounded-2xl border text-left transition-all ${item.color} ${
              roleFilter === item.key
                ? "ring-2 ring-indigo-500 shadow-sm"
                : "hover:border-slate-300"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{item.label}</p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-1">{item.count}</p>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, company code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500 mr-1">Role:</span>
          {[
            { key: "all", label: "All" },
            { key: "platformAdmin", label: "Platform Admin" },
            { key: "hr", label: "HR Admin" },
            { key: "employee", label: "Employee" },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => setRoleFilter(r.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                roleFilter === r.key
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            Loading platform users...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            No users found matching current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Company Code</th>
                  <th className="px-6 py-3.5">Employee ID</th>
                  <th className="px-6 py-3.5">Joined Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const isCurrent = loggedInUser && loggedInUser.id === u._id;
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center font-bold text-xs text-slate-700 uppercase flex-shrink-0">
                            {u.fullName?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              {u.fullName}
                              {isCurrent && (
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-sm">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            ROLE_BADGE[u.role] || "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {u.role === "platformAdmin" && <Shield className="w-3 h-3" />}
                          {u.role === "hr" && <ShieldCheck className="w-3 h-3" />}
                          {u.role === "employee" && <UserCheck className="w-3 h-3" />}
                          {ROLE_LABEL[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.companyCode ? (
                          <span className="font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200">
                            {u.companyCode}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">System Wide</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-600">
                        {u.employeeCode || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="px-2.5 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      <Modal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title="Account Information"
        subtitle={selectedUser ? `${selectedUser.fullName} (${selectedUser.email})` : ""}
        icon={UserCog}
        maxWidth="max-w-md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg uppercase flex-shrink-0">
                {selectedUser.fullName?.charAt(0) || "U"}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">{selectedUser.fullName}</h4>
                <p className="text-xs text-slate-500">{selectedUser.email}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Platform Role</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    ROLE_BADGE[selectedUser.role] || "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {ROLE_LABEL[selectedUser.role] || selectedUser.role}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Company Code</span>
                <span className="font-mono font-bold text-xs text-slate-800">
                  {selectedUser.companyCode || "Platform Root"}
                </span>
              </div>

              {selectedUser.employeeCode && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Employee Code</span>
                  <span className="font-mono font-bold text-xs text-slate-800">
                    {selectedUser.employeeCode}
                  </span>
                </div>
              )}

              {selectedUser.phoneNumber && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Phone Number</span>
                  <span className="text-xs font-medium text-slate-800">
                    {selectedUser.phoneNumber}
                  </span>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Registered At</span>
                <span className="text-xs font-medium text-slate-800">
                  {selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleString()
                    : "N/A"}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
