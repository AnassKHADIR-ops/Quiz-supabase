import React, { useState, useEffect, useRef, useCallback } from "react";
import { extractYouTubeId, extractDriveFileId } from "../utils/driveUtils.js";
import {
  Play,
  Pause,
  PlayCircle,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  Loader2
} from "./Icon.jsx";

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const s = Math.floor(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Load YouTube IFrame API once globally
let ytApiPromise = null;
function loadYouTubeIframeApi() {
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const existingScript = document.getElementById("yt-iframe-api-script");
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScript = document.getElementsByTagName("script")[0];
        firstScript.parentNode.insertBefore(tag, firstScript);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === "function") prevCallback();
        resolve(window.YT);
      };

      // Fallback check in case script was already loading
      const interval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(interval);
          resolve(window.YT);
        }
      }, 100);
    });
  }
  return ytApiPromise;
}

/**
 * MathVideoPlayer
 * High-performance, 100% distraction-free video player for higher math courses.
 * Completely eliminates YouTube channel avatar, titles, share buttons, and recommendations.
 */
export default function MathVideoPlayer({
  videoUrl,
  title = "Séance Vidéo",
  onEnded,
  className = "",
  autoPlay = true,
}) {
  const containerRef = useRef(null);
  const ytPlayerContainerRef = useRef(null);
  const playerRef = useRef(null);
  const timeUpdateTimerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [splashAction, setSplashAction] = useState(null); // 'play' | 'pause' | 'seek-forward' | 'seek-backward'

  const rawUrl = (typeof videoUrl === "string" ? videoUrl : "")?.trim();
  const ytId = extractYouTubeId(rawUrl);
  const driveId = !ytId ? extractDriveFileId(rawUrl) : null;
  const isDirectVideo = !ytId && !driveId && rawUrl.match(/\.(mp4|webm|ogg)$/i);

  // Trigger brief center icon splash feedback
  const triggerSplash = (type) => {
    setSplashAction(type);
    setTimeout(() => {
      setSplashAction((prev) => (prev === type ? null : prev));
    }, 550);
  };

  // Activity handler for auto-hiding controls
  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 2800);
    }
  }, [isPlaying]);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Time tracker loop when playing
  const startTimeTracking = useCallback(() => {
    if (timeUpdateTimerRef.current) clearInterval(timeUpdateTimerRef.current);
    timeUpdateTimerRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        try {
          const curr = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || 0;
          const loaded = playerRef.current.getVideoLoadedFraction() || 0;
          setCurrentTime(curr);
          if (dur > 0) setDuration(dur);
          setBufferedPercent(loaded * 100);
        } catch {
          // ignore any player state transition errors
        }
      }
    }, 300);
  }, []);

  const stopTimeTracking = useCallback(() => {
    if (timeUpdateTimerRef.current) {
      clearInterval(timeUpdateTimerRef.current);
      timeUpdateTimerRef.current = null;
    }
  }, []);

  // Initialize YouTube Player
  useEffect(() => {
    if (!ytId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    let isMounted = true;
    let createdPlayer = null;

    loadYouTubeIframeApi()
      .then((YT) => {
        if (!isMounted || !ytPlayerContainerRef.current) return;

        // Clean up previous instance
        if (playerRef.current && typeof playerRef.current.destroy === "function") {
          try {
            playerRef.current.destroy();
          } catch {
            // ignore
          }
          playerRef.current = null;
        }

        // Create new div for YT.Player replacement
        const placeholderDiv = document.createElement("div");
        placeholderDiv.style.width = "100%";
        placeholderDiv.style.height = "100%";
        ytPlayerContainerRef.current.innerHTML = "";
        ytPlayerContainerRef.current.appendChild(placeholderDiv);

        createdPlayer = new YT.Player(placeholderDiv, {
          width: "100%",
          height: "100%",
          videoId: ytId,
          playerVars: {
            autoplay: autoPlay ? 1 : 0,
            controls: 0, // Disable YouTube native bottom bar, watermark & recommendations
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3, // Disable annotations
            disablekb: 1, // Disable YouTube internal keyboard handlers
            fs: 0, // Disable YouTube native fullscreen button
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (!isMounted) return;
              playerRef.current = event.target;
              setIsLoading(false);
              const dur = event.target.getDuration();
              if (dur) setDuration(dur);

              if (autoPlay) {
                try {
                  event.target.playVideo();
                } catch {
                  // autoplay policy restriction
                }
              }
            },
            onStateChange: (event) => {
              if (!isMounted) return;
              const state = event.data;
              if (state === YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setIsBuffering(false);
                setIsLoading(false);
                startTimeTracking();
              } else if (state === YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                setIsBuffering(false);
                stopTimeTracking();
              } else if (state === YT.PlayerState.BUFFERING) {
                setIsBuffering(true);
              } else if (state === YT.PlayerState.ENDED) {
                setIsPlaying(false);
                setIsBuffering(false);
                stopTimeTracking();
                if (onEnded) onEnded();
              }
            },
            onError: () => {
              if (!isMounted) return;
              setIsLoading(false);
              setHasError(true);
            },
          },
        });

        playerRef.current = createdPlayer;
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
          setHasError(true);
        }
      });

    return () => {
      isMounted = false;
      stopTimeTracking();
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [ytId, autoPlay, onEnded, startTimeTracking, stopTimeTracking]);

  // Playback Control Actions
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      triggerSplash("pause");
    } else {
      playerRef.current.playVideo();
      triggerSplash("play");
    }
  };

  const handleSeek = (e) => {
    if (!playerRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * duration;
    playerRef.current.seekTo(targetTime, true);
    setCurrentTime(targetTime);
  };

  const seekRelative = (delta) => {
    if (!playerRef.current) return;
    const newTime = Math.max(0, Math.min(duration || 0, currentTime + delta));
    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
    triggerSplash(delta > 0 ? "seek-forward" : "seek-backward");
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume || 100);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (!playerRef.current) return;
    playerRef.current.setVolume(val);
    if (val === 0) {
      playerRef.current.mute();
      setIsMuted(true);
    } else if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    }
  };

  const changeSpeed = (rate) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === "function") {
      playerRef.current.setPlaybackRate(rate);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Fallback for Invalid Video URL
  if (!rawUrl || (!ytId && !driveId && !isDirectVideo) || hasError) {
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

  // Google Drive Embed Fallback
  if (driveId) {
    return (
      <div
        className={`math-video-container ${className}`}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%",
          background: "#050811",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
        }}
      >
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
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`math-video-container ${className}`}
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: "relative",
        width: "100%",
        paddingTop: isFullscreen ? "0" : "56.25%", // 16:9 Aspect Ratio
        height: isFullscreen ? "100vh" : "auto",
        background: "#000000",
        borderRadius: isFullscreen ? 0 : 14,
        overflow: "hidden",
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.6)",
        userSelect: "none",
        cursor: showControls ? "default" : "none",
      }}
      role="region"
      aria-label={title}
    >
      {/* 🛡️ VIEWPORT CROP CONTAINER: Crops out YouTube's Top Title Bar, Avatar & Popouts */}
      <div
        className="math-video-crop-wrapper"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "100%",
          height: "100%",
          transform: "translate(-50%, -50%) scale(1.36)",
          transformOrigin: "center center",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          ref={ytPlayerContainerRef}
          className="math-video-yt-frame"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* 🛡️ FULL-CANVAS CLICK INTERCEPTOR */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 4,
          cursor: "pointer",
        }}
        onClick={togglePlay}
        onDoubleClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const isRight = e.clientX - rect.left > rect.width / 2;
          seekRelative(isRight ? 10 : -10);
        }}
      />

      {/* Loading & Buffering Spinner */}
      {(isLoading || isBuffering) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: isLoading ? "linear-gradient(135deg, #090e1a 0%, #151e32 100%)" : "rgba(0,0,0,0.35)",
            color: "#ffffff",
            gap: 12,
            zIndex: 6,
            pointerEvents: "none",
            transition: "opacity 0.3s ease",
          }}
        >
          <Loader2
            size={40}
            style={{
              animation: "spin 1s linear infinite",
              color: "var(--primary, #4361ee)",
            }}
          />
          {isLoading && (
            <span style={{ fontSize: "0.88rem", fontWeight: 500, color: "#cbd5e1" }}>
              Initialisation du lecteur sécurisé...
            </span>
          )}
        </div>
      )}

      {/* Center Play Button on Pause */}
      {!isPlaying && !isLoading && !isBuffering && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 5,
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(67, 97, 238, 0.9)",
            boxShadow: "0 8px 30px rgba(67, 97, 238, 0.5)",
            display: "grid",
            placeItems: "center",
            color: "#ffffff",
            cursor: "pointer",
            pointerEvents: "none",
            transition: "transform 0.2s ease, background 0.2s ease",
          }}
        >
          <Play size={34} style={{ marginLeft: 4 }} />
        </div>
      )}

      {/* Splash Center Action Feedback (Play / Pause / Seek) */}
      {splashAction && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) scale(1)",
            zIndex: 7,
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "grid",
            placeItems: "center",
            color: "#ffffff",
            pointerEvents: "none",
            animation: "mathVideoSplash 0.5s ease forwards",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {splashAction === "play" && <Play size={32} style={{ marginLeft: 3 }} />}
          {splashAction === "pause" && <Pause size={32} />}
          {splashAction === "seek-forward" && <RotateCw size={30} />}
          {splashAction === "seek-backward" && <RotateCcw size={30} />}
        </div>
      )}

      {/* 🛡️ TOP BRANDED HEADER (Shields Top & Shows Clean Lesson Title) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "16px 20px 28px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
          zIndex: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pointerEvents: showControls ? "auto" : "none",
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: 6,
              background: "rgba(67, 97, 238, 0.25)",
              border: "1px solid rgba(67, 97, 238, 0.5)",
              color: "#93c5fd",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={13} /> AK-Math Player
          </span>
          <span
            style={{
              color: "#f8fafc",
              fontSize: "0.95rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </span>
        </div>
      </div>

      {/* 🎛️ CUSTOM REACT CONTROLS BAR (100% Custom UI, Zero YouTube Elements) */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "24px 18px 12px",
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 65%, transparent 100%)",
          zIndex: 8,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: showControls ? "auto" : "none",
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Timeline Scrubber / Progress Bar */}
        <div
          onClick={handleSeek}
          style={{
            position: "relative",
            width: "100%",
            height: 6,
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: 99,
            cursor: "pointer",
            transition: "height 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.height = "9px")}
          onMouseLeave={(e) => (e.currentTarget.style.height = "6px")}
        >
          {/* Buffered Progress */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: `${bufferedPercent}%`,
              background: "rgba(255, 255, 255, 0.35)",
              borderRadius: 99,
              pointerEvents: "none",
            }}
          />
          {/* Played Progress */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: `${progressPercent}%`,
              background: "linear-gradient(90deg, #4361ee, #60a5fa)",
              borderRadius: 99,
              pointerEvents: "none",
            }}
          />
          {/* Scrubber Handle */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `${progressPercent}%`,
              transform: "translate(-50%, -50%)",
              width: 13,
              height: 13,
              borderRadius: "50%",
              background: "#ffffff",
              boxShadow: "0 0 8px rgba(0,0,0,0.5)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Buttons & Indicators */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#ffffff",
            fontSize: "0.85rem",
          }}
        >
          {/* Left Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Lecture"}
              style={{
                background: "transparent",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                padding: 4,
                display: "grid",
                placeItems: "center",
                borderRadius: 6,
              }}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
            </button>

            {/* Rewind 10s */}
            <button
              type="button"
              onClick={() => seekRelative(-10)}
              title="Reculer de 10s"
              style={{
                background: "transparent",
                border: "none",
                color: "#cbd5e1",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                gap: 2,
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              <RotateCcw size={16} /> 10s
            </button>

            {/* Forward 10s */}
            <button
              type="button"
              onClick={() => seekRelative(10)}
              title="Avancer de 10s"
              style={{
                background: "transparent",
                border: "none",
                color: "#cbd5e1",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                gap: 2,
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              <RotateCw size={16} /> 10s
            </button>

            {/* Volume Control */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Activer le son" : "Couper le son"}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#cbd5e1",
                  cursor: "pointer",
                  padding: 4,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={18} />
                ) : volume < 50 ? (
                  <Volume1 size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{
                  width: 65,
                  height: 4,
                  accentColor: "var(--primary, #4361ee)",
                  cursor: "pointer",
                }}
              />
            </div>

            {/* Time Stamp */}
            <span style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 500, marginLeft: 4 }}>
              <strong style={{ color: "#f8fafc" }}>{formatTime(currentTime)}</strong> / {formatTime(duration)}
            </span>
          </div>

          {/* Right Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
            {/* Speed Selector Dropup */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowSpeedMenu((prev) => !prev)}
                title="Vitesse de lecture"
                style={{
                  background: playbackRate !== 1 ? "rgba(67, 97, 238, 0.3)" : "rgba(255, 255, 255, 0.1)",
                  border: playbackRate !== 1 ? "1px solid #4361ee" : "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  cursor: "pointer",
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 10px)",
                    right: 0,
                    background: "#0f172a",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: 8,
                    padding: 4,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    zIndex: 10,
                    minWidth: 80,
                  }}
                >
                  {[0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => changeSpeed(rate)}
                      style={{
                        background: playbackRate === rate ? "rgba(67, 97, 238, 0.3)" : "transparent",
                        color: playbackRate === rate ? "#60a5fa" : "#e2e8f0",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: "0.78rem",
                        fontWeight: playbackRate === rate ? 700 : 500,
                        textAlign: "left",
                      }}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Quitter plein écran" : "Plein écran"}
              style={{
                background: "transparent",
                border: "none",
                color: "#cbd5e1",
                cursor: "pointer",
                padding: 4,
                display: "grid",
                placeItems: "center",
                borderRadius: 6,
              }}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
