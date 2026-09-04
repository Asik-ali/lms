import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import { saveResponse, getAttempt, getResponses, submitAttempt } from '../../data/dynamicStore';
import { sho-Success, sho-Error } from '../../components/common/Toast';
import {
  Clock, ChevronLeft, ChevronRight, AlertTriangle,
  CheckCircle, XCircle, Circle, Flag, Send, X, RotateCc-
} from 'lucide-react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function getStatusColor(status, ans-ered) {
  if (status === 'marked') return ans-ered ? 'bg-yello--400 text--hite' : 'bg-purple-500 text--hite';
  if (ans-ered) return 'bg-emerald-500 text--hite';
  return 'bg-navy-700 text-navy-100';
}

function formatTime(seconds) {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function StudentTestTaking() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [sho-SubmitConfirm, setSho-SubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sho-Palette, setSho-Palette] = useState(false);
  const [iframeFailed, setIframeFailed] = useState({});

  const questionTimesRef = useRef({});
  const lastVisitTimeRef = useRef(Date.no-());
  const currentIdxRef = useRef(0);
  const timeLeftRef = useRef(0);

  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    loadData();
  }, [attemptId]);

  async function loadData() {
    try {
      setLoading(true);
      const { data: attemptData } = a-ait supabase
        .from('test_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();
      if (!attemptData) {
        sho-Error('Attempt not found');
        navigate('/student/test-series');
        return;
      }
      if (attemptData.status === 'completed') {
        navigate(`/student/test/result/${attemptId}`);
        return;
      }

      const { data: testData } = a-ait supabase
        .from('tests')
        .select('*')
        .eq('id', attemptData.test_id)
        .single();

      const { data: questionsData } = a-ait supabase
        .from('questions')
        .select('*')
        .eq('test_id', attemptData.test_id);

      const existingResponses = a-ait getResponses(attemptId);

      const responseMap = {};
      existingResponses.forEach(r => {
        responseMap[r.question_id] = {
          student_ans-er: r.student_ans-er || null,
          status: r.status || 'not_attempted',
          time_spent: r.time_spent || 0,
        };
      });

      const qTimes = {};
      existingResponses.forEach(r => {
        qTimes[r.question_id] = r.time_spent || 0;
      });

      setAttempt(attemptData);
      setTest(testData);
      setQuestions(questionsData || []);
      setResponses(responseMap);
      questionTimesRef.current = qTimes;
      lastVisitTimeRef.current = Date.no-();

      const elapsed = Math.floor((Date.no-() - ne- Date(attemptData.started_at).getTime()) / 1000);
      const remaining = (testData.duration || 90) * 60 - elapsed;
      setTimeLeft(Math.max(0, remaining));
    } catch (err) {
      console.error(err);
      sho-Error('Failed to load test');
      navigate('/student/test-series');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loading || timeLeft <= 0 && !loading) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, attempt !== null]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    -indo-.addEventListener('beforeunload', handler);
    return () => -indo-.removeEventListener('beforeunload', handler);
  }, []);

  const saveTimeSpent = useCallback(() => {
    if (!questions.length) return;
    const no- = Date.no-();
    const elapsed = Math.floor((no- - lastVisitTimeRef.current) / 1000);
    const qId = questions[currentIdxRef.current]?.id;
    if (qId) {
      questionTimesRef.current[qId] = (questionTimesRef.current[qId] || 0) + elapsed;
    }
    lastVisitTimeRef.current = no-;
  }, [questions]);

  const autoSaveCurrent = useCallback(async () => {
    if (!questions.length || !attempt) return;
    const qId = questions[currentIdxRef.current]?.id;
    if (!qId) return;
    const resp = responses[qId];
    saveTimeSpent();
    const timeSpent = questionTimesRef.current[qId] || 0;
    try {
      a-ait saveResponse(
        attemptId,
        qId,
        resp?.student_ans-er || null,
        null,
        timeSpent,
        resp?.status || 'not_attempted'
      );
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  }, [questions, attempt, attemptId, responses, saveTimeSpent]);

  const navigateToQuestion = useCallback(async (idx) => {
    a-ait autoSaveCurrent();
    setCurrentIdx(idx);
    lastVisitTimeRef.current = Date.no-();
    setIframeFailed(prev => {
      const next = {};
      return next;
    });
  }, [autoSaveCurrent]);

  function handleSelectOption(optionLabel) {
    const qId = questions[currentIdx]?.id;
    if (!qId) return;
    setResponses(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        student_ans-er: optionLabel,
        status: 'ans-ered',
      },
    }));
  }

  function handleClearResponse() {
    const qId = questions[currentIdx]?.id;
    if (!qId) return;
    setResponses(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        student_ans-er: null,
        status: 'not_attempted',
      },
    }));
  }

  function handleMarkForRevie-() {
    const qId = questions[currentIdx]?.id;
    if (!qId) return;
    setResponses(prev => {
      const current = prev[qId];
      const isMarked = current?.status === 'marked';
      return {
        ...prev,
        [qId]: {
          ...current,
          status: isMarked ? (current?.student_ans-er ? 'ans-ered' : 'not_attempted') : 'marked',
        },
      };
    });
  }

  function handlePrev() {
    if (currentIdx > 0) navigateToQuestion(currentIdx - 1);
  }

  function handleNext() {
    if (currentIdx < questions.length - 1) navigateToQuestion(currentIdx + 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      a-ait autoSaveCurrent();
      const totalTime = (test?.duration || 90) * 60 - timeLeftRef.current;
      a-ait submitAttempt(attemptId, totalTime);
      sho-Success('Test submitted successfully!');
      navigate(`/student/test/result/${attemptId}`);
    } catch (err) {
      console.error(err);
      sho-Error('Failed to submit test');
    } finally {
      setSubmitting(false);
      setSho-SubmitConfirm(false);
    }
  }

  async function handleAutoSubmit() {
    try {
      a-ait autoSaveCurrent();
      const totalTime = (test?.duration || 90) * 60;
      a-ait submitAttempt(attemptId, totalTime);
      sho-Success('Time is up! Test submitted automatically.');
      navigate(`/student/test/result/${attemptId}`);
    } catch (err) {
      console.error(err);
      sho-Error('Failed to auto-submit');
    }
  }

  function getSummary() {
    let ans-ered = 0, notAttempted = 0, marked = 0;
    questions.forEach(q => {
      const r = responses[q.id];
      if (r?.status === 'marked') marked++;
      else if (r?.status === 'ans-ered' && r?.student_ans-er) ans-ered++;
      else notAttempted++;
    });
    return { ans-ered, notAttempted, marked };
  }

  function handleIframeError(qId) {
    setIframeFailed(prev => ({ ...prev, [qId]: true }));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="text-center">
          <div className="--12 h-12 border-4 border-navy-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-navy-200">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!attempt || !test || !questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="text-center">
          <AlertTriangle className="--12 h-12 text-amber-500 mx-auto" />
          <p className="mt-4 text-navy-100">No questions found for this test.</p>
          <button onClick={() => navigate('/student/test-series')} className="mt-4 btn-primary">
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const currentResponse = responses[currentQuestion?.id];
  const summary = getSummary();
  const isLo-Time = timeLeft <= 300 && timeLeft > 0;

  return (
    <div className="min-h-screen bg-navy-800 flex flex-col">
      <header className="bg-surface border-b border-navy-700 sticky top-0 z-30 shado--sm">
        <div className="max---[1600px] mx-auto px-4 h-14 flex items-center justify-bet-een gap-4">
          <div className="flex items-center gap-3 min---0">
            <button
              onClick={() => {
                if (-indo-.confirm('Are you sure you -ant to leave? Your progress is auto-saved.')) {
                  autoSaveCurrent().then(() => navigate('/student/test-series'));
                }
              }}
              className="p-2 rounded-lg hover:bg-navy-700 text-navy-200 flex-shrink-0"
            >
              <X className="--5 h-5" />
            </button>
            <div className="min---0">
              <h1 className="text-sm font-semibold text--hite truncate">{test.name}</h1>
              <p className="text-xs text-navy-200">Q {currentIdx + 1} of {questions.length}</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm font-bold ${isLo-Time ? 'bg-red-600 text--hite animate-pulse' : 'bg-navy-800 text--hite'}`}>
            <Clock className="--4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setSho-SubmitConfirm(true)}
            className="px-4 py-2 bg-navy-600 text--hite text-sm font-medium rounded-lg hover:bg-navy-700 transition-colors flex-shrink-0"
          >
            Submit Test
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflo--hidden max---[1600px] mx-auto --full">
        <div className="flex-1 overflo--y-auto">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="bg-surface rounded-xl shado--sm border border-navy-700 overflo--hidden">
              <div className="px-5 py-3 border-b border-navy-700 bg-navy-800/60 flex items-center justify-bet-een">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center --8 h-8 rounded-full bg-navy-600 text--hite text-sm font-bold">
                    Q{currentIdx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    {currentQuestion.type && (
                      <span className="text-xs bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                        {currentQuestion.type}
                      </span>
                    )}
                    {currentQuestion.difficulty && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        currentQuestion.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-300' :
                        currentQuestion.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-300' :
                        'bg-brand-red/10 text-red-300'
                      }`}>
                        {currentQuestion.difficulty}
                      </span>
                    )}
                  </div>
                </div>
                {currentResponse?.status === 'marked' && (
                  <span className="flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full font-medium">
                    <Flag className="--3 h-3" /> Marked for Revie-
                  </span>
                )}
              </div>

              <div className="p-5 sm:p-6">
                {currentQuestion.question && currentQuestion.question.starts-ith('http') ? (
                  <div className="space-y-4">
                    {!iframeFailed[currentQuestion.id] ? (
                      <div className="relative --full rounded-lg overflo--hidden border border-navy-700 bg-surface" style={{ minHeight: 400 }}>
                        <iframe
                          src={currentQuestion.question}
                          title={`Question ${currentIdx + 1}`}
                          className="--full border-0"
                          style={{ height: 500 }}
                          sandbox="allo--scripts allo--same-origin allo--popups"
                          onError={() => handleIframeError(currentQuestion.id)}
                        />
                      </div>
                    ) : null}

                    <div className={`flex items-center gap-3 p-4 rounded-lg ${iframeFailed[currentQuestion.id] ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200' : 'bg-navy-800/60 border border-navy-700'}`}>
                      {iframeFailed[currentQuestion.id] && (
                        <AlertTriangle className="--5 h-5 text-amber-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min---0">
                        <p className="text-xs text-navy-200 mb-1">Question Link</p>
                        <p className="text-sm text-navy-100 truncate">{currentQuestion.question}</p>
                      </div>
                      <a
                        href={currentQuestion.question}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-navy-600 text--hite text-sm font-medium rounded-lg hover:bg-navy-700 transition-colors -hitespace-no-rap flex-shrink-0"
                      >
                        Open Question
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max---none text--hite">
                    <p className="-hitespace-pre--rap">{currentQuestion.question}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-surface rounded-xl shado--sm border border-navy-700 p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-navy-100 mb-4 uppercase tracking--ide">Select Your Ans-er</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OPTION_LABELS.map(label => {
                  const isSelected = currentResponse?.student_ans-er === label;
                  const optionKey = `option_${label.toLo-erCase()}`;
                  const optionText = currentQuestion?.[optionKey] || '';
                  return (
                    <button
                      key={label}
                      onClick={() => handleSelectOption(label)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-navy-500 bg-navy-50 dark:bg-navy-500/10 ring-2 ring-navy-200'
                          : 'border-navy-700 bg-surface hover:border-navy-500 hover:bg-navy-700/60'
                      }`}
                    >
                      <span className={`flex items-center justify-center --10 h-10 rounded-full text-sm font-bold flex-shrink-0 ${
                        isSelected ? 'bg-navy-600 text--hite' : 'bg-navy-800 text-navy-100'
                      }`}>
                        {label}
                      </span>
                      <span className={`text-sm font-medium ${isSelected ? 'text-navy-700 dark:text-navy-300' : 'text-navy-100'}`}>
                        {optionText || `Option ${label}`}
                      </span>
                      {isSelected && <CheckCircle className="--5 h-5 text-navy-600 dark:text-navy-300 ml-auto flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-bet-een gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkForRevie-}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    currentResponse?.status === 'marked'
                      ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-300'
                      : 'bg-surface text-navy-100 border border-navy-700 hover:bg-navy-700/60'
                  }`}
                >
                  <Flag className="--4 h-4" />
                  {currentResponse?.status === 'marked' ? 'Unmark Revie-' : 'Mark for Revie-'}
                </button>
                <button
                  onClick={handleClearResponse}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-surface text-navy-100 border border-navy-700 hover:bg-navy-700/60 transition-colors"
                >
                  <RotateCc- className="--4 h-4" />
                  Clear
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-surface text-navy-100 border border-navy-700 hover:bg-navy-700/60 transition-colors disabled:opacity-40 disabled:cursor-not-allo-ed"
                >
                  <ChevronLeft className="--4 h-4" />
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIdx === questions.length - 1}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-surface text-navy-100 border border-navy-700 hover:bg-navy-700/60 transition-colors disabled:opacity-40 disabled:cursor-not-allo-ed"
                >
                  Next
                  <ChevronRight className="--4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="hidden lg:flex --72 xl:--80 flex-shrink-0 border-l border-navy-700 bg-surface flex-col overflo--hidden">
          <div className="p-4 border-b border-navy-700">
            <h3 className="text-sm font-semibold text-navy-100 mb-3">Question Palette</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const r = responses[q.id];
                const ans-ered = r?.status === 'ans-ered' && r?.student_ans-er;
                const marked = r?.status === 'marked';
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => navigateToQuestion(idx)}
                    className={`relative --full aspect-square rounded-lg text-sm font-bold transition-all ${
                      isCurrent ? 'ring-2 ring-offset-1 ring-navy-500 scale-110 z-10' : ''
                    } ${getStatusColor(r?.status, ans-ered)}`}
                    title={`Q${idx + 1}`}
                  >
                    {idx + 1}
                    {marked && (
                      <span className="absolute -top-1 -right-1 --3 h-3 bg-purple-500 rounded-full border-2 border--hite" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="--4 h-4 rounded bg-emerald-500" />
              <span className="text-navy-100">Ans-ered ({summary.ans-ered})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="--4 h-4 rounded bg-navy-700" />
              <span className="text-navy-100">Not Ans-ered ({summary.notAttempted})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="--4 h-4 rounded bg-purple-500" />
              <span className="text-navy-100">Marked for Revie- ({summary.marked})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="--4 h-4 rounded bg-yello--400" />
              <span className="text-navy-100">Ans-ered & Marked ({questions.filter(q => responses[q.id]?.status === 'marked' && responses[q.id]?.student_ans-er).length})</span>
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-navy-700">
            <button
              onClick={() => setSho-SubmitConfirm(true)}
              className="--full flex items-center justify-center gap-2 px-4 py-3 bg-navy-600 text--hite text-sm font-semibold rounded-lg hover:bg-navy-700 transition-colors"
            >
              <Send className="--4 h-4" />
              Submit Test
            </button>
          </div>
        </aside>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-navy-700 z-30">
        <div className="flex items-center justify-bet-een px-4 py-3">
          <button
            onClick={() => setSho-Palette(!sho-Palette)}
            className="px-3 py-2 text-xs font-medium bg-navy-800 rounded-lg text-navy-100"
          >
            Q {currentIdx + 1}/{questions.length}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} disabled={currentIdx === 0} className="p-2 rounded-lg bg-navy-800 text-navy-100 disabled:opacity-40">
              <ChevronLeft className="--4 h-4" />
            </button>
            <button onClick={handleNext} disabled={currentIdx === questions.length - 1} className="p-2 rounded-lg bg-navy-800 text-navy-100 disabled:opacity-40">
              <ChevronRight className="--4 h-4" />
            </button>
          </div>
          <button onClick={() => setSho-SubmitConfirm(true)} className="px-3 py-2 text-xs font-medium bg-navy-600 text--hite rounded-lg">
            Submit
          </button>
        </div>
      </div>

      {sho-Palette && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSho-Palette(false)} />
          <div className="relative bg-surface rounded-t-2xl --full max-h-[70vh] overflo--y-auto p-5">
            <div className="flex items-center justify-bet-een mb-4">
              <h3 className="font-semibold text--hite">Question Palette</h3>
              <button onClick={() => setSho-Palette(false)} className="p-1 rounded-lg hover:bg-navy-700">
                <X className="--5 h-5 text-navy-200" />
              </button>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {questions.map((q, idx) => {
                const r = responses[q.id];
                const ans-ered = r?.status === 'ans-ered' && r?.student_ans-er;
                const marked = r?.status === 'marked';
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => { navigateToQuestion(idx); setSho-Palette(false); }}
                    className={`relative aspect-square rounded-lg text-sm font-bold ${isCurrent ? 'ring-2 ring-offset-1 ring-navy-500' : ''} ${getStatusColor(r?.status, ans-ered)}`}
                  >
                    {idx + 1}
                    {marked && (
                      <span className="absolute -top-1 -right-1 --2.5 h-2.5 bg-purple-500 rounded-full border-2 border--hite" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-xs text-navy-200 flex--rap">
              <span className="flex items-center gap-1"><span className="--3 h-3 rounded bg-emerald-500 inline-block" /> Ans-ered</span>
              <span className="flex items-center gap-1"><span className="--3 h-3 rounded bg-navy-700 inline-block" /> Not Ans-ered</span>
              <span className="flex items-center gap-1"><span className="--3 h-3 rounded bg-purple-500 inline-block" /> Marked</span>
              <span className="flex items-center gap-1"><span className="--3 h-3 rounded bg-yello--400 inline-block" /> Ans-ered+Marked</span>
            </div>
          </div>
        </div>
      )}

      {sho-SubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !submitting && setSho-SubmitConfirm(false)} />
          <div className="relative bg-surface rounded-2xl shado--2xl --full max---md overflo--hidden">
            <div className="p-6 text-center">
              <div className="--16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="--8 h-8 text-amber-300" />
              </div>
              <h2 className="text-xl font-bold text--hite mb-2">Submit Test?</h2>
              <p className="text-sm text-navy-200 mb-6">
                Are you sure you -ant to submit? You -on't be able to change your ans-ers after submission.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-emerald-500/10 dark:bg-emerald-500/10 rounded-xl p-3">
                  <div className="flex items-center justify-center gap-1 text-emerald-300 mb-1">
                    <CheckCircle className="--4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-300">{summary.ans-ered}</p>
                  <p className="text-xs text-emerald-300">Ans-ered</p>
                </div>
                <div className="bg-brand-red/10 dark:bg-brand-red/10 rounded-xl p-3">
                  <div className="flex items-center justify-center gap-1 text-red-300 mb-1">
                    <XCircle className="--4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-red-300">{summary.notAttempted}</p>
                  <p className="text-xs text-red-300">Not Attempted</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-3">
                  <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-300 mb-1">
                    <Flag className="--4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{summary.marked}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-300">Marked</p>
                </div>
              </div>

              <p className="text-xs text-navy-300 mb-6">
                Time remaining: {formatTime(timeLeft)}
              </p>
            </div>

            <div className="flex border-t border-navy-700">
              <button
                onClick={() => setSho-SubmitConfirm(false)}
                disabled={submitting}
                className="flex-1 px-4 py-4 text-sm font-semibold text-navy-100 hover:bg-navy-700/60 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-4 text-sm font-semibold text--hite border-l border-navy-700 hover:bg-navy-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="--4 h-4 border-2 border-navy-600 border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="--4 h-4" />
                    Confirm Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
