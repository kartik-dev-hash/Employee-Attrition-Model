import React, { useState } from "react";
import { Card } from "../../components/common/Card";
import { Toast } from "../../components/common/Toast";
import { Bell, ShieldCheck } from "lucide-react";

export const Settings = () => {
  const [toast, setToast] = useState(null);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoReminder, setAutoReminder] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    setToast({ type: "success", text: "Portal preferences saved successfully!" });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Portal Settings</h2>
        <p className="text-xs text-slate-500">Configure notification alerts and admin preferences</p>
      </div>

      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}

      <Card title="Notification & Survey Preferences">
        <form onSubmit={handleSave} className="space-y-6 max-w-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">New Feedback Email Notifications</h4>
                  <p className="text-[11px] text-slate-500">Receive email alerts whenever an employee submits feedback</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Automatic Attrition Risk Flagging</h4>
                  <p className="text-[11px] text-slate-500">Automatically flag employees with average ratings below 2.5</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoReminder}
                onChange={(e) => setAutoReminder(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Save Preferences
          </button>
        </form>
      </Card>
    </div>
  );
};
