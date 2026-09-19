import React, { useState } from "react";
import { Card } from "../../components/common/Card";
import { Toast } from "../../components/common/Toast";
import { HelpCircle, ChevronDown, ChevronUp, Send } from "lucide-react";

export const HelpSupport = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [ticketSent, setTicketSent] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const faqs = [
    {
      q: "Is my feedback completely confidential?",
      a: "Yes. Your feedback is processed securely through RetainPulse and anonymized to assist HR in evaluating overall workplace health and attrition factors.",
    },
    {
      q: "How often should I submit feedback?",
      a: "Surveys are made available every quarter or whenever triggered by your HR department.",
    },
    {
      q: "Can I edit my feedback after submission?",
      a: "Once submitted, responses are locked for processing. If you need to raise an urgent correction, contact your HR Admin.",
    },
    {
      q: "Who sees my survey ratings?",
      a: "Aggregated feedback is visible to primary HR Managers of your registered company code.",
    },
  ];

  const handleSendTicket = (e) => {
    e.preventDefault();
    setTicketSent(true);
    setSubject("");
    setMessage("");
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Help & HR Support</h2>
        <p className="text-xs text-slate-500">Frequently asked questions and direct HR assistance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FAQs */}
        <div className="md:col-span-2 space-y-4">
          <Card title="Frequently Asked Questions">
            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="border border-slate-100 rounded-2xl overflow-hidden transition-all bg-slate-50/50"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-100/50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Contact HR Ticket Box */}
        <div>
          <Card title="Contact HR Support">
            {ticketSent && (
              <Toast
                type="success"
                message="Support message sent to HR team!"
                onClose={() => setTicketSent(false)}
              />
            )}
            <form onSubmit={handleSendTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Account query"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Describe your request..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
