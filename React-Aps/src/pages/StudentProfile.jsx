import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { resultsApi } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const TEACHER_EMAIL = "anass.khadir@usmba.ac.ma";

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ borderTopColor: color, borderTopWidth: 3, borderTopStyle: "solid" }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function StudentProfile() {
  const { studentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  const isTeacher = user?.email === TEACHER_EMAIL;

  const load = () => {
    setLoading(true);
    resultsApi.studentAnalytics(studentId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [studentId]);

  const handleDelete = async (resultId) => {
    if (!window.confirm("Supprimer ce résultat ? Cette action est irréversible.")) return;
    setDeleting(resultId);
    try {
      await resultsApi.deleteResult(resultId);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="center-msg">Chargement du profil…</div>;
  if (error)   return <div className="center-msg error-msg">{error}</div>;
  if (!data)   return null;

  const { stats, history, byUniversity } = data;

  const lineData = history.map((r, i) => ({
    name: `#${i + 1} ${r.university_name || ""}`,
    score: Number(r.percentage),
    exam: r.exam_title,
    date: new Date(r.submitted_at).toLocaleDateString("fr-FR"),
  }));

  const barData = byUniversity.map((u) => ({
    name: u.name,
    avg: u.avg,
    count: u.count,
  }));

  const gradeLabel = (pct) =>
    pct >= 90 ? "Excellent" : pct >= 75 ? "Très bien" : pct >= 50 ? "Passable" : "Insuffisant";
  const gradeColor = (pct) =>
    pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <button className="btn btn-secondary" style={{ padding: "7px 14px" }} onClick={() => navigate(-1)}>
          ← Retour
        </button>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Analyse de l'étudiant</h1>
          <p style={{ color: "var(--text-muted)" }}>Historique et performances</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <StatCard label="Examens passés"   value={stats.total}           sub="tentatives au total"     color="var(--primary)" />
        <StatCard label="Moyenne générale" value={`${stats.avgPct}%`}   sub="tous les examens"        color="var(--violet)" />
        <StatCard label="Meilleur score"   value={`${stats.best}%`}     sub="résultat le plus élevé"  color="var(--success)" />
        <StatCard label="Taux de réussite" value={`${stats.passRate}%`} sub="examens ≥ 50%"           color="var(--warning)" />
        <StatCard label="Score le plus bas" value={`${stats.lowest}%`}  sub="à améliorer"             color="var(--danger)" />
      </div>

      {/* Charts row */}
      {history.length > 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Évolution des scores</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} hide />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(val) => [`${val}%`, "Score"]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.exam || ""}
                />
                <ReferenceLine y={50} stroke="var(--warning)" strokeDasharray="4 2" label={{ value: "Seuil", fontSize: 10 }} />
                <Line
                  type="monotone" dataKey="score"
                  stroke="var(--primary)" strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--primary)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Score par établissement</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(val) => [`${val}%`, "Moy."]} />
                <ReferenceLine y={50} stroke="var(--warning)" strokeDasharray="4 2" />
                <Bar dataKey="avg" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* History table */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700 }}>Historique des examens</h3>
          <span className="tag">{history.length} tentative{history.length !== 1 ? "s" : ""}</span>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>Aucun examen passé</h3>
          </div>
        ) : (
          <div className="results-table-wrap">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Examen</th>
                  <th>Établissement</th>
                  <th>Année</th>
                  <th>Score</th>
                  <th>Résultat</th>
                  <th>Mention</th>
                  <th>Date</th>
                  {isTeacher && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((r) => {
                  const pct = Number(r.percentage);
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>{r.exam_title}</td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {r.icon} {r.university_name || "—"}
                        </span>
                      </td>
                      <td>{r.year || "—"}</td>
                      <td style={{ fontWeight: 600 }}>{r.score}/{r.total}</td>
                      <td>
                        <div className="pct-bar">
                          <div className="pct-track">
                            <div
                              className={`pct-fill ${pct < 75 ? pct < 50 ? "low" : "medium" : ""}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: gradeColor(pct) }}>{gradeLabel(pct)}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {new Date(r.submitted_at).toLocaleDateString("fr-FR")}
                      </td>
                      {isTeacher && (
                        <td>
                          <button
                            className="btn"
                            style={{ padding: "4px 10px", fontSize: "0.78rem", background: "#fef2f2", color: "var(--danger)", border: "1px solid #fecaca" }}
                            disabled={deleting === r.id}
                            onClick={() => handleDelete(r.id)}
                          >
                            {deleting === r.id ? "…" : "Supprimer"}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentProfile;
