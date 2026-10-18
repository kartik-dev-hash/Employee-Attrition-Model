import React, { useState, useEffect } from "react";
import api from "../../api/client";
import { Toast } from "../common/Toast";
import { Modal } from "../common/Modal";
import { sendMeetingInvitationEmail } from "../../utils/emailService";
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
} from "lucide-react";

export const RetentionActionCenter = ({ employee, feedback, mlPrediction, onActionUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [autoScheduling, setAutoScheduling] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Retention record state
  const [actionData, setActionData] = useState({
    status: "Pending",
    assignedHR: "HR Representative",
    meetingDate: "",
    meetingTime: "",
    meetingLocation: "",
    meetingLink: "",
    contactMethod: "WhatsApp",
    suggestedActions: [],
    agreedActionPlan: "",
    notes: "",
    followUpDate: "",
    contactHistory: [],
  });

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

  const hasScheduledMeeting = Boolean(actionData.meetingDate && actionData.status !== "Cancelled");

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
        const res = await api.get(`/api/hr/retention/actions/${employee._id}`);
        if (isMounted && res.data?.actionRecord) {
          const rec = res.data.actionRecord;
          setActionData({
            status: rec.status || "Pending",
            assignedHR: rec.assignedHR || "HR Representative",
            meetingDate: rec.meetingDate || "",
            meetingTime: rec.meetingTime || "",
            meetingLocation: rec.meetingLocation || "",
            meetingLink: rec.meetingLink || "",
            contactMethod: rec.contactMethod || "WhatsApp",
            suggestedActions: rec.suggestedActions || [],
            agreedActionPlan: rec.agreedActionPlan || "",
            notes: rec.notes || "",
            followUpDate: rec.followUpDate || "",
            contactHistory: rec.contactHistory || [],
          });
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

  // Generates a free Jitsi Meet room link for the employee meeting
  const generateMeetLink = (employeeCode) => {
    const room = `RetainPulse-${(employeeCode || "meeting").replace(/\s+/g, "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    return `https://meet.jit.si/${room}`;
  };

  // Auto-schedule a retention meeting via the AI Retention Agent
  const handleAutoSchedule = async () => {
    setAutoScheduling(true);
    setToast(null);
    try {
      const res = await api.post(`/api/hr/retention/auto-schedule/${employee._id}`);
      if (res.data?.scheduled) {
        const slot = res.data.slot || {};

        // Generate a unique Jitsi Meet link for this meeting
        const meetingLink = generateMeetLink(employee?.employeeCode);

        // Save the meet link back to the record
        await api.put(`/api/hr/retention/actions/${employee._id}`, {
          meetingLink,
        });

        // Refresh the retention action record so new meeting date/time appears
        const refresh = await api.get(`/api/hr/retention/actions/${employee._id}`);
        if (refresh.data?.actionRecord) {
          const rec = refresh.data.actionRecord;
          setActionData((prev) => ({
            ...prev,
            ...rec,
            meetingLink,
            contactHistory: rec.contactHistory || prev.contactHistory,
          }));
        }

        // Send invitation email to the employee
        const targetEmail = employeeEmail || employee?.email;
        let emailStatusMsg = "";
        if (targetEmail) {
          const emailRes = await sendMeetingInvitationEmail({
            to_email: targetEmail,
            to_name: employee.fullName,
            hr_name: actionData.assignedHR || "HR Team",
            meeting_date: slot.meetingDate,
            meeting_time: slot.meetingTime,
            meeting_link: meetingLink,
          });
          emailStatusMsg = emailRes.success
            ? ` Invitation email sent to ${targetEmail}! ✅`
            : ` (Email error: ${emailRes.message})`;
        } else {
          emailStatusMsg = " (No employee email address found to send invitation).";
        }

        setToast({
          type: "success",
          text: `Meeting auto-scheduled for ${slot.meetingDate || "?"} at ${slot.meetingTime || "?"}.${emailStatusMsg}`,
        });
        if (onActionUpdated) onActionUpdated();
      } else {
        setToast({
          type: "error",
          text: res.data?.reason || "Employee is not eligible or no available slot was found.",
        });
      }
    } catch (err) {
      setToast({
        type: "error",
        text: err.response?.data?.message || "Auto-schedule request failed. Please try again.",
      });
    } finally {
      setAutoScheduling(false);
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
          {!hasScheduledMeeting ? (
            <button
              type="button"
              onClick={handleAutoSchedule}
              disabled={autoScheduling}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>{autoScheduling ? "Scheduling..." : "Auto-Schedule Meeting"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelMeeting}
              disabled={cancelling}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>{cancelling ? "Cancelling..." : "Cancel Meeting"}</span>
            </button>
          )}
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

      {/* Automated Meeting Management Hub */}
      {hasScheduledMeeting ? (
        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-indigo-100 shadow-sm space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900">Scheduled Retention Meeting</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    Status: {actionData.status || "In Progress"}
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
                  Automated retention check-in arranged for <strong>{employee?.fullName}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoSchedule}
                disabled={autoScheduling}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="Reschedule to next available slot"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${autoScheduling ? "animate-spin" : ""}`} />
                <span>{autoScheduling ? "Rescheduling..." : "Reschedule"}</span>
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
      ) : (
        /* Empty / Not Scheduled State: Rich AI Auto-Schedule Showcase Card */
        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-sm">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">One-Click AI Retention Scheduler</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Automated
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Let the system automatically arrange a confidential 1-on-1 retention session with <strong>{employee?.fullName}</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAutoSchedule}
              disabled={autoScheduling}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{autoScheduling ? "Scheduling Session..." : "Auto-Schedule Retention Meeting"}</span>
            </button>
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
                Creates a secure, one-click Jitsi virtual conference room for the employee and assigned HR partner.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Mail className="w-4 h-4 text-indigo-500" />
                <span>Automated Email Invite</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Dispatches a branded invitation with meeting link and direct Accept / Reschedule response buttons.
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
                    {item.contactMethod === "Email" ? "📧 Meeting Invitation" : "💬 WhatsApp Outreach"}
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
