import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { examsApi, resultsApi } from "../api.js";
import { useScrollAnimation, useCounter } from "../hooks/useScrollAnimation.js";
import MathText from "./MathText.jsx";
import PrintExamModal from "./PrintExamModal.jsx";
import {
  AlertTriangle,
  ClipboardList,
  Eye,
  Inbox,
  Medal,
  Printer,
  Sparkles,
  Trophy,
  Users,
  CheckCircle,
  X,
  Trash,
  Search,
  Clock,
  RefreshCw,
  RotateCcw
} from "./Icon.jsx";
import UserAccessManager from "./UserAccessManager.jsx";

function AnimatedStat({ label, value, sub, colorClass, suffix = "" }) {
  const [ref, visible] = useScrollAnimation();
  const count = useCounter(value, visible);
  return (
    <div ref={ref} className={`stat-card ${colorClass} fade-up${visible ? " visible" : ""}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{count}{suffix}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

// Calcul du temps passé entre started_at et submitted_at
function formatTimeSpent(startedAt, submittedAt) {
  if (!startedAt || !submittedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = new Date(submittedAt).getTime();
  const sec = Math.max(0, Math.round((end - start) / 1000));
  if (isNaN(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s} s`;
  return s > 0 ? `${m} min ${s} s` : `${m} min`;
}

/* ─────────────────────────────────────────
   Podium top 3
───────────────────────────────────────── */
function Podium({ ranked, onDeleteSingle }) {
  if (ranked.length === 0) return null;
  const top3 = ranked.slice(0, 3);
  const heights = [110, 80, 60];
  const visualOrder = top3[1] ? [1, 0, 2] : [0, 2];

  return (
    <div className="podium">
      {visualOrder.map((rankIdx) => {
        const r = top3[rankIdx];
        if (!r) return null;
        const pct = Number(r.percentage);

        return (
          <div key={r.id} className={`podium-item podium-item--${rankIdx + 1}`}>
            <Medal className="podium-medal" size={24} />
            <Link to={`/student/${r.student_id}`}>
              <div className="podium-avatar">{r.student_name?.[0]?.toUpperCase() || "?"}</div>
            </Link>
            <div>
              <div className="podium-name">{r.student_name?.split(" ")[0] || "—"}</div>
              <div className="podium-pct" style={{ textAlign: "center" }}>{pct}%</div>
            </div>
            <div className="podium-bar" style={{ height: heights[rankIdx] }}>
              <span>#{rankIdx + 1}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   Tableau de classement complet
───────────────────────────────────────── */
function RankingTable({ ranked, onDeleteSingle }) {
  if (ranked.length === 0) return (
    <div className="empty-state">
      <Trophy size={40} className="empty-state-icon" style={{ color: "var(--text-faint)" }} />
      <h3>Aucun résultat</h3>
      <p>Les étudiants n'ont pas encore soumis cet examen.</p>
    </div>
  );

  const gradeLabel = (pct) =>
    pct >= 90 ? "Excellent" : pct >= 75 ? "Très bien" : pct >= 50 ? "Passable" : "Insuffisant";
  const gradeColor = (pct) =>
    pct >= 90 ? "var(--success)" : pct >= 75 ? "var(--primary)" : pct >= 50 ? "var(--cyan)" : "var(--danger)";

  return (
    <div className="results-table-wrap">
      <table className="results-table">
        <thead>
          <tr>
            <th style={{ width: 60 }}>Rang</th>
            <th>Étudiant</th>
            <th>Score</th>
            <th style={{ minWidth: 140 }}>Progression</th>
            <th>Mention</th>
            <th>Date</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((r, i) => {
            const pct = Number(r.percentage);
            const barClass = pct >= 75 ? "" : pct >= 50 ? "medium" : "low";
            const rankColor = i === 0 ? "var(--warning)" : i === 1 ? "var(--text-muted)" : i === 2 ? "#b5651d" : null;

            return (
              <tr key={r.id} style={i < 3 ? { background: "var(--surface-2)" } : {}}>
                {/* Rang */}
                <td style={{ textAlign: "center" }}>
                  {rankColor
                    ? <Medal size={18} style={{ color: rankColor }} />
                    : <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "var(--text-muted)",
                      }}>#{i + 1}</span>
                  }
                </td>
                {/* Étudiant */}
                <td>
                  <Link
                    to={`/student/${r.student_id}`}
                    style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}
                  >
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: "0.76rem" }}>
                      {r.student_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.9rem" }}>
                        {r.student_name || "—"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.student_email}</div>
                    </div>
                  </Link>
                </td>
                {/* Score */}
                <td style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.95rem" }}>
                  {r.score} / {r.total}
                </td>
                {/* Barre */}
                <td>
                  <div className="pct-bar">
                    <div className="pct-track">
                      <div className={`pct-fill ${barClass}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, whiteSpace: "nowrap", minWidth: 38, textAlign: "right" }}>
                      {pct}%
                    </span>
                  </div>
                </td>
                {/* Mention */}
                <td>
                  <span style={{ fontWeight: 700, color: gradeColor(pct) }}>{gradeLabel(pct)}</span>
                </td>
                {/* Date */}
                <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  {new Date(r.submitted_at).toLocaleString("fr-FR")}
                </td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                    <Link to={`/result/${r.id}`} className="btn btn-secondary btn-sm" title="Voir les réponses détaillées">
                      <Eye size={14} /> Voir
                    </Link>
                    {onDeleteSingle && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => onDeleteSingle(r)}
                        title="Supprimer cette soumission pour nettoyer le classement"
                        style={{ padding: "4px 8px" }}
                      >
                        <Trash size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────
   Gestionnaire des Soumissions (Admin Cleanup)
───────────────────────────────────────── */
function SubmissionsManager({ results, examTitle, onDeleteSingle, onDeleteBulk, onResetExam, deleting }) {
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);

  // Filtrage local en temps réel
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return results.filter((r) => {
      const matchSearch =
        !q ||
        (r.student_name && r.student_name.toLowerCase().includes(q)) ||
        (r.student_email && r.student_email.toLowerCase().includes(q));

      const pct = Number(r.percentage);
      const matchScore =
        scoreFilter === "all"
          ? true
          : scoreFilter === "passed"
          ? pct >= 50
          : scoreFilter === "failed"
          ? pct < 50
          : scoreFilter === "excellent"
          ? pct >= 75
          : true;

      return matchSearch && matchScore;
    });
  }, [results, search, scoreFilter]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selectedIds.includes(r.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((r) => r.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div>
      {/* ── Toolbar de recherche, filtre et actions groupées ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
          padding: "14px 16px",
          background: "var(--surface-2)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Recherche rapide */}
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Filtrer par nom ou e-mail d'étudiant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 32px 7px 34px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "0.85rem",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: 0,
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filtres de score */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { id: "all", label: `Toutes (${results.length})` },
            { id: "passed", label: "Admis (≥50%)" },
            { id: "failed", label: "Échoués (<50%)" },
            { id: "excellent", label: "Excellents (≥75%)" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setScoreFilter(f.id)}
              className={`user-filter-pill ${scoreFilter === f.id ? "active" : ""}`}
              style={{ padding: "5px 11px", fontSize: "0.78rem" }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Actions groupées / Nettoyage */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {selectedIds.length > 0 && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onDeleteBulk(selectedIds, () => setSelectedIds([]))}
              disabled={deleting}
              style={{ fontWeight: 700 }}
            >
              <Trash size={14} /> Supprimer ({selectedIds.length})
            </button>
          )}

          {results.length > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onResetExam}
              disabled={deleting}
              title="Supprimer toutes les soumissions de cet examen"
              style={{ color: "var(--danger)", borderColor: "var(--danger-light, #fecaca)" }}
            >
              <RotateCcw size={14} /> Tout réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ── Table des soumissions ── */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: "40px 16px" }}>
          <Inbox size={38} className="empty-state-icon" style={{ color: "var(--text-faint)" }} />
          <h3>Aucune soumission trouvée</h3>
          <p>{results.length === 0 ? "Aucun étudiant n'a encore passé cet examen." : "Aucune soumission ne correspond aux filtres actuels."}</p>
        </div>
      ) : (
        <div className="results-table-wrap">
          <table className="results-table">
            <thead>
              <tr>
                <th style={{ width: 40, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    title="Tout sélectionner"
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th>Étudiant</th>
                <th>Score</th>
                <th style={{ minWidth: 120 }}>Progression</th>
                <th>Mention</th>
                <th>Temps passé</th>
                <th>Date & Heure</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isSelected = selectedIds.includes(r.id);
                const pct = Number(r.percentage);
                const barClass = pct >= 75 ? "" : pct >= 50 ? "medium" : "low";
                const gradeColor =
                  pct >= 90 ? "var(--success)" :
                  pct >= 75 ? "var(--primary)" :
                  pct >= 50 ? "var(--cyan)" : "var(--danger)";
                const gradeLabel =
                  pct >= 90 ? "Excellent" : pct >= 75 ? "Très bien" : pct >= 50 ? "Passable" : "Insuffisant";
                const timeSpent = formatTimeSpent(r.started_at, r.submitted_at);

                return (
                  <tr key={r.id} style={{ background: isSelected ? "var(--surface-3)" : undefined }}>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(r.id)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>
                      <Link
                        to={`/student/${r.student_id}`}
                        style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}
                      >
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: "0.72rem" }}>
                          {r.student_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: "var(--primary)", display: "block" }}>
                            {r.student_name || "—"}
                          </span>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>
                            {r.student_email}
                          </span>
                        </div>
                      </Link>
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--primary)" }}>
                      {r.score} / {r.total}
                    </td>
                    <td>
                      <div className="pct-bar">
                        <div className="pct-track">
                          <div className={`pct-fill ${barClass}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap" }}>{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: gradeColor }}>{gradeLabel}</span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Clock size={13} style={{ color: "var(--text-muted)" }} /> {timeSpent}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      {new Date(r.submitted_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                        <Link to={`/result/${r.id}`} className="btn btn-secondary btn-sm" title="Consulter la correction détaillée">
                          <Eye size={14} /> Voir
                        </Link>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => onDeleteSingle(r)}
                          disabled={deleting}
                          title="Supprimer cette soumission (ex: test ou faux résultat)"
                          style={{ padding: "5px 8px" }}
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Modal de Confirmation de Suppression
───────────────────────────────────────── */
function DeleteConfirmModal({ modalData, onClose, onConfirm, deleting }) {
  if (!modalData) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="card"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          maxWidth: 480,
          width: "90%",
          padding: "26px",
          background: "var(--surface)",
          boxShadow: "var(--shadow-lg)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.12)",
              color: "var(--danger)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text)" }}>
              {modalData.title}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.55, marginTop: 6 }}>
              {modalData.message}
            </p>
          </div>
        </div>

        {modalData.details && (
          <div
            style={{
              background: "var(--surface-2)",
              padding: "12px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              fontSize: "0.84rem",
              marginBottom: 20,
            }}
          >
            {modalData.details}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={deleting}>
            Annuler
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={deleting}
            style={{ fontWeight: 700 }}
          >
            {deleting ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: "white" }} />
                Suppression…
              </>
            ) : (
              <>
                <Trash size={15} /> Confirmer la suppression
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}



/* ─────────────────────────────────────────
   Vue Structure des questions
───────────────────────────────────────── */
function QuestionAnalyticsView({ exam }) {
  if (!exam || !exam.questions || exam.questions.length === 0) {
    return (
      <div className="empty-state">
        <Inbox size={38} className="empty-state-icon" />
        <h3>Aucune question enregistrée pour cet examen</h3>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={18} /> Structure & Pédagogie des {exam.questions.length} questions
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
          Visualisez l'ensemble des questions, les choix de réponse avec la clé de correction, et les solutions détaillées.
        </p>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {exam.questions.map((q, idx) => (
          <div
            key={q.id}
            className="card"
            style={{
              padding: "20px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="avatar" style={{ width: 28, height: 28, fontSize: "0.78rem" }}>
                  {idx + 1}
                </span>
                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Question {idx + 1}</span>
                {q.topic && <span className="tag">{q.topic}</span>}
              </div>
              <span className="badge" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                {q.question_type === "multiple" ? "Choix multiple" : "Choix unique"}
              </span>
            </div>

            <div style={{ fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 14 }}>
              <MathText text={q.question_text} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 8, marginBottom: 12 }}>
              {q.choices?.map((c, cIdx) => {
                const letter = String.fromCharCode(65 + cIdx);
                return (
                  <div
                    key={c.id}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: c.is_correct ? "1px solid var(--success)" : "1px solid var(--border)",
                      background: c.is_correct ? "var(--success-light)" : "var(--surface-2)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: "0.86rem",
                    }}
                  >
                    <span style={{ fontWeight: 800, color: c.is_correct ? "var(--success)" : "var(--text-muted)" }}>
                      {letter}.
                    </span>
                    <MathText text={c.choice_text} />
                    {c.is_correct && <span className="badge badge-success" style={{ marginLeft: "auto", fontSize: "0.68rem" }}>Correcte</span>}
                  </div>
                );
              })}
            </div>

            {q.solution_text && (
              <div style={{ padding: "10px 14px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--primary)", fontSize: "0.85rem" }}>
                <strong>💡 Solution détaillée : </strong> <MathText text={q.solution_text} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Dashboard principal
───────────────────────────────────────── */
function Dashboard() {
  const [exams,              setExams]              = useState([]);
  const [selectedExamId,     setSelectedExamId]     = useState(null);
  const [selectedExamDetail, setSelectedExamDetail] = useState(null);
  const [results,            setResults]            = useState([]);
  const [loadingExams,       setLoadingExams]       = useState(true);
  const [loadingResults,     setLoadingResults]     = useState(false);
  const [error,              setError]              = useState("");
  const [activeTab,          setActiveTab]          = useState("utilisateurs");
  const [pendingCount,       setPendingCount]       = useState(0);
  const [printModalOpen,     setPrintModalOpen]     = useState(false);

  // Modale & état de suppression
  const [deleteModal,        setDeleteModal]        = useState(null);
  const [deleting,           setDeleting]           = useState(false);
  const [toast,              setToast]              = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  useEffect(() => {
    examsApi.list()
      .then((data) => {
        setExams(data);
        if (data.length > 0) setSelectedExamId(data[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingExams(false));
  }, []);

  const loadExamData = (examId) => {
    if (!examId) return;
    setLoadingResults(true);

    Promise.all([
      resultsApi.forExam(examId),
      examsApi.get(examId).catch(() => null),
    ])
      .then(([resData, exDetail]) => {
        setResults(resData || []);
        setSelectedExamDetail(exDetail);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingResults(false));
  };

  useEffect(() => {
    loadExamData(selectedExamId);
  }, [selectedExamId]);

  // Recalcul dynamique automatique en temps réel des statistiques
  const total    = results.length;
  const avgPct   = total > 0 ? Math.round(results.reduce((s, r) => s + Number(r.percentage), 0) / total) : 0;
  const passed   = results.filter((r) => Number(r.percentage) >= 50).length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const highest  = total > 0 ? Math.max(...results.map((r) => Number(r.percentage))) : 0;

  // Classement : tri par % décroissant (meilleur score par étudiant)
  const bestPerStudent = useMemo(() => {
    return Object.values(
      results.reduce((acc, r) => {
        const sid = r.student_id;
        if (!acc[sid] || Number(r.percentage) > Number(acc[sid].percentage)) acc[sid] = r;
        return acc;
      }, {})
    );
  }, [results]);

  const ranked = useMemo(() => {
    return [...bestPerStudent].sort((a, b) => Number(b.percentage) - Number(a.percentage));
  }, [bestPerStudent]);

  /* ── Handlers de suppression ── */
  const promptDeleteSingle = (resultItem) => {
    setDeleteModal({
      type: "single",
      id: resultItem.id,
      title: "Supprimer cette soumission ?",
      message: `Voulez-vous vraiment supprimer la tentative de ${resultItem.student_name || "l'étudiant"} ?`,
      details: (
        <div>
          <div><strong>Étudiant :</strong> {resultItem.student_name} ({resultItem.student_email})</div>
          <div><strong>Score :</strong> {resultItem.score} / {resultItem.total} ({resultItem.percentage}%)</div>
          <div><strong>Date :</strong> {new Date(resultItem.submitted_at).toLocaleString("fr-FR")}</div>
        </div>
      ),
    });
  };

  const promptDeleteBulk = (selectedIds, onClearSelection) => {
    if (!selectedIds.length) return;
    setDeleteModal({
      type: "bulk",
      ids: selectedIds,
      onSuccess: onClearSelection,
      title: `Supprimer ${selectedIds.length} soumission(s) ?`,
      message: `Vous allez supprimer définitivement ${selectedIds.length} soumission(s) sélectionnée(s). Les statistiques et le classement seront recalculés immédiatement.`,
    });
  };

  const promptResetExam = () => {
    const currentExam = exams.find((e) => e.id === selectedExamId);
    setDeleteModal({
      type: "reset",
      examId: selectedExamId,
      title: `⚠️ Réinitialiser toutes les soumissions ?`,
      message: `Attention : vous êtes sur le point de supprimer l'intégralité des ${results.length} soumission(s) enregistrée(s) pour l'examen "${currentExam?.title || "cet examen"}".`,
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      if (deleteModal.type === "single") {
        await resultsApi.deleteResult(deleteModal.id);
        setResults((prev) => prev.filter((r) => r.id !== deleteModal.id));
        showToast("Soumission supprimée avec succès.");
      } else if (deleteModal.type === "bulk") {
        await resultsApi.deleteBulkResults(deleteModal.ids);
        setResults((prev) => prev.filter((r) => !deleteModal.ids.includes(r.id)));
        if (deleteModal.onSuccess) deleteModal.onSuccess();
        showToast(`${deleteModal.ids.length} soumissions supprimées avec succès.`);
      } else if (deleteModal.type === "reset") {
        await resultsApi.deleteForExam(deleteModal.examId);
        setResults([]);
        showToast("Toutes les soumissions de cet examen ont été réinitialisées.");
      }
      setDeleteModal(null);
    } catch (err) {
      alert(`Erreur lors de la suppression : ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: "var(--surface)",
            color: "var(--text)",
            border: "1px solid var(--success)",
            boxShadow: "0 8px 24px rgba(16, 185, 129, 0.25)",
            padding: "12px 18px",
            borderRadius: "var(--radius)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: "0.9rem",
            fontWeight: 700,
            animation: "authSlideIn .3s ease",
          }}
        >
          <CheckCircle size={18} style={{ color: "var(--success)" }} />
          <span>{toast}</span>
        </div>
      )}

      <div className="page-header fade-up">
        <div className="section-label">⊙ ESPACE PROFESSEUR / ADMIN</div>
        <h1>Tableau de bord</h1>
        <p>Gestion des accès à la plateforme privée, suivi et nettoyage des soumissions d'examen</p>
      </div>

      {error && <p className="error-msg"><AlertTriangle size={15} /> {error}</p>}

      {/* Tabs : Utilisateurs / Classement / Liste / Analyse */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { key: "utilisateurs", Icon: Users, label: "Accès & Inscriptions", badge: pendingCount },
          { key: "liste",        Icon: ClipboardList, label: "Gestion des soumissions" },
          { key: "classement",   Icon: Trophy, label: "Classement par examen" },
          { key: "analyse",      Icon: Sparkles, label: "Structure des questions" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn ${activeTab === tab.key ? "btn-primary" : "btn-secondary"}`}
            style={{ position: "relative" }}
          >
            <tab.Icon size={15} /> {tab.label}
            {tab.badge > 0 && (
              <span
                className="badge badge-warning"
                style={{
                  marginLeft: 6,
                  padding: "2px 7px",
                  fontSize: "0.72rem",
                  background: activeTab === tab.key ? "rgba(255,255,255,0.25)" : "var(--warning)",
                  color: activeTab === tab.key ? "white" : "black",
                  fontWeight: 800,
                }}
              >
                {tab.badge} en attente
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "utilisateurs" ? (
        <div className="card fade-up" style={{ padding: "28px" }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={20} /> Gestion des inscriptions & Accès privés
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.86rem", marginTop: 4 }}>
              Validez les demandes d'inscription des nouveaux étudiants ou révoquez l'accès à tout moment.
            </p>
          </div>
          <UserAccessManager onPendingCountChange={setPendingCount} />
        </div>
      ) : (
        <>
          {/* Sélecteur d'examen & Action Imprimer */}
          {exams.length > 0 && (
            <div className="fade-up" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {exams.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setSelectedExamId(e.id)}
                    className={`btn ${selectedExamId === e.id ? "btn-primary" : "btn-secondary"}`}
                  >
                    {e.title}
                  </button>
                ))}
              </div>

              {selectedExamDetail && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPrintModalOpen(true)}
                  title="Aperçu avant impression du sujet et des corrigés"
                >
                  <Printer size={15} /> Imprimer le sujet
                </button>
              )}
            </div>
          )}

          {/* Stats recalculées automatiquement */}
          <div className="stats-grid">
            <AnimatedStat label="Soumissions"      value={total}    suffix=""  sub="tentatives d'examen"            colorClass="blue"   />
            <AnimatedStat label="Moyenne"          value={avgPct}   suffix="%" sub="tous les étudiants"             colorClass="green"  />
            <AnimatedStat label="Taux de réussite" value={passRate} suffix="%" sub={`${passed}/${total} admis ≥50%`} colorClass="yellow" />
            <AnimatedStat label="Meilleur score"   value={highest}  suffix="%" sub="meilleure performance"          colorClass="red"    />
          </div>

          {/* Contenu de l'onglet actif */}
          <div className="card fade-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
                {activeTab === "classement" ? <Trophy size={18} /> : activeTab === "analyse" ? <Sparkles size={18} /> : <ClipboardList size={18} />}
                {activeTab === "classement" ? "Classement — " : activeTab === "analyse" ? "Structure des questions — " : "Gestion des soumissions — "}
                {exams.find((e) => e.id === selectedExamId)?.title || ""}
              </h2>
              <span className="tag">{results.length} soumission{results.length !== 1 ? "s" : ""}</span>
            </div>

            {loadingExams || loadingResults ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
              </div>
            ) : activeTab === "classement" ? (
              <>
                <Podium ranked={ranked} onDeleteSingle={promptDeleteSingle} />
                <RankingTable ranked={ranked} onDeleteSingle={promptDeleteSingle} />
              </>
            ) : activeTab === "analyse" ? (
              <QuestionAnalyticsView exam={selectedExamDetail} />
            ) : (
              /* Onglet Gestion et nettoyage des Soumissions */
              <SubmissionsManager
                results={results}
                examTitle={exams.find((e) => e.id === selectedExamId)?.title}
                onDeleteSingle={promptDeleteSingle}
                onDeleteBulk={promptDeleteBulk}
                onResetExam={promptResetExam}
                deleting={deleting}
              />
            )}
          </div>

          {printModalOpen && (
            <PrintExamModal
              exam={selectedExamDetail}
              onClose={() => setPrintModalOpen(false)}
            />
          )}

          {/* Modale de Confirmation de Suppression */}
          <DeleteConfirmModal
            modalData={deleteModal}
            onClose={() => setDeleteModal(null)}
            onConfirm={confirmDelete}
            deleting={deleting}
          />
        </>
      )}
    </div>
  );
}

export default Dashboard;
