import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { Card } from "../../components/common/Card";
import { Toast } from "../../components/common/Toast";
import { Modal } from "../../components/common/Modal";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldCheck,
  HeartHandshake,
  MessageSquare,
  Video,
  ExternalLink,
} from "lucide-react";

/**
 * MeetingInvitations – Employee portal page.
 *
 * Shows the employee their current HR meeting invitation (if any) and lets them:
 *  • Accept
 *  • Decline
 *  • Request a reschedule
 *
 * ML risk scores are NEVER shown to the employee.
 * The page is friendly, supportive, and framed around "career support" language.
 */
export const MeetingInvitations = () => {
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [toast, setToast] = useState(null);
  const [responding, setResponding] = useState(false);

  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleNote, setRescheduleNote] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  // Decline confirmation modal state
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineNote, setDeclineNote] = useState("");

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/employee/invitations/my");
      setInvitation(res.data?.invitation || null);
    } catch (err) {
      console.error("Error loading invitation:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitation();
  }, []);

  const respond = async (response, note = "", extraFields = {}) => {
    setResponding(true);
    setToast(null);
    try {
      await api.post("/api/employee/invitations/respond", {
        response,
        note,
        ...extraFields,
      });
      setToast({
        type: "success",
        text:
          response === "Accepted"
            ? "Great! Your meeting is confirmed. ✅"
            : response === "Declined"
            ? "You have declined the meeting invitation."
            : "Reschedule request submitted. HR will follow up shortly.",
      });
      await fetchInvitation();
    } catch (err) {
      setToast({
        type: "error",
        text: err.response?.data?.message || "Could not record your response. Please try again.",
      });
    } finally {
      setResponding(false);
    }
  };

  const handleAccept = () => respond("Accepted", "Employee accepted the meeting invitation.");

  const handleDecline = async () => {
    setShowDeclineModal(false);
    await respond("Declined", declineNote || "Employee declined the meeting invitation.");
    setDeclineNote("");
  };

  const handleReschedule = async () => {
    setShowRescheduleModal(false);
    await respond("RescheduleRequested", rescheduleNote, {
      preferredDate,
      preferredTime,
    });
    setRescheduleNote("");
    setPreferredDate("");
    setPreferredTime("");
  };

  if (loading) {
    return <LoadingSpinner label="Checking for meeting invitations..." />;
  }

  // ── Status badge helper ──────────────────────────────────────────────────
  const statusColor = {
    Pending: "bg-amber-100 text-amber-800 border-amber-200",
    Accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Declined: "bg-rose-100 text-rose-800 border-rose-200",
    RescheduleRequested: "bg-indigo-100 text-indigo-800 border-indigo-200",
  };

  return (
    <div className="max-w-2xl space-y-6">
      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Meeting Invitations</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          View and respond to HR support meeting invitations scheduled for you.
        </p>
      </div>

      {/* No invitation state */}
      {!invitation && (
        <Card>
          <div className="flex flex-col items-center py-10 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <HeartHandshake className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No meetings scheduled yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                When HR schedules a check-in or career support discussion with you, it will
                appear here. You can accept, decline, or request a different time.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Invitation card */}
      {invitation && (
        <div className="space-y-4">
          {/* Status banner */}
          <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">
                  HR Career Support Meeting
                </p>
                <h3 className="text-base font-bold text-white leading-tight mt-0.5">
                  Workplace Feedback Discussion
                </h3>
              </div>
            </div>
          </div>

          <Card>
            <div className="space-y-5">
              {/* Response status */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Your Response</span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    statusColor[invitation.invitationStatus] || "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {invitation.invitationStatus === "RescheduleRequested"
                    ? "Reschedule Requested"
                    : invitation.invitationStatus || "Pending"}
                </span>
              </div>

              {/* Meeting details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Date</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {invitation.meetingDate || "To be confirmed"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Time</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {invitation.meetingTime || "To be confirmed"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Location</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {invitation.meetingLocation || "HR will share link/location"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assigned HR */}
              {invitation.assignedHR && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 font-semibold">HR Representative: </span>
                  <span className="text-slate-700 font-bold">{invitation.assignedHR}</span>
                </div>
              )}

              {/* Online Video Meeting Link (if available) */}
              {invitation.meetingLink && (
                <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Online Meeting Room</p>
                      <p className="text-[11px] text-slate-500">Google Meet / Video discussion link</p>
                    </div>
                  </div>
                  <a
                    href={invitation.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition text-xs flex-shrink-0"
                  >
                    <span>Join Call</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Context note (confidential; supportive language only) */}
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-800 leading-relaxed">
                <strong>Purpose of this meeting:</strong> Your HR team would like to have a
                confidential, supportive discussion about your workplace experience, career
                development, and any assistance you may need. Your feedback and concerns are
                valued and completely confidential.
              </div>

              {/* Response buttons – only show if still pending */}
              {(invitation.invitationStatus === "Pending" ||
                invitation.invitationStatus === "RescheduleRequested") && (
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={handleAccept}
                    disabled={responding}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Meeting</span>
                  </button>

                  <button
                    onClick={() => setShowRescheduleModal(true)}
                    disabled={responding}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Request Reschedule</span>
                  </button>

                  <button
                    onClick={() => setShowDeclineModal(true)}
                    disabled={responding}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </div>
              )}

              {/* Accepted state */}
              {invitation.invitationStatus === "Accepted" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    You have confirmed your attendance. See you at the meeting!
                  </div>
                  {invitation.meetingLink && (
                    <a
                      href={invitation.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Online Video Meeting</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {/* Declined state */}
              {invitation.invitationStatus === "Declined" && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-semibold">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  You have declined this invitation. HR may follow up to reschedule.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── Reschedule modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        title="Request a Reschedule"
        subtitle="Let HR know your preferred time"
        icon={RefreshCw}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Preferred Date (optional)
            </label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Preferred Time (optional)
            </label>
            <input
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Message to HR (optional)
            </label>
            <textarea
              rows={3}
              value={rescheduleNote}
              onChange={(e) => setRescheduleNote(e.target.value)}
              placeholder="Explain why you'd like to reschedule or any preferences..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowRescheduleModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReschedule}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Submit Request</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Decline confirmation modal ──────────────────────────────────────── */}
      <Modal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        title="Decline Meeting"
        subtitle="Please let HR know your reason (optional)"
        icon={XCircle}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[11px] leading-relaxed">
            This meeting is meant to be a supportive, confidential career discussion. If you have
            concerns about attending, please consider reaching out to HR directly.
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason for declining (optional)
            </label>
            <textarea
              rows={3}
              value={declineNote}
              onChange={(e) => setDeclineNote(e.target.value)}
              placeholder="Your reason will be shared with HR..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowDeclineModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={handleDecline}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Confirm Decline</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
