import React, { useEffect } from "react";
import { Download, ExternalLink, X } from "lucide-react";
import { getEmbedUrl, getDriveDownloadUrl } from "../utils/driveUtils.js";

/**
 * Composant unifié et accessible de prévisualisation de documents PDF.
 * Accepte { title, url, onClose } ou { doc, onClose }.
 */
export function PdfPreviewModal({ title, url, doc, onClose }) {
  const displayTitle =
    title ||
    doc?.label ||
    doc?.title ||
    (doc?.year ? `Programme ${doc.year}` : "Document PDF");

  const rawUrl = url || doc?.document_url || doc?.url || "";
  const embedUrl = getEmbedUrl(rawUrl, "pdf") || rawUrl;
  const downloadUrl = getDriveDownloadUrl(rawUrl) || rawUrl;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!rawUrl) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(10, 15, 44, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="document-preview-modal"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          maxWidth: 1060,
          width: "96vw",
          height: "90vh",
          background: "var(--surface, #ffffff)",
          borderRadius: 18,
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="document-preview-head"
          style={{
            padding: "12px 20px",
            background: "var(--surface-2, #f8fafc)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                background: "var(--primary, #4361ee)",
                color: "#fff",
                padding: "3px 8px",
                borderRadius: 6,
                flexShrink: 0,
                letterSpacing: "0.04em",
              }}
            >
              PDF
            </span>
            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: "var(--text)",
              }}
              title={displayTitle}
            >
              {displayTitle}
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-primary"
                style={{
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  fontSize: "0.82rem",
                  textDecoration: "none",
                }}
              >
                <Download size={14} />
                <span>Télécharger</span>
              </a>
            )}
            {embedUrl && (
              <a
                href={embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  fontSize: "0.82rem",
                  textDecoration: "none",
                }}
              >
                <ExternalLink size={13} />
                <span>Drive</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 6,
                color: "var(--text-muted)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, position: "relative", background: "#1a1a2e" }}>
          <iframe
            title={displayTitle}
            src={embedUrl}
            style={{ width: "100%", height: "100%", border: "none" }}
            allow="autoplay"
          />
        </div>
      </div>
    </div>
  );
}

export default PdfPreviewModal;
