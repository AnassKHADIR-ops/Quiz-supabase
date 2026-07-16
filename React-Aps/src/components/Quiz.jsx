import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MathText from "./MathText.jsx";
import Results from "./Results.jsx";
import { examsApi, resultsApi } from "../api.js";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Clock, ClipboardList, HelpCircle, Hourglass, Inbox, ListIcon, PlayCircle, X, Zap } from "./Icon.jsx";

// Durée totale de l'examen : celle fixée par le professeur (duration_minutes),
// avec un repli à 90s/question pour les anciens QCM créés sans durée.
const examTotalSeconds = (exam) => (exam.duration_minutes ? exam.duration_minutes * 60 : exam.questions.length * 90);
const formatDuration = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s} s`;
  return s > 0 ? `${m} min ${s} s` : `${m} min`;
};
/* ─────────────────────────────────────────
   Panneau latéral — toutes les questions
───────────────────────────────────────── */
function QuestionNavigator({ open, onClose, questions, current, answers, onJump }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  const answeredCount = answers.filter((a) => a !== null).length;

  return (
    <>
      <div className={`qnav-drawer-backdrop ${open ? "open" : ""}`} onClick={onClose} />
      <div className={`qnav-drawer ${open ? "open" : ""}`} role="dialog" aria-label="Navigation entre les questions">
        <div className="qnav-drawer-head">
          <div>
            <h3>Toutes les questions</h3>
            <p>{answeredCount} / {questions.length} répondues</p>
          </div>
          <button className="qnav-drawer-close" onClick={onClose} aria-label="Fermer"><X size={16} /></button>
        </div>
        <div className="qnav-drawer-list">
          {questions.map((q, i) => {
            const isCurrent = i === current;
            const isAnswered = answers[i] !== null;
            return (
              <button
                key={q.id}
                className={`qnav-drawer-item ${isCurrent ? "current" : ""} ${isAnswered ? "answered" : ""}`}
                onClick={() => onJump(i)}
              >
                <span className="qnav-drawer-num">{isAnswered && !isCurrent ? <Check size={13} /> : i + 1}</span>
                <span className="qnav-drawer-body">
                  <span className="qnav-drawer-preview"><MathText text={q.question_text || "Question sans énoncé"} /></span>
                  <span className="qnav-drawer-status">{isCurrent ? "En cours" : isAnswered ? "Répondu" : "Non répondu"}</span>
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
function GlobalTimer({ secondsLeft, totalSeconds }) {
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
   Écran de départ
───────────────────────────────────────── */
function ExamStartScreen({ exam, onStart, onBack }) {
  const totalSec = examTotalSeconds(exam);
  const totalLabel = formatDuration(totalSec);
  const avgLabel = formatDuration(exam.questions.length > 0 ? Math.round(totalSec / exam.questions.length) : 0);
  const infoTiles = [
    { Icon: HelpCircle, val: exam.questions.length, label: "Questions" },
    { Icon: Hourglass, val: totalLabel, label: "Durée totale" },
    { Icon: Zap, val: `~${avgLabel} / question`, label: "Régulation" },
  ];
  const rules = [
    `Le chronomètre démarre au lancement et compte ${totalLabel} en continu pour l'ensemble des ${exam.questions.length} question(s).`,
    "Naviguer entre les questions ne réinitialise PAS le chronomètre.",
    "À la fin du temps, l'examen est soumis automatiquement.",
    "Aucune modification n'est possible après la soumission.",
    "Les questions sans réponse comptent comme incorrectes.",
  ];
  return (
    <div className="page-narrow" style={{ textAlign: "center", paddingTop: 60 }}>
      <div className="exam-icon-badge"><Clock size={30} /></div>

      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 8 }}>{exam.title}</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 36, fontSize: "1rem" }}>
        Lisez les conditions avant de commencer
      </p>

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
        <p className="exam-rules-title"><ClipboardList size={17} /> Règles de l'examen</p>
        {rules.map((rule, i) => (
          <div key={i} className="exam-rules-item">
            <span>{i + 1}.</span>
            {rule}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button className="btn btn-secondary" onClick={onBack}><ArrowLeft size={16} /> Retour</button>
        <button className="btn btn-primary btn-lg" onClick={onStart}>
          <PlayCircle size={18} /> Lancer l'examen
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

  const [exam,      setExam]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [started,   setStarted]   = useState(false);
  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result,    setResult]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");
  const [navOpen,   setNavOpen]   = useState(false);

  // Timer global — une seule valeur pour tout l'examen
  const [timeLeft,  setTimeLeft]  = useState(0);
  const timerRef   = useRef(null);
  const startedAt  = useRef(null);
  // Référence stable vers les réponses courantes (évite des closures périmées)
  const answersRef = useRef([]);
  const examRef    = useRef(null);

  useEffect(() => {
    examsApi.get(examId)
      .then((data) => {
        setExam(data);
        examRef.current = data;
        setAnswers(Array(data.questions.length).fill(null));
        answersRef.current = Array(data.questions.length).fill(null);
        setTimeLeft(examTotalSeconds(data));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [examId]);

  /* ── Soumission (stable, ne dépend que des refs) ── */
  const doSubmit = useCallback(async () => {
    clearInterval(timerRef.current);
    const finalAnswers = answersRef.current;
    const ex = examRef.current;
    if (!ex) return;

    setSaving(true);
    try {
      // 1) Soumettre l'examen
      const submitted = await resultsApi.submit({
        // Supabase uses UUID exam IDs; converting them with Number() produces null.
        exam_id: ex.id,
        started_at: startedAt.current,
        answers: ex.questions.map((q, i) => ({
          question_id: q.id,
          selected_choice_ids: finalAnswers[i] !== null ? [finalAnswers[i]] : [],
        })),
      });
      // 2) Charger la correction complète (choix avec is_correct + solution_text)
      const details = await resultsApi.details(submitted.id);
      setResult(details);
      setSubmitted(true);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }, [examId]);

  /* ── Lancer le timer UNE SEULE FOIS au démarrage ── */
  useEffect(() => {
    if (!started || submitted) return;

    // Démarrage du compte à rebours global
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          doSubmit(); // Temps écoulé → soumettre
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // NE PAS mettre `current` ici — le timer ne repart JAMAIS sur un changement de question
  }, [started, submitted, doSubmit]);

  /* ── Handlers ── */
  const handleSelect = (choiceId) => {
    if (submitted) return;
    const updated = [...answersRef.current];
    updated[current] = choiceId;
    answersRef.current = updated;
    setAnswers([...updated]);
  };

  const handleManualSubmit = () => doSubmit();

  const handleRetry = () => {
    clearInterval(timerRef.current);
    const fresh = Array(exam.questions.length).fill(null);
    answersRef.current = fresh;
    setAnswers(fresh);
    setSubmitted(false);
    setResult(null);
    setSaveError("");
    setCurrent(0);
    setTimeLeft(examTotalSeconds(exam));
    setStarted(false);
  };

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
    <ExamStartScreen
      exam={exam}
      onStart={() => {
        startedAt.current = new Date().toISOString();
        setStarted(true);
      }}
      onBack={() => navigate("/")}
    />
  );

  const q            = exam.questions[current];
  const allAnswered   = answers.every((a) => a !== null);
  const answeredCount = answers.filter((a) => a !== null).length;
  const progress      = ((current + 1) / exam.questions.length) * 100;
  const isLast        = current === exam.questions.length - 1;
  const totalSeconds  = examTotalSeconds(exam);

  return (
    <div className="page-narrow">
      {/* ── En-tête : titre + timer global ── */}
      <div className="quiz-header">
        <div>
          <button
            onClick={() => navigate("/")}
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: 10 }}
          >
            <ArrowLeft size={14} /> Quitter
          </button>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 800 }}>{exam.title}</h1>
          <p className="quiz-meta">
            {answeredCount} / {exam.questions.length} réponses données
          </p>
        </div>

        {/* Timer — ne se réinitialise PAS au changement de question */}
        <GlobalTimer secondsLeft={timeLeft} totalSeconds={totalSeconds} />
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
              className={`qnav-dot ${i === current ? "current" : answers[i] !== null ? "answered" : ""}`}
              onClick={() => setCurrent(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setNavOpen(true)} style={{ flexShrink: 0 }}>
          <ListIcon size={14} /> Toutes les questions
        </button>
      </div>

      <QuestionNavigator
        open={navOpen}
        onClose={() => setNavOpen(false)}
        questions={exam.questions}
        current={current}
        answers={answers}
        onJump={(i) => { setCurrent(i); setNavOpen(false); }}
      />

      {/* Carte question */}
      <div className="card question-card">
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, letterSpacing: ".06em" }}>
          QUESTION {current + 1} / {exam.questions.length}
        </div>
        <div className="question-text">
          <MathText text={q.question_text} />
        </div>
        <div className="choices">
          {q.choices.map((choice) => (
            <label
              key={choice.id}
              className={`choice ${answers[current] === choice.id ? "selected" : ""}`}
              onClick={() => handleSelect(choice.id)}
            >
              <div className="choice-radio" />
              <input type="radio" readOnly checked={answers[current] === choice.id} />
              <MathText text={choice.choice_text} />
            </label>
          ))}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="quiz-footer">
        <button
          className="btn btn-secondary"
          onClick={() => setCurrent((c) => c - 1)}
          disabled={current === 0}
        >
          <ArrowLeft size={16} /> Précédent
        </button>

        {!isLast ? (
          <button className="btn btn-primary" onClick={() => setCurrent((c) => c + 1)}>
            Suivant <ArrowRight size={16} />
          </button>
        ) : (
          <button
            className="btn btn-success"
            onClick={handleManualSubmit}
            disabled={!allAnswered || saving}
          >
            {saving
              ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: "white" }} /> Envoi…</>
              : <><Check size={16} /> Soumettre</>}
          </button>
        )}
      </div>

      {saveError && <p className="error-msg" style={{ marginTop: 12 }}>{saveError}</p>}
      {!allAnswered && isLast && (
        <p className="hint" style={{ marginTop: 12, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <AlertTriangle size={14} /> Répondez à toutes les questions avant de soumettre.
        </p>
      )}
    </div>
  );
}

export default Quiz;
