import mongoose from "mongoose";

const attritionSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Monthly feedback cycle period (e.g., "2026-10")
  feedbackPeriod: {
    type: String,
    required: true,
    index: true,
    default: () => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    },
  },

  // Employee's ratings
  jobSatisfaction: {
    type: Number,
    required: true,
  },

  workEnvironment: {
    type: Number,
    required: true,
  },

  workLifeBalance: {
    type: Number,
    required: true,
  },

  growth: {
    type: Number,
    required: true,
  },

  // Employee's written responses
  manager: {
    type: String,
    required: true,
  },

  likedMost: {
    type: String,
    default: "",
  },

  improvement: {
    type: String,
    default: "",
  },

  comments: {
    type: String,
    default: "",
  },

  // ML result
  prediction: {
    type: String,
  },

  probability: {
    type: Number,
  },

  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

attritionSchema.index({ employeeId: 1, feedbackPeriod: 1 }, { unique: true });

export default mongoose.model("EmployeeFeedback", attritionSchema, "feedback");


