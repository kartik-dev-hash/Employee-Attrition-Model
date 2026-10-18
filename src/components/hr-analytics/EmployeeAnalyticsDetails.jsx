import React, { useEffect, useState } from "react";
import { getEmployeeAnalytics } from "../../services/analyticsService";
import {
  ArrowLeft,
  User,
  Mail,
  ShieldCheck,
  Calendar,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  BrainCircuit,
} from "lucide-react";

export const EmployeeAnalyticsDetails = ({ employeeId, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const result = await getEmployeeAnalytics(employeeId);
        setData(result);
      } catch (err) {
        console.error("Error fetching employee analytics details:", err);
        setError(err.response?.data?.message || "Failed to load individual employee analytics.");
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchDetails();
    }
  }, [employeeId]);

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading individual employee analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <p className="text-sm font-semibold text-rose-600">{error || "Employee not found."}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
        >
          Return to Overview
        </button>
      </div>
    );
  }

  const { employee, analytics, feedbackHistory, mlStatus } = data;
  const currentAvg = analytics?.currentAverages || {};
  const riskInfo = analytics?.experimentalSurveyRisk || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Navigation & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Employees</span>
        </button>

        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
          ID: {employee._id}
        </span>
      </div>

      {/* Employee Profile Header Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
            {employee.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{employee.fullName}</h2>
              <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-200">
                {employee.employeeCode || "N/A"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {employee.email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                Company: {employee.companyCode}
              </span>
            </div>
          </div>
        </div>

        {/* Status Chip */}
        <div className="text-right">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            Feedback Submissions
          </span>
          <span className="text-xl font-bold text-slate-800">
            {feedbackHistory.length} Recorded
          </span>
        </div>
      </div>

      {/* Ratings & Risk Assessment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Ratings Breakdown */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Latest Survey Ratings Breakdown</span>
          </h3>

          <div className="space-y-3.5">
            {[
              { label: "Job Satisfaction", val: currentAvg.jobSatisfaction, color: "bg-indigo-500" },
              { label: "Work Environment", val: currentAvg.workEnvironment, color: "bg-emerald-500" },
              { label: "Work-Life Balance", val: currentAvg.workLifeBalance, color: "bg-amber-500" },
              { label: "Career Growth", val: currentAvg.growth, color: "bg-purple-500" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="text-slate-800">★ {item.val || 0} / 5.0</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${((item.val || 0) / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700">Combined Average Score</span>
            <span className="text-base text-indigo-600">★ {currentAvg.overall || 0} / 5.0</span>
          </div>
        </div>

        {/* Card 2: Experimental Risk Indicator & ML State */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Attrition Risk Assessment & Model Status</span>
          </h3>

          <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Descriptive Risk Indicator:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                riskInfo.level === "HIGH_RISK"
                  ? "bg-rose-100 text-rose-700"
                  : riskInfo.level === "NEEDS_ATTENTION"
                  ? "bg-amber-100 text-amber-700"
                  : riskInfo.level === "HEALTHY"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-700"
              }`}>
                {riskInfo.label || "No Feedback"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {riskInfo.disclaimer || "Calculated using satisfaction score cutoffs. Not an automated resignation prediction."}
            </p>
          </div>

          {/* Machine Learning Status */}
          <div className="p-4 rounded-xl border bg-indigo-50/50 border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-900">Supervised ML Prediction:</span>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                analytics?.mlPrediction?.isAvailable
                  ? "bg-emerald-100 text-emerald-700"
                  : mlStatus?.status === "TRAINED"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-slate-200 text-slate-700"
              }`}>
                {analytics?.mlPrediction?.isAvailable
                  ? `Predicted: Attrition ${analytics.mlPrediction.outcome}`
                  : mlStatus?.status === "TRAINED"
                  ? "Active"
                  : "Unavailable"}
              </span>
            </div>
            {analytics?.mlPrediction?.isAvailable ? (
              <div className="text-[11px] text-indigo-900 space-y-1">
                <div className="flex justify-between font-medium">
                  <span>Departure Probability:</span>
                  <span className="font-bold">
                    {analytics.mlPrediction.probability != null
                      ? `${(analytics.mlPrediction.probability * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Model Version:</span>
                  <span className="font-mono">{analytics.mlPrediction.modelVersion || mlStatus?.modelVersion}</span>
                </div>
                <p className="text-[10px] text-slate-500 pt-1 border-t border-indigo-100">
                  Trained on benchmark dataset features (JobSatisfaction, EnvironmentSatisfaction, WorkLifeBalance, RelationshipSatisfaction).
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                {mlStatus?.status === "TRAINED"
                  ? `Model version ${mlStatus.modelVersion} is trained and ready. Refresh analytics to populate individual employee predictions.`
                  : "A trained ML model is currently unavailable because the database lacks historical labeled records with verified employee departures ('attrition: true/false')."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Historical Feedback Responses */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-600" />
          <span>Qualitative Feedback Submissions ({feedbackHistory.length})</span>
        </h3>

        {feedbackHistory.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No feedback recorded yet for this employee.</p>
        ) : (
          <div className="space-y-4">
            {feedbackHistory.map((item, idx) => (
              <div key={item._id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Submission #{idx + 1}</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.submittedAt || item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 block">Manager Relationship:</span>
                    <p className="text-slate-600 mt-0.5">{item.manager || "N/A"}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">Liked Most:</span>
                    <p className="text-slate-600 mt-0.5">{item.likedMost || "N/A"}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">Areas for Improvement:</span>
                    <p className="text-slate-600 mt-0.5">{item.improvement || "N/A"}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">Additional Comments:</span>
                    <p className="text-slate-600 mt-0.5">{item.comments || "N/A"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
