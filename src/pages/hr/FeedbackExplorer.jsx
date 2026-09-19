import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { DataTable } from "../../components/common/DataTable";
import { RatingStars } from "../../components/common/RatingStars";
import { Modal } from "../../components/common/Modal";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { MessageSquareText, Eye } from "lucide-react";

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
      employeeName: emp?.fullName || "Employee",
      employeeEmail: emp?.email || "",
      employeeCode: emp?.employeeCode || "N/A",
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

      {/* Detailed Response Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={`Feedback from ${selectedItem?.employeeName}`}
        subtitle={`Employee Code: ${selectedItem?.employeeCode}`}
        icon={MessageSquareText}
        maxWidth="max-w-3xl"
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Header Score Overview */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-600 block">Overall Feedback Score</span>
                <span className="text-2xl font-extrabold text-indigo-900">★ {selectedItem.avgRating} / 5.0</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Manager Sentiment</span>
                <span className="text-xs font-bold text-slate-800 bg-white px-3 py-1 rounded-full border border-slate-200">
                  {selectedItem.manager || "N/A"}
                </span>
              </div>
            </div>

            {/* Ratings Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-1">Job Satisfaction</span>
                <RatingStars value={selectedItem.jobSatisfaction} disabled />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-1">Work Environment</span>
                <RatingStars value={selectedItem.workEnvironment} disabled />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-1">Work-Life Balance</span>
                <RatingStars value={selectedItem.workLifeBalance} disabled />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-1">Growth Opportunities</span>
                <RatingStars value={selectedItem.growth} disabled />
              </div>
            </div>

            {/* Written Statements */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Employee Comments</h4>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <strong className="block text-slate-800 mb-1">What the Employee Likes Most</strong>
                <p className="text-slate-600 leading-relaxed">{selectedItem.likedMost || "No response provided."}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <strong className="block text-slate-800 mb-1">Suggested Workplace Improvements</strong>
                <p className="text-slate-600 leading-relaxed">{selectedItem.improvement || "No response provided."}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <strong className="block text-slate-800 mb-1">Additional Comments</strong>
                <p className="text-slate-600 leading-relaxed">{selectedItem.comments || "No additional comments."}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
