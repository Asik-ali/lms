import React from "react";

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export default function PerformanceChart({ attempt }) {
  const data = attempt || {};
  const correct = data.correct_count ?? 0;
  const wrong = data.wrong_count ?? 0;
  const skipped = data.skipped_count ?? 0;
  const total = correct + wrong + skipped;

  const segments = [
    { label: "Correct", value: correct, color: "#10b981" },
    { label: "Wrong", value: wrong, color: "#f43f5e" },
    { label: "Skipped", value: skipped, color: "#94a3b8" },
  ];

  const size = 200;
  const stroke = 28;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  let angle = 0;
  const arcs = segments
    .filter((s) => s.value > 0 && total > 0)
    .map((s) => {
      const sweep = (s.value / total) * 360;
      const seg = {
        ...s,
        d: arcPath(cx, cy, r, angle, angle + sweep),
      };
      angle += sweep;
      return seg;
    });

  const percentage =
    total > 0 ? Math.round(((correct + wrong * 0) / total) * 100) : 0;
  const score = data.score ?? 0;
  const totalMarks = data.total_marks ?? 0;

  return (
    <div className="w-full rounded-2xl border border-navy-700 bg-surface p-4 shadow-sm sm:p-6">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-navy-200">
        Performance
      </h3>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={stroke}
            />
            {arcs.map((a) => (
              <path
                key={a.label}
                d={a.d}
                fill="none"
                stroke={a.color}
                strokeWidth={stroke}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-navy-100">
              {score}
              {totalMarks > 0 && (
                <span className="text-base font-medium text-navy-300">
                  /{totalMarks}
                </span>
              )}
            </span>
            <span className="text-xs text-navy-200">
              {total > 0 ? Math.round((correct / total) * 100) : 0}% correct
            </span>
          </div>
        </div>

        <div className="w-full max-w-xs space-y-2">
          {segments.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between rounded-lg border border-navy-700 border-navy-700 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm text-navy-200">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </span>
              <span className="text-sm font-semibold text-navy-100">
                {s.value}
                <span className="ml-1 text-xs font-normal text-navy-300">
                  {total > 0 ? Math.round((s.value / total) * 100) : 0}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
