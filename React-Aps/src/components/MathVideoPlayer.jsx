import React, { useState, useEffect } from "react";
import { extractYouTubeId, extractDriveFileId } from "../utils/driveUtils.js";
import { PlayCircle } from "./Icon.jsx";

/**
 * MathVideoPlayer
 * High-performance, distraction-free YouTube & Drive video player for online math courses.
 * Includes Click-Shield Security Overlays to prevent opening YouTube channel/unlisted URLs,
 * disables right-click context menu, and incorporates a 1.5s loading timeout fallback.
 */
export default function MathVideoPlayer({
  videoUrl,
  title = "Séance Vidéo",
  onEnded,
  className = "",
  autoPlay = true,
  aspectRatio = "16/9",
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const rawUrl = (typeof videoUrl === "string" ? videoUrl : "")?.trim();
  const ytId = extractYouTubeId(rawUrl);
  const driveId = !ytId ? extractDriveFileId(rawUrl) : null;

  // Safety fallback: Dismiss loading spinner after 1.5s max to prevent stuck overlay
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [videoUrl]);

  // Fallback if no valid video source is provided
  if (!rawUrl || (!ytId && !driveId) || hasError) {
    return (
      <div
        className={`math-video-container math-video-fallback ${className}`}
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%",
          background: "#0a0f1d",
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
        role="region"
        aria-label={`Lecteur vidéo indisponible - ${title}`}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            padding: 24,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.12)",
              display: "grid",
              placeItems: "center",
              marginBottom: 12,
              color: "#ef4444",
            }}
          >
            <PlayCircle size={32} />
          </div>
          <h4 style={{ color: "#f8fafc", margin: "0 0 6px 0", fontSize: "1.05rem", fontWeight: 600 }}>
            {hasError ? "Erreur de chargement" : "Vidéo en cours de préparation"}
          </h4>
          <p style={{ margin: 0, fontSize: "0.88rem", maxWidth: 420, color: "#94a3b8", lineHeight: 1.5 }}>
            {hasError
              ? "Impossible de charger la vidéo demandée. Veuillez vérifier votre connexion ou réessayer."
              : "La vidéo d'explication de ce chapitre sera disponible très prochainement sur votre espace membre."}
          </p>
        </div>
      </div>
    );
  }

  // Construct privacy-enhanced, distraction-free embed URL with all required parameters
  const embedSrc = ytId
    ? `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1&controls=1&playsinline=1&enablejsapi=1&iv_load_policy=3&disablekb=0`
    : `https://drive.google.com/file/d/${driveId}/preview`;

  return (
    <div
      className={`math-video-container ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: "relative",
        width: "100%",
        paddingTop: "56.25%", // 16:9 Aspect Ratio
        background: "#050811",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
        userSelect: "none",
      }}
      role="region"
      aria-label={title}
    >
      {/* Loading Skeleton Indicator (non-blocking pointer-events & auto-fades) */}
      {isLoading && (
        <div
          className="math-video-skeleton"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #090e1a 0%, #151e32 100%)",
            color: "#94a3b8",
            gap: 14,
            zIndex: 2,
            pointerEvents: "none", // Crucial: Never intercept user clicks or trap the iframe
            transition: "opacity 0.35s ease",
            opacity: isLoading ? 1 : 0,
          }}
          aria-hidden="true"
        >
          <div
            style={{
              width: 42,
              height: 42,
              border: "3px solid rgba(255, 255, 255, 0.1)",
              borderTopColor: "#4361ee",
              borderRadius: "50%",
              animation: "mathVideoSpin 0.9s cubic-bezier(0.6, 0.2, 0.4, 0.8) infinite",
            }}
          />
          <span style={{ fontSize: "0.85rem", fontWeight: 500, letterSpacing: "0.02em" }}>
            Chargement sécurisé du lecteur...
          </span>
          <style>{`
            @keyframes mathVideoSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Resilient iframe embed */}
      <iframe
        key={embedSrc}
        title={title}
        src={embedSrc}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: 0,
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />

      {/* 🛡️ 1. Top Header Click Shield (Blocks Channel Avatar, Title, Share, Watch Later) */}
      {ytId && (
        <div
          className="math-video-shield-top"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 55,
            zIndex: 5,
            background: "transparent",
            cursor: "default",
            userSelect: "none",
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onContextMenu={(e) => e.preventDefault()}
          aria-hidden="true"
        />
      )}

      {/* 🛡️ 2. Bottom-Right Logo Shield (Blocks YouTube Watermark & "Plus de vidéos" popout) */}
      {ytId && (
        <div
          className="math-video-shield-bottom-right"
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 90,
            height: 48,
            zIndex: 5,
            background: "transparent",
            cursor: "default",
            userSelect: "none",
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onContextMenu={(e) => e.preventDefault()}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
