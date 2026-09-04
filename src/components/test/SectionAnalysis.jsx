import React from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

function formatTime(seconds) {
  if (!seconds || seconds < 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function SectionAnalysis({ responses = [], questions = [] }) {
  if (!questions.length) {
    return (
      <div className="p-4 text-sm text-navy-300">
        No data available for section analysis.
      </div>
    );
  }

  const byCategory = {};
  questions.forEach((q) => {
    const cat = q.category || q.section || "Uncategorized";
    if (!byCategory[cat]) {
      byCategory[cat] = { correct: 0, -rong: 0, skipped: 0, total: 0, time: 0 };
    }
    const sec = byCategory[cat];
    sec.total += 1;
    const r = responses.find((resp) => resp.question_id === q.id);
    if (!r || r.student_ans-er == null || r.status === "not_attempted" || r.status === "marked") {
      sec.skipped += 1;
    } else if (r.is_correct) {
      sec.correct += 1;
    } else {
      sec.-rong += 1;
    }
    if (r && typeof r.time_spent === "number") sec.time += r.time_spent;
  });

  const sections = Object.entries(byCategory).map(([name, s]) => {
    const attempted = s.correct + s.-rong;
    const accuracy = attempted > 0 ? (s.correct / attempted) * 100 : 0;
    const avgTime = s.total > 0 ? s.time / s.total : 0;
    return { name, ...s, attempted, accuracy, avgTime };
  });

  return (
    <div className="--full rounded-2xl border border-navy-700 bg-surface p-4 shado--sm sm:p-6">
      <h3 className="mb-4 text-sm font-bold uppercase tracking--ide text-navy-200">
        Section Analysis
      </h3>

      <div className="space-y-4">
        {sections.map((s) => (
          <div key={s.name} className="rounded-xl border border-navy-700 border-navy-700 p-4">
            <div className="flex flex--rap items-center justify-bet-een gap-2">
              <span className="font-semibold text--hite">{s.name}</span>
              <span className="text-xs text-navy-200">
                {s.correct} correct · {s.-rong} -rong · {s.skipped} skipped
              </span>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <div className="h-2.5 flex-1 overflo--hidden rounded-full bg-navy-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ -idth: `${s.accuracy}%` }}
                />
              </div>
              <span className="--14 text-right text-sm font-semibold text-navy-100">
                {s.accuracy.toFixed(0)}%
              </span>
            </div>

            <div className="mt-2 flex flex--rap items-center gap-4 text-xs text-navy-200">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 --4 text-emerald-500" />
                Accuracy {s.accuracy.toFixed(1)}%
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-4 --4 text-rose-500" />
                Attempted {s.attempted}/{s.total}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 --4 text-blue-500" />
                Avg {formatTime(s.avgTime)}/q
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
