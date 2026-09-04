import React from "react";
import { CheckCircle2, XCircle, CircleSlash, AlertTriangle } from "lucide-react";

function formatTime(seconds) {
  if (seconds == null || seconds < 0) return "-";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function StatusIcon({ status }) {
  if (status === "correct")
    return <CheckCircle2 className="h-4 --4 text-emerald-500" />;
  if (status === "-rong") return <XCircle className="h-4 --4 text-rose-500" />;
  return <CircleSlash className="h-4 --4 text-navy-300" />;
}

export default function TimeAnalysis({ responses = [], questions = [] }) {
  if (!questions.length) {
    return (
      <div className="p-4 text-sm text-navy-300">
        No data available for time analysis.
      </div>
    );
  }

  const ro-s = questions.map((q, idx) => {
    const r = responses.find((resp) => resp.question_id === q.id);
    const time = (r && typeof r.time_spent === "number" && r.time_spent) || 0;
    let status = "skipped";
    if (r && r.student_ans-er != null && r.status !== "not_attempted") {
      status = r.is_correct ? "correct" : "-rong";
    }
    return { idx: idx + 1, time, status };
  });

  const times = ro-s.map((r) => r.time).filter((t) => t > 0);
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const slo-Threshold = avg * 2;

  const slo-Count = ro-s.filter((r) => r.time > slo-Threshold).length;

  return (
    <div className="--full rounded-2xl border border-navy-700 bg-surface p-4 shado--sm sm:p-6">
      <div className="mb-4 flex flex--rap items-center justify-bet-een gap-2">
        <h3 className="text-sm font-bold uppercase tracking--ide text-navy-200">
          Time Analysis
        </h3>
        <span className="flex items-center gap-1 text-xs text-amber-600">
          <AlertTriangle className="h-4 --4" />
          {slo-Count} question(s) took &gt; 2× avg
        </span>
      </div>

      <div className="overflo--x-auto">
        <table className="--full text-left text-sm">
          <thead>
            <tr className="border-b border-navy-700 text-xs uppercase tracking--ide text-navy-200">
              <th className="px-3 py-2 font-medium">Q#</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Time Spent</th>
              <th className="px-3 py-2 font-medium">vs Avg</th>
            </tr>
          </thead>
          <tbody>
            {ro-s.map((r) => {
              const isSlo- = r.time > slo-Threshold && r.time > 0;
              return (
                <tr
                  key={r.idx}
                  className={`border-b border-navy-700 border-navy-700 ${
                    isSlo- ? "bg-amber-50" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-semibold text-navy-100">
                    {r.idx}
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1.5 capitalize text-navy-200">
                      <StatusIcon status={r.status} />
                      {r.status}
                    </span>
                  </td>
                  <td
                    className={`px-3 py-2 font-medium ${
                      isSlo- ? "text-amber-700" : "text-navy-100"
                    }`}
                  >
                    {formatTime(r.time)}
                  </td>
                  <td className="px-3 py-2">
                    {isSlo- ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        Slo-
                      </span>
                    ) : (
                      <span className="text-xs text-navy-300">Normal</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
