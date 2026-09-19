import React from "react";

export const StatCard = ({ title, value, icon: Icon, color = "indigo", subtext, badgeText }) => {
  const themes = {
    indigo: {
      bg: "from-indigo-600 to-violet-600",
      lightBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
      shadow: "shadow-indigo-100",
    },
    emerald: {
      bg: "from-emerald-500 to-teal-600",
      lightBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      shadow: "shadow-emerald-100",
    },
    amber: {
      bg: "from-amber-500 to-orange-600",
      lightBg: "bg-amber-50 text-amber-600 border-amber-100",
      shadow: "shadow-amber-100",
    },
    rose: {
      bg: "from-rose-500 to-pink-600",
      lightBg: "bg-rose-50 text-rose-600 border-rose-100",
      shadow: "shadow-rose-100",
    },
    blue: {
      bg: "from-blue-600 to-cyan-600",
      lightBg: "bg-blue-50 text-blue-600 border-blue-100",
      shadow: "shadow-blue-100",
    },
  };

  const theme = themes[color] || themes.indigo;

  return (
    <div className={`bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${theme.bg} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
            <Icon className="w-5.5 h-5.5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </span>
        {badgeText && (
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${theme.lightBg}`}>
            {badgeText}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
          {subtext}
        </p>
      )}
    </div>
  );
};

export const Card = ({ children, className = "", title, subtitle, headerAction }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            {title && <h3 className="text-lg font-bold text-slate-800">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
