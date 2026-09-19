import React, { useState } from "react";
import api from "../../api/client";
import { Card } from "../../components/common/Card";
import { Toast } from "../../components/common/Toast";
import { sendWelcomeEmail } from "../../utils/emailService";
import { UserPlus, ShieldPlus, User, Mail, Lock, ArrowRight } from "lucide-react";

export const HRManagement = () => {
  const [activeTab, setActiveTab] = useState("employee"); // 'employee' | 'hr'
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [formFields, setFormFields] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      const response = await api.post("/Save", {
        fullName: formFields.fullName.trim(),
        email: formFields.email.trim(),
        password: formFields.password,
      });

      // Send email
      try {
        await sendWelcomeEmail({
          to_email: formFields.email.trim(),
          to_name: formFields.fullName.trim(),
          password: formFields.password,
        });
      } catch (err) {
        console.warn("Email service warning:", err);
      }

      setToast({
        type: "success",
        text: `Employee ${formFields.fullName} created successfully with code: ${response.data.employee?.employeeCode || "EMP-Generated"}!`,
      });
      setFormFields({ fullName: "", email: "", password: "" });
    } catch (err) {
      console.error("Create Employee error:", err);
      setToast({
        type: "error",
        text: err.response?.data?.message || "Failed to create employee.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHR = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      const response = await api.post("/hr/create", {
        fullName: formFields.fullName.trim(),
        email: formFields.email.trim(),
        password: formFields.password,
      });

      try {
        await sendWelcomeEmail({
          to_email: formFields.email.trim(),
          to_name: formFields.fullName.trim(),
          password: formFields.password,
        });
      } catch (err) {
        console.warn("Email service warning:", err);
      }

      setToast({
        type: "success",
        text: `HR Admin ${formFields.fullName} registered successfully!`,
      });
      setFormFields({ fullName: "", email: "", password: "" });
    } catch (err) {
      console.error("Create HR error:", err);
      setToast({
        type: "error",
        text: err.response?.data?.message || "Failed to create HR account.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">HR & Workforce Management</h2>
        <p className="text-xs text-slate-500">Onboard new team members or grant HR administrative access</p>
      </div>

      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}

      {/* Tab Selectors */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => {
            setActiveTab("employee");
            setToast(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === "employee"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("hr");
            setToast(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === "hr"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <ShieldPlus className="w-4 h-4" />
          <span>Add HR Admin</span>
        </button>
      </div>

      <Card
        title={activeTab === "employee" ? "Onboard New Employee Account" : "Register New HR Admin Account"}
        subtitle={
          activeTab === "employee"
            ? "Generates unique employee code automatically under your company"
            : "Grants administrative access for managing team records"
        }
      >
        <form onSubmit={activeTab === "employee" ? handleCreateEmployee : handleCreateHR} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="fullName"
                required
                placeholder="Full Name"
                value={formFields.fullName}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                required
                placeholder="user@company.com"
                value={formFields.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formFields.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-4 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 text-white ${
              activeTab === "employee" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? (
              <span className="animate-pulse">Processing Registration...</span>
            ) : (
              <>
                <span>{activeTab === "employee" ? "Register Employee Account" : "Register HR Admin"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </Card>
    </div>
  );
};
