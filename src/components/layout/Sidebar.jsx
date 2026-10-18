import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  User,
  MessageSquarePlus,
  History,
  BookOpen,
  HelpCircle,
  Users,
  MessageSquareText,
  TrendingUp,
  Building2,
  Settings,
  LogOut,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  UserCog,
  Bot,
  CalendarClock,
} from "lucide-react";

export const Sidebar = ({ isOpen, toggleSidebar, isMobileOpen, closeMobile }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const employeeNavItems = [
    { label: "Dashboard", path: "/employee/dashboard", icon: LayoutDashboard },
    { label: "My Profile", path: "/employee/profile", icon: User },
    { label: "Give Feedback", path: "/employee/feedback", icon: MessageSquarePlus },
    { label: "Feedback History", path: "/employee/history", icon: History },
    { label: "My Meetings", path: "/employee/meetings", icon: CalendarClock },
    { label: "Resources", path: "/employee/resources", icon: BookOpen },
    { label: "Help & Support", path: "/employee/support", icon: HelpCircle },
  ];

  const hrNavItems = [
    { label: "Dashboard", path: "/hr/dashboard", icon: LayoutDashboard },
    { label: "Employees", path: "/hr/employees", icon: Users },
    { label: "Feedback", path: "/hr/feedback", icon: MessageSquareText },
    { label: "Attrition Insights", path: "/hr/attrition", icon: TrendingUp },
    { label: "AI Retention Agent", path: "/hr/retention-cases", icon: Bot },
    { label: "Company", path: "/hr/company", icon: Building2 },
    { label: "Settings", path: "/hr/settings", icon: Settings },
  ];

  const adminNavItems = [
    { label: "Company Management", path: "/admin/companies", icon: Building2 },
    { label: "User & Admin Management", path: "/admin/users", icon: UserCog },
    { label: "Platform Analytics", path: "/admin/analytics", icon: BarChart3 },
  ];

  const navItems =
    role === "hr"
      ? hrNavItems
      : role === "platformAdmin"
      ? adminNavItems
      : employeeNavItems;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 border-r border-slate-800 ${
          isOpen ? "w-64" : "w-20"
        } ${
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header Logo Section */}
        <div className="h-18 px-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-indigo-900/30">
              <Sparkles className="w-5 h-5" />
            </div>
            {isOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm text-white tracking-tight truncate">
                  RetainPulse
                </span>
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {role === "platformAdmin"
                    ? "Platform Admin"
                    : role === "hr"
                    ? "HR Admin Portal"
                    : "Employee Portal"}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* User Card info inside sidebar */}
        {isOpen && user && (
          <div className="mx-3 mt-4 p-3.5 bg-slate-800/60 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs uppercase flex-shrink-0">
              {user.fullName?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto mt-2">
          {isOpen && (
            <span className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Main Menu
            </span>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-900/40"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                  }`
                }
                title={!isOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 font-medium text-sm transition-all"
            title={!isOpen ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
