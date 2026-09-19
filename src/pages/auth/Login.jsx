import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import { Toast } from "../../components/common/Toast";
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck, Building2, UserCheck } from "lucide-react";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/login", {
        email: email.trim(),
        password: password,
      });

      const { token, user } = response.data;
      login(user, token);

      if (user.role === "hr") {
        navigate("/hr/dashboard");
      } else {
        navigate("/employee/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-2">
        {/* Left Hero Brand Panel */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 p-8 sm:p-12 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          
          {/* Logo */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight block">RetainPulse</span>
              <span className="text-xs font-semibold text-indigo-200">Employee Attrition Platform</span>
            </div>
          </div>

          {/* Value Prop */}
          <div className="my-10 relative z-10 space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Transform Employee Feedback Into Actionable Insights
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
              Empower HR leaders with early risk detection, pulse surveys, and AI-driven retention intelligence.
            </p>

            <div className="pt-4 space-y-2.5 text-xs text-indigo-100/90 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Enterprise-grade JWT Authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-300" />
                <span>Multi-tenant Company Workspace Isolation</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-300" />
                <span>Role-aware HR & Employee Portals</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-[11px] text-indigo-200/60 relative z-10">
            &copy; {new Date().getFullYear()} RetainPulse Inc. All rights reserved.
          </p>
        </div>

        {/* Right Form Panel */}
        <div className="bg-white p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Please sign in to access your portal account
            </p>
          </div>

          {error && <Toast type="error" message={error} onClose={() => setError("")} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="animate-pulse">Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              New Organization?{" "}
              <Link
                to="/register-company"
                className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Register Your Company
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
