import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { examsApi, resultsApi } from "../api.js";
import { useScrollAnimation, useCounter } from "../hooks/useScrollAnimation.js";
import { AlertTriangle, ClipboardList, Eye, Inbox, Medal, Trophy } from "./Icon.jsx";

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

/* ─────────────────────────────────────────
   Podium top 3
───────────────────────────────────────── */
function Podium({ ranked }) {
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
function RankingTable({ ranked }) {
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
            <th></th>
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
                <td>
                  <Link to={`/result/${r.id}`} className="btn btn-secondary btn-sm">
                    <Eye size={14} /> Voir
                  </Link>
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
   Dashboard principal
───────────────────────────────────────── */
function Dashboard() {
  const [exams,          setExams]          = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [results,        setResults]        = useState([]);
  const [loadingExams,   setLoadingExams]   = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error,          setError]          = useState("");
  const [activeTab,      setActiveTab]      = useState("classement"); // "classement" | "liste"

  useEffect(() => {
    examsApi.list()
      .then((data) => {
        setExams(data);
        if (data.length > 0) setSelectedExamId(data[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingExams(false));
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    setLoadingResults(true);
    resultsApi.forExam(selectedExamId)
      .then(setResults)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingResults(false));
  }, [selectedExamId]);

  // Statistiques
  const total    = results.length;
  const avgPct   = total > 0 ? Math.round(results.reduce((s, r) => s + Number(r.percentage), 0) / total) : 0;
  const passed   = results.filter((r) => Number(r.percentage) >= 50).length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const highest  = total > 0 ? Math.max(...results.map((r) => Number(r.percentage))) : 0;

  // Classement : tri par % décroissant (garder uniquement le meilleur score par étudiant)
  const bestPerStudent = Object.values(
    results.reduce((acc, r) => {
      const sid = r.student_id;
      if (!acc[sid] || Number(r.percentage) > Number(acc[sid].percentage)) acc[sid] = r;
      return acc;
    }, {})
  );
  const ranked = [...bestPerStudent].sort((a, b) => Number(b.percentage) - Number(a.percentage));

  return (
    <div className="page">
      <div className="page-header fade-up">
        <div className="section-label">⊙ ESPACE PROFESSEUR</div>
        <h1>Tableau de bord</h1>
        <p>Suivi des résultats et classement de vos étudiants</p>
      </div>

      {error && <p className="error-msg"><AlertTriangle size={15} /> {error}</p>}

      {/* Sélecteur d'examen */}
      {exams.length > 0 && (
        <div className="fade-up" style={{ marginBottom: 28, display: "flex", gap: 8, flexWrap: "wrap" }}>
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
      )}

      {/* Stats */}
      <div className="stats-grid">
        <AnimatedStat label="Soumissions"      value={total}    suffix=""  sub="tentatives d'examen"            colorClass="blue"   />
        <AnimatedStat label="Moyenne"          value={avgPct}   suffix="%" sub="tous les étudiants"             colorClass="green"  />
        <AnimatedStat label="Taux de réussite" value={passRate} suffix="%" sub={`${passed}/${total} admis ≥50%`} colorClass="yellow" />
        <AnimatedStat label="Meilleur score"   value={highest}  suffix="%" sub="meilleure performance"          colorClass="red"    />
      </div>

      {/* Tabs : Classement / Liste */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {[
          { key: "classement", Icon: Trophy, label: "Classement" },
          { key: "liste",      Icon: ClipboardList, label: "Liste complète" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn ${activeTab === tab.key ? "btn-primary" : "btn-secondary"}`}
          >
            <tab.Icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="card fade-up">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
            {activeTab === "classement" ? <Trophy size={18} /> : <ClipboardList size={18} />}
            {activeTab === "classement" ? "Classement —" : "Résultats —"}{" "}
            {exams.find((e) => e.id === selectedExamId)?.title || ""}
          </h2>
          <span className="tag">{ranked.length} étudiant{ranked.length !== 1 ? "s" : ""}</span>
        </div>

        {loadingExams || loadingResults ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
          </div>
        ) : activeTab === "classement" ? (
          <>
            <Podium ranked={ranked} />
            <RankingTable ranked={ranked} />
          </>
        ) : (
          /* Liste complète (toutes soumissions, pas de déduplication) */
          results.length === 0 ? (
            <div className="empty-state">
              <Inbox size={40} className="empty-state-icon" style={{ color: "var(--text-faint)" }} />
              <h3>Aucun résultat</h3>
              <p>Les étudiants n'ont pas encore soumis cet examen.</p>
            </div>
          ) : (
            <div className="results-table-wrap">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>E-mail</th>
                    <th>Score</th>
                    <th style={{ minWidth: 140 }}>Progression</th>
                    <th>Mention</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const pct = Number(r.percentage);
                    const barClass = pct >= 75 ? "" : pct >= 50 ? "medium" : "low";
                    const gradeColor =
                      pct >= 90 ? "var(--success)" :
                      pct >= 75 ? "var(--primary)" :
                      pct >= 50 ? "var(--cyan)" : "var(--danger)";
                    const gradeLabel =
                      pct >= 90 ? "Excellent" : pct >= 75 ? "Très bien" : pct >= 50 ? "Passable" : "Insuffisant";

                    return (
                      <tr key={r.id}>
                        <td>
                          <Link
                            to={`/student/${r.student_id}`}
                            style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}
                          >
                            <div className="avatar" style={{ width: 30, height: 30, fontSize: "0.72rem" }}>
                              {r.student_name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span style={{ fontWeight: 600, color: "var(--primary)" }}>{r.student_name || "—"}</span>
                          </Link>
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{r.student_email}</td>
                        <td style={{ fontWeight: 700, color: "var(--primary)" }}>{r.score} / {r.total}</td>
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
                        <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          {new Date(r.submitted_at).toLocaleString("fr-FR")}
                        </td>
                        <td>
                          <Link to={`/result/${r.id}`} className="btn btn-secondary btn-sm">
                            <Eye size={14} /> Voir
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default Dashboard;
