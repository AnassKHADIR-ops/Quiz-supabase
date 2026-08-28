import React, { useState } from "react";
import ReactPlayer from "react-player";
import { extractYouTubeId, extractDriveFileId } from "../utils/driveUtils.js";
import { PlayCircle, ShieldCheck } from "./Icon.jsx";

/**
 * MathVideoPlayer
 * Distraction-free, responsive YouTube video player for online math courses.
 */
export default function MathVideoPlayer({
  videoUrl,
  title = "Séance Vidéo",
  onEnded,
  onProgress,
  onPlay,
  onPause,
  className = "",
  autoPlay = false,
  aspectRatio = "16/9",
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const rawUrl = (typeof videoUrl === "string" ? videoUrl : "")?.trim();
  const ytId = extractYouTubeId(rawUrl);
  const driveId = !ytId ? extractDriveFileId(rawUrl) : null;

  // Normalized YouTube playback URL
  const normalizedYtUrl = ytId ? `https://www.youtube.com/watch?v=${ytId}` : null;

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

  return (
    <div
      className={`math-video-container ${className}`}
      style={{
        position: "relative",
        width: "100%",
        paddingTop: "56.25%", // 16:9 Aspect Ratio
        background: "#050811",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
      }}
      role="region"
      aria-label={title}
    >
      {/* Loading Skeleton Indicator */}
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
            transition: "opacity 0.3s ease",
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

      {/* YouTube Player via ReactPlayer */}
      {normalizedYtUrl ? (
        <ReactPlayer
          url={normalizedYtUrl}
          width="100%"
          height="100%"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
          controls={true}
          playing={autoPlay}
          onReady={() => setIsLoading(false)}
          onEnded={onEnded}
          onProgress={onProgress}
          onPlay={onPlay}
          onPause={onPause}
          onError={(err) => {
            console.error("MathVideoPlayer Error:", err);
            setIsLoading(false);
            setHasError(true);
          }}
          config={{
            youtube: {
              playerVars: {
                rel: 0, // Prevent recommendations from other channels
                modestbranding: 1, // Minimize YouTube logo
                fs: 1, // Fullscreen button enabled
                playsinline: 1, // Mobile inline playback
                controls: 1, // Player controls visible
                iv_load_policy: 3, // Disable annotations/popups
                origin: typeof window !== "undefined" ? window.location.origin : undefined,
              },
            },
          }}
        />
      ) : driveId ? (
        /* Fallback for Google Drive videos */
        <iframe
          title={title}
          src={`https://drive.google.com/file/d/${driveId}/preview`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: 0,
          }}
          onLoad={() => setIsLoading(false)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : null}
    </div>
  );
}
