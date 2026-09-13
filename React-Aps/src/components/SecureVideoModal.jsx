import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, PlayCircle, Download, FileText, CheckCircle, Zap, ShieldCheck } from "./Icon.jsx";
import MathVideoPlayer from "./MathVideoPlayer.jsx";
import { getEmbedUrl } from "../utils/driveUtils.js";

function SecureVideoModal({ chapter, videoUrl, title, onClose }) {
  const [isControlsVisible, setIsControlsVisible] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const rawUrl = videoUrl || (chapter && (chapter.video_url || chapter.video || chapter.v || chapter.vid || chapter.video_id)) || "";
  const displayTitle = title || (chapter && (chapter.titre || chapter.t)) || "Séance & Replay Vidéo";
  const hasResources = Boolean(chapter?.pdf || chapter?.exo || chapter?.corr || chapter?.qcm_id);

  return (
    <div className="video-modal-backdrop" onMouseDown={onClose} style={{ zIndex: 1000 }}>
      <div
        className={`video-player-modal ${!isControlsVisible ? "controls-hidden" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(96vw, 980px)",
          height: "auto",
          maxHeight: "94vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 18,
          overflow: "hidden",
          background: "var(--card-bg, #ffffff)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.45)",
        }}
      >
        {/* Header */}
        <div
          className="document-preview-head"
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-subtle, #f8fafc)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                display: "grid",
                placeItems: "center",
                color: "white",
                boxShadow: "0 4px 10px rgba(239, 68, 68, 0.3)",
                flexShrink: 0,
              }}
            >
              <PlayCircle size={20} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                {chapter?.n || chapter?.id ? (
                  <span
                    style={{
                      fontSize: "0.72rem",
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
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    padding: "1px 7px",
                    borderRadius: 99,
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#059669",
                  }}
                >
                  <ShieldCheck size={11} /> Espace Membre
                </span>
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.02rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={displayTitle}
              >
                {displayTitle}
              </h3>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 10 }}>
            {chapter?.video_duration && (
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  background: "var(--bg-tag, rgba(0,0,0,0.05))",
                  padding: "3px 8px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                }}
              >
                ⏱️ {chapter.video_duration}
              </span>
            )}
            <button
              className="management-modal-close"
              onClick={onClose}
              aria-label="Fermer"
              style={{
                background: "var(--surface-3, rgba(0,0,0,0.05))",
                border: "none",
                cursor: "pointer",
                padding: 6,
                borderRadius: 8,
                display: "grid",
                placeItems: "center",
                color: "var(--text)",
                width: 32,
                height: 32,
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <MathVideoPlayer
          videoUrl={rawUrl}
          title={displayTitle}
          autoPlay={true}
          onControlsVisibilityChange={setIsControlsVisible}
        />

        {/* Modal Footer / Quick Actions */}
        <div className="video-modal-footer">
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
            {!hasResources && (
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                🎓 Séance de cours & révision mathématique
              </span>
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
