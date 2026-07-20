import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MathText from "./MathText.jsx";
import { AlertTriangle, ArrowLeft, Award, Check, CheckCircle, Lightbulb, RefreshCw, Trash, Trophy, Video, X } from "./Icon.jsx";

function youtubeEmbedUrl(url) {
  const match = (url || "").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function VideoModal({ url, onClose }) {
  const embedUrl = youtubeEmbedUrl(url);
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="video-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="management-modal-close" onClick={onClose} style={{ position: "absolute", right: 12, top: 12, zIndex: 1 }}><X size={16} /></button>
        {embedUrl
          ? <iframe
              className="video-modal-frame"
              src={embedUrl}
              title="Vidéo explicative"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          : <p className="error-msg" style={{ padding: 24 }}>Lien vidéo invalide.</p>
        }
      </div>
    </div>
  );
}

function ScoreCircle({ percentage }) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color =
    percentage >= 90 ? "var(--success)" :
    percentage >= 75 ? "var(--primary)" :
    percentage >= 50 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="score-circle">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--border)" strokeWidth="12" />
        <circle
          cx="80" cy="80" r={radius} fill="none"
          stroke={color} strokeWidth="12"
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

/*
  `result` vient de resultsApi.details() — format :
  {
    id, score, total, percentage,
    answers: [{
      question_id, is_correct, selected_choice_ids,
      question_text, solution_text,
      choices: [{ id, choice_text, is_correct }]
    }]
  }
  `exam` sert uniquement pour le titre et le bouton Recommencer.
*/
function Results({ exam, result, onRetry, saveError, studentName, onBack, onDelete }) {
  const navigate = useNavigate();
  const [activeVideo, setActiveVideo] = useState(null);

  // Les réponses viennent directement de details — elles ont choices + is_correct
  const allAnswers = result.answers || [];
  const answeredOnly = allAnswers.filter((a) => (a.selected_choice_ids || []).length > 0);
  const hasUnanswered = answeredOnly.length < allAnswers.length;

  // Si tout a été répondu, les deux modes sont identiques : pas besoin de choix.
  const [scoreMode, setScoreMode] = useState("all"); // "all" | "answered"
  const answers    = hasUnanswered && scoreMode === "answered" ? answeredOnly : allAnswers;
  const total      = answers.length;
  const score      = answers.filter((a) => a.is_correct).length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  let grade = "À améliorer";
  let gradeClass = "grade-fail";
  let GradeIcon = AlertTriangle;
  if (percentage >= 90)      { grade = "Excellent";  gradeClass = "grade-excellent"; GradeIcon = Trophy; }
  else if (percentage >= 75) { grade = "Très bien";  gradeClass = "grade-good"; GradeIcon = Award; }
  else if (percentage >= 50) { grade = "Passable";   gradeClass = "grade-pass"; GradeIcon = Check; }

  return (
    <div className="page-narrow">
      {/* ── Actions (en haut, accessibles sans avoir à défiler) ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
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
        {onDelete && (
          <button className="btn btn-danger btn-lg" onClick={onDelete}>
            <Trash size={16} /> Supprimer cette soumission
          </button>
        )}
      </div>

      {/* ── Choix du mode de score (seulement si des questions sont restées sans réponse) ── */}
      {hasUnanswered && (
        <div className="card" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, justifyContent: "space-between", marginBottom: 16, padding: "14px 18px" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            {answeredOnly.length} / {allAnswers.length} questions répondues — comment afficher le score ?
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
        <span className={`grade-badge ${gradeClass}`}><GradeIcon size={16} /> {grade}</span>
        <p style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: 8, color: "var(--text)" }}>
          {score} / {total} réponses correctes
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          {exam.title}{studentName ? ` — ${studentName}` : ""}
        </p>
        {saveError && <p className="error-msg" style={{ marginTop: 8 }}>{saveError}</p>}
        {!saveError && !onBack && (
          <p style={{ marginTop: 8, color: "var(--text-muted)", fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <CheckCircle size={15} /> Votre résultat a été envoyé à votre professeur.
          </p>
        )}
      </div>

      {/* ── Correction détaillée ── */}
      <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 16 }}>Correction détaillée</h2>

      {answers.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>Aucune correction disponible.</p>
      ) : (
        <div className="review-list">
          {answers.map((ans, idx) => {
            const isCorrect   = ans.is_correct || false;
            const selectedIds = new Set(ans.selected_choice_ids || []);
            const choices     = ans.choices || [];
            const correctChoice   = choices.find((c) => c.is_correct);
            const selectedChoices = choices.filter((c) => selectedIds.has(c.id));

            return (
              <div key={ans.question_id} className={`review-item ${isCorrect ? "correct" : "incorrect"}`}>
                {/* Numéro */}
                <div className="review-q-label">Question {idx + 1}</div>

                {/* Intitulé */}
                <div className="review-q-text">
                  <MathText text={ans.question_text} />
                </div>

                {/* Réponse de l'étudiant */}
                <div className="review-answer">
                  <span style={{ fontWeight: 600 }}>Votre réponse : </span>
                  {selectedChoices.length > 0
                    ? selectedChoices.map((c) => (
                        <span key={c.id} className={isCorrect ? "correct-text" : "wrong-text"}>
                          <MathText text={c.choice_text} />
                        </span>
                      ))
                    : <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Sans réponse</span>
                  }
                  {" "}{isCorrect ? <Check size={14} style={{ verticalAlign: "-2px", color: "var(--success)" }} /> : <X size={14} style={{ verticalAlign: "-2px", color: "var(--danger)" }} />}
                </div>

                {/* Bonne réponse si faux */}
                {!isCorrect && correctChoice && (
                  <div className="review-answer">
                    <span style={{ fontWeight: 600 }}>Bonne réponse : </span>
                    <span className="correct-text">
                      <MathText text={correctChoice.choice_text} />
                    </span>
                  </div>
                )}

                {/* Solution / explication */}
                {ans.solution_text && (
                  <div className="review-solution">
                    <Lightbulb size={16} />
                    <span><strong>Solution :</strong> <MathText text={ans.solution_text} /></span>
                  </div>
                )}

                {/* Vidéo explicative (si renseignée par le professeur) */}
                {ans.resource_url && (
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => setActiveVideo(ans.resource_url)}>
                    <Video size={14} /> Voir l'explication
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeVideo && <VideoModal url={activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  );
}

export default Results;
