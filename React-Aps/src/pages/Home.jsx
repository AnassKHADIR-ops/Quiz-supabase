import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { universitiesApi } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const CATEGORY_META = {
  "Medical Studies":      { icon: "🏥", label: "Études Médicales",            color: "var(--danger-light)",  accent: "#ef4444" },
  "Engineering Schools":  { icon: "⚙️", label: "Grandes Écoles d'Ingénieurs", color: "var(--primary-light)", accent: "var(--primary)" },
  "Business Schools":     { icon: "📊", label: "Grandes Écoles de Commerce",  color: "var(--violet-light)",  accent: "var(--violet)" },
  "Agricultural Studies": { icon: "🌾", label: "Études Agronomiques",          color: "var(--success-light)", accent: "var(--success)" },
};

function Home() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    universitiesApi.list()
      .then((data) => {
        setCategories(data);
        if (data.length > 0) setSelectedCategory(data[0].name);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(" ")[0] || "Étudiant";
  const currentCategory = categories.find((c) => c.name === selectedCategory);

  return (
    <div className="page">

      {/* ── Hero ── */}
      <div style={{ marginBottom: 48 }}>
        <div className="section-label fade-up">
          ✦ E-LEARNING MATHEMATICS
        </div>
        <h1 className="fade-up delay-1" style={{
          fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
          fontWeight: 800,
          lineHeight: 1.2,
          color: "var(--text)",
          marginBottom: 12,
          maxWidth: 560,
        }}>
          Préparez vos{" "}
          <span style={{ background: "var(--gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>concours</span>
          {" "}avec confiance
        </h1>
        <p className="fade-up delay-2" style={{
          color: "var(--text-muted)",
          maxWidth: 500,
          fontSize: "1rem",
          lineHeight: 1.7,
          marginBottom: 24,
        }}>
          Bonjour <strong style={{ color: "var(--primary)" }}>{firstName}</strong> — choisissez
          votre filière, sélectionnez une session et commencez votre entraînement.
          Vos résultats sont enregistrés automatiquement.
        </p>
      </div>

      {loading && (
        <div className="center-msg">
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        </div>
      )}
      {error && <div className="center-msg error-msg">⚠ {error}</div>}

      {!loading && !error && (
        <>
          {/* ── Category tabs ── */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 36 }} className="fade-up delay-2">
            {categories.map((cat, i) => {
              const meta = CATEGORY_META[cat.name] || { icon: "📚", label: cat.name, color: "var(--primary-light)", accent: "var(--primary)" };
              const active = selectedCategory === cat.name;
              const totalExams = cat.universities.reduce((s, u) => s + u.exams.length, 0);
              return (
                <button
                  key={cat.name}
                  className={`cat-tab${active ? " active" : ""}`}
                  onClick={() => { setSelectedCategory(cat.name); setSelectedUniversity(null); }}
                >
                  <span>{meta.icon}</span>
                  {meta.label}
                  <span className="cat-tab-count">{totalExams}</span>
                </button>
              );
            })}
          </div>

          {currentCategory && (
            <>
              {/* ── University cards ── */}
              {!selectedUniversity && (
                <>
                  <p className="fade-up" style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: 16,
                  }}>
                    ⊙ ACCÉDEZ À VOTRE ÉTABLISSEMENT
                  </p>
                  <div className="exam-grid">
                    {currentCategory.universities.map((univ, i) => {
                      const meta = CATEGORY_META[currentCategory.name] || { icon: "📚", color: "#f5f0e8", accent: "#7a7a8e" };
                      return (
                        <div
                          key={univ.id}
                          className={`exam-card fade-up delay-${Math.min(i + 1, 4)}`}
                          onClick={() => setSelectedUniversity(univ)}
                        >
                          <div className="exam-card-icon" style={{ background: meta.color }}>
                            {univ.icon}
                          </div>
                          <div>
                            <h3>{univ.name}</h3>
                            <p style={{ marginTop: 4 }}>{univ.description}</p>
                          </div>
                          <div className="exam-card-meta">
                            <span className="badge" style={{ background: meta.color, color: meta.accent }}>
                              {univ.exams.length} examen{univ.exams.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              Voir les annales
                            </span>
                            <span style={{
                              width: 32, height: 32, borderRadius: "50%",
                              background: meta.color,
                              color: meta.accent,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "1rem", fontWeight: 700,
                            }}>→</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ── Exam list ── */}
              {selectedUniversity && (
                <>
                  <div className="fade-in visible" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "7px 14px", fontSize: "0.85rem" }}
                      onClick={() => setSelectedUniversity(null)}
                    >
                      ← Retour
                    </button>
                    <div>
                      <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--primary)" }}>
                        {selectedUniversity.icon} {selectedUniversity.name}
                      </h2>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        {selectedUniversity.description}
                      </p>
                    </div>
                  </div>

                  {selectedUniversity.exams.length === 0 ? (
                    <div className="empty-state fade-up visible">
                      <div className="empty-state-icon">📭</div>
                      <h3>Examens bientôt disponibles</h3>
                      <p>Les annales de {selectedUniversity.name} seront ajoutées prochainement.</p>
                    </div>
                  ) : (
                    <div className="exam-grid">
                      {selectedUniversity.exams.map((exam, i) => (
                        <Link
                          key={exam.id}
                          to={`/exam/${exam.id}`}
                          className={`exam-card fade-up delay-${Math.min(i + 1, 4)}`}
                          style={{ "--i": i }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "2rem" }}>{selectedUniversity.icon}</span>
                            {exam.year && (
                              <span className="badge" style={{ fontSize: "0.85rem" }}>{exam.year}</span>
                            )}
                          </div>
                          <div>
                            <h3>{exam.title}</h3>
                            {exam.description && <p style={{ marginTop: 4 }}>{exam.description}</p>}
                          </div>
                          <div className="exam-card-meta">
                            {exam.duration_minutes ? (
                              <span className="badge badge-warning">⏱ {exam.duration_minutes} min</span>
                            ) : (
                              <span className="badge badge-success">Sans minuterie</span>
                            )}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              Commencer l'examen
                            </span>
                            <span style={{
                              width: 32, height: 32, borderRadius: "50%",
                              background: "var(--primary-light)",
                              color: "var(--primary)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "1rem", fontWeight: 700, transition: "all .2s",
                            }}>→</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Home;
