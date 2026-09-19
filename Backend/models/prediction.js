import mongoose from "mongoose";

const attritionSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
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
export default mongoose.model("prediction", attritionSchema);
