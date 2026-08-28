import { useEffect } from "react";
import { Link } from "react-router-dom";
import { X, PlayCircle, Download, FileText, CheckCircle, Zap, ShieldCheck } from "./Icon.jsx";
import MathVideoPlayer from "./MathVideoPlayer.jsx";
import { getEmbedUrl, extractDriveFileId, extractYouTubeId } from "../utils/driveUtils.js";

function SecureVideoModal({ chapter, videoUrl, title, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const rawUrl = videoUrl || (chapter && (chapter.video_url || chapter.video || chapter.v || chapter.vid || chapter.video_id)) || "";
  const displayTitle = title || (chapter && (chapter.titre || chapter.t)) || "Séance & Replay Vidéo";
  const embedUrl = getEmbedUrl(rawUrl, "video");
  const hasEmbed = embedUrl && embedUrl !== "about:blank";

  return (
    <div className="modal-backdrop" onMouseDown={onClose} style={{ zIndex: 1000 }}>
      <div
        className="document-preview-modal video-player-modal"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          maxWidth: 960,
          width: "95vw",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 18,
          overflow: "hidden",
          background: "var(--card-bg, #ffffff)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* Header */}
        <div
          className="document-preview-head"
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-subtle, #f8fafc)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                display: "grid",
                placeItems: "center",
                color: "white",
                boxShadow: "0 4px 10px rgba(239, 68, 68, 0.3)",
              }}
            >
              <PlayCircle size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {chapter?.n || chapter?.id ? (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--primary)",
                    }}
                  >
                    Chapitre {chapter.n || chapter.id}
                  </span>
                ) : null}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#059669",
                  }}
                >
                  <ShieldCheck size={12} /> Espace Membre
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>
                {displayTitle}
              </h3>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {chapter?.video_duration && (
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  background: "var(--bg-tag, rgba(0,0,0,0.05))",
                  padding: "4px 10px",
                  borderRadius: 6,
                }}
              >
                ⏱️ {chapter.video_duration}
              </span>
            )}
            <button
              className="management-modal-close"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 6,
                borderRadius: 8,
                display: "grid",
                placeItems: "center",
                color: "var(--text-muted)",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <MathVideoPlayer
          videoUrl={rawUrl}
          title={displayTitle}
          autoPlay={true}
        />

        {/* Modal Footer / Quick Actions */}
        <div
          style={{
            padding: "16px 22px",
            background: "var(--card-bg, #ffffff)",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {chapter?.pdf && (
              <a
                href={chapter.pdf}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Download size={14} /> Cours PDF
              </a>
            )}
            {chapter?.exo && (
              <a
                href={chapter.exo}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <FileText size={14} /> Exercices PDF
              </a>
            )}
            {chapter?.corr && (
              <a
                href={chapter.corr}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <CheckCircle size={14} /> Correction PDF
              </a>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {chapter?.qcm_id ? (
              <Link
                to={`/exam/${chapter.qcm_id}`}
                className="btn btn-primary btn-sm"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "linear-gradient(135deg, #4361ee, #7c3aed)",
                  color: "white",
                  border: "none",
                }}
              >
                <Zap size={14} /> S'entraîner sur ce QCM
              </Link>
            ) : null}
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecureVideoModal;
