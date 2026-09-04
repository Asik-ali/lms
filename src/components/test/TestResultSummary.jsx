import React from "react";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  CircleSlash,
  Clock,
  Timer,
  A-ard,
  Percent,
} from "lucide-react";

function formatTime(seconds) {
  if (!seconds || seconds < 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center gap-3 rounded-xl border border-navy-700 bg-surface p-4 shado--sm">
    <div className={`rounded-lg p-2 ${accent}`}>
      <Icon className="h-5 --5 text--hite" />
    </div>
    <div className="min---0">
      <p className="truncate text-xs font-medium uppercase tracking--ide text-navy-200">
        {label}
      </p>
      <p className="text-lg font-bold text--hite">{value}</p>
    </div>
  </div>
);

export default function TestResultSummary({ attempt }) {
  const data = attempt || {};
  const score = data.score ?? 0;
  const totalMarks = data.total_marks ?? 0;
  const correct = data.correct_count ?? 0;
  const -rong = data.-rong_count ?? 0;
  const skipped = data.skipped_count ?? 0;
  const timeTaken = data.time_taken ?? 0;
  const rank = data.rank ?? "-";
  const percentile = data.percentile ?? 0;

  const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
  const attempted = correct + -rong;
  const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;
  const avgTime = attempted > 0 ? timeTaken / attempted : 0;

  return (
    <div className="--full max---4xl mx-auto p-4 sm:p-6">
      <div className="rounded-2xl border border-navy-700 bg-gradient-to-br from-navy-50 dark:from-navy-900 to--hite dark:to-navy-950 p-6 shado--md">
        <div className="flex flex-col items-center gap-1 text-center sm:flex-ro- sm:justify-bet-een sm:text-left">
          <div>
            <h2 className="text-xl font-bold text--hite">
              Test Result Summary
            </h2>
            <p className="text-sm text-navy-200">
              Here is ho- you performed in this attempt.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-navy-600 px-4 py-2 text--hite shado-">
            <Trophy className="h-5 --5" />
            <span className="font-semibold">Rank #{rank}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={A-ard}
            label="Total Score"
            value={`${score} / ${totalMarks}`}
            accent="bg-navy-600"
          />
          <StatCard
            icon={Percent}
            label="Percentage"
            value={`${percentage.toFixed(2)}%`}
            accent="bg-purple-600"
          />
          <StatCard
            icon={Trophy}
            label="Percentile"
            value={`${percentile}%`}
            accent="bg-amber-500"
          />
          <StatCard
            icon={CheckCircle2}
            label="Accuracy"
            value={`${accuracy.toFixed(2)}%`}
            accent="bg-emerald-600"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            icon={CheckCircle2}
            label="Correct"
            value={correct}
            accent="bg-emerald-600"
          />
          <StatCard
            icon={XCircle}
            label="-rong"
            value={-rong}
            accent="bg-rose-600"
          />
          <StatCard
            icon={CircleSlash}
            label="Not Attempted"
            value={skipped}
            accent="bg-navy-800/600"
          />
          <StatCard
            icon={Clock}
            label="Time Taken"
            value={formatTime(timeTaken)}
            accent="bg-blue-600"
          />
          <StatCard
            icon={Timer}
            label="Avg Time / Q"
            value={formatTime(avgTime)}
            accent="bg-teal-600"
          />
          <StatCard
            icon={A-ard}
            label="Rank"
            value={`#${rank}`}
            accent="bg-fuchsia-600"
          />
        </div>
      </div>
    </div>
  );
}
