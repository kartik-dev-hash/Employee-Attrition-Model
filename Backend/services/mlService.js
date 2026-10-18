import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import ModelMetadata from "../models/ModelMetadata.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Retrieve current ML model status from MongoDB metadata
 */
export async function getModelStatus() {
  try {
    const latest = await ModelMetadata.findOne().sort({ createdAt: -1 }).lean();
    if (!latest) {
      return {
        status: "NEEDS_LABELED_DATA",
        isReadyForInference: false,
        modelVersion: "none",
        lastTrainedAt: null,
        datasetSize: 0,
        validLabeledRecords: 0,
        evaluationMetrics: null,
        message:
          "No trained ML model found. Supervised training requires historical employee records with verified attrition outcomes ('attrition: true/false').",
      };
    }

    return {
      status: latest.status,
      isReadyForInference: latest.status === "TRAINED",
      modelVersion: latest.modelVersion,
      lastTrainedAt: latest.trainingTimestamp,
      datasetSize: latest.datasetSize,
      validLabeledRecords: latest.validLabeledRecords,
      evaluationMetrics: latest.evaluationMetrics,
      message: latest.statusReason,
      artifactPath: latest.artifactPath,
    };
  } catch (error) {
    return {
      status: "ERROR",
      isReadyForInference: false,
      message: error.message,
    };
  }
}

/**
 * Run inference using the trained ML model artifact
 */
export async function predictOutcome(features) {
  try {
    const status = await getModelStatus();
    if (!status.isReadyForInference || !status.artifactPath) {
      return {
        isAvailable: false,
        outcome: null,
        probability: null,
        reason: "No trained model artifact available.",
      };
    }

    const scriptPath = path.join(__dirname, "..", "ml", "predict.py");
    const payload = JSON.stringify({
      artifactPath: status.artifactPath,
      features,
    });

    return new Promise((resolve) => {
      const py = spawn("python", [scriptPath, payload]);
      let out = "";
      py.stdout.on("data", (d) => {
        out += d.toString();
      });
      py.on("close", () => {
        try {
          const res = JSON.parse(out.trim());
          if (res.success) {
            resolve({
              isAvailable: true,
              outcome: res.prediction,
              probability: res.probability,
              riskCategory: res.riskCategory,
              modelVersion: status.modelVersion,
            });
          } else {
            resolve({ isAvailable: false, reason: res.message });
          }
        } catch (e) {
          resolve({
            isAvailable: false,
            reason: "Failed to parse inference result.",
          });
        }
      });
    });
  } catch (err) {
    return { isAvailable: false, reason: err.message };
  }
}

/**
 * Trigger Python scikit-learn model training with provided feedback records or CSV path
 */
export async function trainModel(
  recordsOrCsvPath,
  version = "1.0.0",
  isCsv = false,
) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "..", "ml", "train_model.py");
    const args = isCsv
      ? [scriptPath, "--csv", recordsOrCsvPath]
      : [
          scriptPath,
          JSON.stringify({
            records: recordsOrCsvPath,
            targetField: "attrition",
            version,
          }),
        ];

    const py = spawn("python", args);

    let output = "";
    let errorOutput = "";

    py.stdout.on("data", (data) => {
      output += data.toString();
    });

    py.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    py.on("close", async (code) => {
      try {
        if (!output.trim()) {
          const failRecord = await ModelMetadata.create({
            modelVersion: version,
            status: "FAILED",
            statusReason: errorOutput || `Process exited with code ${code}`,
          });
          return resolve({
            success: false,
            status: "FAILED",
            message: errorOutput || "ML training script produced empty output.",
          });
        }

        const result = JSON.parse(output.trim());

        // Persist model metadata in MongoDB
        if (!result.success || result.status !== "TRAINED") {
          await ModelMetadata.create({
            modelVersion: result.modelVersion || version,
            datasetSize: result.datasetSize || 0,
            validLabeledRecords: result.validLabeledRecords || 0,
            status: "FAILED",
            statusReason:
              result.message || "Training did not complete successfully.",
            evaluationMetrics: result.evaluationMetrics || null,
            artifactPath: null,
          });

          return resolve({
            ...result,
            success: false,
            status: "FAILED",
          });
        }

        await ModelMetadata.create({
          modelVersion: result.modelVersion || version,
          trainingTimestamp: result.trainingTimestamp
            ? new Date(result.trainingTimestamp)
            : new Date(),
          datasetSize: result.datasetSize || 0,
          validLabeledRecords: result.validLabeledRecords || 0,
          features: result.features || [],
          status: "TRAINED",
          statusReason: result.message || "Model trained successfully.",
          evaluationMetrics: result.evaluationMetrics || null,
          artifactPath: result.artifactPath || null,
        });

        return resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    py.on("error", (err) => {
      reject(
        new Error(`Failed to start Python training process: ${err.message}`),
      );
    });
  });
}
