import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MathText from "./MathText.jsx";
import Results from "./Results.jsx";
import { examsApi, resultsApi } from "../api.js";

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
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: urgent ? "var(--danger-light)" : "var(--surface-2)",
      border: `1.5px solid ${urgent ? "var(--danger)" : "var(--border)"}`,
      borderRadius: "var(--radius)",
      padding: "10px 16px",
      transition: "all .4s",
      animation: urgent ? "pulse 1s infinite" : "none",
      flexShrink: 0,
    }}>
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
      <div style={{ lineHeight: 1.1 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "1.4rem",
          fontWeight: 700,
          color,
          letterSpacing: "-.02em",
          transition: "color .4s",
        }}>
          {mm}:{ss}
        </div>
        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>
          temps restant
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Écran de départ
───────────────────────────────────────── */
function ExamStartScreen({ exam, onStart, onBack }) {
  const totalSec = exam.questions.length * 90;
  const totalMin = Math.floor(totalSec / 60);
  const totalRemSec = totalSec % 60;
  const totalLabel = totalRemSec > 0 ? `${totalMin} min ${totalRemSec} s` : `${totalMin} min`;
  return (
    <div className="page-narrow" style={{ textAlign: "center", paddingTop: 60 }}>
      <div style={{
        width: 80, height: 80,
        background: "var(--gradient)",
        borderRadius: "var(--radius-lg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "2.2rem",
        margin: "0 auto 24px",
        boxShadow: "var(--shadow-lg)",
      }}>⏱</div>

      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 8 }}>{exam.title}</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 36, fontSize: "1rem" }}>
        Lisez les conditions avant de commencer
      </p>

      {/* Infos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 36 }}>
        {[
          { icon: "❓", val: exam.questions.length,  label: "Questions" },
          { icon: "⏳", val: totalLabel,               label: "Durée totale" },
          { icon: "⚡", val: "1 min 30 s / question", label: "Régulation" },
        ].map((item) => (
          <div key={item.label} className="card" style={{ padding: "18px 12px", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: "var(--primary)" }}>
              {item.val}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600 }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Règles */}
      <div className="card" style={{ textAlign: "left", marginBottom: 32, padding: "22px 24px" }}>
        <p style={{ fontWeight: 700, marginBottom: 12, fontSize: "0.9rem" }}>📋 Règles de l'examen :</p>
        {[
          `Le chronomètre démarre au lancement et compte ${totalLabel} en continu (1 min 30 s × ${exam.questions.length} questions).`,
          "Naviguer entre les questions ne réinitialise PAS le chronomètre.",
          "À la fin du temps, l'examen est soumis automatiquement.",
          "Aucune modification n'est possible après la soumission.",
          "Les questions sans réponse comptent comme incorrectes.",
        ].map((rule, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: "0.875rem", color: "var(--text-muted)" }}>
            <span style={{ color: "var(--primary)", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
            {rule}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button className="btn btn-secondary" onClick={onBack}>← Retour</button>
        <button className="btn btn-primary btn-lg" onClick={onStart}>
          Lancer l'examen ▶
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
        setTimeLeft(data.questions.length * 90); // 1 min par question
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
        exam_id: Number(examId),
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
    const len = exam.questions.length;
    const fresh = Array(len).fill(null);
    answersRef.current = fresh;
    setAnswers(fresh);
    setSubmitted(false);
    setResult(null);
    setSaveError("");
    setCurrent(0);
    setTimeLeft(len * 60);
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
      <div className="empty-state-icon">⚠️</div>
      <p className="error-msg" style={{ fontSize: "1rem" }}>{error}</p>
      <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate("/")}>
        ← Retour aux examens
      </button>
    </div>
  );

  if (exam && exam.questions.length === 0) return (
    <div className="center-msg">
      <div className="empty-state-icon">📭</div>
      <h3 style={{ marginBottom: 8 }}>Examen bientôt disponible</h3>
      <p style={{ marginBottom: 20 }}>Les questions de cet examen n'ont pas encore été ajoutées.</p>
      <button className="btn btn-secondary" onClick={() => navigate("/")}>← Retour</button>
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
  const totalSeconds  = exam.questions.length * 90;

  return (
    <div className="page-narrow">
      {/* ── En-tête : titre + timer global ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 16 }}>
        <div>
          <button
            onClick={() => navigate("/")}
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: 10 }}
          >
            ← Quitter
          </button>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 800 }}>{exam.title}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
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

      {/* Navigation numéros */}
      <div className="question-nav">
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
          ← Précédent
        </button>

        {!isLast ? (
          <button className="btn btn-primary" onClick={() => setCurrent((c) => c + 1)}>
            Suivant →
          </button>
        ) : (
          <button
            className="btn btn-success"
            onClick={handleManualSubmit}
            disabled={!allAnswered || saving}
          >
            {saving
              ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: "white" }} /> Envoi…</>
              : "Soumettre ✓"}
          </button>
        )}
      </div>

      {saveError && <p className="error-msg" style={{ marginTop: 12 }}>{saveError}</p>}
      {!allAnswered && isLast && (
        <p className="hint" style={{ marginTop: 12, textAlign: "center" }}>
          ⚠ Répondez à toutes les questions avant de soumettre.
        </p>
      )}
    </div>
  );
}

export default Quiz;
