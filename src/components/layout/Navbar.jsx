import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Menu, Building, ShieldCheck, UserCheck, LogOut } from "lucide-react";

export const Navbar = ({ toggleMobileSidebar }) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();

  const getPageMeta = (pathname) => {
    const titleMap = {
      "/employee/dashboard": { title: "Employee Dashboard", subtitle: "Overview of your workplace & activity" },
      "/employee/profile": { title: "My Profile", subtitle: "Manage your account and employment details" },
      "/employee/feedback": { title: "Give Feedback", subtitle: "Share your voice to help improve workplace culture" },
      "/employee/history": { title: "Feedback History", subtitle: "Track your past feedback submissions" },
      "/employee/resources": { title: "Resources & Guidelines", subtitle: "Company handbook, wellness & growth materials" },
      "/employee/support": { title: "Help & Support", subtitle: "Connect with HR or explore support resources" },
      "/hr/dashboard": { title: "HR Analytics Dashboard", subtitle: "Real-time attrition metrics & workforce overview" },
      "/hr/employees": { title: "Employee Directory", subtitle: "Browse, filter, and review workforce records" },
      "/hr/feedback": { title: "Employee Feedback Explorer", subtitle: "Review submitted employee satisfaction surveys" },
      "/hr/attrition": { title: "Attrition Insights", subtitle: "Predictive risk analysis & retention recommendations" },
      "/hr/company": { title: "Company Overview", subtitle: "Organization profile and workspace settings" },
      "/hr/management": { title: "HR Management", subtitle: "Onboard new employees & HR team members" },
      "/hr/settings": { title: "Portal Settings", subtitle: "Configure system preferences & notifications" },
    };

    return titleMap[pathname] || { title: "RetainPulse Portal", subtitle: "Employee Attrition Management System" };
  };

  const meta = getPageMeta(location.pathname);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu + Page Info */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={toggleMobileSidebar}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {meta.title}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Company Badge + User Profile & Logout */}
        <div className="flex items-center gap-3">
          {/* Company Code Badge */}
          {user?.companyCode && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              <span>Company: <strong className="text-indigo-700 uppercase">{user.companyCode}</strong></span>
            </div>
          )}

          {/* User Details */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {user?.fullName || "User"}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {role === "hr" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                    <ShieldCheck className="w-2.5 h-2.5" /> HR Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    <UserCheck className="w-2.5 h-2.5" /> Employee
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
