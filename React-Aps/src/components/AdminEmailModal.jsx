import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  PROF_INFO,
  EMAIL_TEMPLATES,
  buildGmailComposeUrl,
  buildMailtoUrl,
} from "../utils/emailTemplates.js";
import { Mail, Check, X } from "./Icon.jsx";

export default function AdminEmailModal({ isOpen, onClose, recipient, initialTemplateId = "adhesion" }) {
  if (!isOpen || !recipient) return null;

  const recipientName = recipient.full_name || recipient.student_name || recipient.name || "";
  const recipientEmail = recipient.email || recipient.student_email || "";

  const tplInitial = EMAIL_TEMPLATES[initialTemplateId] || EMAIL_TEMPLATES.adhesion;
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplateId);
  const [subject, setSubject] = useState(() => tplInitial.getSubject(recipientName));
  const [body, setBody] = useState(() => tplInitial.getBody(recipientName));
  const [copied, setCopied] = useState(false);

  // Synchronisation lors du changement de modèle ou de destinataire
  useEffect(() => {
    const tpl = EMAIL_TEMPLATES[selectedTemplate] || EMAIL_TEMPLATES.adhesion;
    setSubject(tpl.getSubject(recipientName));
    setBody(tpl.getBody(recipientName));
  }, [selectedTemplate, recipientName]);

  // Fermeture par la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Bloquer le défilement de l'arrière-plan quand la modale est ouverte
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleCopy = async () => {
    try {
      const fullText = `Objet : ${subject}\n\n${body}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Erreur copie presse-papier :", err);
    }
  };

  const handleOpenGmail = () => {
    const url = buildGmailComposeUrl({
      to: recipientEmail,
      subject,
      body,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOpenMailto = () => {
    const url = buildMailtoUrl({
      to: recipientEmail,
      subject,
      body,
    });
    window.location.href = url;
  };

  const modalContent = (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(5, 9, 26, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "grid",
        placeItems: "center",
        zIndex: 999999,
        padding: "16px",
        boxSizing: "border-box",
        overflowY: "auto",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "680px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--surface, #ffffff)",
          border: "1px solid var(--border, #e2e8f0)",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          position: "relative",
          margin: "auto",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface-2, #f8fafc)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #ea4335, #c5221f)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 4px 12px rgba(234, 67, 53, 0.3)",
              }}
            >
              <Mail size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text, #0f172a)" }}>
                Contacter l'étudiant par Email
              </h3>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #64748b)", marginTop: 2 }}>
                Via votre compte : <strong style={{ color: "var(--primary, #3b82f6)" }}>{PROF_INFO.email}</strong>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted, #64748b)",
              cursor: "pointer",
              padding: 6,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps défilable */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Métadonnées Destinataire */}
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius, 12px)",
              background: "var(--surface-2, #f8fafc)",
              border: "1px solid var(--border, #e2e8f0)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              fontSize: "0.85rem",
            }}
          >
            <div>
              <span style={{ color: "var(--text-muted, #64748b)", marginRight: 6 }}>Destinataire :</span>
              <strong style={{ color: "var(--text, #0f172a)" }}>{recipientName || "Étudiant"}</strong>
              <span style={{ color: "var(--text-muted, #64748b)", marginLeft: 6 }}>({recipientEmail})</span>
            </div>
            <span
              className="badge"
              style={{
                background: "rgba(16, 185, 129, 0.12)",
                color: "var(--success, #10b981)",
                fontWeight: 700,
                fontSize: "0.74rem",
              }}
            >
              Tarif : {PROF_INFO.annualPrice}
            </span>
          </div>

          {/* Sélecteur de modèle */}
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted, #64748b)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Modèle de message
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.values(EMAIL_TEMPLATES).map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    border: "1.5px solid",
                    borderColor: selectedTemplate === tpl.id ? "var(--primary, #3b82f6)" : "var(--border, #e2e8f0)",
                    background: selectedTemplate === tpl.id ? "var(--primary-light, rgba(59, 130, 246, 0.1))" : "var(--surface, #ffffff)",
                    color: selectedTemplate === tpl.id ? "var(--primary, #3b82f6)" : "var(--text-muted, #64748b)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Champ Objet */}
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted, #64748b)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Objet de l'email
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm, 8px)",
                border: "1px solid var(--border, #e2e8f0)",
                background: "var(--surface, #ffffff)",
                color: "var(--text, #0f172a)",
                fontSize: "0.88rem",
                fontWeight: 600,
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Champ Corps */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted, #64748b)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Contenu du message
              </label>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted, #64748b)" }}>
                Vous pouvez ajuster le texte ci-dessous avant d'ouvrir Gmail
              </span>
            </div>
            <textarea
              rows={11}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "var(--radius-sm, 8px)",
                border: "1px solid var(--border, #e2e8f0)",
                background: "var(--surface, #ffffff)",
                color: "var(--text, #0f172a)",
                fontSize: "0.82rem",
                lineHeight: "1.55",
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Pied de modale / Boutons d'action */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border, #e2e8f0)",
            background: "var(--surface-2, #f8fafc)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Action secondaire : Copier le texte */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
            title="Copier l'objet et le texte pour le coller où vous voulez"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {copied ? (
              <>
                <Check size={14} style={{ color: "var(--success, #10b981)" }} />
                <span style={{ color: "var(--success, #10b981)" }}>Copié dans le presse-papier !</span>
              </>
            ) : (
              <>
                <span>📋 Copier le message</span>
              </>
            )}
          </button>

          {/* Actions principales d'ouverture */}
          <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleOpenMailto}
              title="Ouvrir dans votre client de messagerie par défaut (Outlook, Apple Mail, etc.)"
            >
              Client Mail ↗
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenGmail}
              style={{
                background: "linear-gradient(135deg, #ea4335, #d93025)",
                borderColor: "#d93025",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 700,
                boxShadow: "0 4px 14px rgba(234, 67, 53, 0.35)",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <Mail size={16} /> Ouvrir dans Gmail ↗
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
