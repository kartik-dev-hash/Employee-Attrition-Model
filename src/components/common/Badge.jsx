import React from "react";

export const StatusBadge = ({ type, label }) => {
  const styles = {
    submitted: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    highRisk: "bg-rose-50 text-rose-700 border-rose-200",
    mediumRisk: "bg-orange-50 text-orange-700 border-orange-200",
    lowRisk: "bg-blue-50 text-blue-700 border-blue-200",
    healthy: "bg-emerald-50 text-emerald-700 border-emerald-200",
    hr: "bg-indigo-50 text-indigo-700 border-indigo-200",
    employee: "bg-slate-100 text-slate-700 border-slate-200",
    default: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const badgeStyle = styles[type] || styles.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeStyle} transition-colors`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          type === "submitted" || type === "healthy"
            ? "bg-emerald-500 animate-pulse"
            : type === "pending" || type === "mediumRisk"
            ? "bg-amber-500"
            : type === "highRisk"
            ? "bg-rose-500 animate-ping"
            : "bg-current"
        }`}
      />
      {label}
    </span>
  );
};
