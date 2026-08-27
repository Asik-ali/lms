import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import { saveResponse, getAttempt, getResponses, submitAttempt } from '../../data/dynamicStore';
import { showSuccess, showError } from '../../components/common/Toast';
import {
  Clock, ChevronLeft, ChevronRight, AlertTriangle,
  CheckCircle, XCircle, Circle, Flag, Send, X, RotateCcw
} from 'lucide-react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function getStatusColor(status, answered) {
  if (status === 'marked') return answered ? 'bg-yellow-400 text-gray-900' : 'bg-purple-500 text-white';
  if (answered) return 'bg-green-500 text-white';
  return 'bg-gray-200 text-gray-600';
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
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [iframeFailed, setIframeFailed] = useState({});

  const questionTimesRef = useRef({});
  const lastVisitTimeRef = useRef(Date.now());
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
      const { data: attemptData } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();
      if (!attemptData) {
        showError('Attempt not found');
        navigate('/student/test-series');
        return;
      }
      if (attemptData.status === 'completed') {
        navigate(`/student/test/result/${attemptId}`);
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

      const existingResponses = await getResponses(attemptId);

      const responseMap = {};
      existingResponses.forEach(r => {
        responseMap[r.question_id] = {
          student_answer: r.student_answer || null,
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
      lastVisitTimeRef.current = Date.now();

      const elapsed = Math.floor((Date.now() - new Date(attemptData.started_at).getTime()) / 1000);
      const remaining = (testData.duration || 90) * 60 - elapsed;
      setTimeLeft(Math.max(0, remaining));
    } catch (err) {
      console.error(err);
      showError('Failed to load test');
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
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const saveTimeSpent = useCallback(() => {
    if (!questions.length) return;
    const now = Date.now();
    const elapsed = Math.floor((now - lastVisitTimeRef.current) / 1000);
    const qId = questions[currentIdxRef.current]?.id;
    if (qId) {
      questionTimesRef.current[qId] = (questionTimesRef.current[qId] || 0) + elapsed;
    }
    lastVisitTimeRef.current = now;
  }, [questions]);

  const autoSaveCurrent = useCallback(async () => {
    if (!questions.length || !attempt) return;
    const qId = questions[currentIdxRef.current]?.id;
    if (!qId) return;
    const resp = responses[qId];
    saveTimeSpent();
    const timeSpent = questionTimesRef.current[qId] || 0;
    try {
      await saveResponse(
        attemptId,
        qId,
        resp?.student_answer || null,
        null,
        timeSpent,
        resp?.status || 'not_attempted'
      );
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  }, [questions, attempt, attemptId, responses, saveTimeSpent]);

  const navigateToQuestion = useCallback(async (idx) => {
    await autoSaveCurrent();
    setCurrentIdx(idx);
    lastVisitTimeRef.current = Date.now();
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
        student_answer: optionLabel,
        status: 'answered',
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
        student_answer: null,
        status: 'not_attempted',
      },
    }));
  }

  function handleMarkForReview() {
    const qId = questions[currentIdx]?.id;
    if (!qId) return;
    setResponses(prev => {
      const current = prev[qId];
      const isMarked = current?.status === 'marked';
      return {
        ...prev,
        [qId]: {
          ...current,
          status: isMarked ? (current?.student_answer ? 'answered' : 'not_attempted') : 'marked',
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
      await autoSaveCurrent();
      const totalTime = (test?.duration || 90) * 60 - timeLeftRef.current;
      await submitAttempt(attemptId, totalTime);
      showSuccess('Test submitted successfully!');
      navigate(`/student/test/result/${attemptId}`);
    } catch (err) {
      console.error(err);
      showError('Failed to submit test');
    } finally {
      setSubmitting(false);
      setShowSubmitConfirm(false);
    }
  }

  async function handleAutoSubmit() {
    try {
      await autoSaveCurrent();
      const totalTime = (test?.duration || 90) * 60;
      await submitAttempt(attemptId, totalTime);
      showSuccess('Time is up! Test submitted automatically.');
      navigate(`/student/test/result/${attemptId}`);
    } catch (err) {
      console.error(err);
      showError('Failed to auto-submit');
    }
  }

  function getSummary() {
    let answered = 0, notAttempted = 0, marked = 0;
    questions.forEach(q => {
      const r = responses[q.id];
      if (r?.status === 'marked') marked++;
      else if (r?.status === 'answered' && r?.student_answer) answered++;
      else notAttempted++;
    });
    return { answered, notAttempted, marked };
  }

  function handleIframeError(qId) {
    setIframeFailed(prev => ({ ...prev, [qId]: true }));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!attempt || !test || !questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <p className="mt-4 text-gray-600">No questions found for this test.</p>
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
  const isLowTime = timeLeft <= 300 && timeLeft > 0;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to leave? Your progress is auto-saved.')) {
                  autoSaveCurrent().then(() => navigate('/student/test-series'));
                }
              }}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 truncate">{test.name}</h1>
              <p className="text-xs text-gray-500">Q {currentIdx + 1} of {questions.length}</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm font-bold ${isLowTime ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-900 text-white'}`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0"
          >
            Submit Test
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-[1600px] mx-auto w-full">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold">
                    Q{currentIdx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    {currentQuestion.type && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {currentQuestion.type}
                      </span>
                    )}
                    {currentQuestion.difficulty && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        currentQuestion.difficulty === 'Easy' ? 'bg-green-50 text-green-700' :
                        currentQuestion.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {currentQuestion.difficulty}
                      </span>
                    )}
                  </div>
                </div>
                {currentResponse?.status === 'marked' && (
                  <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                    <Flag className="w-3 h-3" /> Marked for Review
                  </span>
                )}
              </div>

              <div className="p-5 sm:p-6">
                {currentQuestion.question && currentQuestion.question.startsWith('http') ? (
                  <div className="space-y-4">
                    {!iframeFailed[currentQuestion.id] ? (
                      <div className="relative w-full rounded-lg overflow-hidden border border-gray-200 bg-white" style={{ minHeight: 400 }}>
                        <iframe
                          src={currentQuestion.question}
                          title={`Question ${currentIdx + 1}`}
                          className="w-full border-0"
                          style={{ height: 500 }}
                          sandbox="allow-scripts allow-same-origin allow-popups"
                          onError={() => handleIframeError(currentQuestion.id)}
                        />
                      </div>
                    ) : null}

                    <div className={`flex items-center gap-3 p-4 rounded-lg ${iframeFailed[currentQuestion.id] ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'}`}>
                      {iframeFailed[currentQuestion.id] && (
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Question Link</p>
                        <p className="text-sm text-gray-700 truncate">{currentQuestion.question}</p>
                      </div>
                      <a
                        href={currentQuestion.question}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap flex-shrink-0"
                      >
                        Open Question
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-gray-800">
                    <p className="whitespace-pre-wrap">{currentQuestion.question}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Select Your Answer</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OPTION_LABELS.map(label => {
                  const isSelected = currentResponse?.student_answer === label;
                  return (
                    <button
                      key={label}
                      onClick={() => handleSelectOption(label)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold flex-shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {label}
                      </span>
                      <span className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                        Option {label}
                      </span>
                      {isSelected && <CheckCircle className="w-5 h-5 text-indigo-600 ml-auto flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkForReview}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    currentResponse?.status === 'marked'
                      ? 'bg-purple-100 text-purple-700 border border-purple-300'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Flag className="w-4 h-4" />
                  {currentResponse?.status === 'marked' ? 'Unmark Review' : 'Mark for Review'}
                </button>
                <button
                  onClick={handleClearResponse}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIdx === questions.length - 1}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="hidden lg:flex w-72 xl:w-80 flex-shrink-0 border-l border-gray-200 bg-white flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Question Palette</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const r = responses[q.id];
                const answered = r?.status === 'answered' && r?.student_answer;
                const marked = r?.status === 'marked';
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => navigateToQuestion(idx)}
                    className={`relative w-full aspect-square rounded-lg text-sm font-bold transition-all ${
                      isCurrent ? 'ring-2 ring-offset-1 ring-indigo-500 scale-110 z-10' : ''
                    } ${getStatusColor(r?.status, answered)}`}
                    title={`Q${idx + 1}`}
                  >
                    {idx + 1}
                    {marked && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-green-500" />
              <span className="text-gray-600">Answered ({summary.answered})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-gray-200" />
              <span className="text-gray-600">Not Answered ({summary.notAttempted})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-purple-500" />
              <span className="text-gray-600">Marked for Review ({summary.marked})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-yellow-400" />
              <span className="text-gray-600">Answered & Marked ({questions.filter(q => responses[q.id]?.status === 'marked' && responses[q.id]?.student_answer).length})</span>
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-gray-200">
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              Submit Test
            </button>
          </div>
        </aside>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setShowPalette(!showPalette)}
            className="px-3 py-2 text-xs font-medium bg-gray-100 rounded-lg text-gray-700"
          >
            Q {currentIdx + 1}/{questions.length}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} disabled={currentIdx === 0} className="p-2 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={handleNext} disabled={currentIdx === questions.length - 1} className="p-2 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setShowSubmitConfirm(true)} className="px-3 py-2 text-xs font-medium bg-indigo-600 text-white rounded-lg">
            Submit
          </button>
        </div>
      </div>

      {showPalette && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPalette(false)} />
          <div className="relative bg-white rounded-t-2xl w-full max-h-[70vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Question Palette</h3>
              <button onClick={() => setShowPalette(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {questions.map((q, idx) => {
                const r = responses[q.id];
                const answered = r?.status === 'answered' && r?.student_answer;
                const marked = r?.status === 'marked';
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => { navigateToQuestion(idx); setShowPalette(false); }}
                    className={`relative aspect-square rounded-lg text-sm font-bold ${isCurrent ? 'ring-2 ring-offset-1 ring-indigo-500' : ''} ${getStatusColor(r?.status, answered)}`}
                  >
                    {idx + 1}
                    {marked && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full border-2 border-white" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Answered</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Not Answered</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-500 inline-block" /> Marked</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Answered+Marked</span>
            </div>
          </div>
        </div>
      )}

      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !submitting && setShowSubmitConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Submit Test?</h2>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to submit? You won't be able to change your answers after submission.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-green-50 rounded-xl p-3">
                  <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-green-700">{summary.answered}</p>
                  <p className="text-xs text-green-600">Answered</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-red-700">{summary.notAttempted}</p>
                  <p className="text-xs text-red-600">Not Attempted</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                    <Flag className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-purple-700">{summary.marked}</p>
                  <p className="text-xs text-purple-600">Marked</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-6">
                Time remaining: {formatTime(timeLeft)}
              </p>
            </div>

            <div className="flex border-t border-gray-200">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                className="flex-1 px-4 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-4 text-sm font-semibold text-indigo-600 border-l border-gray-200 hover:bg-indigo-50 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
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
