import React from "react";
import { AlertTriangle, RefreshCw } from "./Icon.jsx";

const CHUNK_RELOAD_KEY = "ak_chunk_reload_at";
const APP_CACHE_KEYS = [
  "ak_cached_user",
  "courses_live_curriculum",
  "courses_last_synced",
  "passerelle_live_data",
  "passerelle_last_synced",
  "passerelle_bac_live_data",
  "passerelle_bac_last_synced",
  "concours_live_data",
  "concours_last_synced",
];

function isChunkLoadError(error) {
  const msg = String(error?.message || error || "");
  return (
    error?.name === "ChunkLoadError" ||
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("Unable to preload CSS") ||
    msg.includes("Loading chunk")
  );
}

export function triggerSafeChunkReload() {
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || "0");
    if (Date.now() - last < 15000) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
    const url = new URL(window.location.href);
    url.searchParams.set("_v", String(Date.now()));
    window.location.replace(url.toString());
    return true;
  } catch {
    return false;
  }
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    if (isChunkLoadError(error)) {
      triggerSafeChunkReload();
    }
  }

  componentDidUpdate(prevProps) {
    if (
      this.state.hasError &&
      this.props.resetKey !== undefined &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  handleClearCacheAndReload = () => {
    try {
      APP_CACHE_KEYS.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {}
      });
      try {
        sessionStorage.removeItem("ak_cached_admin_users");
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      } catch {}
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.replace("/");
  };

  render() {
    if (this.state.hasError) {
      const errName = this.state.error?.name || "Error";
      const errMsg = this.state.error?.message || String(this.state.error || "");

      return (
        <div
          style={{
            minHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.12)",
              color: "#ef4444",
              display: "grid",
              placeItems: "center",
              marginBottom: 20,
            }}
          >
            <AlertTriangle size={32} />
          </div>
          <h2
            style={{
              fontSize: "1.4rem",
              fontWeight: 800,
              color: "var(--text)",
              marginBottom: 8,
            }}
          >
            Une erreur inattendue est survenue
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.92rem",
              maxWidth: 460,
              marginBottom: 24,
              lineHeight: 1.5,
            }}
          >
            Une anomalie s'est produite lors de l'affichage de cette page. Vous
            pouvez recharger la plateforme pour continuer votre session
            d'apprentissage.
          </p>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{
                borderRadius: 12,
                padding: "10px 22px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 700,
              }}
            >
              <RefreshCw size={16} /> Retour à l'accueil
            </button>
            <button
              type="button"
              onClick={this.handleClearCacheAndReload}
              className="btn btn-secondary"
              style={{
                borderRadius: 12,
                padding: "10px 18px",
                fontWeight: 600,
              }}
            >
              Vider le cache local et recharger
            </button>
          </div>

          {errMsg && (
            <details
              style={{
                marginTop: 22,
                maxWidth: 520,
                width: "100%",
                textAlign: "left",
                background: "var(--surface-2, rgba(15, 23, 42, 0.04))",
                border: "1px solid var(--border, #e2e8f0)",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: "0.78rem",
                color: "var(--text-muted)",
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                Détails techniques
              </summary>
              <pre
                style={{
                  margin: "8px 0 0",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.74rem",
                  color: "var(--danger, #dc2626)",
                }}
              >
                {errName}: {errMsg}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
