import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/common/Card";
import { Building2, ShieldCheck, Users, Hash, Mail, CheckCircle2 } from "lucide-react";

export const CompanyOverview = () => {
  const { user } = useAuth();
  const [empCount, setEmpCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await api.get("/hr/employees");
        setEmpCount(response.data.employees?.length || 0);
      } catch (err) {
        console.error("Company details error:", err);
      }
    };
    fetchCount();
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Organization Profile</h2>
        <p className="text-xs text-slate-500">Company details and multi-tenant code identification</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">Registered Workspace</h3>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Company Workspace Profile</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-xl border border-indigo-100 uppercase">
            Code: {user?.companyCode || "N/A"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Unique Company Code</span>
              <span className="text-base font-mono font-extrabold text-slate-900 uppercase">{user?.companyCode || "N/A"}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Active Employees</span>
              <span className="text-base font-extrabold text-slate-900">{empCount} Onboarded</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Primary HR Admin</span>
              <span className="text-sm font-bold text-slate-800">{user?.fullName || "N/A"}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Admin Email</span>
              <span className="text-sm font-bold text-slate-800">{user?.email || "N/A"}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Active Tenant Isolation Mode</span>
          </div>
          <span>RetainPulse Enterprise v2.0</span>
        </div>
      </Card>
    </div>
  );
};
