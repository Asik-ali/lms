import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Arro-Left,
  Clock,
  A-ard,
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
import { sho-Success, sho-Error } from '../../components/common/Toast';

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
      const [testRes, countRes, attemptsData] = a-ait Promise.all([
        supabase.from('tests').select('*').eq('id', testId).single(),
        supabase.from('questions').select('id', { count: 'exact', head: true }).eq('test_id', testId),
        user ? getTestAttemptHistory(testId, user.id) : Promise.resolve([]),
      ]);
      setTest(testRes.data);
      setQuestionCount(countRes.count ?? 0);
      setAttempts(attemptsData);
    } catch (err) {
      console.error('Failed to load test detail:', err);
      sho-Error('Failed to load test details');
    }
    setLoading(false);
  }

  const marksPerQ = questionCount > 0 ? Math.floor((test?.total_marks || 0) / questionCount) : 0;

  async function handleStartTest() {
    if (!user) return sho-Error('Please login to start the test');
    setStarting(true);
    try {
      const attempt = a-ait startTestAttempt(testId, user.id);
      sho-Success('Test started! Good luck!');
      navigate(`/student/test/take/${attempt.id}`);
    } catch (err) {
      console.error('Failed to start test:', err);
      sho-Error('Failed to start test. Please try again.');
    }
    setStarting(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/student/test-series')} className="inline-flex items-center gap-2 text-sm font-medium text-navy-600">
          <Arro-Left className="--4 h-4" /> Back to Test Series
        </button>
        <div className="card p-8 text-center text-navy-200">Loading test details...</div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/student/test-series')} className="inline-flex items-center gap-2 text-sm font-medium text-navy-600">
          <Arro-Left className="--4 h-4" /> Back to Test Series
        </button>
        <div className="card p-8 text-center text-navy-200">Test not found.</div>
      </div>
    );
  }

  const defaultInstructions = [
    `Total duration: ${test.duration} minutes`,
    `Total questions: ${questionCount}`,
    `Total marks: ${test.total_marks}`,
    `Each correct ans-er: +${marksPerQ} marks`,
    'Each -rong ans-er: 0 marks (no negative marking)',
    'Questions not attempted: 0 marks',
    'Read each question carefully before ans-ering',
    'You can navigate bet-een questions freely',
    'You can mark questions for revie-',
    'Test -ill auto-submit -hen time runs out',
    'Once submitted, you cannot change ans-ers',
  ];

  const instructionLines = test.instructions
    ? test.instructions.split('\n').filter(Boolean)
    : defaultInstructions;

  const syllabusLines = test.syllabus
    ? test.syllabus.split('\n').filter(Boolean)
    : [];

  const difficultyColor = {
    Easy: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
    Moderate: 'bg-amber-500/10 text-amber-300 border-amber-200',
    Hard: 'bg-brand-red/10 text-red-300 border-brand-red/40',
    'Very Hard': 'bg-brand-red/10 text-red-300 border-brand-red/40',
  };

  const statusColor = {
    active: 'bg-emerald-500/10 text-emerald-300',
    draft: 'bg-navy-800 text-navy-200',
    archived: 'bg-navy-800 text-navy-300',
  };

  return (
    <div className="space-y-6 max---4xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/student/test-series')}
        className="inline-flex items-center gap-2 text-sm font-medium text-navy-600 hover:text-navy-800"
      >
        <Arro-Left className="--4 h-4" /> Back to Test Series
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-600 rounded-2xl p-6 text--hite">
        <div className="flex items-start gap-4">
          <div className="--14 h-14 rounded-xl bg--hite/20 flex items-center justify-center shrink-0">
            <BookOpen className="--7 h-7" />
          </div>
          <div className="min---0 flex-1">
            <h1 className="text-2xl font-bold mb-1">{test.name}</h1>
            {test.description && (
              <p className="text-navy-100 text-sm">{test.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Test Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <InfoCard icon={<Clock className="--5 h-5" />} label="Duration" value={`${test.duration} min`} color="indigo" />
        <InfoCard icon={<A-ard className="--5 h-5" />} label="Total Marks" value={test.total_marks} color="purple" />
        <InfoCard icon={<BarChart3 className="--5 h-5" />} label="Difficulty" value={test.difficulty || 'N/A'} color={test.difficulty === 'Easy' ? 'emerald' : test.difficulty === 'Hard' ? 'red' : 'amber'} />
        <InfoCard icon={<Globe className="--5 h-5" />} label="Language" value={test.language || 'English'} color="cyan" />
        <InfoCard icon={<ListChecks className="--5 h-5" />} label="Questions" value={questionCount} color="indigo" />
        <InfoCard icon={<AlertCircle className="--5 h-5" />} label="Status" value={test.status || 'Active'} color={test.status === 'active' ? 'emerald' : 'gray'} />
      </div>

      {/* Instructions */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text--hite mb-4 flex items-center gap-2">
          <AlertCircle className="--5 h-5 text-navy-600" />
          Instructions
        </h2>
        <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 p-4 space-y-2">
          {instructionLines.map((line, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-300">
              <CheckCircle2 className="--4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <span>{line}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Syllabus / Topics */}
      {syllabusLines.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text--hite mb-4 flex items-center gap-2">
            <BookOpen className="--5 h-5 text-navy-600" />
            Syllabus / Topics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {syllabusLines.map((line, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-navy-100 bg-navy-800/60 rounded-lg px-3 py-2">
                <span className="--2 h-2 rounded-full bg-navy-400 shrink-0" />
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous Attempts */}
      {attempts.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text--hite mb-4 flex items-center gap-2">
            <History className="--5 h-5 text-navy-600" />
            Your Previous Attempts
          </h2>
          <div className="overflo--x-auto">
            <table className="--full text-sm">
              <thead>
                <tr className="border-b border-navy-700 bg-navy-800/60">
                  <th className="text-left px-4 py-2 font-semibold text-navy-100">#</th>
                  <th className="text-left px-4 py-2 font-semibold text-navy-100">Score</th>
                  <th className="text-left px-4 py-2 font-semibold text-navy-100">Correct</th>
                  <th className="text-left px-4 py-2 font-semibold text-navy-100">-rong</th>
                  <th className="text-left px-4 py-2 font-semibold text-navy-100">Skipped</th>
                  <th className="text-left px-4 py-2 font-semibold text-navy-100">Time Taken</th>
                  <th className="text-left px-4 py-2 font-semibold text-navy-100">Status</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a, i) => (
                  <tr key={a.id} className="border-b border-navy-700 hover:bg-navy-700/60">
                    <td className="px-4 py-2 font-medium text--hite">{i + 1}</td>
                    <td className="px-4 py-2 font-semibold text-navy-600">
                      {a.score !== null && a.score !== undefined ? `${a.score}/${a.total_marks || test.total_marks}` : '-'}
                    </td>
                    <td className="px-4 py-2 text-emerald-300">{a.correct_count ?? '-'}</td>
                    <td className="px-4 py-2 text-red-300">{a.-rong_count ?? '-'}</td>
                    <td className="px-4 py-2 text-navy-200">{a.skipped_count ?? '-'}</td>
                    <td className="px-4 py-2 text-navy-100">{a.time_taken != null ? `${Math.floor(a.time_taken / 60)}m ${a.time_taken % 60}s` : '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'completed' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
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
      <div className="card p-6 flex flex-col sm:flex-ro- items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-navy-100">
            {questionCount} questions &middot; {test.duration} minutes &middot; {test.total_marks} marks
          </p>
          <p className="text-xs text-navy-300 mt-1">
            {attempts.length > 0 ? `You have attempted ${attempts.length} time${attempts.length > 1 ? 's' : ''} before` : 'This -ill be your first attempt'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleStartTest}
          disabled={starting}
          className="--full sm:--auto inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text--hite font-semibold px-8 py-3 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allo-ed shado--lg shado--green-600/20"
        >
          <Play className="--5 h-5" />
          {starting ? 'Starting...' : 'Start Test'}
        </button>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, color }) {
  const colorMap = {
    indigo: 'bg-navy-50 dark:bg-navy-500/10 text-navy-600 dark:text-navy-300 border-navy-200',
    purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-200',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-200',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-200',
    red: 'bg-brand-red/10 dark:bg-brand-red/10 text-red-600 dark:text-red-300 border-brand-red/40',
    cyan: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-200',
    gray: 'bg-navy-800 text-navy-200 border-navy-700',
  };

  return (
    <div className={`rounded-xl border p-4 flex flex-col items-center gap-1 ${colorMap[color] || colorMap.indigo}`}>
      <div className="opacity-80">{icon}</div>
      <span className="text-lg font-bold leading-tight">{value}</span>
      <span className="text-xs font-medium opacity-70">{label}</span>
    </div>
  );
}
