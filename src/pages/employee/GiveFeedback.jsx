import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/common/Card";
import { RatingStars } from "../../components/common/RatingStars";
import { Toast } from "../../components/common/Toast";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  MessageSquarePlus,
  CheckCircle2,
  Send,
  ShieldCheck,
} from "lucide-react";

export const GiveFeedback = () => {
  const { user } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [feedbacks, setFeedbacks] = useState({
    jobSatisfaction: 0,
    workEnvironment: 0,
    workLifeBalance: 0,
    growth: 0,
    manager: "",
    likedMost: "",
    improvement: "",
    comments: "",
  });

  useEffect(() => {
    const checkSubmission = async () => {
      try {
        const response = await api.get("/predict/status");
        if (response.data.submitted) {
          setSubmittedMessage(response.data.message || "You have already submitted your feedback 😇");
        }
      } catch (err) {
        console.error("Error checking submission status:", err);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkSubmission();
  }, []);

  const handleRatingChange = (field, value) => {
    setFeedbacks((prev) => ({ ...prev, [field]: value }));
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFeedbacks((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToastMessage(null);

    // Basic frontend validation
    if (!feedbacks.jobSatisfaction || !feedbacks.workEnvironment || !feedbacks.workLifeBalance || !feedbacks.growth) {
      setToastMessage({ type: "error", text: "Please provide a rating (1-5) for all four workplace categories." });
      return;
    }

    if (!feedbacks.manager) {
      setToastMessage({ type: "error", text: "Please select an option for how you feel about your manager and team." });
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/predict", {
        feedbacks: feedbacks,
      });

      setSubmittedMessage(response.data.message || "Feedback Submitted Successfully 😇");
    } catch (err) {
      console.error("Submission error:", err);
      setToastMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to submit feedback. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingStatus) {
    return <LoadingSpinner label="Checking submission status..." />;
  }

  if (submittedMessage) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="text-center p-8 sm:p-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-200 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {submittedMessage}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Thank you, <strong>{user?.fullName?.split(" ")[0]}</strong>, for sharing your workplace insights! Your response has been securely recorded and helps create a better environment for everyone.
          </p>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600">
            <ShieldCheck className="w-4 h-4" />
            <span>Confidential & Secure Feedback Process</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white flex-shrink-0">
            <MessageSquarePlus className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Employee Sentiment Survey
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-indigo-100/90 leading-relaxed max-w-2xl">
              Please answer the ratings and open feedback questions below. Your honest evaluation directly influences workplace improvements and culture.
            </p>
          </div>
        </div>
      </div>

      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Workplace Rating Cards */}
        <Card title="1. Workplace Category Ratings" subtitle="Rate each aspect on a scale of 1 to 5 stars">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
              <label className="block font-bold text-xs text-slate-800 mb-1">
                Job Satisfaction
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                How satisfied are you with your daily responsibilities?
              </p>
              <RatingStars
                value={feedbacks.jobSatisfaction}
                onChange={(val) => handleRatingChange("jobSatisfaction", val)}
              />
            </div>

            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
              <label className="block font-bold text-xs text-slate-800 mb-1">
                Work Environment
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                How would you rate your workplace culture & atmosphere?
              </p>
              <RatingStars
                value={feedbacks.workEnvironment}
                onChange={(val) => handleRatingChange("workEnvironment", val)}
              />
            </div>

            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
              <label className="block font-bold text-xs text-slate-800 mb-1">
                Work-Life Balance
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                How well can you manage personal time alongside work?
              </p>
              <RatingStars
                value={feedbacks.workLifeBalance}
                onChange={(val) => handleRatingChange("workLifeBalance", val)}
              />
            </div>

            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
              <label className="block font-bold text-xs text-slate-800 mb-1">
                Growth Opportunities
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                Are you satisfied with your learning & career path?
              </p>
              <RatingStars
                value={feedbacks.growth}
                onChange={(val) => handleRatingChange("growth", val)}
              />
            </div>
          </div>
        </Card>

        {/* Step 2: Manager Sentiment */}
        <Card title="2. Leadership & Team Dynamics" subtitle="Evaluation of management support">
          <div>
            <label className="block font-bold text-xs text-slate-800 mb-2">
              How do you feel about your manager and team support? <span className="text-rose-500">*</span>
            </label>
            <select
              name="manager"
              value={feedbacks.manager}
              onChange={handleTextChange}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
            >
              <option value="">Select an option...</option>
              <option value="Very Satisfied">Very Satisfied</option>
              <option value="Satisfied">Satisfied</option>
              <option value="Neutral">Neutral</option>
              <option value="Unsatisfied">Unsatisfied</option>
              <option value="Very Unsatisfied">Very Unsatisfied</option>
            </select>
          </div>
        </Card>

        {/* Step 3: Written Open Responses */}
        <Card title="3. Qualitative Insights" subtitle="Tell us in your own words (optional but helpful)">
          <div className="space-y-4">
            <div>
              <label className="block font-bold text-xs text-slate-800 mb-1.5">
                What do you like most about working here?
              </label>
              <textarea
                name="likedMost"
                rows="3"
                value={feedbacks.likedMost}
                onChange={handleTextChange}
                placeholder="Share positive workplace aspects..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all resize-none"
              />
            </div>

            <div>
              <label className="block font-bold text-xs text-slate-800 mb-1.5">
                What areas could be improved?
              </label>
              <textarea
                name="improvement"
                rows="3"
                value={feedbacks.improvement}
                onChange={handleTextChange}
                placeholder="Share constructive suggestions or concerns..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all resize-none"
              />
            </div>

            <div>
              <label className="block font-bold text-xs text-slate-800 mb-1.5">
                Additional Comments
              </label>
              <textarea
                name="comments"
                rows="3"
                value={feedbacks.comments}
                onChange={handleTextChange}
                placeholder="Any other thoughts you wish to mention..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/25 transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span className="animate-pulse">Submitting Feedback...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Confidential Feedback</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
