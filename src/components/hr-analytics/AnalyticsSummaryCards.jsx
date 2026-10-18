import React from "react";
import {
  BrainCircuit,
  Sparkles,
} from "lucide-react";

export const AnalyticsSummaryCards = ({ overview, mlStatus, onTriggerTraining, isTraining }) => {
  return (
    <div>
      {/* Model Status & ML Governance Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Machine Learning Status:</h4>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                mlStatus?.status === "TRAINED"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}>
                {mlStatus?.status || "NEEDS_LABELED_DATA"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              {mlStatus?.status === "TRAINED" && mlStatus?.evaluationMetrics ? (
                <span>
                  Trained on benchmark dataset ({mlStatus.datasetSize} records). Accuracy:{" "}
                  <strong className="text-emerald-400">{(mlStatus.evaluationMetrics.accuracy * 100).toFixed(1)}%</strong> | ROC-AUC:{" "}
                  <strong className="text-indigo-300">{mlStatus.evaluationMetrics.rocAuc ? (mlStatus.evaluationMetrics.rocAuc * 100).toFixed(1) + "%" : "N/A"}</strong> | F1-Score:{" "}
                  <strong className="text-indigo-300">{(mlStatus.evaluationMetrics.f1Score * 100).toFixed(1)}%</strong>
                </span>
              ) : (
                mlStatus?.message ||
                "Supervised attrition classification requires historical employee records with verified exit outcomes ('attrition: true/false')."
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onTriggerTraining}
          disabled={isTraining}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-2 flex-shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{isTraining ? "Checking Dataset..." : "Run ML Pipeline Check"}</span>
        </button>
      </div>
    </div>
  );
};

