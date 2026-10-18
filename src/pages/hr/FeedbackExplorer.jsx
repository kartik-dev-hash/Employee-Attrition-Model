import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { DataTable } from "../../components/common/DataTable";
import { RatingStars } from "../../components/common/RatingStars";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Eye } from "lucide-react";
import { EmployeeDetailView } from "../../components/hr-analytics/EmployeeDetailView";

export const FeedbackExplorer = () => {
  const [employees, setEmployees] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState(null); // { emp, feed }

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/hr/employees");
      setEmployees(response.data.employees || []);
      setFeedbacks(response.data.feedbacks || []);
    } catch (err) {
      console.error("Error fetching feedback list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Merge submitted feedbacks with employee details
  const feedbackList = feedbacks.map((feed) => {
    const emp = employees.find((e) => e._id === feed.employeeId || e._id === feed.employeeId?._id);
    return {
      ...feed,
      employee: emp,
      employeeName: emp?.fullName || "Employee",
      employeeEmail: emp?.email || "",
      employeeCode: emp?.employeeCode || "N/A",
      mlPrediction: emp?.mlPrediction,
      avgRating: (
        ((feed.jobSatisfaction || 0) +
          (feed.workEnvironment || 0) +
          (feed.workLifeBalance || 0) +
          (feed.growth || 0)) /
        4
      ).toFixed(1),
    };
  });

  const columns = [
    {
      header: "Employee",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center">
            {row.employeeName?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800">{row.employeeName}</p>
            <p className="text-[11px] text-slate-400">{row.employeeEmail}</p>
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
      header: "Job Sat.",
      cell: (row) => <RatingStars value={row.jobSatisfaction} size="sm" showLabel={false} disabled />,
    },
    {
      header: "Work Env.",
      cell: (row) => <RatingStars value={row.workEnvironment} size="sm" showLabel={false} disabled />,
    },
    {
      header: "Work-Life",
      cell: (row) => <RatingStars value={row.workLifeBalance} size="sm" showLabel={false} disabled />,
    },
    {
      header: "Growth",
      cell: (row) => <RatingStars value={row.growth} size="sm" showLabel={false} disabled />,
    },
    {
      header: "Average Score",
      cell: (row) => (
        <span className="font-extrabold text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
          ★ {row.avgRating} / 5
        </span>
      ),
    },
    {
      header: "Attrition Risk",
      cell: (row) => {
        const ml = row.mlPrediction;
        if (!ml?.isAvailable) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
              Not Evaluated
            </span>
          );
        }
        const isHigh = ml.outcome === "Yes";
        const pct = ml.probability != null ? `${(ml.probability * 100).toFixed(1)}%` : "";
        if (isHigh) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse" />
              High Risk {pct && <span className="opacity-75">· {pct}</span>}
            </span>
          );
        }
        const prob = ml.probability ?? 0;
        if (prob >= 0.35) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              Medium Risk {pct && <span className="opacity-75">· {pct}</span>}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Low Risk {pct && <span className="opacity-75">· {pct}</span>}
          </span>
        );
      },
    },
    {
      header: "Action",
      align: "center",
      cell: (row) => (
        <button
          onClick={() => setSelectedItem(row)}
          className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors font-medium text-xs flex items-center gap-1 mx-auto cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          <span>View Response</span>
        </button>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner label="Loading feedback explorer..." />;
  }

  // When a feedback response is selected, render full-page details view (matching View Details & Analytics)
  if (selectedItem) {
    const empObj = selectedItem.employee || {
      _id: selectedItem.employeeId?._id || selectedItem.employeeId,
      fullName: selectedItem.employeeName,
      email: selectedItem.employeeEmail,
      employeeCode: selectedItem.employeeCode,
      mlPrediction: selectedItem.mlPrediction,
      companyCode: selectedItem.companyCode,
      role: "Employee",
    };

    return (
      <EmployeeDetailView
        employee={empObj}
        feedback={selectedItem}
        initialTab="overview"
        backLabel="Back to Feedback Explorer"
        onBack={() => setSelectedItem(null)}
        onRefresh={fetchData}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Employee Feedback Explorer</h2>
        <p className="text-xs text-slate-500">Review satisfaction ratings and written feedback submissions</p>
      </div>

      <DataTable
        columns={columns}
        data={feedbackList}
        searchPlaceholder="Search feedback by employee name or code..."
        searchFields={["employeeName", "employeeEmail", "employeeCode", "manager"]}
        emptyTitle="No Feedback Submissions Found"
        emptyDescription="None of your registered employees have submitted a feedback survey yet."
      />
    </div>
  );
};
