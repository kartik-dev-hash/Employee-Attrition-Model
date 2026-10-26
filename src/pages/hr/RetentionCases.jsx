import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { Card } from "../../components/common/Card";
import { Toast } from "../../components/common/Toast";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Modal } from "../../components/common/Modal";
import {
  Bot,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  Filter,
  ChevronDown,
  Sparkles,
  Check,
} from "lucide-react";

/**
 * RetentionCases – HR page to manage all auto-scheduled retention meetings and proposals.
 *
 * Features:
 *  • Lists all retention cases & proposals with status filters
 *  • See employee invitation responses
 *  • View proposals awaiting HR approval
 *  • View exception queue
 *  • Cancel a scheduled meeting
 */
export const RetentionCases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("All");
  const [bulkScheduling, setBulkScheduling] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/hr/retention-meetings").catch(() =>
        api.get("/api/hr/retention/all-cases")
      );
      setCases(res.data?.cases || []);
    } catch (err) {
      console.error("Error loading retention cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // ── Bulk auto-schedule ───────────────────────────────────────────────────
  const handleBulkSchedule = async () => {
    setBulkScheduling(true);
    setBulkResult(null);
    try {
      const res = await api.post("/api/hr/retention/bulk-auto-schedule");
      setBulkResult(res.data);
      setToast({
        type: "success",
        text: `Bulk auto-schedule complete: ${res.data.scheduled} scheduled, ${res.data.skippedDuplicate} already active, ${res.data.skippedNoSlot} no slot.`,
      });
      await fetchCases();
    } catch (err) {
      setToast({ type: "error", text: err.response?.data?.message || "Bulk auto-schedule failed." });
    } finally {
      setBulkScheduling(false);
    }
  };

  // ── Cancel meeting ───────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.post(`/api/hr/retention/cancel/${cancelTarget.employeeId}`, {
        reason: cancelReason,
      });
      setToast({ type: "success", text: "Meeting cancelled successfully." });
      setCancelTarget(null);
      setCancelReason("");
      await fetchCases();
    } catch (err) {
      setToast({ type: "error", text: err.response?.data?.message || "Failed to cancel meeting." });
    } finally {
      setCancelling(false);
    }
  };

  // ── Filters ──────────────────────────────────────────────────────────────
  const FILTERS = ["All", "Proposed", "Approved", "In Progress", "Completed", "Cancelled", "Exception Queue"];

  const filtered = cases.filter((c) => {
    if (filter === "All") return true;
    if (filter === "Exception Queue") return c.inExceptionQueue;
    if (filter === "Proposed") return c.proposalStatus === "PROPOSED" || c.status === "PROPOSED";
    if (filter === "Approved") return c.status === "APPROVED" || c.proposalStatus === "APPROVED";
    return c.invitationStatus === filter || c.status === filter;
  });

  // ── Status helpers ───────────────────────────────────────────────────────
  const invitationBadge = {
    Pending: "bg-amber-100 text-amber-800",
    Accepted: "bg-emerald-100 text-emerald-800",
    Declined: "bg-rose-100 text-rose-800",
    RescheduleRequested: "bg-indigo-100 text-indigo-800",
  };

  const statusBadge = {
    Pending: "bg-slate-100 text-slate-700",
    PROPOSED: "bg-amber-100 text-amber-800 border border-amber-200",
    Proposed: "bg-amber-100 text-amber-800 border border-amber-200",
    APPROVED: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    Approved: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    "In Progress": "bg-indigo-100 text-indigo-700",
    Completed: "bg-emerald-100 text-emerald-700",
    Cancelled: "bg-rose-100 text-rose-700",
  };

  if (loading) {
    return <LoadingSpinner label="Loading retention cases..." />;
  }

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">AI Retention Agent</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage AI-generated retention proposals and confirmed meetings for at-risk team members.
          </p>
        </div>

        <button
          onClick={handleBulkSchedule}
          disabled={bulkScheduling}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          <span>{bulkScheduling ? "Scheduling..." : "Auto-Schedule All Eligible"}</span>
        </button>
      </div>

      {/* Bulk result summary */}
      {bulkResult && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 space-y-1">
          <p className="font-bold text-indigo-800">Last bulk auto-schedule result:</p>
          <div className="flex flex-wrap gap-4">
            <span>✅ Scheduled: <strong>{bulkResult.scheduled}</strong></span>
            <span>⚠️ Skipped (duplicate): <strong>{bulkResult.skippedDuplicate}</strong></span>
            <span>❌ No slot: <strong>{bulkResult.skippedNoSlot}</strong></span>
            <span>⚡ Errors: <strong>{bulkResult.errors}</strong></span>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Cases", value: cases.length, icon: Users, color: "indigo" },
          {
            label: "Proposals Pending",
            value: cases.filter((c) => c.proposalStatus === "PROPOSED" || c.status === "PROPOSED").length,
            icon: Clock,
            color: "amber",
          },
          {
            label: "Approved / Active",
            value: cases.filter((c) => (c.status === "APPROVED" || c.status === "In Progress") && c.meetingDate).length,
            icon: CheckCircle2,
            color: "emerald",
          },
          {
            label: "Exception Queue",
            value: cases.filter((c) => c.inExceptionQueue).length,
            icon: AlertTriangle,
            color: "rose",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          const colorMap = {
            indigo: "bg-indigo-50 border-indigo-100 text-indigo-600",
            amber: "bg-amber-50 border-amber-100 text-amber-600",
            emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
            rose: "bg-rose-50 border-rose-100 text-rose-600",
          };
          return (
            <div
              key={stat.label}
              className={`p-4 rounded-2xl border flex items-center gap-3 ${colorMap[stat.color]}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold opacity-80">{stat.label}</p>
                <p className="text-xl font-extrabold">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filter === f
                ? "bg-indigo-600 text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f}
            {f === "Exception Queue" && cases.filter((c) => c.inExceptionQueue).length > 0 && (
              <span className="ml-1 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {cases.filter((c) => c.inExceptionQueue).length}
              </span>
            )}
            {f === "Proposed" && cases.filter((c) => c.proposalStatus === "PROPOSED" || c.status === "PROPOSED").length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {cases.filter((c) => c.proposalStatus === "PROPOSED" || c.status === "PROPOSED").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cases list */}
      {filtered.length === 0 ? (
        <Card>
          <div className="py-10 text-center text-sm text-slate-400">
            No cases found for the selected filter.
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const isCaseProposed = c.proposalStatus === "PROPOSED" || c.status === "PROPOSED";
            return (
              <div
                key={c._id}
                className={`p-4 rounded-2xl border bg-white space-y-3 ${
                  c.inExceptionQueue
                    ? "border-rose-200 bg-rose-50/30"
                    : isCaseProposed
                    ? "border-amber-200 bg-amber-50/20"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Employee info */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {c.employee?.fullName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {c.employee?.fullName || "Unknown"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {c.employee?.email || ""} · {c.employee?.employeeCode || ""}
                      </p>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.proposalSource && c.proposalSource !== "none" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {c.proposalSource === "n8n_agent" ? "n8n Agent" : "Internal AI"}
                      </span>
                    )}

                    {isCaseProposed && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        Awaiting Approval
                      </span>
                    )}

                    {c.inExceptionQueue && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Exception
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        statusBadge[c.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {c.status}
                    </span>

                    {c.invitationStatus && c.meetingDate && !isCaseProposed && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          invitationBadge[c.invitationStatus] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        Employee: {c.invitationStatus === "RescheduleRequested" ? "Reschedule Req." : c.invitationStatus}
                      </span>
                    )}
                  </div>
                </div>

                {/* Exception reason */}
                {c.inExceptionQueue && c.exceptionReason && (
                  <div className="flex items-start gap-2 p-2.5 bg-rose-100/60 rounded-xl text-xs text-rose-800">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{c.exceptionReason}</span>
                  </div>
                )}

                {/* Meeting purpose / proposed slot info */}
                {c.meetingPurpose && (
                  <p className="text-xs text-slate-600 font-medium">
                    Purpose: <span className="font-semibold text-slate-800">{c.meetingPurpose}</span>
                  </p>
                )}

                {/* Meeting time */}
                {c.meetingDate && (
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {isCaseProposed ? "Proposed: " : "Scheduled: "} {c.meetingDate}
                    </span>
                    {c.meetingTime && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {c.meetingTime}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  {c.status !== "Cancelled" && c.status !== "Completed" && c.meetingDate && !isCaseProposed && (
                    <button
                      onClick={() => setCancelTarget({ employeeId: c.employeeId, name: c.employee?.fullName })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel confirmation modal */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title={`Cancel Meeting`}
        subtitle={`For ${cancelTarget?.name || "employee"}`}
        icon={XCircle}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason for cancellation (optional)
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Employee on leave, rescheduling in progress..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white resize-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCancelTarget(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
            >
              Go Back
            </button>
            <button
              type="button"
              disabled={cancelling}
              onClick={handleCancel}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl shadow transition-all"
            >
              {cancelling ? "Cancelling..." : "Confirm Cancel"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
