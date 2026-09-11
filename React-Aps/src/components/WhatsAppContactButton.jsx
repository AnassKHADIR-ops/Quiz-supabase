import React from "react";

/**
 * Numéro de contact WhatsApp officiel du professeur
 * Format international pour l'API WhatsApp (Maroc +212, sans le premier 0) :
 * 0659041407 -> 212659041407
 */
export const PROF_WHATSAPP_PHONE = "212659041407";

export function WhatsAppIcon({ size = 18, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/**
 * Construit le message prérempli selon la situation de l'étudiant
 */
export function buildWhatsAppMessage({
  user,
  type = "pending", // "pending" | "revoked" | "rejected" | "signup" | "login" | "general"
  contentTitle = "",
  customMessage = "",
}) {
  if (customMessage) return customMessage;

  const studentName = user?.name || user?.full_name || user?.user_metadata?.full_name || "";
  const studentEmail = user?.email || "";

  let header = "Bonjour Pr. Anass Khadir,";
  let identityLines = [];

  if (studentName) {
    identityLines.push(`Je suis l'étudiant(e) : ${studentName}`);
  }
  if (studentEmail) {
    identityLines.push(`Email : ${studentEmail}`);
  }

  let body = "";
  if (type === "pending") {
    body =
      "Je me suis inscrit(e) sur la plateforme et mon compte est actuellement en attente d'approbation. Pourriez-vous s'il vous plaît valider mon accès aux cours ?";
  } else if (type === "revoked") {
    body =
      "Mon accès à la plateforme a été suspendu / révoqué. Je souhaiterais échanger avec vous pour régulariser ma situation et réactiver mon accès.";
  } else if (type === "rejected") {
    body =
      "Ma demande d'accès n'a pas été acceptée. Je souhaiterais échanger avec vous à ce sujet pour débloquer mon compte.";
  } else if (type === "signup") {
    body =
      "Je viens de créer mon compte sur la plateforme et je suis en attente de validation. Merci de bien vouloir approuver mon accès dès que possible.";
  } else if (type === "login") {
    body =
      "Je n'arrive pas à me connecter à mon compte (compte en attente de validation ou accès suspendu). Pourriez-vous vérifier mon statut ?";
  } else {
    body = "Je vous contacte concernant l'accès aux cours de votre plateforme privée.";
  }

  if (contentTitle) {
    body += `\n(Ressource concernée : ${contentTitle})`;
  }

  const parts = [header];
  if (identityLines.length > 0) {
    parts.push(identityLines.join("\n"));
  }
  parts.push(body);
  parts.push("Merci d'avance pour votre aide !");

  return parts.join("\n\n");
}

export default function WhatsAppContactButton({
  user = null,
  type = "pending",
  contentTitle = "",
  customMessage = "",
  label = null,
  variant = "primary", // "primary" | "modal" | "banner" | "compact" | "outline"
  className = "",
  style = {},
}) {
  const messageText = buildWhatsAppMessage({
    user,
    type,
    contentTitle,
    customMessage,
  });

  const whatsappUrl = `https://wa.me/${PROF_WHATSAPP_PHONE}?text=${encodeURIComponent(messageText)}`;

  const defaultLabel =
    label ||
    (type === "revoked"
      ? "Demander le déblocage sur WhatsApp"
      : type === "pending"
      ? "Demander la validation sur WhatsApp"
      : type === "signup"
      ? "Notifier le professeur sur WhatsApp"
      : "Contacter le professeur sur WhatsApp");

  const baseStyles = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    textDecoration: "none",
    fontWeight: 700,
    fontFamily: '"Outfit", "Inter", sans-serif',
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "none",
    lineHeight: 1.3,
  };

  let variantStyles = {};

  if (variant === "modal") {
    variantStyles = {
      width: "100%",
      padding: "13px 20px",
      fontSize: "0.95rem",
      color: "#ffffff",
      background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
      boxShadow: "0 6px 20px rgba(37, 211, 102, 0.38)",
    };
  } else if (variant === "banner") {
    variantStyles = {
      padding: "8px 16px",
      fontSize: "0.85rem",
      color: "#ffffff",
      background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
      boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)",
      borderRadius: "10px",
      flexShrink: 0,
    };
  } else if (variant === "compact") {
    variantStyles = {
      padding: "6px 12px",
      fontSize: "0.8rem",
      color: "#ffffff",
      background: "#25D366",
      borderRadius: "8px",
    };
  } else if (variant === "outline") {
    variantStyles = {
      padding: "10px 18px",
      fontSize: "0.9rem",
      color: "#128C7E",
      background: "rgba(37, 211, 102, 0.1)",
      border: "1.5px solid rgba(37, 211, 102, 0.5)",
    };
  } else {
    variantStyles = {
      padding: "11px 22px",
      fontSize: "0.92rem",
      color: "#ffffff",
      background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
      boxShadow: "0 4px 16px rgba(37, 211, 102, 0.35)",
    };
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`whatsapp-contact-btn ${className}`}
      style={{
        ...baseStyles,
        ...variantStyles,
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(37, 211, 102, 0.48)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = variantStyles.boxShadow || "none";
      }}
      title="Ouvrir WhatsApp pour envoyer un message direct"
    >
      <WhatsAppIcon size={variant === "compact" ? 15 : 19} />
      <span>{defaultLabel}</span>
    </a>
  );
}
