import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import { getAttempt, getResponses, reportQuestion } from '../../data/dynamicStore';
import { showSuccess, showError } from '../../components/common/Toast';
import {
  BarChart3,
  FileText,
  Layers,
  Tag,
  Clock,
  ArrowLeft,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  CircleSlash,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Shield,
  Loader2,
  AlertTriangle,
  BookOpen,
  Target,
  Award,
  Info,
  X,
} from 'lucide-react';
import TestResultSummary from '../../components/test/TestResultSummary';
import QuestionPalette from '../../components/test/QuestionPalette';
import SectionAnalysis from '../../components/test/SectionAnalysis';
import TopicAnalysis from '../../components/test/TopicAnalysis';
import TimeAnalysis from '../../components/test/TimeAnalysis';
import PerformanceChart from '../../components/test/PerformanceChart';

function formatTime(seconds) {
  if (!seconds || seconds < 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function buildAutoExplanation(q) {
  if (!q) return '';
  const letter = String(q.correct_answer || '').trim().toUpperCase();
  const optionText = letter ? q[`option_${letter.toLowerCase()}`] : '';
  const lead = letter && optionText
    ? `The correct answer is ${letter} — ${optionText}.`
    : letter
      ? `The correct answer is ${letter}.`
      : `No correct answer has been set for this question.`;
  const questionText = q.question && !q.question.startsWith('http') ? ` The question was: ${q.question}` : '';
  return `${lead}${questionText}`;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'solutions', label: 'Solutions', icon: FileText },
  { id: 'section', label: 'Section Analysis', icon: Layers },
  { id: 'topic', label: 'Topic Analysis', icon: Tag },
  { id: 'time', label: 'Time Analysis', icon: Clock },
];

const REPORT_REASONS = [
  'Wrong Question',
  'Wrong Answer',
  'Wrong Explanation',
  'Question is Unclear',
  'Typing/Translation Error',
  'Duplicate Question',
  'Other',
];

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

const DIFFICULTY_COLORS = {
  Easy: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Medium: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
  Hard: 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

export default function StudentTestResult() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [rank, setRank] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [percentile, setPercentile] = useState('100');
  const [showRank, setShowRank] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const [expandedExplanation, setExpandedExplanation] = useState({});
  const [reportModal, setReportModal] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    loadResult();
  }, [attemptId]);

  async function loadResult() {
    try {
      setLoading(true);
      setError(null);

      const attemptData = await getAttempt(attemptId);
      if (!attemptData) {
        setError('Attempt not found.');
        return;
      }
      if (attemptData.status !== 'completed') {
        setError('This test has not been submitted yet.');
        return;
      }

      const { data: testData } = await supabase
        .from('tests')
        .select('*')
        .eq('id', attemptData.test_id)
        .single();

      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', attemptData.test_id);

      const responsesData = await getResponses(attemptId);

      // Determine if this is the student's first completed attempt for this test
      const { count: earlierAttempts } = await supabase
        .from('test_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('test_id', attemptData.test_id)
        .eq('student_id', attemptData.student_id)
        .eq('status', 'completed')
        .lt('started_at', attemptData.started_at);
      const isFirstAttempt = (earlierAttempts || 0) === 0;

      const { data: allCompleted } = await supabase
        .from('test_attempts')
        .select('student_id, started_at')
        .eq('test_id', attemptData.test_id)
        .eq('status', 'completed');
      const participants = new Set((allCompleted || []).map(a => a.student_id)).size;

      let shownRank;
      let shownPercentile;
      const canShowRank = isFirstAttempt;
      if (attemptData.rank != null) {
        shownRank = attemptData.rank;
        shownPercentile = attemptData.percentile != null ? attemptData.percentile : '100';
      } else if (canShowRank) {
        const { count: total } = await supabase
          .from('test_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('test_id', attemptData.test_id)
          .eq('status', 'completed');
        const { count: better } = await supabase
          .from('test_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('test_id', attemptData.test_id)
          .eq('status', 'completed')
          .gt('score', attemptData.score);
        shownRank = (better || 0) + 1;
        shownPercentile = total > 0 ? ((total - shownRank) / total * 100).toFixed(1) : '100';
      }

      setAttempt(attemptData);
      setTest(testData);
      setQuestions(questionsData || []);
      setResponses(responsesData || []);
      setRank(shownRank ?? 0);
      setTotalAttempts(participants);
      setPercentile(shownPercentile ?? '—');
      setShowRank(canShowRank && shownRank != null);
    } catch (err) {
      console.error(err);
      showError('Failed to load test result.');
      setError('Failed to load test result.');
    } finally {
      setLoading(false);
    }
  }

  function getResponseForQuestion(qIdx) {
    const q = questions[qIdx];
    if (!q) return null;
    return responses.find((r) => r.question_id === q.id) || null;
  }

  function getQuestionStatus(qIdx) {
    const r = getResponseForQuestion(qIdx);
    if (!r || r.status === 'not_attempted' || r.status === 'marked' || !r.student_answer) {
      return 'skipped';
    }
    return r.is_correct ? 'correct' : 'wrong';
  }

  async function handleReportSubmit() {
    if (!reportReason) {
      showError('Please select a reason.');
      return;
    }
    try {
      setSubmittingReport(true);
      await reportQuestion({
        question_id: reportModal.id,
        student_id: user.id,
        reason: reportReason,
        description: reportDesc,
      });
      showSuccess('Report submitted successfully. Thank you!');
      setReportModal(null);
      setReportReason('');
      setReportDesc('');
    } catch (err) {
      console.error(err);
      showError('Failed to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  }

  function getMarksForQuestion(qIdx) {
    if (!attempt) return 0;
    const totalQ = questions.length || 1;
    const marksPerQ = Math.floor((attempt.total_marks || 0) / totalQ);
    const status = getQuestionStatus(qIdx);
    return status === 'correct' ? marksPerQ : 0;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-navy-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading your results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-500/10 p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-rose-500" />
          <p className="text-lg font-semibold text-rose-700 dark:text-rose-300">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const marksPerQ = questions.length
    ? Math.floor((attempt?.total_marks || 0) / questions.length)
    : 1;

  const paletteResponses = {};
  questions.forEach((q, idx) => {
    const r = getResponseForQuestion(idx);
    paletteResponses[idx] = {
      selected_option: r?.student_answer || null,
      is_correct: r?.is_correct ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="mb-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-navy-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 sm:text-2xl">
            {test?.name || 'Test Result'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {test?.category && `${test.category} · `}
            Submitted {attempt?.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/student/test-series`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Test Series</span>
          </Link>
          <Link
            to={`/student/test/${attempt?.test_id}`}
            className="flex items-center gap-1.5 rounded-lg bg-navy-600 px-3 py-2 text-sm font-medium text-white hover:bg-navy-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Retake Test</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 shadow-sm">
        <nav className="flex">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'border-navy-600 text-navy-600 bg-navy-50/50 dark:bg-navy-500/10'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <TestResultSummary
            attempt={showRank ? { ...attempt, rank, percentile } : { ...attempt, rank: null, percentile: null }}
          />

          {/* Ranking Card */}
          <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-navy-50 via-white to-navy-100 p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-navy-600" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Your Ranking
              </h3>
            </div>
            {showRank ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="flex flex-col items-center rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
                <span className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Score</span>
                <span className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {attempt?.score ?? 0}
                  <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                    /{attempt?.total_marks ?? 0}
                  </span>
                </span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-navy-100 bg-navy-50 dark:bg-navy-500/10 p-4 shadow-sm">
                <span className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  All India Rank
                </span>
                <span className="mt-1 text-2xl font-bold text-navy-700 dark:text-navy-300">
                  #{rank}
                  <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                    {' '}/ {totalAttempts}
                  </span>
                </span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-amber-100 bg-amber-50 dark:bg-amber-500/10 p-4 shadow-sm">
                <span className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Percentile</span>
                <span className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {percentile}%
                </span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-emerald-100 bg-emerald-50 dark:bg-emerald-500/10 p-4 shadow-sm">
                <span className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Better Than
                </span>
                <span className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {percentile}%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">of students</span>
              </div>
            </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 p-6 text-center">
                <Award className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Rank is only calculated on your first attempt.
                </p>
              </div>
            )}
          </div>

          <PerformanceChart attempt={attempt} />
        </div>
      )}

      {/* Tab: Solutions */}
      {activeTab === 'solutions' && (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Palette Toggle (Mobile) */}
          <button
            onClick={() => setPaletteOpen(!paletteOpen)}
            className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm lg:hidden"
          >
            <span className="flex items-center gap-2">
              <Target className="h-4 w-4 text-navy-500" />
              Question Palette ({questions.length} questions)
            </span>
            {paletteOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* Palette (Desktop: sticky sidebar) */}
          <div
            className={`w-full shrink-0 lg:sticky lg:top-6 lg:block lg:w-64 lg:self-start ${
              paletteOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            <QuestionPalette
              questions={questions}
              currentIndex={currentQIndex}
              responses={paletteResponses}
              onSelect={(idx) => {
                setCurrentQIndex(idx);
                setPaletteOpen(false);
                const el = document.getElementById(`question-${idx}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            />
          </div>

          {/* Questions List */}
          <div className="flex-1 space-y-6">
            {questions.map((q, idx) => {
              const status = getQuestionStatus(idx);
              const r = getResponseForQuestion(idx);
              const marks = getMarksForQuestion(idx);
              const isExpanded = expandedExplanation[q.id];

              const statusConfig = {
                correct: {
                  label: 'Correct',
                  icon: CheckCircle2,
                  color: 'text-emerald-600 dark:text-emerald-400',
                  bg: 'bg-emerald-50 dark:bg-emerald-500/10',
                  border: 'border-emerald-200',
                  strip: 'bg-emerald-500',
                },
                wrong: {
                  label: 'Wrong',
                  icon: XCircle,
                  color: 'text-rose-600 dark:text-rose-400',
                  bg: 'bg-rose-50 dark:bg-rose-500/10',
                  border: 'border-rose-200',
                  strip: 'bg-rose-500',
                },
                skipped: {
                  label: 'Not Attempted',
                  icon: CircleSlash,
                  color: 'text-slate-500 dark:text-slate-400',
                  bg: 'bg-slate-50 dark:bg-slate-800/60',
                  border: 'border-slate-200 dark:border-slate-800',
                  strip: 'bg-slate-400',
                },
              };
              const sc = statusConfig[status];
              const StatusIcon = sc.icon;

              const isUrl =
                q.question &&
                (q.question.startsWith('http://') ||
                  q.question.startsWith('https://'));

              return (
                <div
                  key={q.id}
                  id={`question-${idx}`}
                  className={`scroll-mt-24 overflow-hidden rounded-2xl border ${sc.border} bg-white dark:bg-gray-900 shadow-sm`}
                >
                  {/* Status Strip */}
                  <div className={`h-1.5 ${sc.strip}`} />

                  {/* Header */}
                  <div className={`flex flex-wrap items-center gap-2 border-b ${sc.border} ${sc.bg} px-4 py-3`}>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Q{idx + 1}
                    </span>
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {sc.label}
                    </span>
                    <span className="rounded-full bg-navy-100 dark:bg-navy-500/15 px-2 py-0.5 text-xs font-semibold text-navy-700 dark:text-navy-300">
                      +{marks} mark{marks !== 1 ? 's' : ''}
                    </span>
                    {r?.time_spent > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-300">
                        <Clock className="h-3 w-3" />
                        {formatTime(r.time_spent)}
                      </span>
                    )}
                    {q.difficulty && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          DIFFICULTY_COLORS[q.difficulty] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    )}
                    {q.category && (
                      <span className="rounded-full bg-purple-100 dark:bg-purple-500/15 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
                        {q.category}
                      </span>
                    )}
                    <button
                      onClick={() => setReportModal(q)}
                      className="ml-auto flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-rose-300 hover:text-rose-600 transition"
                    >
                      <Flag className="h-3 w-3" />
                      Report
                    </button>
                  </div>

                  {/* Question Content */}
                  <div className="px-4 py-4 space-y-4">
                    {/* Question Link */}
                    {isUrl && (
                      <a
                        href={q.question}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-navy-50 dark:bg-navy-500/10 px-3 py-2 text-sm font-medium text-navy-700 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-500/15 transition"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Question
                      </a>
                    )}

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {OPTION_LETTERS.map((letter) => {
                        const isStudentAnswer =
                          r?.student_answer?.toUpperCase() === letter;
                        const isCorrectAnswer =
                          status === 'correct' && isStudentAnswer;

                        let optionClasses =
                          'border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 text-slate-700 dark:text-slate-300';

                        if (status === 'correct' && isStudentAnswer) {
                          optionClasses =
                            'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-200';
                        } else if (status === 'wrong' && isStudentAnswer) {
                          optionClasses =
                            'border-rose-400 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300 ring-1 ring-rose-200';
                        } else if (
                          status === 'correct' &&
                          !isStudentAnswer
                        ) {
                          // don't highlight non-selected on correct
                        }

                        return (
                          <div
                            key={letter}
                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${optionClasses}`}
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current text-sm font-bold">
                              {letter}
                            </span>
                            <span className="flex-1 text-sm">
                              {q?.[`option_${letter.toLowerCase()}`] || `Option ${letter}`}
                            </span>
                            {isStudentAnswer && status === 'correct' && (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            )}
                            {isStudentAnswer && status === 'wrong' && (
                              <XCircle className="h-5 w-5 text-rose-500" />
                            )}
                            {isStudentAnswer && status === 'skipped' && (
                              <CircleSlash className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {status === 'skipped' && (
                      <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                        <Info className="h-4 w-4" />
                        You did not attempt this question.
                      </p>
                    )}

                    {/* Explanation Toggle */}
                    <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <button
                        onClick={() =>
                          setExpandedExplanation((prev) => ({
                            ...prev,
                            [q.id]: !prev[q.id],
                          }))
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        View Explanation
                      </button>

                      <div className="ml-auto flex items-center gap-1">
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Helpful?
                        </span>
                        <button className="rounded-lg border border-slate-200 dark:border-slate-800 p-1.5 text-slate-400 dark:text-slate-500 hover:border-emerald-300 hover:text-emerald-500 transition">
                          <ThumbsUp className="h-4 w-4" />
                        </button>
                        <button className="rounded-lg border border-slate-200 dark:border-slate-800 p-1.5 text-slate-400 dark:text-slate-500 hover:border-rose-300 hover:text-rose-500 transition">
                          <ThumbsDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Explanation Content */}
                    {isExpanded && (
                      <div className="rounded-xl border border-navy-100 bg-navy-50/50 dark:bg-navy-500/10 p-4 space-y-2">
                        {status === 'correct' && (
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="h-4 w-4" />
                            Correct Answer: {r?.student_answer || '—'}
                          </p>
                        )}
                        {status === 'skipped' && (
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
                            <Info className="h-4 w-4" />
                            This question was not attempted.
                          </p>
                        )}
                        {status === 'wrong' && (
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-rose-600 dark:text-rose-400">
                            <XCircle className="h-4 w-4" />
                            Your Answer: {r?.student_answer || '—'} &nbsp;•&nbsp; Correct Answer: {q.correct_answer || '—'}
                          </p>
                        )}
                        {q.explanation ? (
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {q.explanation}
                          </p>
                        ) : (
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {buildAutoExplanation(q)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {questions.length === 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 p-12 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No questions available for this test.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Section Analysis */}
      {activeTab === 'section' && (
        <SectionAnalysis responses={responses} questions={questions} />
      )}

      {/* Tab: Topic Analysis */}
      {activeTab === 'topic' && (
        <TopicAnalysis responses={responses} questions={questions} />
      )}

      {/* Tab: Time Analysis */}
      {activeTab === 'time' && (
        <TimeAnalysis responses={responses} questions={questions} />
      )}

      {/* Bottom Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-200 dark:border-slate-800 pt-6">
        <Link
          to="/student/test-series"
          className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Test Series
        </Link>
        <Link
          to={`/student/test/${attempt?.test_id}`}
          className="flex items-center gap-2 rounded-xl bg-navy-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-700 transition shadow-sm"
        >
          <RotateCcw className="h-4 w-4" />
          Retake Test
        </Link>
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Report Question
              </h3>
              <button
                onClick={() => {
                  setReportModal(null);
                  setReportReason('');
                  setReportDesc('');
                }}
                className="rounded-lg p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Why are you reporting this question? Select a reason below.
            </p>

            <div className="space-y-2 mb-4">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                    reportReason === reason
                      ? 'border-navy-400 bg-navy-50 dark:bg-navy-500/10 ring-1 ring-navy-200'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={() => setReportReason(reason)}
                    className="h-4 w-4 text-navy-600 focus:ring-navy-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{reason}</span>
                </label>
              ))}
            </div>

            <textarea
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              placeholder="Optional: Add more details..."
              rows={3}
              className="mb-4 w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:border-navy-400 focus:ring-1 focus:ring-navy-200 outline-none resize-none"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setReportModal(null);
                  setReportReason('');
                  setReportDesc('');
                }}
                className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                disabled={submittingReport || !reportReason}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReport ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
