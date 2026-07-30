import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import exercises from "../../data/ExerciseData";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Link } from "react-router-dom";

const TARGET_WORDS = 100;

const expandExerciseText = (text, targetWords = TARGET_WORDS) => {
  const words = text.trim().split(/\s+/);
  if (words.length >= targetWords) return text;
  const repetitions = Math.ceil(targetWords / words.length);
  let expanded = "";
  for (let i = 0; i < repetitions; i++) {
    expanded += text + (i < repetitions - 1 ? "\n" : "");
  }
  return expanded.trim();
};

const expandedExercises = exercises.map(ex => ({
  ...ex,
  expandedText: expandExerciseText(ex.text, TARGET_WORDS)
}));

const useCountdownTimer = (initialSeconds, active, onExpire) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);
  const activeRef = useRef(active);
  const pausedRef = useRef(paused);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    activeRef.current = active;
    pausedRef.current = paused;
    onExpireRef.current = onExpire;
  }, [active, paused, onExpire]);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!active || paused) {
      clearTimer();
      return;
    }
    if (timeLeft <= 0) {
      clearTimer();
      onExpireRef.current();
      return;
    }
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearTimer();
            onExpireRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return clearTimer;
  }, [active, paused, timeLeft]);

  const reset = useCallback((newSeconds) => {
    clearTimer();
    setTimeLeft(newSeconds);
  }, []);

  const pause = () => setPaused(true);
  const resume = () => setPaused(false);
  const isPaused = paused;

  useEffect(() => clearTimer, []);

  return { timeLeft, reset, pause, resume, isPaused };
};

const useTypingTest = (exercise, durationSec) => {
  const [typedText, setTypedText] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [result, setResult] = useState(null);

  const finishTest = useCallback((extraStats = {}) => {
    if (!isActive) return;
    setIsActive(false);
    const originalWords = exercise.expandedText.trim().split(/\s+/);
    const typedWords = typedText.trim().split(/\s+/);
    let correct = 0, wrong = 0;
    const wrongWordsList = [];
    originalWords.forEach((word, idx) => {
      if (typedWords[idx] === word) correct++;
      else if (typedWords[idx] !== undefined) {
        wrong++;
        wrongWordsList.push({ expected: word, got: typedWords[idx] });
      }
    });
    const omission = Math.max(originalWords.length - typedWords.length, 0);
    const extra = Math.max(typedWords.length - originalWords.length, 0);
    const accuracy = (correct / originalWords.length) * 100;
    const minutesUsed = durationSec / 60;
    const wpm = Math.round(typedWords.length / minutesUsed);
    setResult({
      correct, wrong, omission, extra,
      accuracy: parseFloat(accuracy.toFixed(2)), wpm,
      wrongWordsList,
      exerciseTitle: exercise.title,
      timestamp: new Date().toLocaleString(),
      ...extraStats,
    });
  }, [exercise.expandedText, typedText, isActive, durationSec, exercise.title]);

  const start = () => {
    setTypedText("");
    setResult(null);
    setIsActive(true);
  };
  const reset = () => {
    setIsActive(false);
    setTypedText("");
    setResult(null);
  };
  return { typedText, setTypedText, isActive, result, start, finishTest, reset };
};

const WordHighlighter = React.forwardRef(({ originalText, typedText }, ref) => {
  const originalLines = useMemo(() => originalText.trim().split(/\r?\n/), [originalText]);
  const typedWords = useMemo(() => typedText.trim().split(/\s+/), [typedText]);
  const allOriginalWords = useMemo(() => originalText.trim().split(/\s+/), [originalText]);
  let wordIndex = 0;
  return (
    <div ref={ref} className="flex flex-col gap-1">
      {originalLines.map((line, lineIdx) => {
        const lineWords = line.trim().split(/\s+/);
        if (lineWords.length === 1 && lineWords[0] === "") return null;
        return (
          <div key={lineIdx} className="flex flex-wrap gap-1">
            {lineWords.map((word, wordIdx) => {
              const currentWordIndex = wordIndex++;
              let wordClassName = "text-lg font-medium px-0.5 py-0.5 rounded whitespace-pre";
              const isTyped = currentWordIndex < typedWords.length;
              const isCurrent = currentWordIndex === typedWords.length - 1 && typedWords.length <= allOriginalWords.length;
              if (isTyped) {
                wordClassName += typedWords[currentWordIndex] === word
                  ? " text-green-700 bg-green-100"
                  : " text-red-600 bg-red-100";
              }
              if (isCurrent) wordClassName += " bg-yellow-200 shadow-[0_0_0_2px_#eab308]";
              return (
                <span key={wordIdx} className={wordClassName} data-current={isCurrent ? "true" : undefined}>
                  {word}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
});

const TypingPractice = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [duration, setDuration] = useState(() => {
    const saved = localStorage.getItem("typingDuration");
    return saved ? parseInt(saved, 10) : 900;
  });
  const [showWarning, setShowWarning] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shareFeedback, setShareFeedback] = useState("");
  const [hideVideos, setHideVideos] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem("typingUserName") || "");

  const [originalTestResult, setOriginalTestResult] = useState(null);
  const [practiceResult, setPracticeResult] = useState(null);
  const [customExercise, setCustomExercise] = useState(null);
  const [showCombinedResults, setShowCombinedResults] = useState(false);

  const [backspaceCount, setBackspaceCount] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [copyPasteCount, setCopyPasteCount] = useState(0);

  const currentExercise = customExercise || expandedExercises[currentIdx];
  const isCustom = !!customExercise;

  const textareaRef = useRef(null);
  const wordDisplayRef = useRef(null);
  const wordContainerRef = useRef(null);
  const resultsRef = useRef(null);

  const { typedText, setTypedText, isActive, result, start, finishTest, reset } = useTypingTest(currentExercise, duration);

  const originalWordCount = currentExercise.expandedText.trim().split(/\s+/).length;
  const typedWordCount = typedText.trim().split(/\s+/).filter(w => w.length > 0).length;
  const hasCompletedAllWords = typedWordCount >= originalWordCount;

  useEffect(() => {
    if (!isActive || !wordContainerRef.current) return;
    const currentElement = wordContainerRef.current.querySelector("[data-current='true']");
    if (currentElement && wordDisplayRef.current) {
      currentElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
  }, [typedText, isActive]);

  const autoNextExercise = useCallback(() => {
    if (currentIdx + 1 < expandedExercises.length) {
      setCurrentIdx(prev => prev + 1);
      reset();
      setOriginalTestResult(null);
      setPracticeResult(null);
      setCustomExercise(null);
      setShowCombinedResults(false);
    }
  }, [currentIdx, reset]);

  const onTimerExpire = useCallback(() => {
    if (isActive) {
      finishTest({ backspaceCount, pauseCount, copyPasteCount });
    }
  }, [isActive, finishTest, backspaceCount, pauseCount, copyPasteCount]);

  const { timeLeft, reset: resetTimer, pause, resume, isPaused } = useCountdownTimer(duration, isActive, onTimerExpire);

  useEffect(() => {
    if (!isActive) {
      resetTimer(duration);
    }
  }, [duration, isActive, resetTimer]);

  useEffect(() => {
    if (isActive && textareaRef.current && !isPaused) textareaRef.current.focus();
  }, [isActive, isPaused]);

  useEffect(() => {
    const handleBackspace = (e) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (isActive) {
          setBackspaceCount(prev => prev + 1);
        }
        alert("⚠️ Backspace is disabled! Please do not delete characters.");
      }
    };
    window.addEventListener("keydown", handleBackspace);
    return () => window.removeEventListener("keydown", handleBackspace);
  }, [isActive]);

  useEffect(() => {
    const disableAndCount = (e) => {
      if (e.type === "copy" || e.type === "cut" || e.type === "paste") {
        e.preventDefault();
        if (isActive) {
          setCopyPasteCount(prev => prev + 1);
        }
        let message = "";
        if (e.type === "copy") message = "📋 Copying is disabled.";
        if (e.type === "cut") message = "✂️ Cutting is disabled.";
        if (e.type === "paste") message = "📌 Pasting is disabled.";
        alert(message);
      }
    };

    const disableContextMenu = (e) => {
      e.preventDefault();
      alert("🖱️ Right-click is disabled.");
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        if (isActive) {
          setCopyPasteCount(prev => prev + 1);
        }
        let message = "";
        if (e.key === 'c') message = "📋 Copying (Ctrl+C) is disabled.";
        if (e.key === 'v') message = "📌 Pasting (Ctrl+V) is disabled.";
        if (e.key === 'x') message = "✂️ Cutting (Ctrl+X) is disabled.";
        alert(message);
      }
    };

    document.addEventListener("copy", disableAndCount);
    document.addEventListener("cut", disableAndCount);
    document.addEventListener("paste", disableAndCount);
    document.addEventListener("contextmenu", disableContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("copy", disableAndCount);
      document.removeEventListener("cut", disableAndCount);
      document.removeEventListener("paste", disableAndCount);
      document.removeEventListener("contextmenu", disableContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive]);

  useEffect(() => {
    if (result && !isActive) {
      if (!isCustom) {
        if (result.wrongWordsList.length > 0) {
          setOriginalTestResult(result);
          setPracticeResult(null);
          setShowCombinedResults(false);
        } else {
          setOriginalTestResult(result);
          setPracticeResult(null);
          setShowCombinedResults(true);
          if (autoNext) {
            autoNextExercise();
          }
        }
      } else {
        setPracticeResult(result);
        setShowCombinedResults(true);
      }
    }
  }, [result, isActive, isCustom, autoNext, autoNextExercise]);

  const startWeakWordsPractice = () => {
    if (!originalTestResult || originalTestResult.wrongWordsList.length === 0) return;
    const wrongWords = originalTestResult.wrongWordsList.map(item => item.expected);
    const repeatedWords = [];
    wrongWords.forEach(word => {
      for (let i = 0; i < 3; i++) {
        repeatedWords.push(word);
      }
    });
    let practiceText = repeatedWords.join(" ");
    const customEx = {
      title: `Weak Words: ${originalTestResult.exerciseTitle}`,
      expandedText: expandExerciseText(practiceText, TARGET_WORDS),
    };
    setCustomExercise(customEx);
    reset();
    resetTimer(duration);
    setShowWarning(false);
    setShowCombinedResults(false);
    setBackspaceCount(0);
    setPauseCount(0);
    setCopyPasteCount(0);
  };

  const cancelPractice = () => {
    setCustomExercise(null);
    setOriginalTestResult(null);
    setPracticeResult(null);
    setShowCombinedResults(false);
    reset();
    resetTimer(duration);
    setBackspaceCount(0);
    setPauseCount(0);
    setCopyPasteCount(0);
  };

  const handleExerciseClick = (index) => {
    if (isActive) {
      setShowWarning(true);
      return;
    }
    if (originalTestResult && !practiceResult && !isCustom) {
      alert("Please complete the weak words practice first.");
      return;
    }
    setCurrentIdx(index);
    reset();
    resetTimer(duration);
    setShowWarning(false);
    setOriginalTestResult(null);
    setPracticeResult(null);
    setCustomExercise(null);
    setShowCombinedResults(false);
    setBackspaceCount(0);
    setPauseCount(0);
    setCopyPasteCount(0);
  };

  const handleStart = () => {
    if (originalTestResult && !practiceResult && !isCustom) {
      alert("You have pending weak words practice. Please complete it first.");
      return;
    }
    let finalName = userName.trim();
    if (!finalName) {
      finalName = prompt("Please enter your name before starting the test:") || "";
      if (!finalName.trim()) {
        alert("Name is required.");
        return;
      }
      setUserName(finalName);
      localStorage.setItem("typingUserName", finalName);
    }
    resetTimer(duration);
    setBackspaceCount(0);
    setPauseCount(0);
    setCopyPasteCount(0);
    start();
    setShowWarning(false);
  };

  const handlePause = () => {
    if (isActive && !isPaused) {
      setPauseCount(prev => prev + 1);
    }
    pause();
    if (textareaRef.current) textareaRef.current.blur();
  };

  const handleResume = () => {
    resume();
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleFinish = () => {
    if (!hasCompletedAllWords) {
      alert("❗ You must complete typing all words before finishing the test.");
      return;
    }
    finishTest({ backspaceCount, pauseCount, copyPasteCount });
  };

  const handleDurationChange = (e) => {
    const newDuration = Number(e.target.value);
    setDuration(newDuration);
    localStorage.setItem("typingDuration", newDuration);
    if (!isActive) resetTimer(newDuration);
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === "Enter" && isActive && hasCompletedAllWords) {
      handleFinish();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getVideoUrls = (exercise) => {
    if (exercise.videos && Array.isArray(exercise.videos)) return exercise.videos;
    const urls = [];
    for (const key in exercise) {
      if (key.toLowerCase().startsWith("video") && typeof exercise[key] === "string") urls.push(exercise[key]);
    }
    return [...new Set(urls)];
  };

  const renderResultHTML = (res, title) => {
    const wrongWordsHtml = res.wrongWordsList && res.wrongWordsList.length
      ? `<div><strong>Wrong Words:</strong><ul>${res.wrongWordsList.slice(0, 20).map(w => `<li>"${w.expected}" → "${w.got}"</li>`).join("")}</ul></div>`
      : "<p><em>No wrong words! Perfect!</em></p>";
    const backspaceStat = res.backspaceCount !== undefined ? `<div style="background:#fce4d6; padding:8px;">⌫ Backspaces: ${res.backspaceCount}</div>` : "";
    const pauseStat = res.pauseCount !== undefined ? `<div style="background:#e2f0d9; padding:8px;">⏸️ Pauses: ${res.pauseCount}</div>` : "";
    const copyStat = res.copyPasteCount !== undefined ? `<div style="background:#ffe0b3; padding:8px;">📋 Copy/Paste attempts: ${res.copyPasteCount}</div>` : "";
    return `
      <div style="margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 12px;">
        <h2 style="color:#2563eb;">📊 ${title}</h2>
        <p><strong>Exercise:</strong> ${res.exerciseTitle}</p>
        <p><strong>Date:</strong> ${res.timestamp}</p>
        <p><strong>Duration:</strong> ${duration / 60} minutes</p>
        <div style="display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin: 15px 0;">
          <div style="background:#e6f7e6; padding:8px;">✅ Correct: ${res.correct}</div>
          <div style="background:#ffe6e6; padding:8px;">❌ Wrong: ${res.wrong}</div>
          <div style="background:#fff3e0; padding:8px;">🟡 Omitted: ${res.omission}</div>
          <div style="background:#e0f0ff; padding:8px;">🔵 Extra: ${res.extra}</div>
          <div style="background:#f0e6ff; padding:8px;">📈 Accuracy: ${res.accuracy}%</div>
          <div style="background:#e6f0ff; padding:8px;">⚡ WPM: ${res.wpm}</div>
          ${backspaceStat}
          ${pauseStat}
          ${copyStat}
        </div>
        ${wrongWordsHtml}
      </div>
    `;
  };

  const downloadCombinedPDF = async () => {
    if (!originalTestResult && !practiceResult) return;
    const combinedDiv = document.createElement("div");
    combinedDiv.style.padding = "20px";
    combinedDiv.style.fontFamily = "sans-serif";
    combinedDiv.style.backgroundColor = "white";
    combinedDiv.style.width = "800px";
    combinedDiv.innerHTML = `
      <h1 style="text-align:center; color:#1e3a8a;">⌨️ Typing Test Report</h1>
      <p style="text-align:center;"><strong>Name:</strong> ${userName.trim() || "Anonymous"}</p>
      <hr/>
      ${originalTestResult ? renderResultHTML(originalTestResult, "Original Test") : ""}
      ${practiceResult ? renderResultHTML(practiceResult, "Weak Words Practice") : ""}
    `;
    document.body.appendChild(combinedDiv);
    try {
      const canvas = await html2canvas(combinedDiv, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      if (imgHeight > pageHeight) {
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -pageHeight, imgWidth, imgHeight);
      }
      pdf.save(`combined_typing_${userName.trim().replace(/\s+/g, "_")}.pdf`);
      setShareFeedback("Combined PDF saved!");
      setTimeout(() => setShareFeedback(""), 2000);
    } catch (err) {
      console.error(err);
      setShareFeedback("Failed to create PDF.");
    } finally {
      document.body.removeChild(combinedDiv);
    }
  };

  const formatResultForTXT = (res, title) => {
    let wrongStr = "";
    if (res.wrongWordsList && res.wrongWordsList.length) {
      wrongStr = "\nWrong Words:\n";
      res.wrongWordsList.forEach((item, i) => { wrongStr += `${i + 1}. Expected: "${item.expected}" → Got: "${item.got}"\n`; });
    } else {
      wrongStr = "\nNo wrong words!\n";
    }
    return `
${title}
──────────────────────────────────
Exercise: ${res.exerciseTitle}
Duration: ${duration / 60} min
Correct: ${res.correct} | Wrong: ${res.wrong} | Omitted: ${res.omission} | Extra: ${res.extra}
Accuracy: ${res.accuracy}% | WPM: ${res.wpm}
Backspaces: ${res.backspaceCount || 0} | Pauses: ${res.pauseCount || 0} | Copy/Paste attempts: ${res.copyPasteCount || 0}
${wrongStr}
`;
  };

  const downloadCombinedTXT = () => {
    if (!originalTestResult && !practiceResult) return;
    const nameStr = userName.trim() || "Anonymous";
    let content = `Typing Test Report (Combined)\nName: ${nameStr}\nDate: ${new Date().toLocaleString()}\n──────────────────────────────────\n\n`;
    if (originalTestResult) content += formatResultForTXT(originalTestResult, "Original Test");
    if (practiceResult) content += formatResultForTXT(practiceResult, "Weak Words Practice");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `combined_typing_${nameStr.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareCombinedResults = async () => {
    const shareText = `Typing test on "${originalTestResult?.exerciseTitle}" – Accuracy: ${originalTestResult?.accuracy}%, WPM: ${originalTestResult?.wpm}, Backspaces: ${originalTestResult?.backspaceCount || 0}, Pauses: ${originalTestResult?.pauseCount || 0}, Copy/Paste attempts: ${originalTestResult?.copyPasteCount || 0}. Practice completed.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Combined Typing Results", text: shareText });
        setShareFeedback("Shared!");
      } catch (err) { if (err.name !== "AbortError") fallbackCopy(shareText); }
    } else { fallbackCopy(shareText); }
    setTimeout(() => setShareFeedback(""), 2000);
  };
  const fallbackCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => setShareFeedback("Copied!")).catch(() => setShareFeedback("Failed"));
  };

  const videoUrls = getVideoUrls(currentExercise);
  const showVideoSection = videoUrls.length > 0 && !hideVideos;
  const showResultsPanel = showCombinedResults && (originalTestResult || practiceResult);
  const pendingPractice = originalTestResult && !practiceResult && !isCustom && originalTestResult.wrongWordsList?.length > 0;

  return (
    <div className="max-w-[1600px] mx-auto my-8 p-6 font-sans bg-gray-50 rounded-2xl shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">⌨️ Eduserve Typing Centre</h1>
      <Link to="/student/typing-exam" className="bg-blue-600 text-white text-sm px-5 py-3 rounded-lg hover:bg-blue-700 transition w-full text-center block mb-4">
        Speed Typing Practice (Both junior and Senior available) - Click here to practice your typing speed
      </Link>
      <div className="flex justify-end mb-2">
        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
          <span className="text-sm text-gray-600">👤 Name:</span>
          <input type="text" value={userName} onChange={(e) => { setUserName(e.target.value); localStorage.setItem("typingUserName", e.target.value); }} placeholder="Your name" className="border-b border-gray-300 focus:border-blue-500 outline-none px-1 py-0.5 text-sm" disabled={isActive} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`${sidebarOpen ? 'w-full lg:w-80' : 'w-auto'} transition-all duration-300`}>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                Exercises ({expandedExercises.length})
              </h3>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700 lg:hidden">{sidebarOpen ? "←" : "→"}</button>
            </div>
            {sidebarOpen && (
              <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                {expandedExercises.map((ex, idx) => (
                  <button key={idx} onClick={() => handleExerciseClick(idx)} className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${currentIdx === idx && !customExercise ? "bg-blue-50 border-l-4 border-l-blue-500 text-blue-700" : "hover:bg-gray-50 text-gray-700"} ${isActive || pendingPractice ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`} disabled={isActive || pendingPractice}>
                    <div className="font-medium">{ex.title}</div>
                    <div className="text-xs text-gray-500 mt-1 truncate">{ex.expandedText.split(/\s+/).length} words</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {currentExercise.title}
                {isCustom && <span className="ml-2 text-sm bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Practice</span>}
              </h2>
              <div className="flex flex-wrap gap-2">
                {isCustom && (
                  <button onClick={cancelPractice} className="px-3 py-2 text-sm font-medium bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">← Back to exercises</button>
                )}
                <select value={duration} onChange={handleDurationChange} className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" disabled={isActive && !isPaused}>
                  <option value={900}>15 minutes</option><option value={1800}>30 minutes</option><option value={2700}>45 minutes</option><option value={3600}>60 minutes</option>
                </select>
                {!isActive ? (
                  <button onClick={handleStart} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Start Test</button>
                ) : (
                  <>
                    {!isPaused ? <button onClick={handlePause} className="px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition">Pause</button> : <button onClick={handleResume} className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">Resume</button>}
                    <button
                      onClick={handleFinish}
                      disabled={!hasCompletedAllWords}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition ${hasCompletedAllWords
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-gray-400 text-gray-200 cursor-not-allowed"
                        }`}
                      title={!hasCompletedAllWords ? "Type all words before finishing" : "Finish test"}
                    >
                      Finish
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg px-4 py-2 text-center mb-4">
              <span className="text-lg">⏱️ Time left: </span><strong className="text-2xl font-mono">{formatTime(timeLeft)}</strong>
              {isPaused && <span className="ml-2 text-amber-600 font-semibold">(Paused)</span>}
              {isActive && !hasCompletedAllWords && (
                <div className="text-sm text-blue-600 mt-1">⌨️ Typed {typedWordCount} / {originalWordCount} words</div>
              )}
            </div>

            <div className="mb-4 p-2 bg-gray-50 rounded-lg flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none"><input type="checkbox" checked={autoNext} onChange={(e) => setAutoNext(e.target.checked)} disabled={isActive} className="w-4 h-4" /> Auto‑next exercise</label>
              {videoUrls.length > 0 && <label className="flex items-center gap-2 text-sm cursor-pointer select-none"><input type="checkbox" checked={hideVideos} onChange={(e) => setHideVideos(e.target.checked)} className="w-4 h-4" /> Hide Videos</label>}
            </div>

            {showWarning && (
              <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 p-3 rounded flex justify-between items-center">
                <span className="text-amber-700">⚠️ Test in progress. Finish before switching exercises.</span>
                <button onClick={() => setShowWarning(false)} className="text-amber-600 font-bold">Dismiss</button>
              </div>
            )}

            {pendingPractice && !isCustom && (
              <div className="mb-4 bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                <p className="text-purple-800 font-medium">📝 You made {originalTestResult.wrongWordsList.length} mistake(s).</p>
                <p className="text-sm text-purple-600 mb-2">You must practice these weak words before seeing your results.</p>
                <button onClick={startWeakWordsPractice} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">📝 Start Weak Words Practice</button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-4">
              <div>
                {showVideoSection && (
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-600 mb-2">🎥 Instruction Video{videoUrls.length > 1 ? 's' : ''}</div>
                    <div className="space-y-3">{videoUrls.map((url, idx) => <video key={idx} controls className="w-full rounded-lg border border-gray-200" src={url}><source src={url} type="video/mp4" /></video>)}</div>
                  </div>
                )}
                <div className="text-sm font-semibold text-gray-600 mb-2">📖 Reference Text</div>
                <div ref={wordDisplayRef} className="bg-white border border-gray-200 rounded-lg p-4 min-h-[400px] max-h-[500px] overflow-y-auto font-mono">
                  <WordHighlighter ref={wordContainerRef} originalText={currentExercise.expandedText} typedText={typedText} />
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-2">✍️ Your Typing</div>
                <textarea ref={textareaRef} value={typedText} onChange={(e) => setTypedText(e.target.value)} disabled={!isActive || isPaused} onKeyDown={handleKeyDown} placeholder={isActive ? (isPaused ? "Test paused – press Resume" : "Start typing here...") : "Press 'Start Test' to begin"} className="w-full text-base p-3 rounded-lg border border-gray-300 font-mono resize-y min-h-[400px] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" rows={15} spellCheck={false} />
              </div>
            </div>

            {showResultsPanel && (
              <div className="mt-5 bg-white rounded-xl border border-gray-200 p-4">
                <div ref={resultsRef}>
                  <div className="flex flex-wrap justify-between items-center mb-3 no-print">
                    <h3 className="font-bold text-lg">📊 Complete Report (Test + Practice)</h3>
                    <div className="flex gap-2">
                      <button onClick={downloadCombinedTXT} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition">⬇️ TXT</button>
                      <button onClick={downloadCombinedPDF} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition">📄 PDF</button>
                      <button onClick={shareCombinedResults} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition">📤 Share</button>
                    </div>
                  </div>
                  {shareFeedback && <div className="mb-2 text-sm text-green-600 font-medium no-print">{shareFeedback}</div>}
                  <div className="mb-3 text-lg font-semibold text-gray-800">Name: {userName.trim() || "Anonymous"}</div>

                  {originalTestResult && (
                    <div className="mb-6">
                      <h4 className="font-bold text-md text-blue-700 mb-2">📋 Original Test: {originalTestResult.exerciseTitle}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-green-50 p-2 rounded">✅ Correct: {originalTestResult.correct}</div>
                        <div className="bg-red-50 p-2 rounded">❌ Wrong: {originalTestResult.wrong}</div>
                        <div className="bg-yellow-50 p-2 rounded">🟡 Omitted: {originalTestResult.omission}</div>
                        <div className="bg-blue-50 p-2 rounded">🔵 Extra: {originalTestResult.extra}</div>
                        <div className="bg-purple-50 p-2 rounded">📈 Accuracy: {originalTestResult.accuracy}%</div>
                        <div className="bg-indigo-50 p-2 rounded">⚡ WPM: {originalTestResult.wpm}</div>
                        <div className="bg-orange-50 p-2 rounded">⌫ Backspaces: {originalTestResult.backspaceCount || 0}</div>
                        <div className="bg-teal-50 p-2 rounded">⏸️ Pauses: {originalTestResult.pauseCount || 0}</div>
                        <div className="bg-amber-50 p-2 rounded">📋 Copy/Paste: {originalTestResult.copyPasteCount || 0}</div>
                      </div>
                      <div className="wrong-words-list mt-2"><h5 className="font-semibold text-sm">Wrong Words:</h5>{originalTestResult.wrongWordsList.length === 0 ? <p className="text-green-600 text-sm">None</p> : <div className="max-h-32 overflow-y-auto text-sm space-y-1">{originalTestResult.wrongWordsList.slice(0, 20).map((item, idx) => <div key={idx} className="font-mono"><span className="text-red-600">"{item.expected}"</span> → <span className="text-orange-600"> "{item.got}"</span></div>)}</div>}</div>
                    </div>
                  )}
                  {practiceResult && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-bold text-md text-purple-700 mb-2">📝 Weak Words Practice</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-green-50 p-2 rounded">✅ Correct: {practiceResult.correct}</div>
                        <div className="bg-red-50 p-2 rounded">❌ Wrong: {practiceResult.wrong}</div>
                        <div className="bg-yellow-50 p-2 rounded">🟡 Omitted: {practiceResult.omission}</div>
                        <div className="bg-blue-50 p-2 rounded">🔵 Extra: {practiceResult.extra}</div>
                        <div className="bg-purple-50 p-2 rounded">📈 Accuracy: {practiceResult.accuracy}%</div>
                        <div className="bg-indigo-50 p-2 rounded">⚡ WPM: {practiceResult.wpm}</div>
                        <div className="bg-orange-50 p-2 rounded">⌫ Backspaces: {practiceResult.backspaceCount || 0}</div>
                        <div className="bg-teal-50 p-2 rounded">⏸️ Pauses: {practiceResult.pauseCount || 0}</div>
                        <div className="bg-amber-50 p-2 rounded">📋 Copy/Paste: {practiceResult.copyPasteCount || 0}</div>
                      </div>
                      <div className="wrong-words-list mt-2"><h5 className="font-semibold text-sm">Wrong Words in Practice:</h5>{practiceResult.wrongWordsList.length === 0 ? <p className="text-green-600 text-sm">Perfect practice!</p> : <div className="max-h-32 overflow-y-auto text-sm space-y-1">{practiceResult.wrongWordsList.slice(0, 20).map((item, idx) => <div key={idx} className="font-mono"><span className="text-red-600">"{item.expected}"</span> → <span className="text-orange-600"> "{item.got}"</span></div>)}</div>}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingPractice;
