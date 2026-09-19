import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/common/Card";
import { StatusBadge } from "../../components/common/Badge";
import { User, Mail, Hash, Building2, ShieldCheck, CheckCircle2 } from "lucide-react";

export const EmployeeProfile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Employee Profile</h2>
          <p className="text-xs text-slate-500">Your registered account details and organization metrics</p>
        </div>
        <StatusBadge type="employee" label="Active Account" />
      </div>

      <Card>
        {/* Top Profile Summary Header */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-indigo-600/30">
            {user?.fullName?.charAt(0) || "U"}
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-2xl font-extrabold text-slate-900">{user?.fullName || "Employee Name"}</h3>
            <p className="text-xs font-medium text-slate-500">{user?.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                <ShieldCheck className="w-3 h-3" /> Role: {user?.role?.toUpperCase()}
              </span>
              {user?.employeeCode && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 font-mono">
                  {user?.employeeCode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
          <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Full Name</span>
              <span className="text-sm font-bold text-slate-800">{user?.fullName || "N/A"}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Email Address</span>
              <span className="text-sm font-bold text-slate-800">{user?.email || "N/A"}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Employee Code</span>
              <span className="text-sm font-mono font-bold text-slate-800">{user?.employeeCode || "N/A"}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Company Code</span>
              <span className="text-sm font-mono font-bold text-slate-800 uppercase">{user?.companyCode || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Security & Verification Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Verified Employee Record</span>
          </div>
          <span>Account ID: {user?.id || user?._id || "N/A"}</span>
        </div>
      </Card>
    </div>
  );
};
