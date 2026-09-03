import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../hooks/useTheme.js";

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function AKLogo({ size = 40 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius)",
        background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #d97706 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(59,130,246,0.35)",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: "#fff",
          fontWeight: 900,
          fontSize: size * 0.42,
          letterSpacing: "-0.5px",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        AK
      </span>
    </div>
  );
}

function Navbar() {
  const { user, isStaff, isRevoked, isPending, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, toggleTheme] = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="nav-brand">
          <AKLogo size={38} />
          <div className="nav-brand-text">
            <span>A. Khadir</span>
            <span>Préparation aux Concours</span>
          </div>
        </Link>

        {/* Desktop Links (Accessible to all visitors) */}
        <div className="nav-links desktop-nav-links">
          <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
            Portail & Concours
          </Link>
          <Link to="/passerelle" className={`nav-link ${isActive("/passerelle") ? "active" : ""}`}>
            Passerelle Sup→Spé
          </Link>
          <Link to="/cours" className={`nav-link ${isActive("/cours") || isActive("/courses") || isActive("/cpge") ? "active" : ""}`}>
            Espace Cours
          </Link>
          {isStaff && (
            <Link to="/dashboard" className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}>
              Tableau de bord
            </Link>
          )}
          {isStaff && (
            <Link to="/management" className={`nav-link ${isActive("/management") ? "active" : ""}`}>
              Gestion
            </Link>
          )}

          {/* Dark mode toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={dark ? "Mode clair" : "Mode sombre"}
            aria-label="Basculer le thème"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          {user ? (
            <div className="nav-user">
              <div className="avatar">{initials}</div>
              <span className="nav-username" style={{ fontWeight: 500, color: "var(--text)", fontSize: "0.875rem" }}>
                {user.name?.split(" ")[0] || user.email}
              </span>
              {isRevoked && (
                <span className="badge badge-danger" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                  Accès Révoqué
                </span>
              )}
              {isPending && (
                <span className="badge badge-warning" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                  En attente
                </span>
              )}
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: 2 }}
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm" style={{ marginLeft: 8 }}>
              Connexion
            </Link>
          )}
        </div>

        {/* Mobile Actions (Theme Toggle + Hamburger) */}
        <div className="mobile-nav-actions" style={{ display: "none", alignItems: "center", gap: 8 }}>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={dark ? "Mode clair" : "Mode sombre"}
            aria-label="Basculer le thème"
            style={{ width: 36, height: 36 }}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="btn btn-secondary btn-sm"
            style={{ padding: "6px 10px", borderRadius: 8, display: "grid", placeItems: "center" }}
            aria-label="Menu de navigation"
          >
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-drawer"
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            padding: "16px 20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          }}
        >
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`nav-link ${isActive("/") ? "active" : ""}`}
            style={{ padding: "10px 14px", borderRadius: 10, fontSize: "0.95rem" }}
          >
            🏛️ Portail & Concours
          </Link>
          <Link
            to="/passerelle"
            onClick={() => setMobileMenuOpen(false)}
            className={`nav-link ${isActive("/passerelle") ? "active" : ""}`}
            style={{ padding: "10px 14px", borderRadius: 10, fontSize: "0.95rem" }}
          >
            🌉 Passerelle Sup → Spé
          </Link>
          <Link
            to="/cours"
            onClick={() => setMobileMenuOpen(false)}
            className={`nav-link ${isActive("/cours") || isActive("/courses") || isActive("/cpge") ? "active" : ""}`}
            style={{ padding: "10px 14px", borderRadius: 10, fontSize: "0.95rem" }}
          >
            📚 Espace Cours CPGE
          </Link>

          {isStaff && (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
                style={{ padding: "10px 14px", borderRadius: 10, fontSize: "0.95rem" }}
              >
                📊 Tableau de bord
              </Link>
              <Link
                to="/management"
                onClick={() => setMobileMenuOpen(false)}
                className={`nav-link ${isActive("/management") ? "active" : ""}`}
                style={{ padding: "10px 14px", borderRadius: 10, fontSize: "0.95rem" }}
              >
                ⚙️ Gestion Plateforme
              </Link>
            </>
          )}

          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />

          {user ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="avatar" style={{ width: 34, height: 34, fontSize: "0.85rem" }}>{initials}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                    {user.name || "Étudiant"}
                    {isRevoked && <span className="badge badge-danger" style={{ fontSize: "0.68rem" }}>Révoqué</span>}
                    {isPending && <span className="badge badge-warning" style={{ fontSize: "0.68rem" }}>En attente</span>}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{user.email}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                style={{ padding: "6px 12px" }}
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn-primary"
              style={{ textAlign: "center", justifyContent: "center" }}
            >
              Se connecter
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
