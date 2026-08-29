import React from "react";

const PALETTE_LEGEND = [
  { label: "Correct", className: "bg-emerald-500 border-emerald-600" },
  { label: "Wrong", className: "bg-rose-500 border-rose-600" },
  { label: "Not Attempted", className: "bg-slate-300 border-slate-400" },
  { label: "Current", className: "bg-blue-600 border-blue-700 ring-2 ring-blue-300" },
];

export default function QuestionPalette({
  questions = [],
  currentIndex = 0,
  responses = {},
  onSelect,
}) {
  if (!questions.length) {
    return (
      <div className="p-4 text-sm text-slate-400 dark:text-slate-500">
        No questions available.
      </div>
    );
  }

  const getStatus = (idx) => {
    if (idx === currentIndex) return "current";
    const r = responses[idx];
    if (!r || r.selected_option == null) return "skipped";
    return r.is_correct ? "correct" : "wrong";
  };

  const statusClasses = {
    correct: "bg-emerald-500 border-emerald-600 text-white",
    wrong: "bg-rose-500 border-rose-600 text-white",
    skipped: "bg-slate-300 border-slate-400 text-slate-700",
    current:
      "bg-blue-600 border-blue-700 text-white ring-2 ring-blue-300 ring-offset-1",
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          Question Palette
        </h3>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {questions.length} Qs
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {questions.map((_, idx) => {
          const status = getStatus(idx);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect && onSelect(idx)}
              aria-label={`Go to question ${idx + 1} (${status})`}
              className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition hover:scale-105 ${statusClasses[status]}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-gray-800 pt-3 sm:grid-cols-4">
        {PALETTE_LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full border ${item.className}`}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
