import React, { useEffect, useId, useRef, useState } from "react";
import { CheckCircle, Download, ExternalLink, FileText, PenLine, X } from "./Icon.jsx";
import { getEmbedUrl, getDriveDownloadUrl } from "../utils/driveUtils.js";

/**
 * Visionneuse PDF native (<dialog closedby="any">) avec barre multi-documents intégrée.
 * Accepte :
 * - { title, url, onClose }
 * - { doc, onClose }
 * - { title, url, docs: [{ label, type, url }], initialIndex, onClose }
 */
export function PdfPreviewModal({ title, url, doc, docs, initialIndex = 0, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [activeIdx, setActiveIdx] = useState(initialIndex || 0);
  const [frameLoaded, setFrameLoaded] = useState(false);

  const validDocs = Array.isArray(docs)
    ? docs.filter((d) => d && typeof d === "object" && d.url)
    : [];
  const hasSwitcher = validDocs.length >= 2;
  const safeIdx = hasSwitcher ? Math.min(Math.max(0, activeIdx), validDocs.length - 1) : 0;
  const activeDoc = hasSwitcher ? validDocs[safeIdx] : null;

  const baseTitle =
    title ||
    doc?.label ||
    doc?.title ||
    (doc?.year ? `Programme ${doc.year}` : "Document PDF");

  const displayTitle = activeDoc
    ? `${activeDoc.label}${baseTitle ? ` — ${baseTitle}` : ""}`
    : baseTitle;

  const rawUrl = activeDoc?.url || url || doc?.document_url || doc?.url || "";
  const embedUrl = getEmbedUrl(rawUrl, "pdf") || rawUrl;
  const downloadUrl = getDriveDownloadUrl(rawUrl) || rawUrl;

  // Reset active index when a new document group opens
  useEffect(() => {
    setActiveIdx(initialIndex || 0);
  }, [initialIndex, url, doc]);

  // Reset loader whenever the iframe src changes
  useEffect(() => {
    setFrameLoaded(false);
  }, [embedUrl]);

  // Native <dialog> showModal() + close event + Safari light-dismiss fallback
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !rawUrl) return;

    if (!dialog.open) {
      if (typeof dialog.showModal === "function") {
        try {
          dialog.showModal();
        } catch {
          dialog.setAttribute("open", "");
        }
      } else {
        dialog.setAttribute("open", "");
      }
    }

    const handleClose = () => {
      onClose?.();
    };
    dialog.addEventListener("close", handleClose);

    // Fallback for browsers without native closedby="any" (e.g. Safari)
    let handleBackdropClick = null;
    if (typeof HTMLDialogElement !== "undefined" && !("closedBy" in HTMLDialogElement.prototype)) {
      handleBackdropClick = (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isInside =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (!isInside) {
          dialog.close();
        }
      };
      dialog.addEventListener("click", handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener("close", handleClose);
      if (handleBackdropClick) {
        dialog.removeEventListener("click", handleBackdropClick);
      }
      if (dialog.open && typeof dialog.close === "function") {
        try {
          dialog.close();
        } catch {}
      }
    };
  }, [rawUrl, onClose]);

  const handleCloseClick = () => {
    const dialog = dialogRef.current;
    if (dialog && dialog.open && typeof dialog.close === "function") {
      dialog.close();
    } else {
      onClose?.();
    }
  };

  if (!rawUrl) return null;

  return (
    <dialog
      ref={dialogRef}
      className="ak-dialog"
      closedby="any"
      aria-labelledby={titleId}
    >
      <div className="ak-pdf-head">
        <span className="ak-pdf-badge">PDF</span>
        <h2 className="ak-pdf-title" id={titleId} title={displayTitle}>
          {displayTitle}
        </h2>
        <div className="ak-pdf-actions">
          {downloadUrl && (
            <a
              className="ak-pdf-btn ak-pdf-dl"
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Télécharger le document"
            >
              <Download size={14} />
              <span className="ak-lbl">Télécharger</span>
            </a>
          )}
          {rawUrl && (
            <a
              className="ak-pdf-btn ak-pdf-tab"
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ouvrir en plein écran dans un nouvel onglet"
            >
              <ExternalLink size={14} />
              <span className="ak-lbl">Plein écran</span>
            </a>
          )}
          <button
            type="button"
            className="ak-pdf-btn ak-pdf-close"
            onClick={handleCloseClick}
            aria-label="Fermer la visionneuse"
            autoFocus
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {hasSwitcher && (
        <div className="ak-pdf-switcher" role="tablist" aria-label="Fichiers du dossier">
          <span className="ak-pdf-sw-label">Dossier :</span>
          {validDocs.map((item, idx) => {
            const isOn = idx === safeIdx;
            const isCorr = item.type === "corr";
            const isExo = item.type === "exo";
            return (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={isOn}
                className={`ak-pdf-sw-pill ${isOn ? "on" : ""} ${isCorr ? "is-corr" : ""}`}
                onClick={() => setActiveIdx(idx)}
              >
                {isCorr ? <CheckCircle size={13} /> : isExo ? <PenLine size={13} /> : <FileText size={13} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="ak-pdf-body">
        {!frameLoaded && (
          <div className="ak-pdf-loader" aria-hidden="true">
            <div className="ak-pdf-spinner" />
            <span>Chargement de l'aperçu PDF…</span>
          </div>
        )}
        <iframe
          key={embedUrl}
          title={displayTitle}
          src={embedUrl}
          allow="autoplay; fullscreen"
          allowFullScreen
          onLoad={() => setFrameLoaded(true)}
        />
      </div>
    </dialog>
  );
}

export default PdfPreviewModal;
