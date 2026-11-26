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
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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
  const hasUrl = Boolean(rawUrl);
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

  // Native <dialog> showModal() + close event + Safari pointer-position light-dismiss fallback.
  // Depends only on `hasUrl` (never on `rawUrl` or `onClose`) so parent re-renders
  // (e.g. setSearchParams transitions) or multi-doc tab switches never close/re-open the dialog.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !hasUrl) return;

    if (!dialog.open && typeof dialog.showModal === "function") {
      try {
        dialog.showModal();
      } catch {
        // Ignore if dialog is already open or detached
      }
    }

    const handleClose = () => {
      dialog.returnValue = "";
      // Ignore stale queued `close` events fired asynchronously after a cleanup->remount
      // cycle (e.g. React 18 StrictMode) when the dialog has already been re-opened.
      if (dialog.open) return;
      onCloseRef.current?.();
    };
    dialog.addEventListener("close", handleClose);

    // Fallback for browsers without native closedby="any" (e.g. Safari):
    // require both pointerdown and pointerup outside the dialog box so text-selection drags
    // ending on the backdrop do not accidentally dismiss the viewer.
    const supportsClosedBy =
      typeof HTMLDialogElement !== "undefined" &&
      "closedBy" in HTMLDialogElement.prototype;

    let handlePointerDown = null;
    let handlePointerUp = null;

    if (!supportsClosedBy) {
      let pressedOutside = false;
      const isOutside = (e) => {
        const r = dialog.getBoundingClientRect();
        return (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        );
      };
      handlePointerDown = (e) => {
        pressedOutside = isOutside(e);
      };
      handlePointerUp = (e) => {
        if (pressedOutside && isOutside(e) && dialog.open) {
          dialog.close();
        }
        pressedOutside = false;
      };
      dialog.addEventListener("pointerdown", handlePointerDown);
      dialog.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      dialog.removeEventListener("close", handleClose);
      if (handlePointerDown) {
        dialog.removeEventListener("pointerdown", handlePointerDown);
      }
      if (handlePointerUp) {
        dialog.removeEventListener("pointerup", handlePointerUp);
      }
      if (dialog.open && typeof dialog.close === "function") {
        try {
          dialog.close();
        } catch {
          // Ignore if already detached
        }
      }
    };
  }, [hasUrl]);

  const handleCloseClick = () => {
    const dialog = dialogRef.current;
    if (dialog && dialog.open && typeof dialog.close === "function") {
      dialog.close();
    } else {
      onCloseRef.current?.();
    }
  };

  if (!hasUrl) return null;

  return (
    <dialog
      ref={dialogRef}
      className="ak-dialog"
      closedby="any"
      aria-labelledby={titleId}
    >
      <div className="ak-pdf-head">
        <span className="ak-pdf-badge">PDF</span>
        <h1 className="ak-pdf-title" id={titleId} title={displayTitle}>
          {displayTitle}
        </h1>
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
