/**
 * retentionRuleEngine.js
 *
 * Deterministic, configurable rule engine for the AI Retention Agent.
 * Evaluates whether an employee is eligible for an automatic retention meeting.
 *
 * Rules applied (ALL configurable via environment variables):
 *  1. ML prediction: probability >= RISK_THRESHOLD AND outcome === "Yes"  (requires model ready)
 *  2. Survey risk fallback: experimentalSurveyRisk.level === "HIGH_RISK"  (always available)
 *  3. Individual dimension score: any single score <= MIN_DIMENSION_SCORE
 *
 * An employee is eligible when rule (1) OR rule (2) OR rule (3) passes.
 * No external LLM or paid API is required.
 */

import EmployeeAnalytics from "../models/EmployeeAnalytics.js";
import User from "../models/User.js";

// ─── Configurable thresholds ────────────────────────────────────────────────
const RISK_THRESHOLD = Number(process.env.RETENTION_RISK_THRESHOLD ?? 0.5);
const MIN_DIMENSION_SCORE = Number(process.env.RETENTION_MIN_DIMENSION_SCORE ?? 2.5);

/**
 * Evaluate a single employee for retention eligibility.
 *
 * @param {string} employeeId  - MongoDB ObjectId string
 * @param {string} companyCode - HR's authorised company code (UPPERCASE)
 * @returns {{ eligible: boolean, reason: string, details: object }}
 */
export async function evaluateEmployee(employeeId, companyCode) {
  const sanitized = companyCode.toUpperCase().trim();

  // 1. Verify employee belongs to authorised company
  const employee = await User.findOne({
    _id: employeeId,
    companyCode: sanitized,
    role: "employee",
  })
    .select("_id fullName email employeeCode companyCode")
    .lean();

  if (!employee) {
    return {
      eligible: false,
      reason: "Employee not found in authorised organisation.",
      details: { employeeId, companyCode: sanitized },
    };
  }

  // 2. Load latest analytics snapshot (populated by refreshCompanyAnalytics)
  const analytics = await EmployeeAnalytics.findOne({
    employeeId: employee._id,
    companyCode: sanitized,
  }).lean();

  if (!analytics) {
    return {
      eligible: false,
      reason: "No analytics snapshot found. Run Analytics Refresh first.",
      details: { employeeId, companyCode: sanitized },
    };
  }

  const mlPred = analytics.mlPrediction || {};
  const surveyRisk = analytics.experimentalSurveyRisk || {};
  const avgs = analytics.currentAverages || {};

  const triggeredRules = [];

  // ── Rule 1: ML model prediction ─────────────────────────────────────────
  if (
    mlPred.isAvailable &&
    mlPred.outcome === "Yes" &&
    typeof mlPred.probability === "number" &&
    mlPred.probability >= RISK_THRESHOLD
  ) {
    triggeredRules.push(
      `ML prediction HIGH risk (probability=${(mlPred.probability * 100).toFixed(1)}% >= threshold ${(RISK_THRESHOLD * 100).toFixed(0)}%)`
    );
  }

  // ── Rule 2: Survey risk level ────────────────────────────────────────────
  if (surveyRisk.level === "HIGH_RISK") {
    triggeredRules.push(
      `Survey risk level is HIGH_RISK (overall avg=${surveyRisk.score?.toFixed(2) ?? "N/A"})`
    );
  }

  // ── Rule 3: Individual dimension thresholds ──────────────────────────────
  const dimensionMap = {
    jobSatisfaction: avgs.jobSatisfaction,
    workEnvironment: avgs.workEnvironment,
    workLifeBalance: avgs.workLifeBalance,
    growth: avgs.growth,
  };
  for (const [dim, score] of Object.entries(dimensionMap)) {
    if (typeof score === "number" && score > 0 && score <= MIN_DIMENSION_SCORE) {
      triggeredRules.push(
        `Low ${dim} score (${score.toFixed(2)} <= threshold ${MIN_DIMENSION_SCORE})`
      );
    }
  }

  const eligible = triggeredRules.length > 0;

  return {
    eligible,
    reason: eligible
      ? `Eligible for retention meeting. Triggered rules: ${triggeredRules.join("; ")}.`
      : "Employee does not meet any risk threshold for automatic scheduling.",
    details: {
      employeeId: employee._id.toString(),
      employeeName: employee.fullName,
      employeeEmail: employee.email,
      companyCode: sanitized,
      mlProbability: mlPred.probability ?? null,
      mlOutcome: mlPred.outcome ?? null,
      surveyRiskLevel: surveyRisk.level ?? "NO_FEEDBACK",
      surveyRiskScore: surveyRisk.score ?? null,
      averages: avgs,
      triggeredRules,
      thresholds: {
        RISK_THRESHOLD,
        MIN_DIMENSION_SCORE,
      },
    },
  };
}

/**
 * Bulk-evaluate all employees in a company and return eligible cases.
 *
 * @param {string} companyCode
 * @returns {Array<{ employee, evaluation }>}
 */
export async function evaluateAllEmployees(companyCode) {
  const sanitized = companyCode.toUpperCase().trim();

  const employees = await User.find({
    companyCode: sanitized,
    role: "employee",
  })
    .select("_id")
    .lean();

  const results = [];

  for (const emp of employees) {
    const evaluation = await evaluateEmployee(emp._id.toString(), sanitized);
    results.push({ employeeId: emp._id.toString(), evaluation });
  }

  return results;
}
