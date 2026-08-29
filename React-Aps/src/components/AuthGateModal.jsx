import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Lock, X, PlayCircle, CheckCircle, ArrowRight, Sparkles, ShieldCheck } from "./Icon.jsx";

export default function AuthGateModal({
  isOpen = true,
  onClose,
  contentType = "video", // "video" | "correction" | "exam" | "member"
  title,
}) {
  const location = useLocation();
  const currentUrl = location.pathname + location.search;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const config = {
    video: {
      badge: "Replay Vidéo • Espace Membre",
      badgeColor: "#ef4444",
      icon: <PlayCircle size={30} />,
      title: title ? `Vidéo : ${title}` : "Séance Vidéo & Replay",
      headline: "Contenu Réservé aux Membres",
      description:
        "Les explications détaillées en vidéo et les replays interactifs sont réservés aux étudiants membres de la plateforme.",
    },
    correction: {
      badge: "Correction PDF • Espace Membre",
      badgeColor: "#10b981",
      icon: <CheckCircle size={30} />,
      title: title ? `Correction : ${title}` : "Correction Détaillée PDF",
      headline: "Correction Réservée aux Membres",
      description:
        "L'accès aux solutions rédigées, aux démonstrations complètes et aux fiches corrigées nécessite une connexion membre.",
    },
    exam: {
      badge: "Examen Privé • Espace Membre",
      badgeColor: "#4361ee",
      icon: <Lock size={30} />,
      title: title || "Épreuve & QCM Concours",
      headline: "Accès Réservé aux Étudiants Inscrits",
      description:
        "Pour passer ce test interactif et enregistrer vos résultats personnalisés, connectez-vous ou créez votre compte.",
    },
    member: {
      badge: "Accès Membre",
      badgeColor: "#d97706",
      icon: <ShieldCheck size={30} />,
      title: title || "Espace Membre Requis",
      headline: "Espace Membre Requis",
      description:
        "Ce contenu pédagogique exclusif est accessible à tous les membres connectés de la plateforme.",
    },
  }[contentType] || {
    badge: "Espace Membre",
    badgeColor: "#4361ee",
    icon: <Lock size={30} />,
    title: title || "Contenu Réservé",
    headline: "Espace Membre Requis",
    description: "Connectez-vous à votre compte membre pour débloquer l'accès complet.",
  };

  const loginLink = `/login?redirect=${encodeURIComponent(currentUrl)}`;
  const signupLink = `/signup?redirect=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="modal-backdrop" onMouseDown={onClose} style={{ zIndex: 1100 }}>
      <div
        className="document-preview-modal auth-gate-modal fade-up"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          maxWidth: 520,
          width: "92vw",
          borderRadius: 22,
          overflow: "hidden",
          background: "var(--card-bg, #ffffff)",
          boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.4)",
          border: "1px solid var(--border)",
          padding: 0,
          textAlign: "center",
        }}
      >
        {/* Top Decorative Banner */}
        <div
          style={{
            position: "relative",
            background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #7c3aed 100%)",
            padding: "36px 24px 28px",
            color: "white",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "grid",
              placeItems: "center",
              color: "white",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            title="Fermer"
          >
            <X size={16} />
          </button>

          {/* Glowing Icon Badge */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "rgba(255, 255, 255, 0.18)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              color: "#ffffff",
            }}
          >
            {config.icon}
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(6px)",
              padding: "4px 14px",
              borderRadius: 99,
              fontSize: "0.74rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 10,
              border: "1px solid rgba(255, 255, 255, 0.25)",
            }}
          >
            <Sparkles size={13} style={{ color: "#fde047" }} />
            {config.badge}
          </div>

          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 6px", color: "white" }}>
            {config.headline}
          </h2>
          <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9, lineHeight: 1.45 }}>
            {config.title}
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "26px 28px 24px", background: "var(--surface)" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.55, margin: "0 0 22px" }}>
            {config.description}
          </p>

          {/* Platform Perks List */}
          <div
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "14px 16px",
              marginBottom: 24,
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.86rem", color: "var(--text)" }}>
              <span style={{ fontSize: "1.1rem" }}>🎬</span>
              <span><strong>Vidéos & Replays HD</strong> : Explications pas-à-pas de chaque chapitre</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.86rem", color: "var(--text)" }}>
              <span style={{ fontSize: "1.1rem" }}>📝</span>
              <span><strong>Corrections Détaillées</strong> : Démonstrations et rédactions complètes</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.86rem", color: "var(--text)" }}>
              <span style={{ fontSize: "1.1rem" }}>⚡</span>
              <span><strong>QCM & Concours</strong> : Entraînement interactif et suivi de progression</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              to={loginLink}
              className="btn btn-primary btn-lg"
              style={{
                width: "100%",
                justifyContent: "center",
                fontWeight: 700,
                borderRadius: 12,
                boxShadow: "0 4px 14px rgba(67, 97, 238, 0.35)",
              }}
            >
              Se connecter à mon compte <ArrowRight size={16} />
            </Link>

            <Link
              to={signupLink}
              className="btn btn-secondary btn-lg"
              style={{
                width: "100%",
                justifyContent: "center",
                fontWeight: 700,
                borderRadius: 12,
              }}
            >
              Créer un compte gratuitement
            </Link>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "0.82rem",
              marginTop: 16,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Continuer la consultation libre des énoncés et synthèses
          </button>
        </div>
      </div>
    </div>
  );
}
