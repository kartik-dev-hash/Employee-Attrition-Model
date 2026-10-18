import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Modal } from "../../components/common/Modal";
import {
  Building2,
  Search,
  Filter,
  RefreshCw,
  Users,
  ShieldCheck,
  Calendar,
  Mail,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  X,
  Building,
} from "lucide-react";

const STATUS_BADGE = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

export const CompanyManagement = () => {
  const { token } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);

  const fetchCompanies = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/all-companies");
      setCompanies(res.data.companies || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCompanies();
  }, [token]);

  const handleAction = async (id, action) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await api.put(`/admin/${action}-company/${id}`);
      await fetchCompanies();
      if (selectedCompany && selectedCompany._id === id) {
        setSelectedCompany((prev) => ({
          ...prev,
          status: action === "approve" ? "approved" : "rejected",
        }));
      }
    } catch (e) {
      alert(e.response?.data?.message || `Failed to ${action} company`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filtered = companies.filter((c) => {
    const matchesFilter = filter === "all" ? true : c.status === filter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      c.companyName?.toLowerCase().includes(query) ||
      c.companyCode?.toLowerCase().includes(query) ||
      c.industry?.toLowerCase().includes(query) ||
      c.primaryHR?.fullName?.toLowerCase().includes(query) ||
      c.primaryHR?.email?.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: companies.length,
    pending: companies.filter((c) => c.status === "pending").length,
    approved: companies.filter((c) => c.status === "approved").length,
    rejected: companies.filter((c) => c.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-8 h-8 text-indigo-600" />
            Company Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Review registered organizations, manage onboarding approval, and track employee footprint.
          </p>
        </div>

        <button
          onClick={fetchCompanies}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium text-sm rounded-xl transition-all shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "All Companies", key: "all", count: counts.all, color: "text-slate-700 bg-slate-50 border-slate-200" },
          { label: "Pending Approval", key: "pending", count: counts.pending, color: "text-amber-700 bg-amber-50/50 border-amber-200" },
          { label: "Active & Approved", key: "approved", count: counts.approved, color: "text-emerald-700 bg-emerald-50/50 border-emerald-200" },
          { label: "Rejected / Suspended", key: "rejected", count: counts.rejected, color: "text-rose-700 bg-rose-50/50 border-rose-200" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`p-4 rounded-2xl border text-left transition-all ${item.color} ${
              filter === item.key
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, code, HR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500 mr-1">Status:</span>
          {["all", "pending", "approved", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === st
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            Loading registered companies...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Building className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            No companies found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Company Name</th>
                  <th className="px-6 py-3.5">Industry</th>
                  <th className="px-6 py-3.5">Company Code</th>
                  <th className="px-6 py-3.5">Registered Date</th>
                  <th className="px-6 py-3.5">Employees</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((comp) => (
                  <tr key={comp._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{comp.companyName}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {comp.primaryHR?.email || "No HR assigned"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {comp.industry || "General"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200">
                        {comp.companyCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {comp.createdAt
                        ? new Date(comp.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span>{comp.employeeCount ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${
                          STATUS_BADGE[comp.status] || "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {comp.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                        {comp.status === "pending" && <Clock className="w-3 h-3" />}
                        {comp.status === "rejected" && <XCircle className="w-3 h-3" />}
                        {comp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedCompany(comp)}
                          className="px-2.5 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
                        </button>

                        {comp.status === "pending" && (
                          <>
                            <button
                              disabled={actionLoading[comp._id]}
                              onClick={() => handleAction(comp._id, "approve")}
                              className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {actionLoading[comp._id] ? "..." : "Approve"}
                            </button>
                            <button
                              disabled={actionLoading[comp._id]}
                              onClick={() => handleAction(comp._id, "reject")}
                              className="px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {actionLoading[comp._id] ? "..." : "Reject"}
                            </button>
                          </>
                        )}

                        {comp.status === "approved" && (
                          <button
                            disabled={actionLoading[comp._id]}
                            onClick={() => handleAction(comp._id, "reject")}
                            className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {actionLoading[comp._id] ? "..." : "Revoke Access"}
                          </button>
                        )}

                        {comp.status === "rejected" && (
                          <button
                            disabled={actionLoading[comp._id]}
                            onClick={() => handleAction(comp._id, "approve")}
                            className="px-2.5 py-1.5 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {actionLoading[comp._id] ? "..." : "Re-approve"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Company Details Modal */}
      <Modal
        isOpen={Boolean(selectedCompany)}
        onClose={() => setSelectedCompany(null)}
        title="Company Details"
        subtitle={selectedCompany ? `${selectedCompany.companyName} (${selectedCompany.industry} Industry)` : ""}
        icon={Building2}
        maxWidth="max-w-lg"
      >
        {selectedCompany && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xl font-bold text-slate-800">{selectedCompany.companyName}</h4>
                <p className="text-sm text-slate-500">{selectedCompany.industry} Industry</p>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border capitalize ${
                  STATUS_BADGE[selectedCompany.status] || "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {selectedCompany.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-medium text-slate-400 block uppercase">Company Code</span>
                <span className="font-mono font-bold text-sm text-slate-800">{selectedCompany.companyCode}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-medium text-slate-400 block uppercase">Total Employees</span>
                <span className="font-bold text-sm text-slate-800">{selectedCompany.employeeCount ?? 0}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-medium text-slate-400 block uppercase">Registered On</span>
                <span className="font-medium text-sm text-slate-700">
                  {selectedCompany.createdAt
                    ? new Date(selectedCompany.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-medium text-slate-400 block uppercase">HR Admins</span>
                <span className="font-bold text-sm text-slate-800">{selectedCompany.hrCount ?? 1}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Primary HR Administrator
              </h5>
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedCompany.primaryHR?.fullName || "Not Assigned"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedCompany.primaryHR?.email || "No email"}
                  </p>
                </div>
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
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
