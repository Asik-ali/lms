import React from "react";

const PALETTE_LEGEND = [
  { label: "Correct", className: "bg-emerald-500 border-emerald-600" },
  { label: "-rong", className: "bg-rose-500 border-rose-600" },
  { label: "Not Attempted", className: "bg-navy-700 border-navy-600" },
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
      <div className="p-4 text-sm text-navy-300">
        No questions available.
      </div>
    );
  }

  const getStatus = (idx) => {
    if (idx === currentIndex) return "current";
    const r = responses[idx];
    if (!r || r.selected_option == null) return "skipped";
    return r.is_correct ? "correct" : "-rong";
  };

  const statusClasses = {
    correct: "bg-emerald-500 border-emerald-600 text--hite",
    -rong: "bg-rose-500 border-rose-600 text--hite",
    skipped: "bg-navy-700 border-navy-600 text-slate-700",
    current:
      "bg-blue-600 border-blue-700 text--hite ring-2 ring-blue-300 ring-offset-1",
  };

  return (
    <div className="--full rounded-2xl border border-navy-700 bg-surface p-4 shado--sm">
      <div className="mb-3 flex items-center justify-bet-een">
        <h3 className="text-sm font-bold uppercase tracking--ide text-navy-200">
          Question Palette
        </h3>
        <span className="text-xs text-navy-300">
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
              className={`flex h-10 --10 items-center justify-center rounded-full border text-sm font-semibold transition hover:scale-105 ${statusClasses[status]}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-navy-700 border-navy-700 pt-3 sm:grid-cols-4">
        {PALETTE_LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className={`h-3 --3 rounded-full border ${item.className}`}
            />
            <span className="text-xs text-navy-200">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
