import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Award,
  BarChart3,
  Globe,
  ListChecks,
  AlertCircle,
  CheckCircle2,
  Play,
  History,
  BookOpen,
} from 'lucide-react';
import { startTestAttempt, getTestAttemptHistory } from '../../data/dynamicStore';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { showSuccess, showError } from '../../components/common/Toast';

export default function StudentTestDetail() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [test, setTest] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!testId) return;
    loadData();
  }, [testId]);

  async function loadData() {
    setLoading(true);
    try {
      const [testRes, countRes, attemptsData] = await Promise.all([
        supabase.from('tests').select('*').eq('id', testId).single(),
        supabase.from('questions').select('id', { count: 'exact', head: true }).eq('test_id', testId),
        user ? getTestAttemptHistory(testId, user.id) : Promise.resolve([]),
      ]);
      setTest(testRes.data);
      setQuestionCount(countRes.count ?? 0);
      setAttempts(attemptsData);
    } catch (err) {
      console.error('Failed to load test detail:', err);
      showError('Failed to load test details');
    }
    setLoading(false);
  }

  const marksPerQ = questionCount > 0 ? Math.floor((test?.total_marks || 0) / questionCount) : 0;

  async function handleStartTest() {
    if (!user) return showError('Please login to start the test');
    setStarting(true);
    try {
      const attempt = await startTestAttempt(testId, user.id);
      showSuccess('Test started! Good luck!');
      navigate(`/student/test/take/${attempt.id}`);
    } catch (err) {
      console.error('Failed to start test:', err);
      showError('Failed to start test. Please try again.');
    }
    setStarting(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/student/test-series')} className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600">
          <ArrowLeft className="w-4 h-4" /> Back to Test Series
        </button>
        <div className="card p-8 text-center text-gray-500">Loading test details...</div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/student/test-series')} className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600">
          <ArrowLeft className="w-4 h-4" /> Back to Test Series
        </button>
        <div className="card p-8 text-center text-gray-500">Test not found.</div>
      </div>
    );
  }

  const defaultInstructions = [
    `Total duration: ${test.duration} minutes`,
    `Total questions: ${questionCount}`,
    `Total marks: ${test.total_marks}`,
    `Each correct answer: +${marksPerQ} marks`,
    'Each wrong answer: 0 marks (no negative marking)',
    'Questions not attempted: 0 marks',
    'Read each question carefully before answering',
    'You can navigate between questions freely',
    'You can mark questions for review',
    'Test will auto-submit when time runs out',
    'Once submitted, you cannot change answers',
  ];

  const instructionLines = test.instructions
    ? test.instructions.split('\n').filter(Boolean)
    : defaultInstructions;

  const syllabusLines = test.syllabus
    ? test.syllabus.split('\n').filter(Boolean)
    : [];

  const difficultyColor = {
    Easy: 'bg-green-50 text-green-700 border-green-200',
    Moderate: 'bg-amber-50 text-amber-700 border-amber-200',
    Hard: 'bg-red-50 text-red-700 border-red-200',
    'Very Hard': 'bg-red-50 text-red-700 border-red-200',
  };

  const statusColor = {
    active: 'bg-green-50 text-green-700',
    draft: 'bg-gray-100 text-gray-500',
    archived: 'bg-gray-100 text-gray-400',
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/student/test-series')}
        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Test Series
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold mb-1">{test.name}</h1>
            {test.description && (
              <p className="text-indigo-100 text-sm">{test.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Test Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <InfoCard icon={<Clock className="w-5 h-5" />} label="Duration" value={`${test.duration} min`} color="indigo" />
        <InfoCard icon={<Award className="w-5 h-5" />} label="Total Marks" value={test.total_marks} color="purple" />
        <InfoCard icon={<BarChart3 className="w-5 h-5" />} label="Difficulty" value={test.difficulty || 'N/A'} color={test.difficulty === 'Easy' ? 'emerald' : test.difficulty === 'Hard' ? 'red' : 'amber'} />
        <InfoCard icon={<Globe className="w-5 h-5" />} label="Language" value={test.language || 'English'} color="cyan" />
        <InfoCard icon={<ListChecks className="w-5 h-5" />} label="Questions" value={questionCount} color="indigo" />
        <InfoCard icon={<AlertCircle className="w-5 h-5" />} label="Status" value={test.status || 'Active'} color={test.status === 'active' ? 'emerald' : 'gray'} />
      </div>

      {/* Instructions */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-indigo-600" />
          Instructions
        </h2>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-2">
          {instructionLines.map((line, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-amber-900">
              <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <span>{line}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Syllabus / Topics */}
      {syllabusLines.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Syllabus / Topics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {syllabusLines.map((line, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous Attempts */}
      {attempts.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Your Previous Attempts
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Score</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Correct</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Wrong</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Skipped</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Time Taken</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a, i) => (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{i + 1}</td>
                    <td className="px-4 py-2 font-semibold text-indigo-600">
                      {a.score !== null && a.score !== undefined ? `${a.score}/${a.total_marks || test.total_marks}` : '-'}
                    </td>
                    <td className="px-4 py-2 text-green-600">{a.correct_count ?? '-'}</td>
                    <td className="px-4 py-2 text-red-600">{a.wrong_count ?? '-'}</td>
                    <td className="px-4 py-2 text-gray-500">{a.skipped_count ?? '-'}</td>
                    <td className="px-4 py-2 text-gray-600">{a.time_taken != null ? `${Math.floor(a.time_taken / 60)}m ${a.time_taken % 60}s` : '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Start Test Button */}
      <div className="card p-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-600">
            {questionCount} questions &middot; {test.duration} minutes &middot; {test.total_marks} marks
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {attempts.length > 0 ? `You have attempted ${attempts.length} time${attempts.length > 1 ? 's' : ''} before` : 'This will be your first attempt'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleStartTest}
          disabled={starting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-8 py-3 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-green-600/20"
        >
          <Play className="w-5 h-5" />
          {starting ? 'Starting...' : 'Start Test'}
        </button>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, color }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    gray: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  return (
    <div className={`rounded-xl border p-4 flex flex-col items-center gap-1 ${colorMap[color] || colorMap.indigo}`}>
      <div className="opacity-80">{icon}</div>
      <span className="text-lg font-bold leading-tight">{value}</span>
      <span className="text-xs font-medium opacity-70">{label}</span>
    </div>
  );
}
