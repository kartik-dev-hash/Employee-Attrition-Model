import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { DataTable } from "../../components/common/DataTable";
import { StatusBadge } from "../../components/common/Badge";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Modal } from "../../components/common/Modal";
import { RatingStars } from "../../components/common/RatingStars";
import { Users, Eye, RefreshCw, Clock } from "lucide-react";

export const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Employee Modal
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [selectedEmpFeedback, setSelectedEmpFeedback] = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.get("/hr/employees");
      setEmployees(response.data.employees || []);
      setFeedbacks(response.data.feedbacks || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleViewEmployee = (emp) => {
    setSelectedEmp(emp);
    const foundFeed = feedbacks.find((f) => f.employeeId === emp._id || f.employeeId?._id === emp._id);
    setSelectedEmpFeedback(foundFeed || null);
  };

  const columns = [
    {
      header: "Employee Name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {row.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800">{row.fullName}</p>
            <p className="text-[11px] text-slate-400">{row.role}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Email",
      accessor: "email",
    },
    {
      header: "Employee Code",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
          {row.employeeCode || "N/A"}
        </span>
      ),
    },
    {
      header: "Company Code",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-slate-700 uppercase">
          {row.companyCode || "N/A"}
        </span>
      ),
    },
    {
      header: "Feedback Status",
      cell: (row) =>
        row.submitted ? (
          <StatusBadge type="submitted" label="Submitted" />
        ) : (
          <StatusBadge type="pending" label="Pending" />
        ),
    },
    {
      header: "Action",
      align: "center",
      cell: (row) => (
        <button
          onClick={() => handleViewEmployee(row)}
          className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors font-medium text-xs flex items-center gap-1 mx-auto cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          <span>View Details</span>
        </button>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner label="Loading employee directory..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Employee Directory</h2>
          <p className="text-xs text-slate-500">Manage and inspect registered workforce members</p>
        </div>

        <button
          onClick={fetchEmployees}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        searchPlaceholder="Search by name, email, employee code..."
        searchFields={["fullName", "email", "employeeCode", "companyCode"]}
        filterOptions={[
          { label: "Submitted", value: "SUBMITTED" },
          { label: "Pending", value: "PENDING" },
        ]}
        onFilterChange={(row, filterVal) => {
          if (filterVal === "SUBMITTED") return row.submitted;
          if (filterVal === "PENDING") return !row.submitted;
          return true;
        }}
        emptyTitle="No employees found"
        emptyDescription="No employee records match your search query."
      />

      {/* Employee Detail Modal */}
      <Modal
        isOpen={!!selectedEmp}
        onClose={() => setSelectedEmp(null)}
        title={selectedEmp?.fullName || "Employee Details"}
        subtitle={`Employee Code: ${selectedEmp?.employeeCode || "N/A"}`}
        icon={Users}
        maxWidth="max-w-3xl"
      >
        {selectedEmp && (
          <div className="space-y-6">
            {/* Overview Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Full Name</span>
                <span className="font-bold text-slate-800">{selectedEmp.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Email</span>
                <span className="font-bold text-slate-800">{selectedEmp.email}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Company Code</span>
                <span className="font-bold text-slate-800 uppercase">{selectedEmp.companyCode}</span>
              </div>
            </div>

            {/* Feedback Detail */}
            {!selectedEmpFeedback ? (
              <div className="p-6 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-center space-y-2">
                <Clock className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="text-sm font-bold text-amber-900">Feedback Not Submitted Yet</h4>
                <p className="text-xs text-amber-700">
                  This employee has not completed their workplace feedback survey for the current period.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800">Submitted Ratings</h4>
                  <StatusBadge type="submitted" label="Verified Feedback" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 block mb-1">Job Satisfaction</span>
                    <RatingStars value={selectedEmpFeedback.jobSatisfaction} disabled />
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 block mb-1">Work Environment</span>
                    <RatingStars value={selectedEmpFeedback.workEnvironment} disabled />
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 block mb-1">Work-Life Balance</span>
                    <RatingStars value={selectedEmpFeedback.workLifeBalance} disabled />
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 block mb-1">Growth Opportunities</span>
                    <RatingStars value={selectedEmpFeedback.growth} disabled />
                  </div>
                </div>

                {/* Qualitative Responses */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Qualitative Responses</h4>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <strong className="block text-slate-700 mb-1">Manager & Team Support</strong>
                    <p className="text-slate-600">{selectedEmpFeedback.manager || "No response"}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <strong className="block text-slate-700 mb-1">What Employee Liked Most</strong>
                    <p className="text-slate-600">{selectedEmpFeedback.likedMost || "No response"}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <strong className="block text-slate-700 mb-1">Suggested Improvements</strong>
                    <p className="text-slate-600">{selectedEmpFeedback.improvement || "No response"}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <strong className="block text-slate-700 mb-1">Additional Comments</strong>
                    <p className="text-slate-600">{selectedEmpFeedback.comments || "No comments"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
