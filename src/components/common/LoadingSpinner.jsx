import React from "react";
import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({ label = "Loading data...", fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <Loader2 className="w-9 h-9 text-indigo-600 animate-spin" />
      <span className="text-sm font-semibold text-slate-600 animate-pulse">
        {label}
      </span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-50/80 backdrop-blur-sm flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="space-y-3 p-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 rounded-xl w-full" />
      ))}
    </div>
  );
};
