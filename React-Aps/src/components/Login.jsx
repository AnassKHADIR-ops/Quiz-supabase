import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { authApi } from "../api.js";
import { useTheme } from "../hooks/useTheme.js";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Trophy,
  GraduationCap
} from "./Icon.jsx";
import WhatsAppContactButton from "./WhatsAppContactButton.jsx";

// Logo hexagone premium avec gradient & reflet
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
          <linearGradient id="akHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#4361ee" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <polygon points="50,4 93,27 93,73 50,96 7,73 7,27" fill="url(#akHeroGrad)" />
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

function Login() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialForgot = searchParams.get("forgot") === "1";

  const [mode, setMode] = useState(initialForgot ? "forgot" : "login"); // "login" | "forgot"
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // États pour la réinitialisation sécurisée par WhatsApp (2 étapes)
  const [resetStep, setResetStep] = useState(1); // 1 = Demande + WhatsApp, 2 = Code 6 chiffres + Nouveau MDP
  const [resetPhone, setResetPhone] = useState("");
  const [resetRequestedInfo, setResetRequestedInfo] = useState(null);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [dark, toggleTheme] = useTheme();

  const redirectUrl = searchParams.get("redirect") || "";

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
      } else if (user?.role === "teacher" || user?.role === "admin") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, redirectUrl, navigate]);

  const openForgotMode = () => {
    setMode("forgot");
    setResetStep(1);
    setError("");
    setSuccessMsg("");
    setResetRequestedInfo(null);
  };

  const backToLogin = () => {
    setMode("login");
    setError("");
    setResetStep(1);
    setResetRequestedInfo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
      } else if (loggedUser?.role === "teacher" || loggedUser?.role === "admin") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!email.trim()) {
      setError("Veuillez renseigner votre adresse e-mail.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.requestPasswordReset(email, resetPhone);
      setResetRequestedInfo({
        email: res?.email || email.trim().toLowerCase(),
        full_name: res?.full_name || "",
        expires_at: res?.expires_at || null,
      });
      setSuccessMsg(
        "Demande sécurisée enregistrée ! Contactez maintenant Pr. Anass Khadir sur WhatsApp pour qu'il vous communique votre code à 6 chiffres."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const cleanCode = resetCode.replace(/\s+/g, "");
    if (!email.trim()) {
      setError("Veuillez renseigner votre adresse e-mail.");
      return;
    }
    if (cleanCode.length !== 6) {
      setError("Le code de validation reçu sur WhatsApp doit contenir exactement 6 chiffres.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Le nouveau mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await authApi.confirmPasswordReset(email, cleanCode, newPassword);
      setPassword("");
      setResetCode("");
      setNewPassword("");
      setConfirmNewPassword("");
      setResetRequestedInfo(null);
      setMode("login");
      setSuccessMsg("Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Panel gauche immersif & moderne ── */}
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
          {/* Badge Supérieur */}
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
            Préparez vos Concours <br />
            <span style={{ background: "linear-gradient(90deg, #60a5fa, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              en Mathématiques
            </span>
          </h2>

          <p style={{ color: "rgba(255, 255, 255, 0.82)", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: 440, margin: "16px auto 0" }}>
            Des annales de concours rigoureusement corrigées, des démonstrations détaillées en LaTeX et un suivi personnalisé pour maximiser votre admissibilité.
          </p>

          {/* Grille de statistiques interactives en verre */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginTop: 36,
              maxWidth: 460,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {[
              { val: "100%", label: "Gratuit", sub: "Accès privé validé" },
              { val: "∞", label: "Essais", sub: "Chronométré ou libre" },
              { val: "A+", label: "Résultats", sub: "Corrigés pas à pas" },
            ].map((s) => (
              <div
                key={s.label}
                className="auth-stat-glass-box"
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  borderRadius: "14px",
                  padding: "14px 10px",
                  textAlign: "center",
                  transition: "transform .2s ease, background .2s ease",
                }}
              >
                <div style={{ fontSize: "1.45rem", fontWeight: 900, fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif", color: "white" }}>
                  {s.val}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#93c5fd", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 800, marginTop: 2 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: "0.65rem", color: "rgba(255, 255, 255, 0.6)", marginTop: 2 }}>
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Témoignage / Mention de réussite */}
          <div
            style={{
              marginTop: 28,
              padding: "12px 18px",
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(10px)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              maxWidth: 460,
              marginInline: "auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "grid",
                placeItems: "center",
                color: "white",
                flexShrink: 0,
              }}
            >
              <GraduationCap size={18} />
            </div>
            <div style={{ fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.45 }}>
              Préparation ciblée aux concours : <strong>ISCAE, ENSA, ENSAM, CNC, Capes & Enseignement</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel droit — formulaire moderne ── */}
      <div className="auth-panel-right">
        {/* Dark mode toggle */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={dark ? "Mode clair" : "Mode sombre"}
          style={{ position: "absolute", top: 20, right: 24, zIndex: 10 }}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className="auth-card" style={{ maxWidth: 440, padding: "36px 32px" }}>
          {/* Logo & En-tête */}
          <div className="auth-logo" style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ display: "inline-block", marginBottom: 8 }}>
              <svg width="46" height="46" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="lgSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4361ee" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <polygon points="50,4 93,27 93,73 50,96 7,73 7,27" fill="url(#lgSmall)" />
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

          {mode === "login" ? (
            <>
              <div style={{ textAlign: "left", marginBottom: 20 }}>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text)" }}>Connexion</h2>
                <p className="auth-sub" style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginTop: 2 }}>
                  Accédez à vos examens et concours privés
                </p>
              </div>

              {successMsg && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: "11px 14px",
                    borderRadius: 10,
                    background: "var(--success-light)",
                    border: "1px solid var(--success)",
                    color: "var(--success)",
                    fontSize: "0.84rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <CheckCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Champ Email */}
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 6, display: "block" }}>
                    Adresse e-mail
                  </label>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      placeholder="nom.prenom@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                        transition: "all .15s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Champ Mot de passe + Lien Mot de passe oublié */}
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, margin: 0 }}>
                      Mot de passe
                    </label>
                    <button
                      type="button"
                      onClick={openForgotMode}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--primary)",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: 0,
                        textDecoration: "underline",
                      }}
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                        transition: "all .15s ease",
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
                  <div style={{ marginBottom: 16 }}>
                    <p className="error-msg" style={{ marginBottom: (error.toLowerCase().includes("attente") || error.toLowerCase().includes("révoqué") || error.toLowerCase().includes("suspendu") || error.toLowerCase().includes("incorrect")) ? 10 : 0, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertTriangle size={15} /> {error}
                    </p>
                    {(error.toLowerCase().includes("attente") || error.toLowerCase().includes("révoqué") || error.toLowerCase().includes("suspendu")) && (
                      <WhatsAppContactButton
                        user={{ email }}
                        type={error.toLowerCase().includes("révoqué") || error.toLowerCase().includes("suspendu") ? "revoked" : "pending"}
                        variant="modal"
                        label={error.toLowerCase().includes("révoqué") ? "Demander le déblocage sur WhatsApp" : "Demander l'approbation sur WhatsApp"}
                      />
                    )}
                    {error.toLowerCase().includes("incorrect") && (
                      <button
                        type="button"
                        onClick={openForgotMode}
                        className="btn btn-secondary btn-sm"
                        style={{ width: "100%", justifyContent: "center", gap: 6, marginTop: 4 }}
                      >
                        <KeyRound size={14} /> Mot de passe oublié ? Réinitialiser via WhatsApp
                      </button>
                    )}
                  </div>
                )}

                {/* Bouton de Connexion */}
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
                      Connexion en cours…
                    </>
                  ) : (
                    <>
                      Se connecter <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* ── Mode Réinitialisation Sécurisée via WhatsApp ── */
            <div>
              <button
                type="button"
                onClick={backToLogin}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: 0,
                  marginBottom: 14,
                }}
              >
                <ArrowLeft size={14} /> Retour à la connexion
              </button>

              <div style={{ textAlign: "left", marginBottom: 16 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.74rem", fontWeight: 700, color: "var(--primary)", background: "var(--primary-light)", padding: "3px 10px", borderRadius: 99, marginBottom: 8 }}>
                  <ShieldCheck size={13} /> Validation sécurisée WhatsApp • Étape {resetStep}/2
                </div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>
                  Mot de passe oublié
                </h2>
                <p style={{ fontSize: "0.83rem", color: "var(--text-muted)", marginTop: 4, lineHeight: 1.45 }}>
                  {resetStep === 1
                    ? "Envoyez une demande sécurisée. Pr. Anass Khadir vérifiera votre identité sur WhatsApp et vous transmettra votre code à 6 chiffres."
                    : "Saisissez le code à 6 chiffres communiqué par Pr. Anass Khadir sur WhatsApp, puis choisissez votre nouveau mot de passe."}
                </p>
              </div>

              {/* Onglets rapides Étape 1 / Étape 2 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                  padding: 4,
                  background: "var(--surface-2)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  marginBottom: 16,
                }}
              >
                <button
                  type="button"
                  onClick={() => { setResetStep(1); setError(""); }}
                  style={{
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "none",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: resetStep === 1 ? "var(--primary)" : "transparent",
                    color: resetStep === 1 ? "white" : "var(--text-muted)",
                  }}
                >
                  1. Demander un code
                </button>
                <button
                  type="button"
                  onClick={() => { setResetStep(2); setError(""); }}
                  style={{
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "none",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: resetStep === 2 ? "var(--primary)" : "transparent",
                    color: resetStep === 2 ? "white" : "var(--text-muted)",
                  }}
                >
                  2. J'ai reçu le code
                </button>
              </div>

              {error && (
                <p className="error-msg" style={{ marginBottom: 14, fontSize: "0.84rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={15} /> {error}
                </p>
              )}

              {resetStep === 1 ? (
                <>
                  {!resetRequestedInfo ? (
                    <form onSubmit={handleRequestReset}>
                      <div className="form-group" style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 6, display: "block" }}>
                          Adresse e-mail de votre compte *
                        </label>
                        <div style={{ position: "relative" }}>
                          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                            <Mail size={16} />
                          </div>
                          <input
                            type="email"
                            placeholder="nom.prenom@exemple.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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

                      <div className="form-group" style={{ marginBottom: 18 }}>
                        <label style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 6, display: "block" }}>
                          Votre numéro WhatsApp <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(facultatif)</span>
                        </label>
                        <div style={{ position: "relative" }}>
                          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                            <Phone size={16} />
                          </div>
                          <input
                            type="tel"
                            placeholder="+212 6 XX XX XX XX"
                            value={resetPhone}
                            onChange={(e) => setResetPhone(e.target.value)}
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

                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                        style={{ width: "100%", justifyContent: "center", fontWeight: 700, fontSize: "0.92rem" }}
                      >
                        {loading ? (
                          <>
                            <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: "white" }} />
                            Génération sécurisée…
                          </>
                        ) : (
                          <>
                            <KeyRound size={16} /> Demander un code à Pr. Khadir
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 14,
                        background: "rgba(37, 211, 102, 0.08)",
                        border: "1px solid rgba(37, 211, 102, 0.35)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--success)", fontWeight: 800, fontSize: "0.92rem" }}>
                        <CheckCircle size={18} /> Demande transmise au professeur !
                      </div>
                      <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                        Un code sécurisé à 6 chiffres (valable <strong>30 min</strong>) est maintenant affiché dans le tableau de bord de <strong>Pr. Anass Khadir</strong> pour le compte <code>{resetRequestedInfo.email}</code>.
                      </p>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text)", fontWeight: 600 }}>
                        Cliquez ci-dessous pour le contacter sur WhatsApp afin qu'il vérifie votre identité et vous envoie ce code :
                      </p>

                      <WhatsAppContactButton
                        user={{ name: resetRequestedInfo.full_name, email: resetRequestedInfo.email }}
                        type="password_reset"
                        variant="modal"
                        label="Demander mon code sur WhatsApp"
                      />

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => { setResetStep(2); setError(""); }}
                        style={{ width: "100%", justifyContent: "center", fontWeight: 700 }}
                      >
                        J'ai reçu mon code à 6 chiffres <ArrowRight size={15} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <form onSubmit={handleConfirmReset}>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 5, display: "block" }}>
                      Adresse e-mail
                    </label>
                    <input
                      type="email"
                      placeholder="nom.prenom@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border)",
                        background: "var(--surface-2)",
                        color: "var(--text)",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 5, display: "block" }}>
                      Code de validation reçu sur WhatsApp (6 chiffres) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="ex: 482913"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, ""))}
                      required
                      autoFocus
                      style={{
                        width: "100%",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--primary)",
                        background: "var(--surface-2)",
                        color: "var(--text)",
                        fontSize: "1.15rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 800,
                        letterSpacing: "0.28em",
                        textAlign: "center",
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 5, display: "block" }}>
                      Nouveau mot de passe <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(min. 6 caractères)</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={6}
                        required
                        style={{
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
                        onClick={() => setShowNewPassword(!showNewPassword)}
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
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 5, display: "block" }}>
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      minLength={6}
                      required
                      style={{
                        width: "100%",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border)",
                        background: "var(--surface-2)",
                        color: "var(--text)",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                    style={{ width: "100%", justifyContent: "center", fontWeight: 700, fontSize: "0.92rem" }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: "white" }} />
                        Mise à jour en cours…
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} /> Confirmer le nouveau mot de passe
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="auth-footer" style={{ marginTop: 24, fontSize: "0.85rem", textAlign: "center" }}>
            Pas encore de compte ?{" "}
            <Link
              to={redirectUrl ? `/signup?redirect=${encodeURIComponent(redirectUrl)}` : "/signup"}
              style={{ fontWeight: 700, color: "var(--primary)" }}
            >
              S'inscrire gratuitement
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
