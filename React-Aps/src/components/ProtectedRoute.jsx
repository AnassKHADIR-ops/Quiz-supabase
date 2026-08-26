import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Clock, RefreshCw, AlertTriangle, Lock, ShieldAlert, CheckCircle } from "./Icon.jsx";

function ProtectedRoute({ children, teacherOnly = false, adminOnly = false }) {
  const { user, loading, isStaff, isPending, isRejected, isRevoked, logout, refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState("");
  const location = useLocation();

  if (loading) {
    return (
      <div className="page" style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          <p style={{ marginTop: 16, color: "var(--text-muted)", fontSize: "0.9rem" }}>Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  // Admin / Teacher route guard
  if ((teacherOnly || adminOnly) && !isStaff) {
    return (
      <div className="page" style={{ maxWidth: 540, margin: "60px auto", padding: "0 16px", textAlign: "center" }}>
        <div className="card approval-card" style={{ padding: "40px 28px" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--danger-light)", color: "var(--danger)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: 8 }}>Accès réservé</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: 24 }}>
            Cet espace est strictement réservé au compte professeur / administrateur de la plateforme.
          </p>
          <button className="btn btn-secondary" onClick={() => window.history.back()}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  // If user account is PENDING approval
  if (isPending) {
    const handleCheckStatus = async () => {
      setChecking(true);
      setNotice("");
      const updated = await refreshUser();
      setChecking(false);
      if (updated?.status === "approved" || updated?.role === "teacher" || updated?.role === "admin") {
        setNotice("Votre compte a été validé ! Accès débloqué.");
      } else {
        setNotice("Votre demande est toujours en attente d'approbation par l'administrateur.");
      }
    };

    return (
      <div className="page" style={{ maxWidth: 580, margin: "60px auto", padding: "0 16px" }}>
        <div className="card approval-card" style={{ padding: "44px 32px", textAlign: "center" }}>
          <div className="approval-icon-wrap" style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--warning-light)", color: "var(--warning)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
            <Clock size={34} />
          </div>

          <span className="badge badge-warning" style={{ marginBottom: 14, display: "inline-block", fontSize: "0.78rem" }}>
            En attente de validation
          </span>

          <h2 style={{ fontSize: "1.5rem", marginBottom: 12 }}>Inscription en cours d'examen</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: 480, margin: "0 auto 24px" }}>
            Cette plateforme est <strong>privée</strong>. Votre inscription a bien été enregistrée et est actuellement en attente d'approbation par l'administrateur.
          </p>

          <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px 20px", marginBottom: 24, textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, color: "var(--text)" }}>{user.name || "Étudiant"}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", fontFamily: "JetBrains Mono, monospace" }}>{user.email}</div>
            </div>
            <span className="badge badge-warning">Demande transmise</span>
          </div>

          {notice && (
            <div style={{
              margin: "0 0 20px",
              padding: "12px 16px",
              borderRadius: "8px",
              background: notice.includes("débloqué") ? "var(--success-light)" : "var(--primary-light)",
              color: notice.includes("débloqué") ? "var(--success)" : "var(--primary)",
              fontWeight: 600,
              fontSize: "0.88rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}>
              {notice.includes("débloqué") ? <CheckCircle size={16} /> : <Clock size={16} />}
              {notice}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              onClick={handleCheckStatus}
              disabled={checking}
              style={{ minWidth: 180 }}
            >
              {checking ? (
                <><span className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} /> Vérification…</>
              ) : (
                <><RefreshCw size={15} /> Actualiser mon statut</>
              )}
            </button>
            <button
              className="btn btn-secondary"
              onClick={logout}
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user account is REJECTED
  if (isRejected) {
    return (
      <div className="page" style={{ maxWidth: 580, margin: "60px auto", padding: "0 16px" }}>
        <div className="card approval-card" style={{ padding: "44px 32px", textAlign: "center" }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--danger-light)", color: "var(--danger)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
            <AlertTriangle size={34} />
          </div>

          <span className="badge badge-danger" style={{ marginBottom: 14, display: "inline-block", fontSize: "0.78rem" }}>
            Accès refusé
          </span>

          <h2 style={{ fontSize: "1.5rem", marginBottom: 12 }}>Demande d'accès non accordée</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: 480, margin: "0 auto 24px" }}>
            Votre demande d'accès à la plateforme privée n'a pas été acceptée par l'administrateur.
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administrateur.
          </p>

          <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px 20px", marginBottom: 24, textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, color: "var(--text)" }}>{user.name || "Étudiant"}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", fontFamily: "JetBrains Mono, monospace" }}>{user.email}</div>
            </div>
            <span className="badge badge-danger">Refusé</span>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button className="btn btn-secondary" onClick={logout}>
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user account is REVOKED
  if (isRevoked) {
    return (
      <div className="page" style={{ maxWidth: 580, margin: "60px auto", padding: "0 16px" }}>
        <div className="card approval-card" style={{ padding: "44px 32px", textAlign: "center" }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--danger-light)", color: "var(--danger)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
            <ShieldAlert size={34} />
          </div>

          <span className="badge badge-danger" style={{ marginBottom: 14, display: "inline-block", fontSize: "0.78rem" }}>
            Accès révoqué
          </span>

          <h2 style={{ fontSize: "1.5rem", marginBottom: 12 }}>Accès révoqué</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: 480, margin: "0 auto 24px" }}>
            Votre accès à cette plateforme privée a été <strong>révoqué</strong> par l'administrateur.
            Veuillez contacter l'administrateur pour toute demande de rétablissement d'accès.
          </p>

          <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px 20px", marginBottom: 24, textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, color: "var(--text)" }}>{user.name || "Étudiant"}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", fontFamily: "JetBrains Mono, monospace" }}>{user.email}</div>
            </div>
            <span className="badge badge-danger">Accès suspendu</span>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button className="btn btn-secondary" onClick={logout}>
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is approved or staff
  return children;
}

export default ProtectedRoute;
