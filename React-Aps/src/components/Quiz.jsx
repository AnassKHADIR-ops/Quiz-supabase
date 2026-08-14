import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MathText from "./MathText.jsx";
import Results from "./Results.jsx";
import PrintExamModal from "./PrintExamModal.jsx";
import { examsApi, resultsApi } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { triggerConfetti } from "../lib/confetti.js";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  ClipboardList,
  HelpCircle,
  Hourglass,
  Inbox,
  ListIcon,
  PlayCircle,
  X,
  Zap,
  Flag,
  Star,
  Sparkles,
  Trophy,
  FileText,
  Printer
} from "./Icon.jsx";

// Durée totale de l'examen
const examTotalSeconds = (exam) => (exam.duration_minutes ? exam.duration_minutes * 60 : exam.questions.length * 90);
const formatDuration = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s} s`;
  return s > 0 ? `${m} min ${s} s` : `${m} min`;
};

// Persistance locale
const loadProgress = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const saveProgress = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
};
const clearProgress = (key) => {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
};

// Starred questions helper
const loadStarred = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(`starred_q:${userId || "guest"}`)) || [];
  } catch {
    return [];
  }
};
const toggleStarred = (userId, qId) => {
  const current = loadStarred(userId);
  const updated = current.includes(qId) ? current.filter((id) => id !== qId) : [...current, qId];
  try {
    localStorage.setItem(`starred_q:${userId || "guest"}`, JSON.stringify(updated));
  } catch { /* ignore */ }
  return updated;
};

/* ─────────────────────────────────────────
   Panneau latéral — toutes les questions
───────────────────────────────────────── */
function QuestionNavigator({ open, onClose, questions, current, answers, flagged, onJump }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  const answeredCount = answers.filter((a) => a !== null).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  return (
    <>
      <div className={`qnav-drawer-backdrop ${open ? "open" : ""}`} onClick={onClose} />
      <div className={`qnav-drawer ${open ? "open" : ""}`} role="dialog" aria-label="Navigation entre les questions">
        <div className="qnav-drawer-head">
          <div>
            <h3>Toutes les questions</h3>
            <p style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <span>{answeredCount} / {questions.length} répondues</span>
              {flaggedCount > 0 && <span style={{ color: "var(--warning)" }}>• {flaggedCount} marquée(s) 🚩</span>}
            </p>
          </div>
          <button className="qnav-drawer-close" onClick={onClose} aria-label="Fermer"><X size={16} /></button>
        </div>
        <div className="qnav-drawer-list">
          {questions.map((q, i) => {
            const isCurrent = i === current;
            const isAnswered = answers[i] !== null;
            const isFlagged = !!flagged[i];
            return (
              <button
                key={q.id}
                className={`qnav-drawer-item ${isCurrent ? "current" : ""} ${isAnswered ? "answered" : ""}`}
                onClick={() => onJump(i)}
              >
                <span className="qnav-drawer-num" style={{ background: isFlagged && !isCurrent ? "var(--warning-light)" : undefined, color: isFlagged && !isCurrent ? "var(--warning)" : undefined }}>
                  {isFlagged ? "🚩" : isAnswered && !isCurrent ? <Check size={13} /> : i + 1}
                </span>
                <span className="qnav-drawer-body">
                  <span className="qnav-drawer-preview"><MathText text={q.question_text || "Question sans énoncé"} /></span>
                  <span className="qnav-drawer-status" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isCurrent ? "En cours" : isAnswered ? "Répondu" : "Non répondu"}
                    {isFlagged && <span style={{ color: "var(--warning)", fontWeight: 700 }}>• À revoir</span>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   Minuterie globale (anneau SVG)
───────────────────────────────────────── */
function GlobalTimer({ secondsLeft, totalSeconds, mode = "exam" }) {
  if (mode === "practice") {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const ss = String(secondsLeft % 60).padStart(2, "0");
    return (
      <div className="timer-pill" style={{ borderColor: "var(--primary)" }}>
        <Clock size={20} style={{ color: "var(--primary)" }} />
        <div>
          <div className="timer-value" style={{ color: "var(--primary)" }}>{mm}:{ss}</div>
          <div className="timer-caption">mode entraînement</div>
        </div>
      </div>
    );
  }

  const radius = 22;
  const circ   = 2 * Math.PI * radius;
  const pct    = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const offset = circ * (1 - pct);

  const color =
    pct > 0.5 ? "var(--success)" :
    pct > 0.2 ? "var(--warning)" : "var(--danger)";

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const urgent = pct < 0.2;

  return (
    <div className={`timer-pill ${urgent ? "timer-pill--urgent" : ""}`}>
      <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="26" cy="26" r={radius} fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle
          cx="26" cy="26" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear, stroke .4s" }}
        />
      </svg>
      <div>
        <div className="timer-value" style={{ color }}>{mm}:{ss}</div>
        <div className="timer-caption">temps restant</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Écran de départ avec sélection de mode & Options d'Impression
───────────────────────────────────────── */
function ExamStartScreen({ exam, mode, setMode, onStart, onBack, onOpenPrint }) {
  const totalSec = examTotalSeconds(exam);
  const totalLabel = formatDuration(totalSec);
  const avgLabel = formatDuration(exam.questions.length > 0 ? Math.round(totalSec / exam.questions.length) : 0);
  
  const infoTiles = [
    { Icon: HelpCircle, val: exam.questions.length, label: "Questions" },
    { Icon: Hourglass, val: mode === "exam" ? totalLabel : "Illimité", label: mode === "exam" ? "Durée totale" : "Rythme libre" },
    { Icon: Zap, val: `~${avgLabel} / question`, label: "Régulation" },
  ];

  return (
    <div className="page-narrow" style={{ textAlign: "center", paddingTop: 30 }}>
      <div className="exam-icon-badge"><Clock size={30} /></div>

      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 8 }}>{exam.title}</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: "0.95rem" }}>
        Choisissez votre modalité de passage ou imprimez le sujet au format papier
      </p>

      {/* ── Boutons d'impression visibles & clairs ── */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text)" }}>
            📄 Export & Impression Papier A4
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
            Téléchargez ou imprimez pour vous entraîner hors-ligne
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onOpenPrint("statement")}
            style={{ fontWeight: 700 }}
          >
            <FileText size={15} /> Imprimer l'Énoncé Seul
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onOpenPrint("solution")}
            style={{ fontWeight: 700 }}
          >
            <Printer size={15} /> Sujet avec Corrigé Détaillé
          </button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 28, textAlign: "left" }}>
        <div
          className={`card ${mode === "exam" ? "active-mode-card" : ""}`}
          onClick={() => setMode("exam")}
          style={{
            cursor: "pointer",
            padding: "20px",
            border: mode === "exam" ? "2px solid var(--primary)" : "1px solid var(--border)",
            background: mode === "exam" ? "var(--surface-2)" : "var(--surface)",
            borderRadius: "var(--radius)",
            transition: "all .15s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: 6 }}>
              <Trophy size={18} /> Mode Concours
            </span>
            <span className="badge badge-warning">Officiel</span>
          </div>
          <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
            Conditions réelles de concours. Chronomètre strict ({totalLabel}) avec soumission automatique à la fin du temps.
          </p>
        </div>

        <div
          className={`card ${mode === "practice" ? "active-mode-card" : ""}`}
          onClick={() => setMode("practice")}
          style={{
            cursor: "pointer",
            padding: "20px",
            border: mode === "practice" ? "2px solid var(--success)" : "1px solid var(--border)",
            background: mode === "practice" ? "var(--surface-2)" : "var(--surface)",
            borderRadius: "var(--radius)",
            transition: "all .15s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--success)", display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={18} /> Mode Entraînement
            </span>
            <span className="badge badge-success">Pédagogique</span>
          </div>
          <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
            Apprenez à votre rythme sans stress de compte à rebours. Marquez les questions difficiles pour vos révisions.
          </p>
        </div>
      </div>

      <div className="exam-info-grid">
        {infoTiles.map(({ Icon, val, label }) => (
          <div key={label} className="card exam-info-tile">
            <Icon size={22} />
            <div className="exam-info-tile-value">{val}</div>
            <div className="exam-info-tile-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="card exam-rules">
        <p className="exam-rules-title"><ClipboardList size={17} /> Règles et astuces ergonomiques</p>
        <div className="exam-rules-item">
          <span>1.</span>
          Utilisez les touches <strong>[A], [B], [C], [D]</strong> ou <strong>[1-4]</strong> pour cocher vos réponses rapidement.
        </div>
        <div className="exam-rules-item">
          <span>2.</span>
          Appuyez sur <strong>[←]</strong> et <strong>[→]</strong> pour passer d'une question à l'autre.
        </div>
        <div className="exam-rules-item">
          <span>3.</span>
          Appuyez sur <strong>[F]</strong> pour marquer (🚩) une question et y revenir plus tard avant de soumettre.
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
        <button className="btn btn-secondary" onClick={onBack}><ArrowLeft size={16} /> Retour</button>
        <button className="btn btn-primary btn-lg" onClick={onStart}>
          <PlayCircle size={18} /> Lancer le quiz en ligne
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Quiz principal
───────────────────────────────────────── */
function Quiz() {
  const { examId } = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const storageKey = `quiz_progress:${user?.id || "anon"}:${examId}`;

  const [exam,        setExam]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [started,     setStarted]     = useState(false);
  const [mode,        setMode]        = useState("exam"); // "exam" | "practice"
  const [current,     setCurrent]     = useState(0);
  const [answers,     setAnswers]     = useState([]);
  const [flagged,     setFlagged]     = useState({}); // { [index]: boolean }
  const [starred,     setStarred]     = useState([]);
  const [submitted,   setSubmitted]   = useState(false);
  const [result,      setResult]      = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState("");
  const [navOpen,     setNavOpen]     = useState(false);
  const [printModal,  setPrintModal]  = useState({ open: false, mode: "statement" });

  // Timer global
  const [timeLeft,  setTimeLeft]  = useState(0);
  const [elapsed,   setElapsed]   = useState(0);
  const timerRef   = useRef(null);
  const startedAt  = useRef(null);
  const answersRef = useRef([]);
  const examRef    = useRef(null);

  useEffect(() => {
    setStarred(loadStarred(user?.id));
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await examsApi.get(examId);
        if (cancelled) return;
        setExam(data);
        examRef.current = data;

        const saved = loadProgress(storageKey);

        if (saved?.submittedResultId) {
          try {
            const details = await resultsApi.details(saved.submittedResultId);
            if (cancelled) return;
            setAnswers(Array(data.questions.length).fill(null));
            setResult(details);
            setSubmitted(true);
            setStarted(true);
            return;
          } catch {
            clearProgress(storageKey);
          }
        }

        if (saved?.started && Array.isArray(saved.answers) && saved.answers.length === data.questions.length) {
          const el = Math.max(0, Math.floor((Date.now() - new Date(saved.startedAt).getTime()) / 1000));
          answersRef.current = saved.answers;
          setAnswers(saved.answers);
          setFlagged(saved.flagged || {});
          setMode(saved.mode || "exam");
          setCurrent(Math.min(saved.current || 0, data.questions.length - 1));
          startedAt.current = saved.startedAt;
          setTimeLeft(Math.max(0, examTotalSeconds(data) - el));
          setElapsed(el);
          setStarted(true);
        } else {
          const fresh = Array(data.questions.length).fill(null);
          answersRef.current = fresh;
          setAnswers(fresh);
          setTimeLeft(examTotalSeconds(data));
          setElapsed(0);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [examId, storageKey]);

  /* ── Soumission ── */
  const doSubmit = useCallback(async () => {
    clearInterval(timerRef.current);
    const finalAnswers = answersRef.current;
    const ex = examRef.current;
    if (!ex) return;

    setSaving(true);
    try {
      const sub = await resultsApi.submit({
        exam_id: ex.id,
        started_at: startedAt.current,
        answers: ex.questions.map((q, i) => ({
          question_id: q.id,
          selected_choice_ids: finalAnswers[i] !== null ? [finalAnswers[i]] : [],
        })),
      });

      const details = await resultsApi.details(sub.id);
      setResult(details);
      setSubmitted(true);

      // Trigger confetti celebration on high score!
      if (details.percentage >= 75) {
        setTimeout(() => triggerConfetti(), 300);
      }

      saveProgress(storageKey, { submittedResultId: sub.id });
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }, [storageKey]);

  /* ── Minuterie ── */
  useEffect(() => {
    if (!started || submitted) return;

    timerRef.current = setInterval(() => {
      if (mode === "practice") {
        setElapsed((prev) => prev + 1);
      } else {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            doSubmit();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [started, submitted, mode, doSubmit]);

  /* ── Handlers ── */
  const handleSelect = (choiceId) => {
    if (submitted) return;
    const updated = [...answersRef.current];
    updated[current] = choiceId;
    answersRef.current = updated;
    setAnswers([...updated]);
    saveProgress(storageKey, { started: true, startedAt: startedAt.current, answers: updated, flagged, mode, current });
  };

  const goToQuestion = (index) => {
    if (index < 0 || !exam || index >= exam.questions.length) return;
    setCurrent(index);
    saveProgress(storageKey, { started: true, startedAt: startedAt.current, answers: answersRef.current, flagged, mode, current: index });
  };

  const toggleFlag = (idx = current) => {
    setFlagged((prev) => {
      const updated = { ...prev, [idx]: !prev[idx] };
      saveProgress(storageKey, { started: true, startedAt: startedAt.current, answers: answersRef.current, flagged: updated, mode, current });
      return updated;
    });
  };

  const handleToggleStar = (qId) => {
    const updated = toggleStarred(user?.id, qId);
    setStarred(updated);
  };

  const handleManualSubmit = () => {
    if (!answers.every((a) => a !== null)) {
      const remaining = exam.questions.length - answers.filter((a) => a !== null).length;
      const ok = window.confirm(
        `Il vous reste ${remaining} question(s) sans réponse. Elles ne seront pas comptées comme correctes. Soumettre quand même ?`
      );
      if (!ok) return;
    }
    doSubmit();
  };

  const handleRetry = () => {
    clearInterval(timerRef.current);
    const fresh = Array(exam.questions.length).fill(null);
    answersRef.current = fresh;
    setAnswers(fresh);
    setFlagged({});
    setSubmitted(false);
    setResult(null);
    setSaveError("");
    setCurrent(0);
    setTimeLeft(examTotalSeconds(exam));
    setElapsed(0);
    setStarted(false);
    clearProgress(storageKey);
  };

  /* ── Keyboard Shortcuts Listener ── */
  useEffect(() => {
    if (!started || submitted || !exam) return;

    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      const q = exam.questions[current];
      const choices = q?.choices || [];

      const keyUpper = e.key.toUpperCase();
      if (["A", "B", "C", "D"].includes(keyUpper)) {
        const idx = keyUpper.charCodeAt(0) - 65;
        if (choices[idx]) {
          e.preventDefault();
          handleSelect(choices[idx].id);
        }
      } else if (["1", "2", "3", "4"].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (choices[idx]) {
          e.preventDefault();
          handleSelect(choices[idx].id);
        }
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        goToQuestion(current + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goToQuestion(current - 1);
      } else if (keyUpper === "F") {
        e.preventDefault();
        toggleFlag(current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [started, submitted, exam, current]);

  /* ── Rendu ── */
  if (loading) return (
    <div className="center-msg">
      <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
    </div>
  );

  if (error) return (
    <div className="center-msg">
      <AlertTriangle size={40} style={{ color: "var(--danger)", marginBottom: 14 }} />
      <p className="error-msg" style={{ fontSize: "1rem" }}>{error}</p>
      <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate("/")}>
        <ArrowLeft size={16} /> Retour aux examens
      </button>
    </div>
  );

  if (exam && exam.questions.length === 0) return (
    <div className="center-msg">
      <Inbox size={40} style={{ color: "var(--text-faint)", marginBottom: 14 }} />
      <h3 style={{ marginBottom: 8 }}>Examen bientôt disponible</h3>
      <p style={{ marginBottom: 20 }}>Les questions de cet examen n'ont pas encore été ajoutées.</p>
      <button className="btn btn-secondary" onClick={() => navigate("/")}><ArrowLeft size={16} /> Retour</button>
    </div>
  );

  if (submitted && result) return (
    <Results exam={exam} result={result} onRetry={handleRetry} saveError={saveError} />
  );

  if (!started) return (
    <>
      <ExamStartScreen
        exam={exam}
        mode={mode}
        setMode={setMode}
        onStart={() => {
          const now = new Date().toISOString();
          startedAt.current = now;
          setStarted(true);
          saveProgress(storageKey, { started: true, startedAt: now, answers: answersRef.current, flagged, mode, current });
        }}
        onBack={() => navigate("/")}
        onOpenPrint={(printMode) => setPrintModal({ open: true, mode: printMode })}
      />
      {printModal.open && (
        <PrintExamModal
          exam={exam}
          initialMode={printModal.mode}
          onClose={() => setPrintModal({ open: false, mode: "statement" })}
        />
      )}
    </>
  );

  const q            = exam.questions[current];
  const allAnswered   = answers.every((a) => a !== null);
  const answeredCount = answers.filter((a) => a !== null).length;
  const progress      = ((current + 1) / exam.questions.length) * 100;
  const isLast        = current === exam.questions.length - 1;
  const totalSeconds  = examTotalSeconds(exam);
  const isStarred     = starred.includes(q.id);
  const isCurrentFlagged = !!flagged[current];

  return (
    <div className="page-narrow">
      {/* ── En-tête : titre + timer global + bouton impression ── */}
      <div className="quiz-header">
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <button
              onClick={() => navigate("/")}
              className="btn btn-secondary btn-sm"
            >
              <ArrowLeft size={14} /> Quitter
            </button>
            <button
              onClick={() => setPrintModal({ open: true, mode: "statement" })}
              className="btn btn-secondary btn-sm"
              title="Aperçu avant impression A4 de l'énoncé ou du corrigé"
            >
              <Printer size={14} /> Imprimer
            </button>
          </div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 800 }}>{exam.title}</h1>
          <p className="quiz-meta" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span>{answeredCount} / {exam.questions.length} répondues</span>
            <span className={`badge ${mode === "exam" ? "badge-warning" : "badge-success"}`}>
              {mode === "exam" ? "Mode Concours" : "Mode Entraînement"}
            </span>
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          <GlobalTimer
            secondsLeft={mode === "exam" ? timeLeft : elapsed}
            totalSeconds={totalSeconds}
            mode={mode}
          />
          <button className="btn btn-success btn-sm" onClick={handleManualSubmit} disabled={saving}>
            {saving
              ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: "white" }} /> Envoi…</>
              : <><Check size={14} /> Soumettre</>}
          </button>
        </div>
      </div>

      {/* Barre de progression globale */}
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Navigation numéros + accès au panneau complet */}
      <div className="quiz-nav-row">
        <div className="question-nav" style={{ marginBottom: 0 }}>
          {exam.questions.map((_, i) => (
            <button
              key={i}
              className={`qnav-dot ${i === current ? "current" : answers[i] !== null ? "answered" : ""} ${flagged[i] ? "flagged" : ""}`}
              onClick={() => goToQuestion(i)}
              title={`Question ${i + 1}${flagged[i] ? " (Marquée 🚩)" : ""}`}
              style={{
                position: "relative",
                borderColor: flagged[i] && i !== current ? "var(--warning)" : undefined,
                background: flagged[i] && i !== current ? "var(--warning-light)" : undefined,
                color: flagged[i] && i !== current ? "var(--warning-dark, #b45309)" : undefined,
              }}
            >
              {flagged[i] ? "🚩" : i + 1}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setNavOpen(true)} style={{ flexShrink: 0 }}>
          <ListIcon size={14} /> Toutes ({answeredCount}/{exam.questions.length})
        </button>
      </div>

      <QuestionNavigator
        open={navOpen}
        onClose={() => setNavOpen(false)}
        questions={exam.questions}
        current={current}
        answers={answers}
        flagged={flagged}
        onJump={(i) => { goToQuestion(i); setNavOpen(false); }}
      />

      {/* Carte question */}
      <div className="card question-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: ".06em" }}>
            QUESTION {current + 1} / {exam.questions.length}
            {q.topic && <span className="tag" style={{ marginLeft: 8 }}>{q.topic}</span>}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`btn btn-sm ${isCurrentFlagged ? "btn-warning" : "btn-secondary"}`}
              onClick={() => toggleFlag(current)}
              title="Marquer cette question pour vérification ultérieure (Raccourci: F)"
              style={{ padding: "4px 10px", fontSize: "0.78rem" }}
            >
              <Flag size={13} style={{ color: isCurrentFlagged ? "var(--warning)" : undefined }} />
              {isCurrentFlagged ? "Marquée 🚩" : "Marquer"}
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleToggleStar(q.id)}
              title={isStarred ? "Retirer des favoris" : "Ajouter aux favoris de révision"}
              style={{ padding: "4px 8px", color: isStarred ? "#f59e0b" : undefined }}
            >
              <Star size={14} fill={isStarred ? "#f59e0b" : "none"} />
            </button>
          </div>
        </div>

        <div className="question-text">
          <MathText text={q.question_text} />
        </div>

        <div className="choices">
          {q.choices.map((choice, cIdx) => {
            const letter = String.fromCharCode(65 + cIdx);
            return (
              <label
                key={choice.id}
                className={`choice ${answers[current] === choice.id ? "selected" : ""}`}
                onClick={() => handleSelect(choice.id)}
              >
                <div className="choice-badge-letter" style={{
                  width: 26,
                  height: 26,
                  borderRadius: "6px",
                  background: answers[current] === choice.id ? "var(--primary)" : "var(--surface-3)",
                  color: answers[current] === choice.id ? "white" : "var(--text)",
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  display: "grid",
                  placeItems: "center",
                  marginRight: 10,
                  flexShrink: 0,
                  transition: "all .12s"
                }}>
                  {letter}
                </div>
                <input type="radio" readOnly checked={answers[current] === choice.id} />
                <MathText text={choice.choice_text} />
              </label>
            );
          })}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="quiz-footer">
        <button
          className="btn btn-secondary"
          onClick={() => goToQuestion(current - 1)}
          disabled={current === 0}
        >
          <ArrowLeft size={16} /> Précédent
        </button>

        {!isLast ? (
          <button className="btn btn-primary" onClick={() => goToQuestion(current + 1)}>
            Suivant <ArrowRight size={16} />
          </button>
        ) : (
          <button
            className="btn btn-success"
            onClick={handleManualSubmit}
            disabled={saving}
          >
            {saving
              ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: "white" }} /> Envoi…</>
              : <><Check size={16} /> Soumettre</>}
          </button>
        )}
      </div>

      {/* Raccourcis clavier */}
      <div style={{
        marginTop: 18,
        padding: "8px 14px",
        borderRadius: "var(--radius-sm)",
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        fontSize: "0.76rem",
        color: "var(--text-muted)",
        flexWrap: "wrap"
      }}>
        <span>⌨️ <strong>Raccourcis :</strong></span>
        <span><kbd style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 5px", fontWeight: 700 }}>A-D</kbd> ou <kbd style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 5px", fontWeight: 700 }}>1-4</kbd> Répondre</span>
        <span><kbd style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 5px", fontWeight: 700 }}>←</kbd> <kbd style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 5px", fontWeight: 700 }}>→</kbd> Naviguer</span>
        <span><kbd style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 5px", fontWeight: 700 }}>F</kbd> Marquer 🚩</span>
      </div>

      {saveError && <p className="error-msg" style={{ marginTop: 12 }}>{saveError}</p>}
      {!allAnswered && isLast && (
        <p className="hint" style={{ marginTop: 12, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <AlertTriangle size={14} /> {exam.questions.length - answeredCount} question(s) sans réponse — vous pourrez choisir comment elles comptent dans votre score après soumission.
        </p>
      )}

      {printModal.open && (
        <PrintExamModal
          exam={exam}
          initialMode={printModal.mode}
          onClose={() => setPrintModal({ open: false, mode: "statement" })}
        />
      )}
    </div>
  );
}

export default Quiz;
