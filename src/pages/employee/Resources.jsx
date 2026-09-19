import React from "react";
import { Card } from "../../components/common/Card";
import { FileText, HeartHandshake, TrendingUp, ShieldCheck, ExternalLink } from "lucide-react";

export const Resources = () => {
  const resourcesList = [
    {
      title: "Employee Handbook & Policies",
      category: "Company Guidelines",
      icon: FileText,
      description: "Comprehensive guide covering code of conduct, remote work, leave policies, and workplace standards.",
      color: "indigo",
    },
    {
      title: "Career Growth & Mentorship Tracks",
      category: "Professional Development",
      icon: TrendingUp,
      description: "Frameworks for performance reviews, promotion criteria, skill development programs, and internal transfers.",
      color: "purple",
    },
    {
      title: "Workplace Mental Health & Wellness",
      category: "Health & Well-being",
      icon: HeartHandshake,
      description: "Employee assistance programs, counseling contacts, stress management resources, and wellness leave.",
      color: "emerald",
    },
    {
      title: "Feedback Ethics & Confidentiality",
      category: "Survey Privacy",
      icon: ShieldCheck,
      description: "Learn how RetainPulse protects employee survey data and anonymizes sentiment reports for HR.",
      color: "amber",
    },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Workplace Resources & Documentation</h2>
        <p className="text-xs text-slate-500">Guidelines, health resources, and career advancement documentation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resourcesList.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card key={index} className="hover:border-indigo-200 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                    {item.category}
                  </span>
                  <Icon className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-800">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                <span>View Guidelines</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
