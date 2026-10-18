import User from "../models/User.js";
import EmployeeFeedback from "../models/feedback.js";
import CompanyAnalytics from "../models/CompanyAnalytics.js";
import EmployeeAnalytics from "../models/EmployeeAnalytics.js";
import { getModelStatus, predictOutcome } from "./mlService.js";

/**
 * Calculate distribution frequencies for rating values (1 to 5)
 */
function calculateDistribution(scores) {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  scores.forEach((s) => {
    if (typeof s === "number" && s >= 1 && s <= 5) {
      const rounded = Math.round(s);
      dist[rounded] = (dist[rounded] || 0) + 1;
    }
  });
  return dist;
}

/**
 * Generate or refresh company-level and employee-level analytics
 * Strictly scoped by companyCode to prevent cross-company data leakage
 */
export async function refreshCompanyAnalytics(companyCode) {
  const sanitizedCompanyCode = companyCode.toUpperCase().trim();

  // 1. Fetch authorized company employees
  const employees = await User.find({
    companyCode: sanitizedCompanyCode,
    role: "employee",
  })
    .select("_id fullName email employeeCode companyCode")
    .lean();

  const totalEmployeesInCompany = employees.length;
  const employeeIds = employees.map((e) => e._id);

  // 2. Fetch feedback submissions for these employees only
  const feedbacks = await EmployeeFeedback.find({
    employeeId: { $in: employeeIds },
  }).lean();

  const totalFeedbackSubmissions = feedbacks.length;

  // Track unique employees represented in feedback
  const uniqueEmployeeSet = new Set(
    feedbacks.map((f) => f.employeeId.toString()),
  );
  const uniqueEmployeesRepresented = uniqueEmployeeSet.size;

  // 3. Compute company aggregate ratings
  const jsScores = [];
  const weScores = [];
  const wlbScores = [];
  const grScores = [];

  const managerDist = {};
  const improvementThemesMap = {};
  let totalCommentsCount = 0;

  feedbacks.forEach((f) => {
    if (typeof f.jobSatisfaction === "number") jsScores.push(f.jobSatisfaction);
    if (typeof f.workEnvironment === "number") weScores.push(f.workEnvironment);
    if (typeof f.workLifeBalance === "number")
      wlbScores.push(f.workLifeBalance);
    if (typeof f.growth === "number") grScores.push(f.growth);

    if (f.manager && typeof f.manager === "string") {
      const cleanManager = f.manager.trim();
      managerDist[cleanManager] = (managerDist[cleanManager] || 0) + 1;
    }

    // Inspect improvement text
    if (f.improvement && typeof f.improvement === "string") {
      const cleanImp = f.improvement.trim().toLowerCase();
      if (cleanImp && cleanImp !== "none" && cleanImp !== "no") {
        totalCommentsCount++;
        improvementThemesMap[cleanImp] =
          (improvementThemesMap[cleanImp] || 0) + 1;
      }
    }
  });

  const topImprovementThemes = Object.entries(improvementThemesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme, count]) => ({ theme, count }));

  const avg = (arr) =>
    arr.length
      ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2))
      : 0;

  const averages = {
    jobSatisfaction: avg(jsScores),
    workEnvironment: avg(weScores),
    workLifeBalance: avg(wlbScores),
    growth: avg(grScores),
    overall: avg([...jsScores, ...weScores, ...wlbScores, ...grScores]),
  };

  // Aggregate actual feedback submissions by calendar date for time-series charts
  const dateMap = {};
  feedbacks.forEach((f) => {
    const rawDate = f.submittedAt || f.createdAt;
    if (rawDate) {
      const d = new Date(rawDate);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = {
          date: dateStr,
          timestamp: d,
          js: [],
          we: [],
          wlb: [],
          gr: [],
        };
      }
      if (typeof f.jobSatisfaction === "number")
        dateMap[dateStr].js.push(f.jobSatisfaction);
      if (typeof f.workEnvironment === "number")
        dateMap[dateStr].we.push(f.workEnvironment);
      if (typeof f.workLifeBalance === "number")
        dateMap[dateStr].wlb.push(f.workLifeBalance);
      if (typeof f.growth === "number") dateMap[dateStr].gr.push(f.growth);
    }
  });

  const timelineTrends = Object.values(dateMap)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((item) => {
      const allScores = [...item.js, ...item.we, ...item.wlb, ...item.gr];
      return {
        date: item.date,
        timestamp: item.timestamp,
        count: item.js.length,
        avgJobSatisfaction: avg(item.js),
        avgWorkEnvironment: avg(item.we),
        avgWorkLifeBalance: avg(item.wlb),
        avgGrowth: avg(item.gr),
        avgOverall: avg(allScores),
      };
    });

  const distributions = {
    jobSatisfaction: calculateDistribution(jsScores),
    workEnvironment: calculateDistribution(weScores),
    workLifeBalance: calculateDistribution(wlbScores),
    growth: calculateDistribution(grScores),
    manager: managerDist,
  };

  // 4. Check ML Model status and compute per-employee analytics
  const mlStatus = await getModelStatus();

  let highRiskCount = 0;
  let needsAttentionCount = 0;
  let healthyCount = 0;
  let unsubmittedCount = 0;

  for (const emp of employees) {
    const empFeedbacks = feedbacks.filter(
      (f) => f.employeeId.toString() === emp._id.toString(),
    );

    if (empFeedbacks.length === 0) {
      unsubmittedCount++;
      await EmployeeAnalytics.findOneAndUpdate(
        { employeeId: emp._id, companyCode: sanitizedCompanyCode },
        {
          employeeId: emp._id,
          companyCode: sanitizedCompanyCode,
          generatedAt: new Date(),
          totalSubmissions: 0,
          latestSubmissionDate: null,
          currentAverages: {
            jobSatisfaction: 0,
            workEnvironment: 0,
            workLifeBalance: 0,
            growth: 0,
            overall: 0,
          },
          experimentalSurveyRisk: {
            level: "NO_FEEDBACK",
            label: "Pending Survey Response",
            score: null,
            disclaimer: "No feedback submitted yet.",
          },
          mlPrediction: { isAvailable: false },
        },
        { upsert: true, returnDocument: "after" },
      );
      continue;
    }

    const latest = empFeedbacks[empFeedbacks.length - 1];
    const scores = [
      latest.jobSatisfaction,
      latest.workEnvironment,
      latest.workLifeBalance,
      latest.growth,
    ].filter((s) => typeof s === "number");
    const empAvg = scores.length
      ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
      : 0;

    let riskLevel = "HEALTHY";
    let riskLabel = "Healthy Retention Indicator";

    if (empAvg <= 2.5) {
      riskLevel = "HIGH_RISK";
      riskLabel = "Low Satisfaction Indicator";
      highRiskCount++;
    } else if (empAvg <= 3.5) {
      riskLevel = "NEEDS_ATTENTION";
      riskLabel = "Moderate Satisfaction Indicator";
      needsAttentionCount++;
    } else {
      healthyCount++;
    }

    // Run ML model inference if trained
    let empMlPrediction = {
      isAvailable: false,
      outcome: null,
      probability: null,
    };

    if (
      mlStatus.isReadyForInference &&
      typeof latest.jobSatisfaction === "number"
    ) {
      try {
        const inf = await predictOutcome({
          jobSatisfaction: Math.min(
            4,
            Math.max(1, Math.round(latest.jobSatisfaction)),
          ),
          environmentSatisfaction: Math.min(
            4,
            Math.max(1, Math.round(latest.workEnvironment)),
          ),
          workLifeBalance: Math.min(
            4,
            Math.max(1, Math.round(latest.workLifeBalance)),
          ),
          relationshipSatisfaction: Math.min(
            4,
            Math.max(1, Math.round(latest.growth)),
          ),
        });
        if (inf && inf.isAvailable) {
          empMlPrediction = {
            isAvailable: true,
            outcome: inf.outcome,
            probability: inf.probability,
            modelVersion: inf.modelVersion,
            predictionTimestamp: new Date(),
          };
        }
      } catch (infErr) {
        // Fall back gracefully if inference fails
      }
    }

    await EmployeeAnalytics.findOneAndUpdate(
      { employeeId: emp._id, companyCode: sanitizedCompanyCode },
      {
        employeeId: emp._id,
        companyCode: sanitizedCompanyCode,
        generatedAt: new Date(),
        totalSubmissions: empFeedbacks.length,
        latestSubmissionDate:
          latest.submittedAt || latest.createdAt || new Date(),
        currentAverages: {
          jobSatisfaction: latest.jobSatisfaction || 0,
          workEnvironment: latest.workEnvironment || 0,
          workLifeBalance: latest.workLifeBalance || 0,
          growth: latest.growth || 0,
          overall: empAvg,
        },
        experimentalSurveyRisk: {
          level: riskLevel,
          label: riskLabel,
          score: empAvg,
          disclaimer:
            "Descriptive indicator based on survey satisfaction thresholds. Not a trained ML prediction.",
        },
        mlPrediction: empMlPrediction,
      },
      { upsert: true, returnDocument: "after" },
    );
  }

  // 6. Save CompanyAnalytics snapshot in MongoDB (upsert — one document per company, no duplicates)
  const companySnapshot = await CompanyAnalytics.findOneAndUpdate(
    { companyCode: sanitizedCompanyCode },
    {
      companyCode: sanitizedCompanyCode,
      generatedAt: new Date(),
      totalEmployeesInCompany,
      totalFeedbackSubmissions,
      uniqueEmployeesRepresented,
      averages,
      distributions,
      timelineTrends,
      textInsights: {
        totalCommentsAnalyzed: totalCommentsCount,
        topImprovementThemes,
      },
      experimentalRiskSummary: {
        highRiskCount,
        needsAttentionCount,
        healthyCount,
        unsubmittedCount,
      },
      modelVersionUsed: mlStatus.modelVersion || "none",
      mlModelStatus: mlStatus.status,
    },
    { upsert: true, returnDocument: "after" },
  );

  return companySnapshot;
}

/**
 * Retrieve latest stored company analytics or generate if none exists
 */
export async function getCompanyAnalyticsOverview(companyCode) {
  const sanitizedCompanyCode = companyCode.toUpperCase().trim();

  let latestSnapshot = await CompanyAnalytics.findOne({
    companyCode: sanitizedCompanyCode,
  })
    .sort({ generatedAt: -1 })
    .lean();

  if (!latestSnapshot) {
    latestSnapshot = await refreshCompanyAnalytics(sanitizedCompanyCode);
  }

  const mlStatus = await getModelStatus();

  return {
    ...latestSnapshot,
    mlStatus,
  };
}

/**
 * Retrieve individual employee analytics details
 */
export async function getEmployeeAnalyticsDetails(employeeId, companyCode) {
  const sanitizedCompanyCode = companyCode.toUpperCase().trim();

  // Verify employee belongs to authorized company
  const emp = await User.findOne({
    _id: employeeId,
    companyCode: sanitizedCompanyCode,
    role: "employee",
  })
    .select("_id fullName email employeeCode companyCode createdAt")
    .lean();

  if (!emp) {
    return null;
  }

  // Fetch feedback history for this employee
  const feedbackHistory = await EmployeeFeedback.find({ employeeId: emp._id })
    .sort({ submittedAt: 1 })
    .lean();

  // Get or calculate employee analytics snapshot
  let employeeAnalytics = await EmployeeAnalytics.findOne({
    employeeId: emp._id,
    companyCode: sanitizedCompanyCode,
  }).lean();

  if (!employeeAnalytics) {
    await refreshCompanyAnalytics(sanitizedCompanyCode);
    employeeAnalytics = await EmployeeAnalytics.findOne({
      employeeId: emp._id,
      companyCode: sanitizedCompanyCode,
    }).lean();
  }

  const mlStatus = await getModelStatus();

  return {
    employee: emp,
    analytics: employeeAnalytics,
    feedbackHistory,
    mlStatus,
  };
}
