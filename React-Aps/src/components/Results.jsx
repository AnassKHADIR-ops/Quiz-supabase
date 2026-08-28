import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MathText from "./MathText.jsx";
import PrintExamModal from "./PrintExamModal.jsx";
import MathVideoPlayer from "./MathVideoPlayer.jsx";
import { triggerConfetti } from "../lib/confetti.js";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Check,
  CheckCircle,
  Lightbulb,
  Printer,
  RefreshCw,
  Sparkles,
  Trash,
  Trophy,
  Video,
  X,
  FileText
} from "./Icon.jsx";

function VideoModal({ url, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="video-modal"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          maxWidth: 860,
          width: "92vw",
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
          background: "var(--card-bg, #0f172a)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
        }}
      >
        <button
          className="management-modal-close"
          onClick={onClose}
          style={{
            position: "absolute",
            right: 12,
            top: 12,
            zIndex: 10,
            background: "rgba(0, 0, 0, 0.6)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          <X size={16} />
        </button>
        <MathVideoPlayer videoUrl={url} title="Explication Vidéo" autoPlay={true} />
      </div>
    </div>
  );
}

function ScoreCircle({ percentage }) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color =
    percentage >= 90
      ? "var(--success)"
      : percentage >= 75
      ? "var(--primary)"
      : percentage >= 50
      ? "var(--warning)"
      : "var(--danger)";

  return (
    <div className="score-circle">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--border)" strokeWidth="12" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />
      </svg>
      <div className="score-circle-text">
        <span className="score-pct">{percentage}%</span>
        <span className="score-label">Score</span>
      </div>
    </div>
  );
}

function Results({ exam, result, onRetry, saveError, studentName, onBack, onDelete }) {
  const navigate = useNavigate();
  const [activeVideo, setActiveVideo] = useState(null);
  const [printModal, setPrintModal] = useState({ open: false, mode: "solution" });

  const allAnswers = result.answers || [];
  const answeredOnly = allAnswers.filter((a) => (a.selected_choice_ids || []).length > 0);
  const hasUnanswered = answeredOnly.length < allAnswers.length;

  const [scoreMode, setScoreMode] = useState("all");
  const answers = hasUnanswered && scoreMode === "answered" ? answeredOnly : allAnswers;
  const total = answers.length;
  const score = answers.filter((a) => a.is_correct).length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  // Trigger celebration confetti on high score
  useEffect(() => {
    if (percentage >= 75 && onRetry) {
      const t = setTimeout(() => triggerConfetti(), 400);
      return () => clearTimeout(t);
    }
  }, [percentage, onRetry]);

  let grade = "À améliorer";
  let gradeClass = "grade-fail";
  let GradeIcon = AlertTriangle;
  if (percentage >= 90) {
    grade = "Major / Excellent 🏆";
    gradeClass = "grade-excellent";
    GradeIcon = Trophy;
  } else if (percentage >= 75) {
    grade = "Très bien ✨";
    gradeClass = "grade-good";
    GradeIcon = Award;
  } else if (percentage >= 50) {
    grade = "Admissible / Passable";
    gradeClass = "grade-pass";
    GradeIcon = Check;
  }

  // Build full printable exam object with choices & LaTeX solutions
  const printableExam = useMemo(() => {
    if (exam && exam.questions && exam.questions.length > 0) {
      return exam;
    }
    return {
      title: exam?.title || "Examen de Mathématiques",
      year: exam?.year,
      duration_minutes: exam?.duration_minutes,
      questions: (result.answers || []).map((a, i) => ({
        id: a.question_id || i,
        question_text: a.question_text,
        solution_text: a.solution_text,
        topic: a.topic,
        choices: a.choices || [],
      })),
    };
  }, [exam, result]);

  return (
    <div className="page-narrow">
      {/* ── Actions ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        {onRetry && (
          <>
            <button className="btn btn-primary btn-lg" onClick={onRetry}>
              <RefreshCw size={16} /> Recommencer
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate("/")}>
              <ArrowLeft size={16} /> Retour aux examens
            </button>
          </>
        )}
        {onBack && (
          <button className="btn btn-secondary btn-lg" onClick={onBack}>
            <ArrowLeft size={16} /> Retour
          </button>
        )}

        {/* Options d'impression */}
        <button
          className="btn btn-secondary btn-lg"
          onClick={() => setPrintModal({ open: true, mode: "statement" })}
          title="Imprimer l'examen blanc sans les réponses"
        >
          <FileText size={16} /> Imprimer l'Énoncé Seul
        </button>
        <button
          className="btn btn-secondary btn-lg"
          onClick={() => setPrintModal({ open: true, mode: "solution" })}
          title="Imprimer le sujet avec les réponses correctes et justifications LaTeX"
        >
          <Printer size={16} /> Imprimer avec Corrigé Détaillé
        </button>

        {onDelete && (
          <button className="btn btn-danger btn-lg" onClick={onDelete}>
            <Trash size={16} /> Supprimer cette soumission
          </button>
        )}
      </div>

      {/* ── Mode de score ── */}
      {hasUnanswered && (
        <div
          className="card"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
            justifyContent: "space-between",
            marginBottom: 16,
            padding: "14px 18px",
          }}
        >
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            {answeredOnly.length} / {allAnswers.length} questions répondues — comment calculer le score ?
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`btn btn-sm ${scoreMode === "all" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setScoreMode("all")}
            >
              Sur les {allAnswers.length} questions
            </button>
            <button
              className={`btn btn-sm ${scoreMode === "answered" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setScoreMode("answered")}
            >
              Sur les {answeredOnly.length} répondues
            </button>
          </div>
        </div>
      )}

      {/* ── Hero score ── */}
      <div className="card results-hero">
        <div className="score-circle-wrap">
          <ScoreCircle percentage={percentage} />
        </div>
        <span className={`grade-badge ${gradeClass}`}>
          <GradeIcon size={16} /> {grade}
        </span>
        <p style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: 8, color: "var(--text)" }}>
          {score} / {total} réponses correctes
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          {exam?.title || "Examen"}{studentName ? ` — ${studentName}` : ""}
        </p>
        {saveError && <p className="error-msg" style={{ marginTop: 8 }}>{saveError}</p>}
        {!saveError && !onBack && (
          <p
            style={{
              marginTop: 8,
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <CheckCircle size={15} /> Votre résultat a été enregistré avec succès.
          </p>
        )}
      </div>

      {/* ── Correction détaillée ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Correction détaillée & Solutions LaTeX</h2>
        <span className="tag">
          {score} juste(s) • {total - score} erreur(s)
        </span>
      </div>

      {answers.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>Aucune correction disponible.</p>
      ) : (
        <div className="review-list">
          {answers.map((ans, idx) => {
            const isCorrect = ans.is_correct || false;
            const selectedIds = new Set(ans.selected_choice_ids || []);
            const choices = ans.choices || [];
            const correctChoice = choices.find((c) => c.is_correct);
            const selectedChoices = choices.filter((c) => selectedIds.has(c.id));

            return (
              <div key={ans.question_id || idx} className={`review-item ${isCorrect ? "correct" : "incorrect"}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div className="review-q-label">Question {idx + 1}</div>
                  {ans.topic && <span className="tag">{ans.topic}</span>}
                </div>

                <div className="review-q-text">
                  <MathText text={ans.question_text} />
                </div>

                <div className="review-answer">
                  <span style={{ fontWeight: 600 }}>Votre réponse : </span>
                  {selectedChoices.length > 0 ? (
                    selectedChoices.map((c) => (
                      <span key={c.id} className={isCorrect ? "correct-text" : "wrong-text"}>
                        <MathText text={c.choice_text} />
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Sans réponse</span>
                  )}{" "}
                  {isCorrect ? (
                    <Check size={14} style={{ verticalAlign: "-2px", color: "var(--success)" }} />
                  ) : (
                    <X size={14} style={{ verticalAlign: "-2px", color: "var(--danger)" }} />
                  )}
                </div>

                {!isCorrect && correctChoice && (
                  <div className="review-answer">
                    <span style={{ fontWeight: 600 }}>Bonne réponse : </span>
                    <span className="correct-text">
                      <MathText text={correctChoice.choice_text} />
                    </span>
                  </div>
                )}

                {ans.solution_text && (
                  <div className="review-solution">
                    <Lightbulb size={16} />
                    <span>
                      <strong>Démonstration & Rappel :</strong> <MathText text={ans.solution_text} />
                    </span>
                  </div>
                )}

                {ans.resource_url && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 12 }}
                    onClick={() => setActiveVideo(ans.resource_url)}
                  >
                    <Video size={14} /> Voir l'explication vidéo
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeVideo && <VideoModal url={activeVideo} onClose={() => setActiveVideo(null)} />}

      {printModal.open && (
        <PrintExamModal
          exam={printableExam}
          initialMode={printModal.mode}
          onClose={() => setPrintModal({ open: false, mode: "solution" })}
        />
      )}
    </div>
  );
}

export default Results;
