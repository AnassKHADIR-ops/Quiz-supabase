import { useNavigate } from "react-router-dom";
import MathText from "./MathText.jsx";

function ScoreCircle({ percentage }) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color =
    percentage >= 90 ? "#10b981" :
    percentage >= 75 ? "#2563eb" :
    percentage >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="score-circle">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="12" />
        <circle
          cx="80" cy="80" r={radius} fill="none"
          stroke="white" strokeWidth="12"
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
function Results({ exam, result, onRetry, saveError }) {
  const navigate = useNavigate();
  const { score, total, percentage } = result;

  let grade = "À améliorer";
  let gradeClass = "grade-fail";
  if (percentage >= 90)      { grade = "Excellent 🏆";  gradeClass = "grade-excellent"; }
  else if (percentage >= 75) { grade = "Très bien 👍";  gradeClass = "grade-good"; }
  else if (percentage >= 50) { grade = "Passable ✓";    gradeClass = "grade-pass"; }

  // Les réponses viennent directement de details — elles ont choices + is_correct
  const answers = result.answers || [];

  return (
    <div className="page-narrow">
      {/* ── Hero score ── */}
      <div className="card results-hero">
        <div className="score-circle-wrap">
          <ScoreCircle percentage={percentage} />
        </div>
        <span className={`grade-badge ${gradeClass}`}>{grade}</span>
        <p style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: 8, color: "white" }}>
          {score} / {total} réponses correctes
        </p>
        <p style={{ color: "rgba(255,255,255,.75)", fontSize: "0.9rem", marginTop: 4 }}>
          {exam.title}
        </p>
        {saveError
          ? <p className="error-msg" style={{ marginTop: 8 }}>{saveError}</p>
          : <p style={{ marginTop: 8, color: "rgba(255,255,255,.8)", fontSize: "0.875rem" }}>
              ✅ Votre résultat a été envoyé à votre professeur.
            </p>
        }
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
                  {" "}{isCorrect ? "✓" : "✗"}
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
                    <strong>💡 Solution :</strong>{" "}
                    <MathText text={ans.solution_text} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button className="btn btn-primary btn-lg" onClick={onRetry}>
          🔄 Recommencer
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate("/")}>
          ← Retour aux examens
        </button>
      </div>
    </div>
  );
}

export default Results;
