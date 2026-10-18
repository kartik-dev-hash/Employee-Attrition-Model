import mongoose from "mongoose";

const emailNotificationLogSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    employeeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    employeeName: {
      type: String,
      default: "",
    },
    companyCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    feedbackPeriod: {
      type: String, // Format: "YYYY-MM" (e.g. "2026-10")
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["MONTHLY_INVITE", "MONTHLY_REMINDER"],
      required: true,
    },
    status: {
      type: String,
      enum: ["SENT", "FAILED", "SKIPPED"],
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    messageId: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate sends for the same employee, period, and notification type even after server restarts
emailNotificationLogSchema.index(
  { employeeId: 1, feedbackPeriod: 1, type: 1 },
  { unique: true }
);

export default mongoose.model("EmailNotificationLog", emailNotificationLogSchema);
