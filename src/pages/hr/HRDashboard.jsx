import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { StatCard, Card } from "../../components/common/Card";
import { StatusBadge } from "../../components/common/Badge";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Modal } from "../../components/common/Modal";
import { Toast } from "../../components/common/Toast";
import { sendWelcomeEmail } from "../../utils/emailService";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserPlus,
  ShieldPlus,
  ArrowRight,
  Building,
  Mail,
  Lock,
  User,
  MailCheck,
  Send,
} from "lucide-react";

export const HRDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    employees: [],
    submittedCount: 0,
    pendingFeedbacks: 0,
    feedbacks: [],
    companyCode: "",
  });
  const [loading, setLoading] = useState(true);

  // Form Modals
  const [activeModal, setActiveModal] = useState(null); // 'employee' | 'hr' | null
  const [modalLoading, setModalLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State
  const [formFields, setFormFields] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [reminderStatus, setReminderStatus] = useState(null);
  const [triggeringReminder, setTriggeringReminder] = useState(false);

  const fetchEmployeesData = async () => {
    try {
      const response = await api.get("/hr/employees");
      setData(response.data);
    } catch (err) {
      console.error("Error fetching HR employees data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReminderStatus = async () => {
    try {
      const response = await api.get("/api/hr/reminders/status");
      setReminderStatus(response.data);
    } catch (err) {
      console.warn("Notice: Reminder status endpoint:", err.message);
    }
  };

  useEffect(() => {
    fetchEmployeesData();
    fetchReminderStatus();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Add Employee (POST /Save)
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setToast(null);

    try {
      const response = await api.post("/Save", {
        fullName: formFields.fullName.trim(),
        email: formFields.email.trim(),
        password: formFields.password,
      });

      // Send Welcome Email if email service configured
      try {
        await sendWelcomeEmail({
          to_email: formFields.email.trim(),
          to_name: formFields.fullName.trim(),
          password: formFields.password,
        });
      } catch (e) {
        console.warn("Email service notice:", e);
      }

      setToast({ type: "success", text: `Employee ${formFields.fullName} created successfully!` });
      setActiveModal(null);
      setFormFields({ fullName: "", email: "", password: "" });
      fetchEmployeesData();
    } catch (err) {
      console.error("Create Employee Error:", err);
      setToast({
        type: "error",
        text: err.response?.data?.message || "Failed to create employee.",
      });
    } finally {
      setModalLoading(false);
    }
  };

  // Submit Add HR (POST /hr/create)
  const handleCreateHR = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setToast(null);

    try {
      const response = await api.post("/hr/create", {
        fullName: formFields.fullName.trim(),
        email: formFields.email.trim(),
        password: formFields.password,
      });

      // Send Welcome Email
      try {
        await sendWelcomeEmail({
          to_email: formFields.email.trim(),
          to_name: formFields.fullName.trim(),
          password: formFields.password,
        });
      } catch (e) {
        console.warn("Email service notice:", e);
      }

      setToast({ type: "success", text: `HR Admin ${formFields.fullName} registered successfully!` });
      setActiveModal(null);
      setFormFields({ fullName: "", email: "", password: "" });
      fetchEmployeesData();
    } catch (err) {
      console.error("Create HR Error:", err);
      setToast({
        type: "error",
        text: err.response?.data?.message || "Failed to create HR account.",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleTriggerInvitations = async () => {
    setTriggeringReminder(true);
    try {
      const response = await api.post("/api/hr/reminders/send-invitations");
      const resData = response.data?.result;
      setToast({
        type: "success",
        text: `Invitations sent to ${resData?.sent || 0} employees (${resData?.skippedAlreadySubmitted || 0} already submitted, ${resData?.skippedAlreadyNotified || 0} already notified).`,
      });
      fetchEmployeesData();
      fetchReminderStatus();
    } catch (err) {
      setToast({
        type: "error",
        text: err.response?.data?.message || "Failed to trigger invitations.",
      });
    } finally {
      setTriggeringReminder(false);
    }
  };

  const handleTriggerReminders = async () => {
    setTriggeringReminder(true);
    try {
      const response = await api.post("/api/hr/reminders/send-reminders");
      const resData = response.data?.result;
      setToast({
        type: "success",
        text: `Reminders sent to ${resData?.sent || 0} pending employees (${resData?.skippedAlreadySubmitted || 0} already submitted, ${resData?.skippedAlreadyReminded || 0} already reminded).`,
      });
      fetchEmployeesData();
      fetchReminderStatus();
    } catch (err) {
      setToast({
        type: "error",
        text: err.response?.data?.message || "Failed to trigger reminders.",
      });
    } finally {
      setTriggeringReminder(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading HR Dashboard Analytics..." />;
  }

  const totalEmployees = data.employees?.length || 0;
  const submittedCount = data.submittedCount || 0;
  const pendingCount = data.pendingFeedbacks || 0;

  // Calculate high risk from feedback scores (avg ≤ 2.5 = high risk, matching backend threshold)
  const highRiskCount = data.feedbacks?.filter((f) => {
    const scores = [f.jobSatisfaction, f.workEnvironment, f.workLifeBalance, f.growth].filter(
      (s) => typeof s === "number"
    );
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    return avg !== null && avg <= 2.5;
  }).length || 0;

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}

      {/* Hero Welcome Bar */}
      <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold border border-white/10 mb-2">
              <Building className="w-3.5 h-3.5 text-indigo-300" /> Workspace: <strong className="uppercase text-white">{data.companyCode || user?.companyCode}</strong>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Workforce Intelligence Overview
            </h2>
            <p className="text-indigo-100/90 text-xs sm:text-sm mt-1">
              Welcome, {user?.fullName || "HR Admin"}. Monitor retention metrics & employee feedback.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFormFields({ fullName: "", email: "", password: "" });
                setActiveModal("employee");
              }}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>

            <button
              onClick={() => {
                setFormFields({ fullName: "", email: "", password: "" });
                setActiveModal("hr");
              }}
              className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldPlus className="w-4 h-4" />
              <span>Add HR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Workforce"
          value={totalEmployees}
          icon={Users}
          color="indigo"
          subtext="Registered employees"
          badgeText="Active"
        />

        <StatCard
          title="Feedback Submitted"
          value={submittedCount}
          icon={CheckCircle2}
          color="emerald"
          subtext="Completed sentiment surveys"
          badgeText={`${totalEmployees ? Math.round((submittedCount / totalEmployees) * 100) : 0}% Rate`}
        />

        <StatCard
          title="Pending Feedback"
          value={pendingCount}
          icon={Clock}
          color="amber"
          subtext="Surveys awaiting response"
        />

        <StatCard
          title="High Attrition Risk"
          value={highRiskCount}
          icon={AlertTriangle}
          color="rose"
          subtext="Identified by ML & Feedback"
          badgeText={highRiskCount > 0 ? "Requires Review" : "Stable"}
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Employees (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Recent Employees"
            subtitle="Latest onboarded team members"
            headerAction={
              <Link to="/hr/employees" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View All Directory <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {data.employees?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No employees registered yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.employees.slice(0, 7).map((emp) => (
                  <div key={emp._id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {emp.fullName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800">{emp.fullName}</p>
                        <p className="text-[11px] text-slate-400">{emp.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {emp.employeeCode}
                      </span>
                      {emp.submitted ? (
                        <StatusBadge type="submitted" label="Submitted" />
                      ) : (
                        <StatusBadge type="pending" label="Pending" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Quick Action Cards */}
        <div className="space-y-4">
          <Card title="Management Actions" subtitle="Workforce onboard shortcuts">
            <div className="space-y-3">
              <button
                onClick={() => {
                  setFormFields({ fullName: "", email: "", password: "" });
                  setActiveModal("employee");
                }}
                className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/80 text-left transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Add New Employee</h4>
                  <p className="text-[11px] text-emerald-700">Generate employee code & login</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setFormFields({ fullName: "", email: "", password: "" });
                  setActiveModal("hr");
                }}
                className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/80 text-left transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <ShieldPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">Add New HR Admin</h4>
                  <p className="text-[11px] text-indigo-700">Grant co-HR workspace privileges</p>
                </div>
              </button>
            </div>
          </Card>

          {/* Monthly Cycle & Automated Email Reminders Control */}
          <Card
            title={`Feedback Cycle (${reminderStatus?.periodLabel || "Current Month"})`}
            subtitle="Automated monthly reminders status"
          >
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">Period Completion</span>
                  <span className="font-extrabold text-slate-800">
                    {reminderStatus?.submittedCount || data.submittedCount || 0} / {reminderStatus?.totalEmployees || data.employees?.length || 0} Submitted
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-semibold text-[11px]">Email Engine</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                    reminderStatus?.isLiveSmtpEnabled || reminderStatus?.emailEngine?.includes("EmailJS")
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {reminderStatus?.emailEngine || (reminderStatus?.isLiveSmtpEnabled ? "SMTP Live" : "EmailJS Active")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={handleTriggerInvitations}
                  disabled={triggeringReminder}
                  className="p-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-[11px]"
                  title="Dispatch initial invitation to eligible employees for current month"
                >
                  <Send className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Send Invites</span>
                </button>

                <button
                  onClick={handleTriggerReminders}
                  disabled={triggeringReminder}
                  className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-[11px]"
                  title="Send 7-day reminder only to employees who haven't submitted yet"
                >
                  <MailCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Send Reminders</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center">
                Automated monthly schedule: 1st of month (invite) & 8th of month (follow-up).
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal: Add Employee */}
      <Modal
        isOpen={activeModal === "employee"}
        onClose={() => setActiveModal(null)}
        title="Onboard New Employee"
        subtitle="Create an employee account for your organization"
        icon={UserPlus}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="fullName"
                required
                placeholder="John Smith"
                value={formFields.fullName}
                onChange={handleInputChange}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                required
                placeholder="employee@company.com"
                value={formFields.email}
                onChange={handleInputChange}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formFields.password}
                onChange={handleInputChange}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={modalLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {modalLoading ? "Creating Employee..." : "Create Employee Account"}
          </button>
        </form>
      </Modal>

      {/* Modal: Add HR */}
      <Modal
        isOpen={activeModal === "hr"}
        onClose={() => setActiveModal(null)}
        title="Add Co-HR Admin"
        subtitle="Register another HR user with administrative access"
        icon={ShieldPlus}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateHR} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="fullName"
                required
                placeholder="Sarah Conner"
                value={formFields.fullName}
                onChange={handleInputChange}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                required
                placeholder="hr2@company.com"
                value={formFields.email}
                onChange={handleInputChange}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formFields.password}
                onChange={handleInputChange}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={modalLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {modalLoading ? "Registering HR..." : "Register HR Admin Account"}
          </button>
        </form>
      </Modal>
    </div>
  );
};
