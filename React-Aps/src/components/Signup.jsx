import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../hooks/useTheme.js";
import { AlertTriangle, ArrowRight, Check } from "./Icon.jsx";

function AKLogoLarge() {
  return (
    <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,4 93,27 93,73 50,96 7,73 7,27" fill="rgba(255,255,255,.95)" />
      <text x="50" y="60" textAnchor="middle" fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="28" fill="#4361ee" letterSpacing="-1">A.K</text>
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [dark, toggleTheme] = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Panel gauche décoratif ── */}
      <div className="auth-panel-left">
        <div className="auth-panel-left-content">
          <AKLogoLarge />
          <h2>Rejoignez des milliers<br />d'étudiants</h2>
          <p>
            Accédez gratuitement à des centaines d'annales corrigées,
            suivez vos progrès et préparez-vous dans les meilleures conditions.
          </p>

          <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              "Accès illimité aux examens",
              "Corrections détaillées avec LaTeX",
              "Suivi de vos résultats en temps réel",
            ].map((item) => (
              <div key={item} style={{ fontSize: "0.9rem", color: "rgba(255,255,255,.85)", fontWeight: 500, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <Check size={16} /> {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel droit — formulaire ── */}
      <div className="auth-panel-right">
        {/* Dark mode toggle */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={dark ? "Mode clair" : "Mode sombre"}
          style={{ position: "absolute", top: 20, right: 24 }}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className="auth-card">
          <div className="auth-logo">
            <div style={{ marginBottom: 12 }}>
              <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="lgSmall2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   stopColor="#4361ee" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <polygon points="50,4 93,27 93,73 50,96 7,73 7,27" fill="url(#lgSmall2)" />
                <text x="50" y="60" textAnchor="middle" fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="30" fill="white" letterSpacing="-1">A.K</text>
              </svg>
            </div>
            <h1>E-learning Mathematics</h1>
            <p>Créez votre compte étudiant</p>
          </div>

          <h2>Inscription</h2>
          <p className="auth-sub">Rejoignez la plateforme pour passer vos examens</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nom complet</label>
              <input
                type="text"
                placeholder="Mohammed Alami"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Adresse e-mail</label>
              <input
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>
                Mot de passe{" "}
                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(6 caractères minimum)</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            {error && <p className="error-msg"><AlertTriangle size={15} /> {error}</p>}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
            >
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: "white" }} /> Création…</>
                : <>Créer mon compte <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="auth-footer">
            Déjà un compte ?{" "}
            <Link to="/login">Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
