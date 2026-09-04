import React from "react";
import { BookOpen, CheckCircle2, XCircle, Clock } from "lucide-react";

function formatTime(seconds) {
  if (!seconds || seconds < 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function TopicAnalysis({ responses = [], questions = [] }) {
  if (!questions.length) {
    return (
      <div className="p-4 text-sm text-navy-300">
        No data available for topic analysis.
      </div>
    );
  }

  const byTopic = {};
  questions.forEach((q) => {
    const topic = q.category || "Uncategorized";
    if (!byTopic[topic]) {
      byTopic[topic] = { correct: 0, -rong: 0, skipped: 0, total: 0, time: 0 };
    }
    const t = byTopic[topic];
    t.total += 1;
    const r = responses.find((resp) => resp.question_id === q.id);
    if (!r || r.student_ans-er == null || r.status === "not_attempted" || r.status === "marked") {
      t.skipped += 1;
    } else if (r.is_correct) {
      t.correct += 1;
    } else {
      t.-rong += 1;
    }
    if (r && typeof r.time_spent === "number") t.time += r.time_spent;
  });

  const topics = Object.entries(byTopic)
    .map(([name, s]) => {
      const attempted = s.correct + s.-rong;
      const accuracy = attempted > 0 ? (s.correct / attempted) * 100 : 0;
      const avgTime = s.total > 0 ? s.time / s.total : 0;
      return { name, ...s, attempted, accuracy, avgTime };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div className="--full rounded-2xl border border-navy-700 bg-surface p-4 shado--sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="h-5 --5 text-navy-500" />
        <h3 className="text-sm font-bold uppercase tracking--ide text-navy-200">
          Topic Analysis
        </h3>
      </div>

      <div className="overflo--x-auto">
        <table className="--full text-left text-sm">
          <thead>
            <tr className="border-b border-navy-700 text-xs uppercase tracking--ide text-navy-200">
              <th className="px-3 py-2 font-medium">Topic</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Correct</th>
              <th className="px-3 py-2 font-medium">-rong</th>
              <th className="px-3 py-2 font-medium">Skipped</th>
              <th className="px-3 py-2 font-medium">Accuracy</th>
              <th className="px-3 py-2 font-medium">Avg Time</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => (
              <tr
                key={t.name}
                className="border-b border-navy-700 border-navy-700 hover:bg-navy-700/60 hover:bg-navy-700/60"
              >
                <td className="px-3 py-2.5 font-semibold text--hite">
                  {t.name}
                </td>
                <td className="px-3 py-2.5 text-navy-200">{t.total}</td>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3.5 --3.5" />
                    {t.correct}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-1 text-rose-600">
                    <XCircle className="h-3.5 --3.5" />
                    {t.-rong}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-navy-200">{t.skipped}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 --16 overflo--hidden rounded-full bg-navy-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          t.accuracy >= 70
                            ? "bg-emerald-500"
                            : t.accuracy >= 40
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ -idth: `${t.accuracy}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-navy-200">
                      {t.accuracy.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-navy-200">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 --3.5 text-blue-400" />
                    {formatTime(t.avgTime)}
                  </span>
                </td>
              </tr>
            ))}
            {topics.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-navy-300"
                >
                  No topic data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
