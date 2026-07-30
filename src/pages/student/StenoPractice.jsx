import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import exercises from "../../data/StenoExerciseData";

function compareWords(original, typed) {
  const oWords = original.trim().split(/\s+/);
  const tWords = typed.trim().split(/\s+/);
  const errors = [];
  const minLen = Math.min(oWords.length, tWords.length);
  for (let i = 0; i < minLen; i++) {
    if (oWords[i] !== tWords[i]) errors.push({ original: oWords[i], typed: tWords[i] });
  }
  return errors;
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
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    startTimeRef.current = null;
  }, []);

  const reset = useCallback((newDuration) => { stop(); setTimeLeft(newDuration); }, [stop]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return { timeLeft, start, stop, reset, isActive };
};

const speedOptions = [80, 100, 120];
const categoryOptions = ["All", "Junior", "Senior"];

const CanvasWhiteboard = forwardRef(({ disabled }, ref) => {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#1e3a8a");
  const [lineWidth, setLineWidth] = useState(3);

  useImperativeHandle(ref, () => ({
    getCanvasDataUrl: () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL("image/png");
    },
    clearCanvas: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    if (disabled) return;
    e.preventDefault();
    setDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!drawing || disabled) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const endDraw = (e) => {
    e.preventDefault();
    setDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const colors = ["#1e3a8a", "#dc2626", "#059669", "#d97706", "#7c3aed", "#000"];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {colors.map(c => (
          <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border-2 ${color === c ? "border-gray-800 scale-125" : "border-gray-300"} transition`} style={{ backgroundColor: c }} />
        ))}
        {[2, 4, 6, 8].map(w => (
          <button key={w} onClick={() => setLineWidth(w)} className={`px-2 py-1 text-xs rounded ${lineWidth === w ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>{w}px</button>
        ))}
        <button onClick={clearCanvas} className="ml-auto px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200">Clear</button>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        className="w-full h-64 border-2 border-gray-300 rounded-xl bg-white touch-none"
      />
    </div>
  );
});

export default function StenoPractice() {
  const [mode, setMode] = useState("audio-stroke");
  const [selectedExercise, setSelectedExercise] = useState(exercises[0]);
  const [typedText, setTypedText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [report, setReport] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [speedFilter, setSpeedFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);
  const [showComparison, setShowComparison] = useState(false);
  const [evalMarks, setEvalMarks] = useState("");
  const [evalComments, setEvalComments] = useState("");

  const wbRef1 = useRef(null);
  const wbRef2 = useRef(null);
  const wbRef3 = useRef(null);

  const DURATION_SEC = 600;

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      if (speedFilter !== "All" && ex.speed !== Number(speedFilter)) return false;
      if (categoryFilter !== "All" && ex.category !== categoryFilter) return false;
      return true;
    });
  }, [speedFilter, categoryFilter]);

  useEffect(() => {
    if (filteredExercises.length > 0 && !filteredExercises.find(e => e.id === selectedExercise.id)) {
      setSelectedExercise(filteredExercises[0]);
      resetExercise();
    }
  }, [filteredExercises]);

  const { timeLeft, start, stop, reset: resetTimer, isActive } = useTimer(DURATION_SEC, () => {
    if (!submitted && typedText.trim()) handleSubmit(true);
  });

  const textareaRef = useRef(null);

  const resetExercise = () => {
    setTypedText("");
    setSubmitted(false);
    setReport(null);
    setShowComparison(false);
    resetTimer(DURATION_SEC);
    stop();
  };

  const handleExerciseChange = (exercise) => {
    if (isActive || submitted) { alert("Reset the current test first."); return; }
    setSelectedExercise(exercise);
    resetExercise();
  };

  const getModeText = useCallback(() => {
    if (mode === "stroke-passage") return selectedExercise.strokeText || selectedExercise.passageText;
    if (mode === "passage-stroke") return selectedExercise.passageText;
    return selectedExercise.passageText;
  }, [mode, selectedExercise]);

  const getTargetText = useCallback(() => {
    if (mode === "stroke-passage") return selectedExercise.passageText;
    if (mode === "passage-stroke") return selectedExercise.strokeText || selectedExercise.passageText;
    return selectedExercise.strokeText || selectedExercise.passageText;
  }, [mode, selectedExercise]);

  const handleSubmit = (isAuto = false) => {
    if (!isAuto && !typedText.trim()) { alert("Type something before submitting."); return; }
    stop();
    const target = getTargetText();
    const original = target;
    const typed = typedText;
    const wordErrors = compareWords(original, typed);
    const typedWords = typed.trim().split(/\s+/).filter(w => w.length > 0);
    const minutesUsed = DURATION_SEC / 60;
    const wpm = Math.round(typedWords.length / minutesUsed);
    const accuracy = original.trim().split(/\s+/).length > 0
      ? parseFloat((((original.trim().split(/\s+/).length - wordErrors.length) / original.trim().split(/\s+/).length) * 100).toFixed(2))
      : 0;

    setReport({
      wordErrors,
      wordErrorCount: wordErrors.length,
      totalWords: original.trim().split(/\s+/).length,
      typedWordCount: typedWords.length,
      wpm,
      accuracy: accuracy > 0 ? accuracy : 0,
    });
    setSubmitted(true);
    if (audioRef.current) { audioRef.current.pause(); setAudioPlaying(false); }
  };

  const handleStart = () => {
    if (submitted) resetExercise();
    resetTimer(DURATION_SEC);
    start();
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (isActive && typedText.trim()) handleSubmit();
    }
  };

  const getActiveWbRef = () => {
    if (mode === "audio-stroke") return wbRef1;
    return wbRef2;
  };

  const downloadPDF = async () => {
    const wbRef = getActiveWbRef();
    const canvasData = wbRef.current?.getCanvasDataUrl();

    const pdfDiv = document.createElement("div");
    pdfDiv.style.padding = "30px";
    pdfDiv.style.fontFamily = "sans-serif";
    pdfDiv.style.backgroundColor = "white";
    pdfDiv.style.width = "800px";
    pdfDiv.style.color = "#000";
    pdfDiv.innerHTML = `
      <h1 style="text-align:center; color:#1e3a8a;">Steno Practice Report</h1>
      <hr/>
      <p><strong>Mode:</strong> ${modeLabel[mode]}</p>
      <p><strong>Exercise:</strong> ${selectedExercise.title}</p>
      <p><strong>Speed:</strong> ${selectedExercise.speed} WPM</p>
      <p><strong>Category:</strong> ${selectedExercise.category}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      <hr/>
      <h2 style="color:#2563eb;">Passage</h2>
      <p style="background:#f3f4f6; padding:10px; border-radius:6px;">${selectedExercise.passageText}</p>
      <h2 style="color:#2563eb;">Stroke Notation</h2>
      <p style="background:#fef3c7; padding:10px; border-radius:6px;">${selectedExercise.strokeText || "N/A"}</p>
      <h2 style="color:#2563eb;">Your Typed Answer</h2>
      <p style="background:#f3f4f6; padding:10px; border-radius:6px;">${typedText || "(none)"}</p>
      <hr/>
      <h2 style="color:#2563eb;">Automated Evaluation</h2>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>WPM</strong></td><td style="padding:6px; border:1px solid #ddd;">${report?.wpm || "N/A"}</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Accuracy</strong></td><td style="padding:6px; border:1px solid #ddd;">${report?.accuracy || "N/A"}%</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Errors</strong></td><td style="padding:6px; border:1px solid #ddd;">${report?.wordErrorCount || "N/A"}</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Words Typed</strong></td><td style="padding:6px; border:1px solid #ddd;">${report?.typedWordCount || "N/A"} / ${report?.totalWords || "N/A"}</td></tr>
      </table>
      ${report?.wordErrorCount > 0 ? `
        <h3 style="color:#dc2626;">Word Errors</h3>
        <ul>${report.wordErrors.slice(0, 20).map(e => `<li><span style="color:#16a34a;">Expected:</span> ${e.original} <span style="color:#dc2626;">→ Your: ${e.typed}</span></li>`).join("")}</ul>
      ` : "<p style='color:#16a34a;'><strong>No errors!</strong></p>"}
      <hr/>
      <h2 style="color:#2563eb;">Manual Evaluation (for Teacher)</h2>
      <p><strong>Marks given (out of 100):</strong> _______________</p>
      <p><strong>Comments:</strong> _______________</p>
      <p>_______________</p>
      <p>_______________</p>
      <p><strong>Evaluated by:</strong> _______________</p>
      <p><strong>Date:</strong> _______________</p>
    `;

    if (canvasData) {
      const img = document.createElement("img");
      img.src = canvasData;
      img.style.width = "100%";
      img.style.maxWidth = "700px";
      img.style.border = "1px solid #ddd";
      img.style.borderRadius = "6px";
      img.style.marginTop = "10px";
      const br = document.createElement("br");
      const label = document.createElement("h2");
      label.style.color = "#2563eb";
      label.textContent = "Whiteboard Drawing";
      pdfDiv.appendChild(label);
      pdfDiv.appendChild(img);
    }

    document.body.appendChild(pdfDiv);
    try {
      const canvas = await html2canvas(pdfDiv, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      const fileName = `steno_report_${selectedExercise.title.replace(/\s+/g, "_")}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      document.body.removeChild(pdfDiv);
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current || !selectedExercise.audioUrl) return;
    if (audioPlaying) { audioRef.current.pause(); setAudioPlaying(false); }
    else { audioRef.current.play(); setAudioPlaying(true); }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const modeLabel = {
    "audio-stroke": "Audio → Stroke",
    "stroke-passage": "Stroke → Passage",
    "passage-stroke": "Passage → Stroke",
  };

  const modeInstructions = {
    "audio-stroke": "Listen to the dictation audio and write/practice the shorthand strokes below.",
    "stroke-passage": "See the shorthand strokes below and type the English passage.",
    "passage-stroke": "Read the English passage and write/type the shorthand strokes.",
  };

  return (
    <div className="w-full px-4 md:px-8 py-6 font-sans bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <h1 className="text-4xl font-extrabold mb-4 text-center bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
        Steno Practice
      </h1>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {Object.entries(modeLabel).map(([key, label]) => (
          <button key={key} onClick={() => { if (!isActive) { setMode(key); resetExercise(); } else alert("Finish the current test first."); }}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
              mode === key ? "bg-indigo-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-gray-500 mb-6">{modeInstructions[mode]}</p>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="lg:w-80 bg-white rounded-2xl shadow-xl p-5 h-fit sticky top-6 transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Exercises</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Speed</label>
                <select value={speedFilter} onChange={(e) => setSpeedFilter(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="All">All Speeds</option>
                  {speedOptions.map(s => <option key={s} value={s}>{s} WPM</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-450px)] pr-1">
              {filteredExercises.length === 0 && (
                <div className="text-sm text-gray-400 text-center py-4">No exercises match filters. Add content in StenoExerciseData.js</div>
              )}
              {filteredExercises.map((ex) => (
                <button key={ex.id} onClick={() => handleExerciseChange(ex)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                    selectedExercise.id === ex.id
                      ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-semibold shadow-md border-l-4 border-blue-500"
                      : "hover:bg-gray-50 text-gray-700 hover:shadow-sm"
                  } ${isActive ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  disabled={isActive}
                >
                  <div className="font-medium">{ex.title}</div>
                  <div className="text-xs text-gray-400 mt-1 flex gap-2">
                    <span>{ex.speed} WPM</span><span>•</span><span>{ex.category}</span><span>•</span><span>{ex.wordCount || ex.passageText.split(/\s+/).length} words</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 space-y-6">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg text-gray-700 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M5 5l7 7-7 7" />
              </svg>
              Show Exercises
            </button>
          )}

          {/* Controls bar */}
          <div className="flex flex-wrap items-center gap-4 bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-full shadow-inner">
              <span className="font-mono text-2xl font-bold text-gray-800">{formatTime(timeLeft)}</span>
              <span className="text-sm text-gray-500 ml-1">remaining</span>
            </div>
            <div className="text-sm text-gray-500">
              Target: <strong>{selectedExercise.speed} WPM</strong> • {selectedExercise.category}
            </div>
            <div className="ml-auto flex gap-2">
              {(mode === "audio-stroke" && selectedExercise.audioUrl) && (
                <button onClick={toggleAudio} className={`px-4 py-2 rounded-full font-medium transition-all shadow-md ${audioPlaying ? "bg-red-500 text-white hover:bg-red-600" : "bg-indigo-500 text-white hover:bg-indigo-600"}`}>
                  {audioPlaying ? "Stop" : "Play"} Dictation
                </button>
              )}
              {!isActive && !submitted && (
                <button onClick={handleStart} className="px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 shadow-md font-medium">
                  Start Test
                </button>
              )}
              {isActive && !submitted && (
                <button onClick={() => handleSubmit()} className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 shadow-md font-medium">
                  Submit
                </button>
              )}
              {submitted && (
                <button onClick={() => { resetExercise(); if (textareaRef.current) textareaRef.current.focus(); }} className="px-5 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full hover:from-gray-600 hover:to-gray-700 shadow-md font-medium">
                  New Test
                </button>
              )}
            </div>
          </div>

          {/* Mode-specific content */}
          {mode === "audio-stroke" && (
            <>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-2">
                  {selectedExercise.strokeImageUrl ? "Reference Strokes" : "Stroke Practice Area"}
                </h2>
                {selectedExercise.strokeImageUrl ? (
                  <img src={selectedExercise.strokeImageUrl} alt="Reference strokes" className="w-full max-w-xl mx-auto rounded-lg border border-gray-200" />
                ) : (
                  <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-500">
                    Add a <code>strokeImageUrl</code> to display reference stroke images here. For now, you can practice writing strokes in the whiteboard below.
                  </div>
                )}
                {selectedExercise.strokeText && (
                  <details className="mt-3">
                    <summary className="text-sm text-blue-600 cursor-pointer">Show stroke text notation</summary>
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg font-mono text-sm">{selectedExercise.strokeText}</div>
                  </details>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Whiteboard — Practice Writing Strokes</h3>
                <CanvasWhiteboard ref={wbRef1} disabled={false} />
              </div>
            </>
          )}

          {mode === "stroke-passage" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Shorthand Strokes</h2>
              {selectedExercise.strokeImageUrl ? (
                <img src={selectedExercise.strokeImageUrl} alt="Shorthand strokes" className="w-full max-w-xl mx-auto rounded-lg border border-gray-200 mb-4" />
              ) : (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-5 rounded-xl mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Stroke Notation</h3>
                  <div className="whitespace-pre-wrap break-words font-mono text-base leading-relaxed tracking-wide text-gray-800">
                    {selectedExercise.strokeText || selectedExercise.passageText}
                  </div>
                </div>
              )}
              <div className="text-sm text-gray-500 mt-2">Type the English translation of these strokes below.</div>
            </div>
          )}

          {mode === "passage-stroke" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-2">English Passage</h2>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl">
                <div className="whitespace-pre-wrap break-words font-mono text-base leading-relaxed tracking-wide text-gray-800">
                  {selectedExercise.passageText}
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-2">Write/type the shorthand strokes for this passage below.</div>
            </div>
          )}

          {/* Text input area */}
          {mode !== "audio-stroke" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  {mode === "stroke-passage" ? "Your English Translation" : "Your Strokes"}
                </h3>
                {isActive && !submitted && (
                  <span className="text-xs text-gray-400">
                    <kbd className="px-2 py-1 bg-gray-200 rounded shadow-sm font-mono text-xs">Ctrl</kbd>+<kbd className="px-2 py-1 bg-gray-200 rounded shadow-sm font-mono text-xs">Enter</kbd> to submit
                  </span>
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                disabled={!isActive || submitted}
                onKeyDown={handleKeyDown}
                rows={12}
                className="w-full p-4 border-2 border-gray-200 rounded-xl font-mono text-base focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed resize-y bg-gray-50 min-h-[300px]"
                placeholder={!isActive && !submitted ? "Press 'Start Test' to begin..." : ""}
              />
            </div>
          )}

          {/* Whiteboard always available for stroke practice */}
          {mode === "audio-stroke" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700">Your Strokes (Text)</h3>
                {isActive && !submitted && (
                  <span className="text-xs text-gray-400">
                    <kbd className="px-2 py-1 bg-gray-200 rounded shadow-sm font-mono text-xs">Ctrl</kbd>+<kbd className="px-2 py-1 bg-gray-200 rounded shadow-sm font-mono text-xs">Enter</kbd> to submit
                  </span>
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                disabled={!isActive || submitted}
                onKeyDown={handleKeyDown}
                rows={8}
                className="w-full p-4 border-2 border-gray-200 rounded-xl font-mono text-base focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed resize-y bg-gray-50"
                placeholder={!isActive && !submitted ? "Press 'Start Test' to begin..." : "Or type stroke notation here..."}
              />
            </div>
          )}

          {/* Results */}
          {submitted && report && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-2xl font-bold mb-5 text-gray-800">Test Results</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-indigo-50 p-4 rounded-xl shadow-sm">
                  <div className="text-2xl font-bold text-indigo-700">{report.wpm}</div>
                  <div className="text-sm text-gray-600">WPM</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl shadow-sm">
                  <div className="text-2xl font-bold text-green-700">{report.accuracy}%</div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl shadow-sm">
                  <div className="text-2xl font-bold text-red-700">{report.wordErrorCount}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl shadow-sm">
                  <div className="text-2xl font-bold text-blue-700">{report.typedWordCount}/{report.totalWords}</div>
                  <div className="text-sm text-gray-600">Words</div>
                </div>
              </div>

              {report.wordErrorCount > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">Word Errors</h3>
                  <div className="max-h-40 overflow-y-auto text-sm font-mono bg-gray-50 p-4 rounded-xl">
                    {report.wordErrors.slice(0, 30).map((err, idx) => (
                      <div key={idx} className="border-b border-gray-200 py-1">
                        <span className="text-green-600 font-medium">Expected:</span> {err.original}
                        <span className="text-gray-400 mx-2">→</span>
                        <span className="text-red-600">Your: {err.typed}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.wordErrorCount === 0 && (
                <div className="bg-green-50 p-4 rounded-xl text-green-700 font-semibold text-center">
                  No errors! Perfect.
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-4">
                <button onClick={downloadPDF} className="px-5 py-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md font-medium transition flex items-center gap-2">
                  Download PDF Report
                </button>
              </div>

              <details className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
                <summary className="px-4 py-3 bg-gray-50 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100">
                  Manual Evaluation (for Teacher)
                </summary>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Marks (out of 100)</label>
                    <input type="number" min="0" max="100" value={evalMarks} onChange={(e) => setEvalMarks(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter marks..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Comments</label>
                    <textarea value={evalComments} onChange={(e) => setEvalComments(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Teacher's comments..." />
                  </div>
                </div>
              </details>

              <button onClick={() => setShowComparison(!showComparison)} className="mt-4 text-blue-600 hover:text-blue-800 underline-offset-4 hover:underline font-medium">
                {showComparison ? "Hide" : "Show"} Comparison
              </button>

              {showComparison && (
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="font-semibold mb-2 text-gray-700">Expected ({mode === "stroke-passage" ? "Passage" : "Strokes"})</div>
                    <div className="whitespace-pre-wrap font-mono text-sm">{getTargetText()}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="font-semibold mb-2 text-gray-700">Your Answer</div>
                    <div className="whitespace-pre-wrap font-mono text-sm">{typedText}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Whiteboard always visible for stroke practice */}
          {mode !== "audio-stroke" && (
            <details className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <summary className="px-6 py-4 text-lg font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">
                Whiteboard — Practice Strokes
              </summary>
              <div className="p-6 pt-2">
                <CanvasWhiteboard ref={wbRef2} disabled={false} />
              </div>
            </details>
          )}
        </div>
      </div>

      {selectedExercise.audioUrl && (
        <audio ref={audioRef} src={selectedExercise.audioUrl} onEnded={() => setAudioPlaying(false)} className="hidden" />
      )}
    </div>
  );
}
