import mongoose from "mongoose";

const retentionActionSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    assignedHR: {
      type: String,
      default: "HR Representative",
      trim: true,
    },
    assignedHRId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "In Progress",
        "Completed",
        "Cancelled",
        "PROPOSED",
        "PENDING_APPROVAL",
        "APPROVED",
        "FAILED",
      ],
      default: "Pending",
      index: true,
    },

    // ── n8n AI Agent & Meeting Proposal Fields ────────────────────────────
    proposalStatus: {
      type: String,
      enum: ["NONE", "PROPOSED", "APPROVED", "REJECTED", "FAILED"],
      default: "NONE",
      index: true,
    },
    proposalSource: {
      type: String, // "n8n_agent" | "internal_fallback" | "none"
      default: "none",
    },
    meetingPurpose: {
      type: String,
      default: "Confidential Retention & Feedback Discussion",
      trim: true,
    },
    meetingAgenda: {
      type: String,
      default: "",
    },
    invitationDraft: {
      subject: { type: String, default: "" },
      message: { type: String, default: "" },
    },
    proposalNotes: {
      type: String,
      default: "",
    },
    proposedAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },

    // ── Retention Agent fields ────────────────────────────────────────────
    // Whether this record was created automatically by the retention agent
    autoScheduled: {
      type: Boolean,
      default: false,
    },
    autoScheduledAt: {
      type: Date,
      default: null,
    },

    // Employee's response to the in-app meeting invitation
    invitationStatus: {
      type: String,
      enum: ["Pending", "Accepted", "Declined", "RescheduleRequested"],
      default: "Pending",
      index: true,
    },
    invitationRespondedAt: {
      type: Date,
      default: null,
    },
    employeeNote: {
      type: String,
      default: "",
    },

    // If auto-scheduling failed, the reason is stored here
    exceptionReason: {
      type: String,
      default: "",
    },
    inExceptionQueue: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Snapshot of risk details at the time of scheduling
    riskSnapshot: {
      mlProbability: { type: Number, default: null },
      mlOutcome: { type: String, default: null },
      surveyRiskLevel: { type: String, default: null },
      surveyRiskScore: { type: Number, default: null },
      triggeredRules: [{ type: String }],
    },
    meetingDate: {
      type: String, // e.g., "2026-10-20"
      default: "",
    },
    meetingTime: {
      type: String, // e.g., "14:00"
      default: "",
    },
    meetingLocation: {
      type: String, // e.g., "Meeting Room B / Google Meet"
      default: "",
    },
    meetingLink: {
      type: String, // e.g., "https://meet.jit.si/RetainPulse-..." or Google Meet URL
      default: "",
    },
    contactMethod: {
      type: String,
      enum: ["Email", "WhatsApp", "In-Person", "Phone", "Other"],
      default: "Email",
    },
    suggestedActions: [
      {
        type: String,
      },
    ],
    agreedActionPlan: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    followUpDate: {
      type: String, // e.g., "2026-11-01"
      default: "",
    },
    // Contact history log entry records
    contactHistory: [
      {
        contactMethod: { type: String, required: true },
        contactedAt: { type: Date, default: Date.now },
        contactedBy: { type: String, default: "HR Team" },
        recipientEmail: { type: String, default: "" },
        recipientPhone: { type: String, default: "" },
        meetingDetails: { type: String, default: "" },
        status: { type: String, default: "SENT" },
        note: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

retentionActionSchema.index({ employeeId: 1, companyCode: 1 });

export default mongoose.model("RetentionAction", retentionActionSchema);
