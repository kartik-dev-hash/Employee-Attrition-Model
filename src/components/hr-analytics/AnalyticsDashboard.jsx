import React, { useEffect, useState } from "react";
import {
  getCompanyAnalytics,
  refreshCompanyAnalytics,
  triggerMlTraining,
  getMlModelStatus,
} from "../../services/analyticsService";
import api from "../../api/client";
import { AnalyticsSummaryCards } from "./AnalyticsSummaryCards";
import { FeedbackCharts } from "./FeedbackCharts";
import { EmployeeAnalyticsTable } from "./EmployeeAnalyticsTable";
import { EmployeeAnalyticsDetails } from "./EmployeeAnalyticsDetails";
import {
  RefreshCw,
  Clock,
  Sparkles,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export const AnalyticsDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [mlStatus, setMlStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [notification, setNotification] = useState(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewData, empData, mlData] = await Promise.all([
        getCompanyAnalytics(),
        api.get("/hr/employees"),
        getMlModelStatus(),
      ]);

      setOverview(overviewData);
      setMlStatus(mlData);

      // Merge employees with individual feedback averages for quick roster lookup
      const empList = (empData.data.employees || []).map((emp) => {
        const empIdStr = String(emp._id);
        const feed = (empData.data.feedbacks || []).find(
          (f) => String(f.employeeId?._id || f.employeeId) === empIdStr
        );
        let avgScore = null;
        if (feed) {
          const scores = [
            feed.jobSatisfaction,
            feed.workEnvironment,
            feed.workLifeBalance,
            feed.growth,
          ].filter((s) => typeof s === "number");
          avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
        }

        return {
          ...emp,
          avgScore,
        };
      });

      setEmployees(empList);
    } catch (err) {
      console.error("Error loading HR analytics dashboard:", err);
      setNotification({
        type: "error",
        text: err.response?.data?.message || "Failed to load HR analytics data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      setNotification(null);
      const result = await refreshCompanyAnalytics();
      setOverview(result.snapshot);
      setMlStatus(result.mlStatus);
      setNotification({
        type: "success",
        text: "Company analytics snapshots regenerated and saved in MongoDB.",
      });
    } catch (err) {
      console.error("Error refreshing analytics:", err);
      setNotification({
        type: "error",
        text: err.response?.data?.message || "Refresh failed.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleTriggerTraining = async () => {
    try {
      setIsTraining(true);
      setNotification(null);
      const trainRes = await triggerMlTraining("1.0.0");
      setMlStatus(trainRes);
      setNotification({
        type: trainRes.success ? "success" : "info",
        text: trainRes.message || "ML training pipeline check completed.",
      });
    } catch (err) {
      console.error("Error triggering training:", err);
      setNotification({
        type: "error",
        text: err.response?.data?.message || "Training pipeline trigger failed.",
      });
    } finally {
      setIsTraining(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-700">Loading comprehensive HR analytics & ML metrics...</p>
        <p className="text-xs text-slate-400 mt-1">Calculating verified feedback distributions and company snapshots</p>
      </div>
    );
  }

  // Individual Employee Deep-Dive View
  if (selectedEmployeeId) {
    return (
      <EmployeeAnalyticsDetails
        employeeId={selectedEmployeeId}
        onBack={() => setSelectedEmployeeId(null)}
      />
    );
  }

  const lastGenDate = overview?.generatedAt ? new Date(overview.generatedAt).toLocaleString() : "Just now";

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header & Refresh Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Attrition & Workplace Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Live Database
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Last snapshot generated: {lastGenDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh Stored Analytics"}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast Banner */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
          notification.type === "success"
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
            : notification.type === "info"
            ? "bg-indigo-50 text-indigo-800 border border-indigo-200"
            : "bg-rose-50 text-rose-800 border border-rose-200"
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Summary Cards & ML Banner */}
      <AnalyticsSummaryCards
        overview={overview}
        mlStatus={mlStatus}
        onTriggerTraining={handleTriggerTraining}
        isTraining={isTraining}
      />

      {/* 2. Feedback Dimension & Distribution Charts */}
      <FeedbackCharts overview={overview} employees={employees} />

      {/* 3. Individual Employee Analytics Roster */}
      <EmployeeAnalyticsTable
        employees={employees}
        onSelectEmployee={(empId) => setSelectedEmployeeId(empId)}
      />
    </div>
  );
};
