import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export const Toast = ({ type = "success", message, onClose }) => {
  if (!message) return null;

  const config = {
    success: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
    },
    error: {
      bg: "bg-rose-50 border-rose-200 text-rose-800",
      icon: AlertCircle,
      iconColor: "text-rose-600",
    },
    info: {
      bg: "bg-blue-50 border-blue-200 text-blue-800",
      icon: Info,
      iconColor: "text-blue-600",
    },
  };

  const style = config[type] || config.info;
  const Icon = style.icon;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${style.bg} shadow-sm transition-all animate-slide-in mb-4`}>
      <Icon className={`w-5 h-5 flex-shrink-0 ${style.iconColor}`} />
      <p className="text-sm font-medium flex-1">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 text-slate-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
