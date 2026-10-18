import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { DataTable } from "../../components/common/DataTable";
import { StatusBadge } from "../../components/common/Badge";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { RatingStars } from "../../components/common/RatingStars";
import { Users, Eye, RefreshCw, Clock, ShieldAlert } from "lucide-react";
import { EmployeeDetailView } from "../../components/hr-analytics/EmployeeDetailView";

export const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Employee Modal
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [selectedEmpFeedback, setSelectedEmpFeedback] = useState(null);
  const [modalTab, setModalTab] = useState("overview"); // 'overview' | 'retention'

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
    setModalTab("overview");
    const foundFeed = feedbacks.find(
      (f) => f.employeeId === emp._id || f.employeeId?._id === emp._id,
    );
    setSelectedEmpFeedback(foundFeed || null);
  };

  const handleOpenRetention = (emp) => {
    setSelectedEmp(emp);
    setModalTab("retention");
    const foundFeed = feedbacks.find(
      (f) => f.employeeId === emp._id || f.employeeId?._id === emp._id,
    );
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
        const pct =
          ml.probability != null ? `${(ml.probability * 100).toFixed(1)}%` : "";
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
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => handleViewEmployee(row)}
            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors font-medium text-xs flex items-center gap-1 cursor-pointer"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
            <span>Details</span>
          </button>

          <button
            onClick={() => handleOpenRetention(row)}
            className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-xl transition-colors font-semibold text-xs flex items-center gap-1 cursor-pointer"
            title="Open Retention Action Center"
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Action</span>
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner label="Loading employee directory..." />;
  }

  // When an employee is selected, render full-page details view (like View Analytics)
  if (selectedEmp) {
    return (
      <EmployeeDetailView
        employee={selectedEmp}
        feedback={selectedEmpFeedback}
        initialTab={modalTab}
        onBack={() => {
          setSelectedEmp(null);
          setSelectedEmpFeedback(null);
        }}
        onRefresh={fetchEmployees}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Employee Directory
          </h2>
          <p className="text-xs text-slate-500">
            Manage and inspect registered workforce members
          </p>
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
    </div>
  );
};
