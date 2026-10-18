import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Activity,
  Layers,
  Users,
  Calendar,
  SlidersHorizontal,
} from "lucide-react";

export const FeedbackCharts = ({ overview, employees = [] }) => {
  // Chart selection and filter states
  const [selectedPieDimension, setSelectedPieDimension] = useState("jobSatisfaction");
  const [selectedLineMetric, setSelectedLineMetric] = useState("all");
  const [selectedCompMetric, setSelectedCompMetric] = useState("overall");

  const averages = overview?.averages || {
    jobSatisfaction: 0,
    workEnvironment: 0,
    workLifeBalance: 0,
    growth: 0,
    overall: 0,
  };

  const distributions = overview?.distributions || {};
  const timelineTrends = overview?.timelineTrends || [];

  // Dimension details
  const dimensionMeta = {
    jobSatisfaction: { label: "Job Satisfaction", color: "text-indigo-600", bg: "bg-indigo-500", stroke: "#6366f1" },
    workEnvironment: { label: "Work Environment", color: "text-emerald-600", bg: "bg-emerald-500", stroke: "#10b981" },
    workLifeBalance: { label: "Work-Life Balance", color: "text-amber-600", bg: "bg-amber-500", stroke: "#f59e0b" },
    growth: { label: "Career Growth", color: "text-purple-600", bg: "bg-purple-500", stroke: "#a855f7" },
  };

  const dimensionList = [
    { key: "jobSatisfaction", label: "Job Satisfaction", score: averages.jobSatisfaction, ...dimensionMeta.jobSatisfaction },
    { key: "workEnvironment", label: "Work Environment", score: averages.workEnvironment, ...dimensionMeta.workEnvironment },
    { key: "workLifeBalance", label: "Work-Life Balance", score: averages.workLifeBalance, ...dimensionMeta.workLifeBalance },
    { key: "growth", label: "Career Growth", score: averages.growth, ...dimensionMeta.growth },
  ];

  // Helper for distribution bars
  const renderDistributionBars = (dist) => {
    const total = Object.values(dist || {}).reduce((a, b) => a + b, 0) || 1;
    return (
      <div className="space-y-2 mt-3">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = dist?.[rating] || 0;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={rating} className="flex items-center gap-3 text-xs">
              <span className="w-14 text-slate-500 font-medium">★ {rating} Star</span>
              <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    rating >= 4 ? "bg-emerald-500" : rating === 3 ? "bg-amber-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-12 text-right font-semibold text-slate-700">
                {count} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Pie/Donut SVG calculation
  const currentDonutDist = distributions[selectedPieDimension] || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const totalDonutCount = Object.values(currentDonutDist).reduce((a, b) => a + b, 0) || 1;
  const ratingColors = {
    5: "#10b981", // emerald
    4: "#34d399", // light emerald
    3: "#f59e0b", // amber
    2: "#f97316", // orange
    1: "#ef4444", // rose
  };

  // Build SVG Donut slices
  let cumulativePercent = 0;
  const donutSegments = [5, 4, 3, 2, 1].map((star) => {
    const count = currentDonutDist[star] || 0;
    const pct = count / totalDonutCount;
    const startAngle = cumulativePercent * 360;
    cumulativePercent += pct;
    const endAngle = cumulativePercent * 360;
    return { star, count, pct: Math.round(pct * 100), startAngle, endAngle, color: ratingColors[star] };
  });

  // Submitted employees for horizontal comparison
  const submittedEmployees = employees
    .filter((e) => e.submitted && e.avgScore)
    .sort((a, b) => Number(b.avgScore) - Number(a.avgScore));

  return (
    <div className="space-y-6">
      {/* SECTION 1: Time Series & Volumetric Charts (A & D) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A. LINE GRAPH: Satisfaction Over Time */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Average Satisfaction Over Time</h3>
                  <p className="text-[11px] text-slate-500">Actual feedback timestamps from MongoDB</p>
                </div>
              </div>

              {/* Metric Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
                <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                <select
                  value={selectedLineMetric}
                  onChange={(e) => setSelectedLineMetric(e.target.value)}
                  className="bg-transparent font-medium focus:outline-none cursor-pointer text-slate-700"
                >
                  <option value="all">Overall Trend</option>
                  <option value="jobSatisfaction">Job Satisfaction</option>
                  <option value="workEnvironment">Work Environment</option>
                  <option value="workLifeBalance">Work-Life Balance</option>
                  <option value="growth">Career Growth</option>
                </select>
              </div>
            </div>

            {/* Line Graph Visualization */}
            {timelineTrends.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No timestamped survey submissions recorded yet.
              </div>
            ) : timelineTrends.length === 1 ? (
              <div className="py-8 text-center text-slate-500 text-xs bg-slate-50/50 rounded-xl mt-4 p-4 border border-slate-100">
                <Calendar className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Single Observation Date Recorded</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Submission on {timelineTrends[0].date}: Combined average rating ★ {timelineTrends[0].avgOverall} / 5.0 ({timelineTrends[0].count} responses). Multiple survey dates will show continuous trajectory.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {/* SVG Line Graph */}
                <div className="h-44 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                    {/* Y-axis guidelines */}
                    <line x1="0" y1="10" x2="400" y2="10" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="0" y1="60" x2="400" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="0" y1="110" x2="400" y2="110" stroke="#e2e8f0" strokeWidth="1" />

                    {/* Plot coordinates */}
                    {(() => {
                      const points = timelineTrends.map((t, idx) => {
                        const x = (idx / (timelineTrends.length - 1)) * 380 + 10;
                        let val = t.avgOverall;
                        if (selectedLineMetric === "jobSatisfaction") val = t.avgJobSatisfaction;
                        if (selectedLineMetric === "workEnvironment") val = t.avgWorkEnvironment;
                        if (selectedLineMetric === "workLifeBalance") val = t.avgWorkLifeBalance;
                        if (selectedLineMetric === "growth") val = t.avgGrowth;
                        const y = 110 - ((val || 0) / 5.0) * 100;
                        return { x, y, val, date: t.date };
                      });

                      const pathStr = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

                      return (
                        <>
                          <path d={pathStr} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          {points.map((p, i) => (
                            <g key={i}>
                              <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#6366f1" strokeWidth="2.5" />
                              <text x={p.x} y={p.y - 8} fontSize="9" fontWeight="bold" fill="#4338ca" textAnchor="middle">
                                {p.val}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* X-axis date labels */}
                <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
                  {timelineTrends.map((t) => (
                    <span key={t.date}>{t.date}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* D. AREA CHART: Submission Volume & Activity */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Feedback Submission Volume</h3>
                  <p className="text-[11px] text-slate-500">Distribution of survey completions across submission dates</p>
                </div>
              </div>
            </div>

            {timelineTrends.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No submission timeline data recorded.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {/* SVG Area chart */}
                <div className="h-44 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>

                    {(() => {
                      const maxCount = Math.max(...timelineTrends.map((t) => t.count), 1);
                      const points = timelineTrends.map((t, idx) => {
                        const x = timelineTrends.length === 1 ? 200 : (idx / (timelineTrends.length - 1)) * 380 + 10;
                        const y = 110 - (t.count / maxCount) * 90;
                        return { x, y, count: t.count, date: t.date };
                      });

                      const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                      const areaPath = `${linePath} L ${points[points.length - 1].x} 110 L ${points[0].x} 110 Z`;

                      return (
                        <>
                          <path d={areaPath} fill="url(#areaGradient)" />
                          <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                          {points.map((p, i) => (
                            <g key={i}>
                              <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
                              <text x={p.x} y={p.y - 8} fontSize="9" fontWeight="bold" fill="#065f46" textAnchor="middle">
                                {p.count} surveys
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
                  {timelineTrends.map((t) => (
                    <span key={t.date}>{t.date}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Dimensions & Distribution Formats (B & C) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* B. BAR CHART: Workplace Dimensions Comparison */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Workplace Dimensions (0–5 Scale)</h3>
                <p className="text-[11px] text-slate-500">Average dimension ratings calculated from database</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-5">
            {dimensionList.map((dim) => {
              const pct = Math.round((dim.score / 5.0) * 100);
              return (
                <div key={dim.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{dim.label}</span>
                    <span className={dim.color}>{dim.score} / 5.0 ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${dim.bg}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* C. DONUT / PIE CHART: Rating Distribution Breakdown */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rating Distribution (Donut View)</h3>
                <p className="text-[11px] text-slate-500">Breakdown of 1-5 star ratings by dimension</p>
              </div>
            </div>

            {/* Dimension Selector */}
            <select
              value={selectedPieDimension}
              onChange={(e) => setSelectedPieDimension(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="jobSatisfaction">Job Satisfaction</option>
              <option value="workEnvironment">Work Environment</option>
              <option value="workLifeBalance">Work-Life Balance</option>
              <option value="growth">Career Growth</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center mt-5">
            {/* Donut Legend */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = currentDonutDist[star] || 0;
                const pct = Math.round((count / totalDonutCount) * 100);
                return (
                  <div key={star} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ratingColors[star] }} />
                      <span className="text-slate-600 font-medium">★ {star} Stars</span>
                    </div>
                    <span className="font-semibold text-slate-800">
                      {count} <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* SVG Donut */}
            <div className="flex justify-center">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background track */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3.8" />
                  {/* Donut segment strokes */}
                  {(() => {
                    let strokeDashOffset = 0;
                    return donutSegments.map((seg) => {
                      const strokeDasharray = `${seg.pct} ${100 - seg.pct}`;
                      const currentOffset = strokeDashOffset;
                      strokeDashOffset -= seg.pct;
                      if (seg.pct === 0) return null;
                      return (
                        <circle
                          key={seg.star}
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="3.8"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={currentOffset}
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-slate-900">{totalDonutCount}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Responses</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Comparative Stacked Bar & Employee Horizontal Comparison (E & F) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* F. STACKED BAR CHART: Star Distribution Comparison Across All Dimensions */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Stacked Rating Distribution Across Dimensions</h3>
                <p className="text-[11px] text-slate-500">Proportions of 1-star through 5-star responses</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-5">
            {dimensionList.map((dim) => {
              const dist = distributions[dim.key] || {};
              const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
              return (
                <div key={dim.key} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{dim.label}</span>
                    <span className="text-slate-400 font-mono text-[11px]">Total: {total}</span>
                  </div>
                  {/* Stacked segmented bar */}
                  <div className="w-full bg-slate-100 h-4 rounded-lg overflow-hidden flex">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = dist[star] || 0;
                      const pct = (count / total) * 100;
                      if (pct === 0) return null;
                      return (
                        <div
                          key={star}
                          style={{ width: `${pct}%`, backgroundColor: ratingColors[star] }}
                          title={`★ ${star} Stars: ${count} (${Math.round(pct)}%)`}
                          className="h-full border-r border-white/40 last:border-none"
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-slate-100 text-[11px]">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: ratingColors[star] }} />
                  <span className="text-slate-600">★ {star} Stars</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* E. HORIZONTAL EMPLOYEE COMPARISON CHART */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Horizontal Employee Score Comparison</h3>
                <p className="text-[11px] text-slate-500">Authorized survey score ranking per employee</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-4 max-h-72 overflow-y-auto pr-1">
            {submittedEmployees.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No employee ratings available.</p>
            ) : (
              submittedEmployees.map((emp) => {
                const score = Number(emp.avgScore);
                const pct = Math.round((score / 5.0) * 100);
                return (
                  <div key={emp._id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 truncate max-w-xs">{emp.fullName} ({emp.employeeCode})</span>
                      <span className={score >= 3.5 ? "text-emerald-600" : score >= 2.5 ? "text-amber-600" : "text-rose-600"}>
                        ★ {score} / 5.0
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          score >= 3.5 ? "bg-emerald-500" : score >= 2.5 ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
