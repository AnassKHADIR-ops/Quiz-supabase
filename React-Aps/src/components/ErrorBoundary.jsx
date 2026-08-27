import React from "react";
import { AlertTriangle, RefreshCw } from "./Icon.jsx";

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
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
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
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
            Une erreur inattendue est survenue
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", maxWidth: 460, marginBottom: 24, lineHeight: 1.5 }}>
            Une anomalie s'est produite lors de l'affichage de cette page. Vous pouvez recharger la plateforme pour continuer votre session d'apprentissage.
          </p>
          <button
            onClick={this.handleReset}
            className="btn btn-primary"
            style={{ borderRadius: 12, padding: "10px 22px", display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700 }}
          >
            <RefreshCw size={16} /> Retour à l'accueil
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
