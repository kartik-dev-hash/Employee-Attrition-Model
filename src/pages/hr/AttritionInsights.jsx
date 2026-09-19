import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { Card, StatCard } from "../../components/common/Card";
import { StatusBadge } from "../../components/common/Badge";
import { DataTable } from "../../components/common/DataTable";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Modal } from "../../components/common/Modal";
import { RatingStars } from "../../components/common/RatingStars";
import { TrendingUp, AlertTriangle, HeartPulse, Eye, HelpCircle } from "lucide-react";

export const AttritionInsights = () => {
  const [employees, setEmployees] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEmp, setSelectedEmp] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/hr/employees");
      setEmployees(response.data.employees || []);
      setFeedbacks(response.data.feedbacks || []);
    } catch (err) {
      console.error("Error fetching attrition insights data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute risk scores for employees using existing data
  const employeeRiskList = employees.map((emp) => {
    const feed = feedbacks.find((f) => f.employeeId === emp._id || f.employeeId?._id === emp._id);

    if (!feed) {
      return {
        ...emp,
        feedback: null,
        riskLevel: "NO_FEEDBACK",
        riskLabel: "Pending Feedback",
        avgScore: null,
        mlPrediction: "Pending",
        mlProbability: null,
      };
    }

    const scores = [
      feed.jobSatisfaction,
      feed.workEnvironment,
      feed.workLifeBalance,
      feed.growth,
    ].filter((s) => typeof s === "number");

    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;

    let riskLevel = "HEALTHY";
    let riskLabel = "Healthy / Low Risk";

    // ML prediction priority if present in backend
    if (feed.prediction === "Yes" || (typeof feed.probability === "number" && feed.probability > 0.5)) {
      riskLevel = "HIGH_RISK";
      riskLabel = "High Attrition Risk";
    } else if (avg <= 2.5) {
      riskLevel = "HIGH_RISK";
      riskLabel = "High Attrition Risk";
    } else if (avg <= 3.5) {
      riskLevel = "NEEDS_ATTENTION";
      riskLabel = "Needs Attention";
    }

    return {
      ...emp,
      feedback: feed,
      riskLevel,
      riskLabel,
      avgScore: avg,
      mlPrediction: feed.prediction || (riskLevel === "HIGH_RISK" ? "Yes" : "No"),
      mlProbability: feed.probability ? (feed.probability * 100).toFixed(0) + "%" : null,
    };
  });

  const highRiskCount = employeeRiskList.filter((e) => e.riskLevel === "HIGH_RISK").length;
  const attentionCount = employeeRiskList.filter((e) => e.riskLevel === "NEEDS_ATTENTION").length;
  const healthyCount = employeeRiskList.filter((e) => e.riskLevel === "HEALTHY").length;
  const pendingCount = employeeRiskList.filter((e) => e.riskLevel === "NO_FEEDBACK").length;

  const columns = [
    {
      header: "Employee Name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center">
            {row.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800">{row.fullName}</p>
            <p className="text-[11px] text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Employee Code",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
          {row.employeeCode}
        </span>
      ),
    },
    {
      header: "Feedback Avg Score",
      cell: (row) =>
        row.avgScore ? (
          <span className="font-extrabold text-xs text-slate-800">
            ★ {row.avgScore} / 5.0
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      header: "Attrition Status",
      cell: (row) => {
        if (row.riskLevel === "HIGH_RISK") return <StatusBadge type="highRisk" label="High Risk" />;
        if (row.riskLevel === "NEEDS_ATTENTION") return <StatusBadge type="mediumRisk" label="Needs Attention" />;
        if (row.riskLevel === "HEALTHY") return <StatusBadge type="healthy" label="Healthy" />;
        return <StatusBadge type="pending" label="Pending Feedback" />;
      },
    },
    {
      header: "Action",
      align: "center",
      cell: (row) => (
        <button
          onClick={() => setSelectedEmp(row)}
          className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors font-medium text-xs flex items-center gap-1 mx-auto cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          <span>Risk Details</span>
        </button>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner label="Calculating attrition risk analytics..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Attrition Risk Analytics & Insights</h2>
        <p className="text-xs text-slate-500">Evaluates workplace risk using existing backend prediction & feedback scores</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="High Attrition Risk"
          value={highRiskCount}
          icon={AlertTriangle}
          color="rose"
          subtext="Immediate retention action recommended"
        />

        <StatCard
          title="Needs Attention"
          value={attentionCount}
          icon={TrendingUp}
          color="amber"
          subtext="Moderate score drop detected"
        />

        <StatCard
          title="Healthy Retention"
          value={healthyCount}
          icon={HeartPulse}
          color="emerald"
          subtext="High satisfaction scores"
        />

        <StatCard
          title="Pending Evaluation"
          value={pendingCount}
          icon={HelpCircle}
          color="indigo"
          subtext="Awaiting survey responses"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={employeeRiskList}
        searchPlaceholder="Search by name, email, employee code..."
        searchFields={["fullName", "email", "employeeCode"]}
        filterOptions={[
          { label: "High Risk", value: "HIGH_RISK" },
          { label: "Needs Attention", value: "NEEDS_ATTENTION" },
          { label: "Healthy", value: "HEALTHY" },
        ]}
        onFilterChange={(row, filterVal) => row.riskLevel === filterVal}
        emptyTitle="No Risk Records Found"
        emptyDescription="No employee records match the selected attrition risk category."
      />

      {/* Risk Detail Modal */}
      <Modal
        isOpen={!!selectedEmp}
        onClose={() => setSelectedEmp(null)}
        title={selectedEmp?.fullName || "Employee Risk Analysis"}
        subtitle={`Employee Code: ${selectedEmp?.employeeCode}`}
        icon={TrendingUp}
        maxWidth="max-w-2xl"
      >
        {selectedEmp && (
          <div className="space-y-6">
            <div className={`p-5 rounded-2xl border ${
              selectedEmp.riskLevel === "HIGH_RISK"
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : selectedEmp.riskLevel === "NEEDS_ATTENTION"
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-emerald-50 border-emerald-200 text-emerald-900"
            }`}>
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-base">{selectedEmp.riskLabel}</h4>
                <StatusBadge
                  type={
                    selectedEmp.riskLevel === "HIGH_RISK"
                      ? "highRisk"
                      : selectedEmp.riskLevel === "NEEDS_ATTENTION"
                      ? "mediumRisk"
                      : "healthy"
                  }
                  label={selectedEmp.riskLabel}
                />
              </div>

              {selectedEmp.avgScore && (
                <p className="text-xs mt-2 font-medium">
                  Average Workplace Rating: <strong>★ {selectedEmp.avgScore} / 5.0</strong>
                </p>
              )}
            </div>

            {selectedEmp.feedback ? (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Category Breakdown</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 block">Job Satisfaction</span>
                    <RatingStars value={selectedEmp.feedback.jobSatisfaction} disabled />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 block">Work Environment</span>
                    <RatingStars value={selectedEmp.feedback.workEnvironment} disabled />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 block">Work-Life Balance</span>
                    <RatingStars value={selectedEmp.feedback.workLifeBalance} disabled />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 block">Growth Opportunities</span>
                    <RatingStars value={selectedEmp.feedback.growth} disabled />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
                  <strong className="block text-slate-800">Improvement Feedback</strong>
                  <p className="text-slate-600">{selectedEmp.feedback.improvement || "No improvement notes provided."}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">
                This employee has not submitted feedback survey data yet.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
