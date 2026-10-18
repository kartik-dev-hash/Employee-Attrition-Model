import mongoose from "mongoose";

const modelMetadataSchema = new mongoose.Schema(
  {
    modelVersion: {
      type: String,
      required: true,
      default: "1.0.0",
    },
    trainingTimestamp: {
      type: Date,
      default: Date.now,
    },
    datasetSize: {
      type: Number,
      default: 0,
    },
    validLabeledRecords: {
      type: Number,
      default: 0,
    },
    targetField: {
      type: String,
      default: "attrition",
    },
    features: {
      type: [String],
      default: ["jobSatisfaction", "workEnvironment", "workLifeBalance", "growth"],
    },
    evaluationMetrics: {
      accuracy: { type: Number, default: null },
      precision: { type: Number, default: null },
      recall: { type: Number, default: null },
      f1Score: { type: Number, default: null },
      confusionMatrix: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    status: {
      type: String,
      enum: ["UNTRAINED", "NEEDS_LABELED_DATA", "TRAINING", "TRAINED", "FAILED"],
      default: "UNTRAINED",
    },
    statusReason: {
      type: String,
      default: "Model has not been trained yet.",
    },
    artifactPath: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ModelMetadata", modelMetadataSchema);
