import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import { Card } from "../../components/common/Card";
import { StatusBadge } from "../../components/common/Badge";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  Sparkles,
  MessageSquarePlus,
  User,
  History,
  BookOpen,
  CheckCircle2,
  Clock,
  Building,
  ShieldCheck,
  ArrowRight,
  HeartHandshake,
} from "lucide-react";

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get("/predict/status");
        setStatusData(response.data);
      } catch (err) {
        console.error("Error fetching status:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading your portal dashboard..." />;
  }

  const isSubmitted = statusData?.submitted || false;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Employee Hub
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.fullName || "Employee"}! 👋
            </h2>
            <p className="text-indigo-100/90 text-xs sm:text-sm max-w-xl leading-relaxed">
              Your honest feedback plays a crucial role in building a better workplace environment, culture, and career growth for everyone.
            </p>
          </div>

          {/* Employee Badge Quick Tag */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs font-medium space-y-1.5 min-w-[200px]">
            <div className="flex items-center justify-between text-indigo-200">
              <span>Employee Code:</span>
              <strong className="text-white font-mono uppercase">{user?.employeeCode || "EMP-N/A"}</strong>
            </div>
            <div className="flex items-center justify-between text-indigo-200">
              <span>Company Code:</span>
              <strong className="text-white font-mono uppercase">{user?.companyCode || "N/A"}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Feedback Status Card (Spans 2 cols on desktop) */}
        <div className="md:col-span-2 space-y-6">
          <Card className="relative overflow-hidden border-indigo-100">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                  Quarterly Feedback Status
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {isSubmitted ? "Feedback Successfully Submitted" : "Your Feedback is Pending"}
                </h3>
              </div>

              {isSubmitted ? (
                <StatusBadge type="submitted" label="Completed" />
              ) : (
                <StatusBadge type="pending" label="Action Required" />
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
              {isSubmitted
                ? "Thank you for sharing your workplace experience! Your responses are securely processed to help improve team satisfaction."
                : "You have not submitted your feedback for the current period yet. It takes less than 3 minutes."}
            </p>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              {isSubmitted ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Response Logged & Confidential</span>
                </div>
              ) : (
                <Link
                  to="/employee/feedback"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>Give Feedback Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </Card>

          {/* Helpful Tips Card */}
          <Card title="Workplace Culture & Wellness" subtitle="Tips to maximize your career growth">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <HeartHandshake className="w-5 h-5 text-indigo-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-800">Open Communication</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Regular 1-on-1 conversations with managers help resolve bottlenecks early.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <BookOpen className="w-5 h-5 text-purple-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-800">Continuous Growth</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Explore internal learning resources and career development tracks.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Quick Navigation Shortcuts */}
        <div className="space-y-4">
          <Card title="Quick Actions">
            <div className="space-y-2.5">
              <Link
                to="/employee/feedback"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 transition-all font-medium text-xs group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <MessageSquarePlus className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Submit Feedback</p>
                  <p className="text-[10px] text-slate-500">Rate your work environment</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/employee/profile"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 transition-all font-medium text-xs group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">View My Profile</p>
                  <p className="text-[10px] text-slate-500">Check employee details</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/employee/history"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 transition-all font-medium text-xs group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Submission History</p>
                  <p className="text-[10px] text-slate-500">Review feedback logs</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/employee/resources"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 transition-all font-medium text-xs group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Company Resources</p>
                  <p className="text-[10px] text-slate-500">Handbooks & support</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
