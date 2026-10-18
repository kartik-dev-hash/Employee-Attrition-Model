import mongoose from "mongoose";

const employeeAnalyticsSchema = new mongoose.Schema(
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
      index: true,
      uppercase: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    totalSubmissions: {
      type: Number,
      default: 0,
    },
    latestSubmissionDate: {
      type: Date,
      default: null,
    },
    currentAverages: {
      jobSatisfaction: { type: Number, default: 0 },
      workEnvironment: { type: Number, default: 0 },
      workLifeBalance: { type: Number, default: 0 },
      growth: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
    },
    experimentalSurveyRisk: {
      level: {
        type: String,
        enum: ["HEALTHY", "NEEDS_ATTENTION", "HIGH_RISK", "NO_FEEDBACK"],
        default: "NO_FEEDBACK",
      },
      label: {
        type: String,
        default: "No Feedback",
      },
      score: {
        type: Number,
        default: null,
      },
      disclaimer: {
        type: String,
        default: "Descriptive indicator based on survey satisfaction thresholds. Not a trained ML probability.",
      },
    },
    mlPrediction: {
      outcome: { type: String, default: null }, // e.g., "Left" / "Stayed" if ML trained
      probability: { type: Number, default: null },
      modelVersion: { type: String, default: null },
      predictionTimestamp: { type: Date, default: null },
      isAvailable: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

employeeAnalyticsSchema.index({ employeeId: 1, companyCode: 1 });

export default mongoose.model("EmployeeAnalytics", employeeAnalyticsSchema);
