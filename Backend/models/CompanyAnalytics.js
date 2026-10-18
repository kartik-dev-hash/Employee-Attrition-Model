import mongoose from "mongoose";

const companyAnalyticsSchema = new mongoose.Schema(
  {
    companyCode: {
      type: String,
      required: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    totalEmployeesInCompany: {
      type: Number,
      default: 0,
    },
    totalFeedbackSubmissions: {
      type: Number,
      default: 0,
    },
    uniqueEmployeesRepresented: {
      type: Number,
      default: 0,
    },
    averages: {
      jobSatisfaction: { type: Number, default: 0 },
      workEnvironment: { type: Number, default: 0 },
      workLifeBalance: { type: Number, default: 0 },
      growth: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
    },
    distributions: {
      jobSatisfaction: { type: mongoose.Schema.Types.Mixed, default: {} },
      workEnvironment: { type: mongoose.Schema.Types.Mixed, default: {} },
      workLifeBalance: { type: mongoose.Schema.Types.Mixed, default: {} },
      growth: { type: mongoose.Schema.Types.Mixed, default: {} },
      manager: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    // Historical trends aggregated by actual submission timestamps
    timelineTrends: [
      {
        date: String, // e.g. "2026-09-19" or "2026-10-12"
        timestamp: Date,
        count: Number,
        avgJobSatisfaction: Number,
        avgWorkEnvironment: Number,
        avgWorkLifeBalance: Number,
        avgGrowth: Number,
        avgOverall: Number,
      },
    ],
    // Qualitative keyword insights from survey comments
    textInsights: {
      totalCommentsAnalyzed: { type: Number, default: 0 },
      topImprovementThemes: [{ theme: String, count: Number }],
    },
    // Descriptive survey sentiment & experimental indicator summary
    experimentalRiskSummary: {
      highRiskCount: { type: Number, default: 0 },
      needsAttentionCount: { type: Number, default: 0 },
      healthyCount: { type: Number, default: 0 },
      unsubmittedCount: { type: Number, default: 0 },
    },
    modelVersionUsed: {
      type: String,
      default: "none",
    },
    mlModelStatus: {
      type: String,
      default: "NEEDS_LABELED_DATA",
    },
  },
  {
    timestamps: true,
  }
);

companyAnalyticsSchema.index({ companyCode: 1, generatedAt: -1 });

export default mongoose.model("CompanyAnalytics", companyAnalyticsSchema);
