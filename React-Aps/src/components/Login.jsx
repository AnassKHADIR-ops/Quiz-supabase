import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../hooks/useTheme.js";

// Logo hexagone premium
function AKLogoLarge() {
  return (
    <svg width="72" height="72" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lgLarge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
        </linearGradient>
        <filter id="glowLarge">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <polygon points="50,4 93,27 93,73 50,96 7,73 7,27" fill="url(#lgLarge)" filter="url(#glowLarge)" opacity="0.9" />
      <polygon points="50,4 93,27 93,73 50,96 7,73 7,27" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
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

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [dark, toggleTheme] = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
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
          <div className="float">
            <AKLogoLarge />
          </div>
          <h2>Préparez votre<br />avenir académique</h2>
          <p>
            Des examens de qualité, des corrections détaillées,
            et un suivi personnalisé pour maximiser vos chances aux concours.
          </p>

          {/* Stats decoratives */}
          <div style={{ display: "flex", gap: 24, marginTop: 36, justifyContent: "center" }}>
            {[
              { val: "100%", label: "Gratuit" },
              { val: "∞", label: "Essais" },
              { val: "A+", label: "Résultats" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: "white" }}>{s.val}</div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,.65)", textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 600 }}>{s.label}</div>
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
                  <linearGradient id="lgSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   stopColor="#4361ee" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <polygon points="50,4 93,27 93,73 50,96 7,73 7,27" fill="url(#lgSmall)" />
                <text x="50" y="60" textAnchor="middle" fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="30" fill="white" letterSpacing="-1">A.K</text>
              </svg>
            </div>
            <h1>E-learning Mathematics</h1>
            <p>Pr. Anass Khadir — USMBA</p>
          </div>

          <h2>Bienvenue 👋</h2>
          <p className="auth-sub">Connectez-vous pour accéder à vos examens</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Adresse e-mail</label>
              <input
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="error-msg">⚠ {error}</p>}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
            >
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: "white" }} /> Connexion…</>
                : "Se connecter →"}
            </button>
          </form>

          <div className="auth-footer">
            Pas encore de compte ?{" "}
            <Link to="/signup">S'inscrire gratuitement</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
