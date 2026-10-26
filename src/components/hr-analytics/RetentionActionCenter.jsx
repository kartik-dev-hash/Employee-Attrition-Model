import React, { useState, useEffect } from "react";
import api from "../../api/client";
import { Toast } from "../common/Toast";
import { Modal } from "../common/Modal";
import {
  ShieldAlert,
  MessageCircle,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Phone,
  History,
  Zap,
  Bot,
  Video,
  ExternalLink,
  XCircle,
  RefreshCw,
  Mail,
  User,
  Check,
  X,
  Sparkles,
  FileText,
  Send,
} from "lucide-react";

export const RetentionActionCenter = ({ employee, feedback, mlPrediction, onActionUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [autoScheduling, setAutoScheduling] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // Retention record state
  const [actionData, setActionData] = useState({
    status: "Pending",
    proposalStatus: "NONE",
    proposalSource: "none",
    assignedHR: "HR Representative",
    meetingDate: "",
    meetingTime: "",
    meetingLocation: "",
    meetingLink: "",
    meetingPurpose: "Confidential Retention & Feedback Discussion",
    meetingAgenda: "",
    invitationDraft: { subject: "", message: "" },
    contactMethod: "Email",
    suggestedActions: [],
    agreedActionPlan: "",
    notes: "",
    followUpDate: "",
    contactHistory: [],
  });

  // Proposal form inputs (for requesting a proposal)
  const [purposeInput, setPurposeInput] = useState("Confidential Retention & Feedback Discussion");
  const [notesInput, setNotesInput] = useState("");
  const [preferredDateInput, setPreferredDateInput] = useState("");
  const [preferredTimeInput, setPreferredTimeInput] = useState("");

  // Proposal edit inputs (for reviewing & editing proposal before approval)
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editPurpose, setEditPurpose] = useState("");
  const [editAgenda, setEditAgenda] = useState("");
  const [editDraftMessage, setEditDraftMessage] = useState("");

  const [phoneNumber, setPhoneNumber] = useState(employee?.phoneNumber || "");
  const [employeeEmail, setEmployeeEmail] = useState(employee?.email || "");

  // WhatsApp compose modal state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppText, setWhatsAppText] = useState("");

  // Determine ML risk presentation
  const isEvaluated = mlPrediction && mlPrediction.isAvailable;
  const isHighRisk = isEvaluated && mlPrediction.outcome === "Yes";
  const probabilityPct = isEvaluated && mlPrediction.probability != null
    ? `${(mlPrediction.probability * 100).toFixed(1)}%`
    : null;

  // Active confirmed meeting (not just a proposal)
  const hasScheduledMeeting = Boolean(
    actionData.meetingDate &&
    actionData.status !== "Cancelled" &&
    actionData.status !== "PROPOSED" &&
    actionData.proposalStatus !== "PROPOSED"
  );

  const isProposed = actionData.proposalStatus === "PROPOSED" || actionData.status === "PROPOSED";

  // Derive evidence-based suggested retention actions from feedback
  const generatedSuggestions = [];
  if (feedback) {
    if (typeof feedback.workLifeBalance === "number" && feedback.workLifeBalance <= 2.5) {
      generatedSuggestions.push({
        area: "Work-Life Balance",
        rating: `${feedback.workLifeBalance}/5`,
        action: "Review workload, project deadlines, and explore flexible hours or hybrid scheduling.",
      });
    }
    if (typeof feedback.growth === "number" && feedback.growth <= 2.5) {
      generatedSuggestions.push({
        area: "Growth & Career Path",
        rating: `${feedback.growth}/5`,
        action: "Discuss career progression, promotion roadmap, training stipends, and internal mentoring.",
      });
    }
    if (typeof feedback.workEnvironment === "number" && feedback.workEnvironment <= 2.5) {
      generatedSuggestions.push({
        area: "Work Environment",
        rating: `${feedback.workEnvironment}/5`,
        action: "Investigate workplace concerns, team culture, physical/virtual tooling, and team dynamics.",
      });
    }
    if (typeof feedback.jobSatisfaction === "number" && feedback.jobSatisfaction <= 2.5) {
      generatedSuggestions.push({
        area: "Job Satisfaction",
        rating: `${feedback.jobSatisfaction}/5`,
        action: "Conduct 1-on-1 check-in to understand daily frustrations, role fit, and recognition needs.",
      });
    }
    if (feedback.manager && feedback.manager.toLowerCase().includes("unsatisfied")) {
      generatedSuggestions.push({
        area: "Manager & Leadership Support",
        rating: feedback.manager,
        action: "Arrange a confidential neutral discussion regarding supervisory support and expectations.",
      });
    }
  }

  // Load existing retention action record for this employee
  useEffect(() => {
    let isMounted = true;
    const fetchAction = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/hr/retention-meetings/${employee._id}`).catch(() =>
          api.get(`/api/hr/retention/actions/${employee._id}`)
        );
        if (isMounted && res.data?.actionRecord) {
          const rec = res.data.actionRecord;
          setActionData({
            status: rec.status || "Pending",
            proposalStatus: rec.proposalStatus || "NONE",
            proposalSource: rec.proposalSource || "none",
            assignedHR: rec.assignedHR || "HR Representative",
            meetingDate: rec.meetingDate || "",
            meetingTime: rec.meetingTime || "",
            meetingLocation: rec.meetingLocation || "",
            meetingLink: rec.meetingLink || "",
            meetingPurpose: rec.meetingPurpose || "Confidential Retention & Feedback Discussion",
            meetingAgenda: rec.meetingAgenda || "",
            invitationDraft: rec.invitationDraft || { subject: "", message: "" },
            contactMethod: rec.contactMethod || "Email",
            suggestedActions: rec.suggestedActions || [],
            agreedActionPlan: rec.agreedActionPlan || "",
            notes: rec.notes || "",
            followUpDate: rec.followUpDate || "",
            contactHistory: rec.contactHistory || [],
            invitationStatus: rec.invitationStatus || "Pending",
          });

          // Pre-populate review fields if proposal is waiting for approval
          setEditDate(rec.meetingDate || "");
          setEditTime(rec.meetingTime || "");
          setEditPurpose(rec.meetingPurpose || "Confidential Retention & Feedback Discussion");
          setEditAgenda(rec.meetingAgenda || "");
          setEditDraftMessage(rec.invitationDraft?.message || "");

          if (res.data.employee?.phoneNumber) {
            setPhoneNumber(res.data.employee.phoneNumber);
          }
          if (res.data.employee?.email) {
            setEmployeeEmail(res.data.employee.email);
          }
        }
      } catch (err) {
        console.warn("Could not load retention action record:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (employee?._id) {
      fetchAction();
    }
    return () => {
      isMounted = false;
    };
  }, [employee]);

  // Request a retention meeting proposal from n8n AI Agent
  const handleProposeMeeting = async () => {
    setAutoScheduling(true);
    setToast(null);
    try {
      const res = await api.post("/api/hr/retention-meetings/propose", {
        employeeId: employee._id,
        purpose: purposeInput,
        notes: notesInput,
        preferredDate: preferredDateInput || null,
        preferredTime: preferredTimeInput || null,
      });

      if (res.data?.success) {
        const proposal = res.data.proposal || {};
        const rec = res.data.actionRecord || {};

        setActionData((prev) => ({
          ...prev,
          status: "PROPOSED",
          proposalStatus: "PROPOSED",
          proposalSource: res.data.proposalSource || "none",
          meetingDate: proposal.proposedDate || rec.meetingDate || "",
          meetingTime: proposal.proposedTime || rec.meetingTime || "",
          meetingPurpose: proposal.purpose || purposeInput,
          meetingAgenda: proposal.agenda || "",
          invitationDraft: proposal.invitationDraft || {},
        }));

        setEditDate(proposal.proposedDate || rec.meetingDate || "");
        setEditTime(proposal.proposedTime || rec.meetingTime || "");
        setEditPurpose(proposal.purpose || purposeInput);
        setEditAgenda(proposal.agenda || "");
        setEditDraftMessage(proposal.invitationDraft?.message || "");

        const sourceLabel = res.data.proposalSource === "n8n_agent"
          ? "n8n AI Retention Agent"
          : "Internal Retention Engine (n8n fallback)";

        setToast({
          type: "success",
          text: `Proposal received via ${sourceLabel}! Please review and approve below.`,
        });

        if (onActionUpdated) onActionUpdated();
      } else {
        setToast({
          type: "error",
          text: res.data?.message || "Could not generate proposal.",
        });
      }
    } catch (err) {
      setToast({
        type: "error",
        text: err.response?.data?.message || "Meeting proposal request failed. Please try again.",
      });
    } finally {
      setAutoScheduling(false);
    }
  };

  // Approve proposal: Reserves the slot, generates link, and dispatches the invitation
  const handleApproveMeeting = async () => {
    setApproving(true);
    setToast(null);
    try {
      const res = await api.post(`/api/hr/retention-meetings/${employee._id}/approve`, {
        meetingDate: editDate,
        meetingTime: editTime,
        meetingPurpose: editPurpose,
        meetingAgenda: editAgenda,
        invitationDraft: {
          subject: actionData.invitationDraft?.subject || `Invitation: Retention Discussion — ${employee.fullName}`,
          message: editDraftMessage,
        },
      });

      if (res.data?.success) {
        const rec = res.data.actionRecord || {};
        setActionData((prev) => ({
          ...prev,
          ...rec,
          status: "APPROVED",
          proposalStatus: "APPROVED",
        }));

        const emailDelivered = res.data.emailResult?.success;
        const emailMsg = emailDelivered
          ? " Invitation email dispatched! ✅"
          : " (Email could not be delivered).";

        setToast({
          type: "success",
          text: `Retention meeting confirmed for ${rec.meetingDate} at ${rec.meetingTime}.${emailMsg}`,
        });

        if (onActionUpdated) onActionUpdated();
      }
    } catch (err) {
      setToast({
        type: "error",
        text: err.response?.data?.message || "Failed to approve meeting. Please try again.",
      });
    } finally {
      setApproving(false);
    }
  };

  // Reject proposal
  const handleRejectMeeting = async () => {
    if (!window.confirm("Reject this proposed retention meeting?")) return;
    setRejecting(true);
    setToast(null);
    try {
      const res = await api.post(`/api/hr/retention-meetings/${employee._id}/reject`, {
        reason: "Proposal rejected by HR.",
      });

      if (res.data?.success) {
        setActionData((prev) => ({
          ...prev,
          status: "Cancelled",
          proposalStatus: "REJECTED",
          meetingDate: "",
          meetingTime: "",
        }));

        setToast({ type: "success", text: "Meeting proposal rejected." });
        if (onActionUpdated) onActionUpdated();
      }
    } catch (err) {
      setToast({
        type: "error",
        text: err.response?.data?.message || "Failed to reject proposal.",
      });
    } finally {
      setRejecting(false);
    }
  };

  // Cancel an existing scheduled meeting
  const handleCancelMeeting = async () => {
    if (!window.confirm(`Cancel the scheduled meeting for ${employee?.fullName || "this employee"}?`)) {
      return;
    }
    setCancelling(true);
    setToast(null);
    try {
      await api.post(`/api/hr/retention/cancel/${employee._id}`, {
        reason: "Cancelled by HR via Action Center",
      });
      setToast({ type: "success", text: "Meeting has been cancelled. ✅" });
      setActionData((prev) => ({
        ...prev,
        status: "Cancelled",
        invitationStatus: "Declined",
        proposalStatus: "NONE",
        meetingDate: "",
        meetingTime: "",
        meetingLink: "",
      }));
      if (onActionUpdated) onActionUpdated();
    } catch (err) {
      setToast({
        type: "error",
        text: err.response?.data?.message || "Failed to cancel meeting.",
      });
    } finally {
      setCancelling(false);
    }
  };

  // Prepare WhatsApp message and modal
  const handleOpenWhatsApp = () => {
    const defaultMsg = `Hi ${employee.fullName || "Team Member"}, this is the HR team. We would like to arrange a confidential discussion about your workplace experience and any support you may need. Please let us know a convenient time to connect. Thank you.`;
    setWhatsAppText(defaultMsg);
    setShowWhatsAppModal(true);
  };

  // Confirm WhatsApp redirect and log interaction
  const handleConfirmWhatsApp = async () => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    if (!cleanPhone) {
      setToast({ type: "error", text: "Please provide a valid employee phone number first." });
      return;
    }

    try {
      await api.post("/api/hr/retention/log-whatsapp", {
        employeeId: employee._id,
        phoneNumber: cleanPhone,
        messageText: whatsAppText,
      });

      setActionData((prev) => ({
        ...prev,
        contactMethod: "WhatsApp",
        status: "In Progress",
        contactHistory: [
          {
            contactMethod: "WhatsApp",
            contactedAt: new Date(),
            contactedBy: actionData.assignedHR || "HR Team",
            recipientPhone: cleanPhone,
            status: "INITIATED",
            note: `Prefilled text opened: "${whatsAppText.substring(0, 60)}..."`,
          },
          ...prev.contactHistory,
        ],
      }));
    } catch (e) {
      console.warn("Could not log WhatsApp interaction:", e);
    }

    // Open WhatsApp Web/App with prefilled encoded message
    const encoded = encodeURIComponent(whatsAppText);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");

    setShowWhatsAppModal(false);
    setToast({
      type: "success",
      text: "WhatsApp opened with prefilled message. Review and send manually in your WhatsApp chat.",
    });
  };

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}

      {/* Header Banner */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Retention Action Center</h3>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  !isEvaluated
                    ? "bg-slate-700 text-slate-300"
                    : isHighRisk
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : mlPrediction.probability >= 0.35
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {!isEvaluated ? "Not Evaluated" : isHighRisk ? `High Risk · ${probabilityPct}` : mlPrediction.probability >= 0.35 ? `Medium Risk · ${probabilityPct}` : `Low Risk · ${probabilityPct}`}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Targeted support and structured intervention for <strong>{employee?.fullName}</strong> ({employee?.employeeCode || "N/A"}).
            </p>
          </div>
        </div>

        {/* Quick Contact Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {!hasScheduledMeeting && !isProposed ? (
            <button
              type="button"
              onClick={handleProposeMeeting}
              disabled={autoScheduling}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>{autoScheduling ? "Connecting n8n..." : "Propose Retention Meeting"}</span>
            </button>
          ) : hasScheduledMeeting ? (
            <button
              type="button"
              onClick={handleCancelMeeting}
              disabled={cancelling}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>{cancelling ? "Cancelling..." : "Cancel Meeting"}</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Contact via WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Suggested Actions Based on Real Feedback */}
      <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Evidence-Based Retention Recommendations
          </h4>
        </div>

        {generatedSuggestions.length === 0 ? (
          <p className="text-xs text-amber-800">
            {feedback
              ? "All satisfaction dimension ratings are currently at or above healthy thresholds (≥3.0/5). Continue standard periodic check-ins."
              : "No feedback submitted yet for the current period. Suggested actions will populate upon survey submission."}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {generatedSuggestions.map((item, idx) => (
              <div key={idx} className="p-3 bg-white/90 rounded-xl border border-amber-200/90 text-xs">
                <div className="flex items-center justify-between font-bold text-amber-950 mb-1">
                  <span>{item.area}</span>
                  <span className="text-[11px] bg-amber-100 px-2 py-0.5 rounded text-amber-800">
                    Rating: {item.rating}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">{item.action}</p>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-amber-700 italic">
          *Note: Suggestions are support recommendations based on submitted ratings, not proven causal drivers.
        </p>
      </div>

      {/* ── STATE 1: ACTIVE SCHEDULED MEETING ─────────────────────────────── */}
      {hasScheduledMeeting ? (
        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-indigo-100 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900">Confirmed Retention Meeting</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Status: Approved & Scheduled
                  </span>
                  {actionData.invitationStatus && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        actionData.invitationStatus === "Accepted"
                          ? "bg-emerald-100 text-emerald-800"
                          : actionData.invitationStatus === "Declined"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      Employee Response: {actionData.invitationStatus}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Meeting arranged for <strong>{employee?.fullName}</strong>. Invitation delivered via EmailJS/SMTP.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleProposeMeeting}
                disabled={autoScheduling}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="Request new proposal"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${autoScheduling ? "animate-spin" : ""}`} />
                <span>Reschedule via AI</span>
              </button>
              <button
                type="button"
                onClick={handleCancelMeeting}
                disabled={cancelling}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>{cancelling ? "Cancelling..." : "Cancel"}</span>
              </button>
            </div>
          </div>

          {/* Key Meeting Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Scheduled Date</span>
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>{actionData.meetingDate}</span>
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Scheduled Time</span>
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>{actionData.meetingTime || "10:00 AM"}</span>
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Assigned HR</span>
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <User className="w-4 h-4 text-indigo-500" />
                <span>{actionData.assignedHR || "HR Representative"}</span>
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Location / Venue</span>
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm truncate">
                <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span className="truncate">{actionData.meetingLocation || "Virtual 1-on-1 (Online)"}</span>
              </div>
            </div>
          </div>

          {/* Video Conference Room Join Box */}
          {actionData.meetingLink ? (
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-xs sm:text-sm">Confidential Video Room Ready</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md font-mono mt-0.5">
                    {actionData.meetingLink}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={actionData.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Video Call</span>
                  <ExternalLink className="w-3 h-3 opacity-75" />
                </a>
              </div>
            </div>
          ) : null}
        </div>
      ) : isProposed ? (
        /* ── STATE 2: AI PROPOSAL AWAITING HR APPROVAL ────────────────────── */
        <div className="p-5 sm:p-6 bg-white rounded-2xl border-2 border-indigo-200 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 flex-shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900">Retention Meeting Proposal</h4>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Awaiting HR Approval
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                      actionData.proposalSource === "n8n_agent"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {actionData.proposalSource === "n8n_agent"
                      ? "🤖 Source: n8n AI Retention Agent"
                      : "⚙️ Source: Internal Retention Engine (n8n Fallback)"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review the proposed meeting parameters and invitation draft. You may modify any field before approving.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProposeMeeting}
              disabled={autoScheduling}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              title="Regenerate proposal"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoScheduling ? "animate-spin" : ""}`} />
              <span>Regenerate Proposal</span>
            </button>
          </div>

          {/* Notice Banner */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Human-in-the-Loop Safeguard: </strong>
              This meeting has <strong>not</strong> been booked and <strong>no email</strong> has been sent yet.
              Please inspect the proposed slot, agenda, and invitation message below, make any necessary adjustments, and click <strong>Approve & Send Invitation</strong> to confirm.
            </div>
          </div>

          {/* Form Fields for Review */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Proposed Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Proposed Meeting Date *</label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Proposed Time */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Proposed Meeting Time (24h) *</label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Meeting Purpose */}
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Discussion Purpose / Title</label>
              <input
                type="text"
                value={editPurpose}
                onChange={(e) => setEditPurpose(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Proposed Agenda */}
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Proposed Agenda & Key Discussion Points</span>
                <span className="text-[11px] text-slate-400 font-normal">Editable by HR</span>
              </label>
              <textarea
                rows={4}
                value={editAgenda}
                onChange={(e) => setEditAgenda(e.target.value)}
                placeholder="Key talking points for discussion..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-mono text-[11px]"
              />
            </div>

            {/* Invitation Draft Preview */}
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Invitation Email Body (Employee Preview)</span>
                <span className="text-[11px] text-slate-400 font-normal">Will be sent upon approval</span>
              </label>
              <textarea
                rows={5}
                value={editDraftMessage}
                onChange={(e) => setEditDraftMessage(e.target.value)}
                placeholder="Email body text that the employee will receive..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed text-[11px]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleRejectMeeting}
              disabled={rejecting || approving}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4 text-rose-600" />
              <span>{rejecting ? "Rejecting..." : "Reject Proposal"}</span>
            </button>

            <button
              type="button"
              onClick={handleApproveMeeting}
              disabled={approving || rejecting || !editDate || !editTime}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{approving ? "Confirming & Sending..." : "Approve & Send Invitation"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── STATE 3: EMPTY / REQUEST PROPOSAL SHOWCASE ───────────────────── */
        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-sm">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">n8n AI Retention Agent</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Webhook Connected
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Request a structured retention meeting proposal for <strong>{employee?.fullName}</strong>. You will review and approve before any email is sent.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProposeMeeting}
              disabled={autoScheduling}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{autoScheduling ? "Connecting to n8n..." : "Propose Retention Meeting"}</span>
            </button>
          </div>

          {/* Quick Context Inputs (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Meeting Purpose</label>
              <input
                type="text"
                value={purposeInput}
                onChange={(e) => setPurposeInput(e.target.value)}
                placeholder="e.g., Confidential Retention Discussion"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">HR Notes / Preferred Timing (Optional)</label>
              <input
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="e.g., Prefer Tuesday afternoon after team sync"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Working-Hours Slotting</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Automatically identifies an open weekday slot between 9:00 AM – 5:00 PM without scheduling conflicts.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Video className="w-4 h-4 text-indigo-500" />
                <span>Encrypted Video Conference</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Generates a secure, one-click Jitsi virtual conference room for the employee and assigned HR partner.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldAlert className="w-4 h-4 text-indigo-500" />
                <span>Approval Safeguard</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                AI proposes the meeting; HR reviews and explicitly approves the draft and slot before any invitation is sent.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contact & Discussion History Log */}
      {actionData.contactHistory && actionData.contactHistory.length > 0 && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Contact & Outreach History</h4>
          </div>

          <div className="divide-y divide-slate-200 text-xs">
            {actionData.contactHistory.map((item, idx) => (
              <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="font-bold text-slate-800">
                    {item.contactMethod === "Email"
                      ? "📧 Meeting Invitation"
                      : item.contactMethod === "WhatsApp"
                      ? "💬 WhatsApp Outreach"
                      : "📝 " + (item.status || "Note")}
                  </span>
                  <span className="text-slate-400 text-[11px] ml-2">by {item.contactedBy || "HR Team"}</span>
                  {item.meetingDetails && (
                    <p className="text-[11px] text-slate-600 mt-0.5">{item.meetingDetails}</p>
                  )}
                  {item.note && <p className="text-[11px] text-slate-500 italic mt-0.5">{item.note}</p>}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {new Date(item.contactedAt).toLocaleDateString()} {new Date(item.contactedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: WhatsApp Message Composer */}
      <Modal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        title="Contact via WhatsApp"
        subtitle="Review message before opening WhatsApp chat"
        icon={MessageCircle}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Employee Phone Number *</label>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <input
                type="text"
                placeholder="Enter phone with country code, e.g. +919876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {!phoneNumber && (
              <p className="text-[11px] text-rose-500 mt-1">
                * No phone number found in records. Please enter a valid number above to enable WhatsApp contact.
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Message Preview (Editable)</label>
            <textarea
              rows={4}
              value={whatsAppText}
              onChange={(e) => setWhatsAppText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-[11px] text-emerald-800">
            Clicking "Open in WhatsApp" will launch WhatsApp with this prefilled message so you can review and send it manually. No automatic background message is dispatched.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowWhatsAppModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!phoneNumber.trim()}
              onClick={handleConfirmWhatsApp}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Open in WhatsApp</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
