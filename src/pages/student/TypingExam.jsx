import React, { useState, useEffect, useRef, useCallback } from "react";
import exercises from "../../data/PassageExercise";

function getCharDiffAligned(original, typed) {
  const m = original.length;
  const n = typed.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (original[i - 1] === typed[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  let i = m, j = n;
  let deletions = 0, insertions = 0;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && original[i - 1] === typed[j - 1]) {
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1])) {
      insertions++;
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j])) {
      deletions++;
      i--;
    } else {
      deletions++;
      insertions++;
      i--; j--;
    }
  }
  return { omissions: deletions, extraChars: insertions };
}

function countIsolatedMissingSpaces(original, typed) {
  const m = original.length;
  const n = typed.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (original[i - 1] === typed[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  let i = m, j = n;
  let missingSpaceCount = 0;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && original[i - 1] === typed[j - 1]) {
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1])) {
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j])) {
      if (original[i - 1] === ' ') {
        let isolated = true;
        if (i > 1 && j > 0 && original[i - 2] !== typed[j - 1]) isolated = false;
        if (i < m && j < n && original[i] !== typed[j]) isolated = false;
        if (isolated) missingSpaceCount++;
      }
      i--;
    } else {
      if (original[i - 1] === ' ' && typed[j - 1] !== ' ') {
        let isolated = true;
        if (i > 1 && j > 1 && original[i - 2] !== typed[j - 2]) isolated = false;
        if (i < m && j < n && original[i] !== typed[j]) isolated = false;
        if (isolated) missingSpaceCount++;
      }
      i--; j--;
    }
  }
  return missingSpaceCount;
}

function compareWords(originalText, typedText) {
  const originalWords = originalText.trim().split(/\s+/);
  const typedWords = typedText.trim().split(/\s+/);
  const errors = [];
  const minLen = Math.min(originalWords.length, typedWords.length);
  for (let i = 0; i < minLen; i++) {
    if (originalWords[i] !== typedWords[i]) {
      errors.push({ original: originalWords[i], typed: typedWords[i] });
    }
  }
  return errors;
}

function highlightAllErrors(original, typed) {
  const m = original.length;
  const n = typed.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (original[i - 1] === typed[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  let i = m, j = n;
  const origSpans = [];
  const typedSpans = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && original[i - 1] === typed[j - 1]) {
      origSpans.unshift({ char: original[i - 1], type: 'match' });
      typedSpans.unshift({ char: typed[j - 1], type: 'match' });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1])) {
      const ch = typed[j - 1];
      if (ch === ' ') {
        typedSpans.unshift({ char: '␣', type: 'extra-space' });
        origSpans.unshift({ char: '', type: 'none' });
      } else {
        typedSpans.unshift({ char: ch, type: 'insertion' });
        origSpans.unshift({ char: '', type: 'none' });
      }
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j])) {
      const ch = original[i - 1];
      if (ch === ' ') {
        origSpans.unshift({ char: '␣', type: 'missing-space' });
        typedSpans.unshift({ char: '', type: 'none' });
      } else {
        origSpans.unshift({ char: ch, type: 'deletion' });
        typedSpans.unshift({ char: '', type: 'none' });
      }
      i--;
    } else {
      const origChar = original[i - 1];
      const typedChar = typed[j - 1];
      if (origChar === ' ' && typedChar !== ' ') {
        origSpans.unshift({ char: '␣', type: 'missing-space' });
        typedSpans.unshift({ char: typedChar, type: 'insertion' });
      } else if (origChar !== ' ' && typedChar === ' ') {
        origSpans.unshift({ char: origChar, type: 'deletion' });
        typedSpans.unshift({ char: '␣', type: 'extra-space' });
      } else {
        origSpans.unshift({ char: origChar, type: 'deletion' });
        typedSpans.unshift({ char: typedChar, type: 'insertion' });
      }
      i--; j--;
    }
  }

  const renderSpans = (spans) => {
    return spans.map((span, idx) => {
      if (span.type === 'none') return null;
      if (span.type === 'match') return <span key={idx}>{span.char}</span>;
      if (span.type === 'deletion') {
        return <span key={idx} className="bg-red-100 line-through text-red-800 rounded px-0.5 mx-0.5">{span.char}</span>;
      }
      if (span.type === 'insertion') {
        return <span key={idx} className="bg-green-100 text-green-800 rounded px-0.5 mx-0.5">{span.char}</span>;
      }
      if (span.type === 'missing-space') {
        return <span key={idx} className="border-b-2 border-dotted border-orange-500 text-orange-700 font-bold px-0.5 mx-0.5">␣</span>;
      }
      if (span.type === 'extra-space') {
        return <span key={idx} className="bg-blue-100 text-blue-800 rounded px-0.5 mx-0.5">␣</span>;
      }
      return <span key={idx}>{span.char}</span>;
    });
  };

  return {
    originalHighlighted: <div className="whitespace-pre-wrap break-words font-mono text-base leading-relaxed tracking-wide">{renderSpans(origSpans)}</div>,
    typedHighlighted: <div className="whitespace-pre-wrap break-words font-mono text-base leading-relaxed tracking-wide">{renderSpans(typedSpans)}</div>
  };
}

const useTimer = (durationSeconds, onExpire) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isActive, setIsActive] = useState(false);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    setIsActive(true);
    startTimeRef.current = Date.now();

    const update = () => {
      if (startTimeRef.current === null) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, durationSeconds - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsActive(false);
        startTimeRef.current = null;
        onExpire();
      }
    };

    update();
    intervalRef.current = setInterval(update, 1000);
  }, [durationSeconds, onExpire]);

  const stop = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  const reset = useCallback((newDuration) => {
    stop();
    setTimeLeft(newDuration);
  }, [stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { timeLeft, start, stop, reset, isActive };
};

export default function TypingExam() {
  const [selectedExercise, setSelectedExercise] = useState(exercises[0]);
  const [typedText, setTypedText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [report, setReport] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [layout, setLayout] = useState("layout1");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const DURATION_SEC = 900;

  const { timeLeft, start, stop, reset: resetTimer, isActive } = useTimer(DURATION_SEC, () => {
    if (!submitted && typedText.trim()) handleSubmit(true);
    else if (!submitted) alert("Time's up! Please type something before submitting.");
  });

  const textareaRef = useRef(null);

  const handleExerciseChange = (exercise) => {
    if (isActive || submitted) {
      alert("Please reset the current test before switching exercises.");
      return;
    }
    setSelectedExercise(exercise);
    setTypedText("");
    setSubmitted(false);
    setReport(null);
    setShowComparison(false);
    resetTimer(DURATION_SEC);
  };

  const handleSubmit = (isAuto = false) => {
    if (!isAuto && !typedText.trim()) {
      alert("Please type something before submitting.");
      return;
    }
    stop();

    const original = selectedExercise.text;
    const typed = typedText;

    const wordErrors = compareWords(original, typed);
    const wordErrorCount = wordErrors.length;
    const { omissions, extraChars } = getCharDiffAligned(original, typed);
    const missingSpaces = countIsolatedMissingSpaces(original, typed);
    const missingSpacesMistakes = Math.floor(missingSpaces / 5);
    const omissionsMistakes = Math.floor(omissions / 5);
    const totalMistakes = wordErrorCount + missingSpacesMistakes + omissionsMistakes + extraChars;
    let marks = 100 - totalMistakes * 1.8;
    if (marks < 0) marks = 0;
    marks = Math.floor(marks);

    setReport({
      wordErrors,
      wordErrorCount,
      missingSpaces,
      missingSpacesMistakes,
      omissions,
      omissionsMistakes,
      extraChars,
      totalMistakes,
      marks,
    });
    setSubmitted(true);
  };

  const handleReset = () => {
    setTypedText("");
    setSubmitted(false);
    setReport(null);
    setShowComparison(false);
    resetTimer(DURATION_SEC);
    stop();
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleStart = () => {
    if (submitted) handleReset();
    resetTimer(DURATION_SEC);
    start();
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (isActive && typedText.trim()) handleSubmit();
      else if (!isActive && !submitted) alert("Please start the test first.");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const renderPassage = () => (
    <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 p-6 h-full flex flex-col border border-gray-100">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">{selectedExercise.title}</h2>
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl flex-1">
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="text-xl">📄</span> Passage to Type
        </h3>
        <div className="whitespace-pre-wrap break-words font-mono text-base leading-relaxed tracking-wide text-gray-800">
          {selectedExercise.text}
        </div>
      </div>
    </div>
  );

  const renderResponse = () => (
    <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 p-6 h-full flex flex-col border border-gray-100">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
          <span className="text-xl">✍️</span> Your Typing
        </h3>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-full shadow-inner">
            <span className="font-mono text-2xl font-bold text-gray-800">{formatTime(timeLeft)}</span>
            <span className="text-sm text-gray-500 ml-1">remaining</span>
          </div>
          {!isActive && !submitted && (
            <button onClick={handleStart} className="px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium">
              Start Test
            </button>
          )}
          {isActive && !submitted && (
            <button onClick={() => handleSubmit()} className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium">
              Submit
            </button>
          )}
          {submitted && (
            <button onClick={handleReset} className="px-5 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium">
              New Test
            </button>
          )}
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={typedText}
        onChange={(e) => setTypedText(e.target.value)}
        disabled={!isActive || submitted}
        onKeyDown={handleKeyDown}
        rows={20}
        className="w-full p-4 border-2 border-gray-200 rounded-xl font-mono text-base focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed resize-y bg-gray-50 min-h-[900px]"
        placeholder={!isActive && !submitted ? "Press 'Start Test' to begin typing..." : ""}
      />
      {isActive && !submitted && (
        <div className="mt-3 text-sm text-gray-500 text-right flex items-center justify-end gap-2">
          <span className="inline-flex items-center gap-1">
            <kbd className="px-2 py-1 bg-gray-200 rounded-md shadow-sm font-mono text-xs">Ctrl</kbd> +
            <kbd className="px-2 py-1 bg-gray-200 rounded-md shadow-sm font-mono text-xs">Enter</kbd>
          </span>
          to submit
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full px-4 md:px-8 py-6 font-sans bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <h1 className="text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
        ⌨️ Eduserve Speed Typing Practice
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {sidebarOpen && (
          <div className="lg:w-80 bg-white rounded-2xl shadow-xl p-5 h-fit sticky top-6 transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📚</span> Exercises
              </h2>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
              {exercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleExerciseChange(ex)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                    selectedExercise.id === ex.id
                      ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-semibold shadow-md border-l-4 border-blue-500"
                      : "hover:bg-gray-50 text-gray-700 hover:shadow-sm"
                  } ${isActive ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  disabled={isActive}
                >
                  <div className="font-medium">{ex.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{ex.text.split(/\s+/).length} words</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 space-y-8">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all text-gray-700 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M5 5l7 7-7 7" />
              </svg>
              Show Exercises
            </button>
          )}

          <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-wrap items-center gap-6 border border-gray-100">
            <span className="font-semibold text-gray-700 text-lg">📐 Choose Your Layout:</span>
            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-full hover:bg-gray-100 transition">
              <input type="radio" name="layout" value="layout1" checked={layout === "layout1"} onChange={(e) => setLayout(e.target.value)} disabled={isActive} className="w-4 h-4 text-blue-600" />
              <span>Layout 1: Passage on left, Response on right</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-full hover:bg-gray-100 transition">
              <input type="radio" name="layout" value="layout2" checked={layout === "layout2"} onChange={(e) => setLayout(e.target.value)} disabled={isActive} className="w-4 h-4 text-blue-600" />
              <span>Layout 2: Response on left, Passage on right</span>
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {layout === "layout1" ? (
              <>
                {renderPassage()}
                {renderResponse()}
              </>
            ) : (
              <>
                {renderResponse()}
                {renderPassage()}
              </>
            )}
          </div>

          {submitted && report && (
            <div className="bg-white rounded-2xl shadow-xl p-6 overflow-x-auto border border-gray-100">
              <h2 className="text-2xl font-bold mb-5 text-gray-800 flex items-center gap-2">
                <span className="text-3xl">📊</span> Test Results
              </h2>
              <h3 className="text-xl font-semibold mb-4 text-gray-700">❌ Mistakes Breakdown</h3>

              <div className="mb-6">
                <div className="font-semibold text-lg text-gray-800 mb-2">Word Errors ({report.wordErrorCount})</div>
                {report.wordErrorCount > 0 ? (
                  <div className="max-h-52 overflow-y-auto mt-2 text-sm font-mono bg-gray-50 p-4 rounded-xl">
                    {report.wordErrors.slice(0, 50).map((err, idx) => (
                      <div key={idx} className="border-b border-gray-200 py-2 break-all flex flex-wrap gap-1">
                        <span className="text-red-600 font-medium">{err.original}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-orange-600">{err.typed}</span>
                      </div>
                    ))}
                    {report.wordErrors.length > 50 && <div className="text-gray-500 italic mt-2">... and {report.wordErrors.length - 50} more</div>}
                  </div>
                ) : (
                  <div className="text-green-600 bg-green-50 p-3 rounded-lg">🎉 No word errors! Perfect.</div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl shadow-sm">
                  <div className="font-semibold text-amber-800">
                    Missing Spaces ({report.missingSpaces} / 5 = {report.missingSpacesMistakes} mistake{report.missingSpacesMistakes !== 1 ? "s" : ""})
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Isolated spaces omitted: {report.missingSpaces}</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl shadow-sm">
                  <div className="font-semibold text-green-800">Extra Characters ({report.extraChars})</div>
                  <div className="text-sm text-gray-600 mt-1">Unnecessary characters typed: {report.extraChars}</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl shadow-sm md:col-span-2">
                  <div className="font-semibold text-red-800">
                    Omissions ({report.omissions} chars / 5 = {report.omissionsMistakes} mistake{report.omissionsMistakes !== 1 ? "s" : ""})
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Characters missing from original: {report.omissions}</div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-5 mt-2">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">📝 Summary</h3>
                <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-4 rounded-xl">
                  <div className="font-medium">Word Errors:</div><div>{report.wordErrorCount}</div>
                  <div className="font-medium">Omissions ({report.omissions} / 5):</div><div>{report.omissionsMistakes}</div>
                  <div className="font-medium">Missing Spaces ({report.missingSpaces} / 5):</div><div>{report.missingSpacesMistakes}</div>
                  <div className="font-medium">Extra Characters:</div><div>{report.extraChars}</div>
                  <div className="font-bold text-gray-800">Total Mistakes:</div><div className="font-bold text-red-600">{report.totalMistakes}</div>
                  <div className="font-bold text-gray-800">Marks = 100 – (Total Mistakes × 1.8):</div><div className="font-bold text-blue-600 text-lg">{report.marks}</div>
                </div>
              </div>

              <button onClick={() => setShowComparison(!showComparison)} className="mt-6 text-blue-600 hover:text-blue-800 underline-offset-4 hover:underline transition-all duration-200 font-medium flex items-center gap-1">
                {showComparison ? "🔽 Hide" : "🔼 Show"} Side‑by‑Side Comparison
              </button>

              {showComparison && (
                <div className="mt-5">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl shadow-md overflow-x-auto">
                      <div className="font-semibold mb-3 text-gray-800 text-lg">📜 Original Passage</div>
                      {highlightAllErrors(selectedExercise.text, typedText).originalHighlighted}
                      <div className="text-xs text-gray-500 mt-4 flex flex-wrap gap-4 border-t border-gray-200 pt-3">
                        <span><span className="bg-red-100 line-through text-red-800 px-1 rounded">a</span> = missing character</span>
                        <span><span className="border-b-2 border-dotted border-orange-500 font-bold">␣</span> = missing space</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl shadow-md overflow-x-auto">
                      <div className="font-semibold mb-3 text-gray-800 text-lg">✏️ Your Response</div>
                      {highlightAllErrors(selectedExercise.text, typedText).typedHighlighted}
                      <div className="text-xs text-gray-500 mt-4 flex flex-wrap gap-4 border-t border-gray-200 pt-3">
                        <span><span className="bg-green-100 text-green-800 px-1 rounded">a</span> = extra character</span>
                        <span><span className="bg-blue-100 px-1 rounded">␣</span> = extra space</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
