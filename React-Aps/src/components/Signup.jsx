import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../hooks/useTheme.js";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Trophy,
  GraduationCap
} from "./Icon.jsx";

function AKLogoLarge() {
  return (
    <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
      <div
        style={{
          position: "absolute",
          inset: -6,
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, transparent 70%)",
          filter: "blur(14px)",
          borderRadius: "50%",
        }}
      />
      <svg width="72" height="72" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "relative" }}>
        <defs>
          <linearGradient id="akHeroGradSignup" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#4361ee" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <polygon points="50,4 93,27 93,73 50,96 7,73 7,27" fill="url(#akHeroGradSignup)" />
        <polygon
          points="50,4 93,27 93,73 50,96 7,73 7,27"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2"
        />
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fontFamily="'Outfit', 'Plus Jakarta Sans', sans-serif"
          fontWeight="800"
          fontSize="30"
          fill="white"
          letterSpacing="-1"
        >
          A.K
        </text>
      </svg>
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dark, toggleTheme] = useTheme();

  const redirectUrl = searchParams.get("redirect") || "";

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, redirectUrl, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Panel gauche immersif ── */}
      <div
        className="auth-panel-left"
        style={{
          position: "relative",
          backgroundImage: `linear-gradient(145deg, rgba(15, 23, 42, 0.94) 0%, rgba(30, 58, 138, 0.88) 50%, rgba(67, 97, 238, 0.78) 100%), url(/images/auth_hero_students.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="auth-panel-left-content">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: "99px",
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              marginBottom: 20,
            }}
          >
            <Sparkles size={14} style={{ color: "#fbbf24" }} />
            <span>Portail E-learning Mathematics</span>
          </div>

          <AKLogoLarge />

          <h2 style={{ fontSize: "2rem", fontWeight: 900, lineHeight: 1.25, letterSpacing: "-0.02em", color: "white" }}>
            Rejoignez l'Excellence <br />
            <span style={{ background: "linear-gradient(90deg, #60a5fa, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              en Mathématiques
            </span>
          </h2>

          <p style={{ color: "rgba(255, 255, 255, 0.82)", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: 440, margin: "16px auto 0" }}>
            Accédez à des centaines d'annales corrigées, entraînez-vous en conditions réelles et progressez avec des corrections claires et méthodiques.
          </p>

          <div
            style={{
              marginTop: 32,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxWidth: 400,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {[
              "Accès aux QCM Post-Bac, Bac+2 & Enseignement",
              "Corrections complètes avec formules LaTeX",
              "Historique de progression & classement",
            ].map((item) => (
              <div
                key={item}
                style={{
                  fontSize: "0.86rem",
                  color: "rgba(255, 255, 255, 0.9)",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(10px)",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
              >
                <CheckCircle size={16} style={{ color: "#4ade80", flexShrink: 0 }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel droit — formulaire ── */}
      <div className="auth-panel-right">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={dark ? "Mode clair" : "Mode sombre"}
          style={{ position: "absolute", top: 20, right: 24, zIndex: 10 }}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className="auth-card" style={{ maxWidth: 440, padding: "36px 32px" }}>
          <div className="auth-logo" style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ display: "inline-block", marginBottom: 8 }}>
              <svg width="46" height="46" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="lgSmallSignup" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4361ee" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <polygon points="50,4 93,27 93,73 50,96 7,73 7,27" fill="url(#lgSmallSignup)" />
                <text x="50" y="60" textAnchor="middle" fontFamily="'Outfit', sans-serif" fontWeight="800" fontSize="30" fill="white" letterSpacing="-1">
                  A.K
                </text>
              </svg>
            </div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text)", margin: "4px 0 2px" }}>
              E-learning Mathematics
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", fontWeight: 600 }}>
              Pr. Anass Khadir
            </p>
          </div>

          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text)" }}>Créer un compte</h2>
            <p className="auth-sub" style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginTop: 2 }}>
              Rejoignez la plateforme privée d'examens
            </p>
          </div>

          {/* Banner d'information plateforme privée */}
          <div
            style={{
              background: "var(--primary-light)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              marginBottom: "18px",
              fontSize: "0.8rem",
              color: "var(--text)",
              lineHeight: "1.45",
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <ShieldCheck size={17} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Accès réservé :</strong> Après inscription, votre demande sera validée par le professeur pour activer vos accès.
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 6, display: "block" }}>
                Nom complet
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                  <Users size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Mohammed Alami"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  style={{
                    paddingLeft: 40,
                    width: "100%",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 6, display: "block" }}>
                Adresse e-mail
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    paddingLeft: 40,
                    width: "100%",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 6, display: "block" }}>
                Mot de passe <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(min. 6 caractères)</span>
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  style={{
                    paddingLeft: 40,
                    paddingRight: 40,
                    width: "100%",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    fontSize: "0.9rem",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    display: "flex",
                  }}
                  title={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="error-msg" style={{ marginBottom: 16, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={15} /> {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{
                width: "100%",
                justifyContent: "center",
                marginTop: 6,
                fontWeight: 700,
                fontSize: "0.95rem",
                boxShadow: "0 4px 14px rgba(67, 97, 238, 0.35)",
              }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: "white" }} />
                  Création du compte…
                </>
              ) : (
                <>
                  Créer mon compte <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer" style={{ marginTop: 24, fontSize: "0.85rem", textAlign: "center" }}>
            Déjà un compte ?{" "}
            <Link
              to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"}
              style={{ fontWeight: 700, color: "var(--primary)" }}
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
