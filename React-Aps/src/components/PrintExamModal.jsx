import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import MathText from "./MathText.jsx";
import { examsApi } from "../api.js";
import { CheckCircle, FileText, Printer, Sparkles, X } from "./Icon.jsx";

export default function PrintExamModal({ exam, initialMode = "statement", onClose }) {
  const [mode, setMode] = useState(initialMode); // "statement" | "solution"
  const [fullExam, setFullExam] = useState(exam);
  const [loading, setLoading] = useState(false);

  // Safeguard: If exam has no questions attached, fetch them automatically
  useEffect(() => {
    if (!exam) return;
    if (!exam.questions || exam.questions.length === 0) {
      if (exam.id) {
        setLoading(true);
        examsApi
          .get(exam.id)
          .then((data) => {
            if (data && data.questions) {
              setFullExam(data);
            }
          })
          .catch((err) => console.error("Failed to load exam questions for print", err))
          .finally(() => setLoading(false));
      }
    } else {
      setFullExam(exam);
    }
  }, [exam]);

  if (!exam) return null;

  const currentExam = fullExam || exam;
  const totalQuestions = currentExam.questions?.length || 0;

  const handlePrint = () => {
    const origTitle = document.title;
    document.title = `${currentExam.title || "Examen"} - ${mode === "statement" ? "Enonce" : "Corrige"} - Pr Anass Khadir`;
    window.print();
    setTimeout(() => {
      document.title = origTitle;
    }, 1000);
  };

  const modalContent = (
    <div className="print-portal-root">
      <div className="modal-backdrop" onMouseDown={onClose}>
        <div
          className="card print-modal-card"
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            maxWidth: 920,
            width: "95%",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "28px 32px",
            position: "relative",
            background: "var(--surface)",
          }}
        >
          {/* ── Print Controls (Hidden in print) ── */}
          <div
            className="print-controls"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 14,
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: "2px solid var(--border)",
            }}
          >
            {/* Mode Switcher */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button
                className={`btn btn-sm ${mode === "statement" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setMode("statement")}
                style={{ fontWeight: 700 }}
              >
                <FileText size={15} /> 1. Énoncé Seul (Examen blanc)
              </button>
              <button
                className={`btn btn-sm ${mode === "solution" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setMode("solution")}
                style={{ fontWeight: 700 }}
              >
                <Sparkles size={15} /> 2. Sujet avec Corrigé Détaillé
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                className="btn btn-primary"
                onClick={handlePrint}
                disabled={loading}
                style={{ fontWeight: 800 }}
              >
                <Printer size={16} /> Lancer l'impression A4 / PDF
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div
            className="print-controls"
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginBottom: 20,
              background: "var(--surface-2)",
              padding: "8px 12px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>💡 <strong>Astuce impression :</strong> Dans la fenêtre d'impression, décochez <em>« En-têtes et pieds de page »</em> pour supprimer l'URL et l'heure du navigateur.</span>
          </div>

          {/* Loading state indicator */}
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
              <p style={{ color: "var(--text-muted)", marginTop: 12, fontSize: "0.9rem" }}>
                Chargement des questions et formules de l'examen…
              </p>
            </div>
          )}

          {/* ── Printable A4 Document Content ── */}
          {!loading && (
            <div className="print-document-container">
              {/* Header officiel */}
              <div
                className="print-header"
                style={{
                  textAlign: "center",
                  borderBottom: "2px solid #0f172a",
                  paddingBottom: 16,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: "#475569",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  PORTAIL E-LEARNING MATHEMATICS • PR. ANASS KHADIR
                </div>

                <h1
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 900,
                    color: "#0f172a",
                    margin: "4px 0 6px",
                    lineHeight: 1.25,
                  }}
                >
                  {currentExam.title}
                </h1>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 16,
                    fontSize: "0.85rem",
                    color: "#334155",
                    fontWeight: 600,
                    flexWrap: "wrap",
                  }}
                >
                  {currentExam.year && <span>📅 Session {currentExam.year}</span>}
                  <span>
                    ⏱️ Durée : {currentExam.duration_minutes ? `${currentExam.duration_minutes} minutes` : "Libre"}
                  </span>
                  <span>📝 {totalQuestions} Questions</span>
                  <span>
                    📊 Type : {mode === "statement" ? "Énoncé d'examen" : "Corrigé officiel"}
                  </span>
                </div>
              </div>

              {/* Student Fill-in Box (Shown on statement mode only) */}
              {mode === "statement" && (
                <div
                  className="print-student-box"
                  style={{
                    border: "1.5px dashed #64748b",
                    borderRadius: "6px",
                    padding: "12px 18px",
                    marginBottom: 24,
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: 12,
                    fontSize: "0.86rem",
                    color: "#0f172a",
                    background: "#f8fafc",
                  }}
                >
                  <div>
                    <strong>Nom & Prénom de l'étudiant :</strong>{" "}
                    ________________________________________
                  </div>
                  <div>
                    <strong>Date :</strong> ____________________
                  </div>
                  <div>
                    <strong>N° d'examen / Identifiant :</strong>{" "}
                    ________________________________________
                  </div>
                  <div>
                    <strong>Note obtenue :</strong> ______ / {totalQuestions}
                  </div>
                </div>
              )}

              {/* Solution Header Callout (Shown on solution mode only) */}
              {mode === "solution" && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1.5px solid #86efac",
                    color: "#166534",
                    padding: "10px 16px",
                    borderRadius: "6px",
                    marginBottom: 24,
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <CheckCircle size={18} style={{ color: "#16a34a", flexShrink: 0 }} />
                  <span>
                    Corrigé officiel détaillé avec justifications et démonstrations mathématiques complètes en LaTeX.
                  </span>
                </div>
              )}

              {/* Empty state safeguard */}
              {totalQuestions === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b" }}>
                  <p>Aucune question enregistrée pour cet examen.</p>
                </div>
              ) : (
                /* Questions List */
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {currentExam.questions.map((q, qIdx) => (
                    <div
                      key={q.id || qIdx}
                      className="print-question-block"
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "14px 18px",
                        background: "#ffffff",
                        pageBreakInside: "avoid",
                        breakInside: "avoid",
                      }}
                    >
                      {/* Question Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                          borderBottom: "1px solid #f1f5f9",
                          paddingBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            color: "#1e40af",
                          }}
                        >
                          Question {qIdx + 1}
                        </span>
                        {q.topic && (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              background: "#e2e8f0",
                              color: "#334155",
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            {q.topic}
                          </span>
                        )}
                      </div>

                      {/* Question Text */}
                      <div
                        style={{
                          fontSize: "0.95rem",
                          lineHeight: 1.6,
                          color: "#0f172a",
                          marginBottom: 14,
                        }}
                      >
                        <MathText text={q.question_text} />
                      </div>

                      {/* Choices Grid */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                          gap: 8,
                          marginBottom: mode === "solution" && q.solution_text ? 12 : 0,
                        }}
                      >
                        {q.choices?.map((c, cIdx) => {
                          const letter = String.fromCharCode(65 + cIdx);
                          const isCorrect = mode === "solution" && !!c.is_correct;

                          return (
                            <div
                              key={c.id || cIdx}
                              className="print-choice-item"
                              style={{
                                padding: "8px 12px",
                                borderRadius: "6px",
                                border: isCorrect ? "1.5px solid #16a34a" : "1px solid #cbd5e1",
                                background: isCorrect ? "#f0fdf4" : "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                fontSize: "0.88rem",
                                color: isCorrect ? "#15803d" : "#1e293b",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 800,
                                  minWidth: 22,
                                  color: isCorrect ? "#16a34a" : "#64748b",
                                }}
                              >
                                {isCorrect ? "☑" : "☐"} {letter}.
                              </span>
                              <div style={{ flex: 1 }}>
                                <MathText text={c.choice_text} />
                              </div>
                              {isCorrect && (
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    fontWeight: 800,
                                    background: "#dcfce7",
                                    color: "#15803d",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  Correcte
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Detailed Solution / LaTeX Demonstration */}
                      {mode === "solution" && q.solution_text && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: "10px 14px",
                            background: "#f8fafc",
                            borderLeft: "3px solid #3b82f6",
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                            color: "#1e293b",
                            lineHeight: 1.55,
                          }}
                        >
                          <strong style={{ color: "#1d4ed8" }}>💡 Démonstration & Justification :</strong>{" "}
                          <MathText text={q.solution_text} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Footer imprimé */}
              <div
                className="print-footer"
                style={{
                  marginTop: 32,
                  paddingTop: 12,
                  borderTop: "1px solid #cbd5e1",
                  fontSize: "0.75rem",
                  color: "#64748b",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Portail E-learning Mathematics — Pr. Anass Khadir</span>
                <span>Document d'évaluation officiel A4</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
