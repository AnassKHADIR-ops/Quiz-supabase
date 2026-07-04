import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../hooks/useTheme.js";


// Logo premium — hexagone gradient indigo/violet
function AKLogo({ size = 42 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#4361ee" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Hexagone */}
      <polygon
        points="50,4 93,27 93,73 50,96 7,73 7,27"
        fill="url(#logoGrad)"
        filter="url(#glow)"
      />
      {/* Bordure subtile */}
      <polygon
        points="50,4 93,27 93,73 50,96 7,73 7,27"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />
      {/* A.K */}
      <text
        x="50" y="60"
        textAnchor="middle"
        fontFamily="'Outfit', Georgia, sans-serif"
        fontWeight="800"
        fontSize="30"
        fill="white"
        letterSpacing="-1"
      >A.K</text>
    </svg>
  );
}

// Icône soleil
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

// Icône lune
function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, toggleTheme] = useTheme();

  const handleLogout = () => { logout(); navigate("/login"); };
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="nav-brand">
          <AKLogo size={40} />
          <div className="nav-brand-text">
            <span>A. Khadir</span>
            <span>Préparation aux Concours</span>
          </div>
        </Link>

        <div className="nav-links">
          {user && (
            <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
              Examens
            </Link>
          )}
          {user?.role === "teacher" && (
            <Link to="/dashboard" className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}>
              Tableau de bord
            </Link>
          )}
          {user?.role === "teacher" && <Link to="/management" className={`nav-link ${isActive("/management") ? "active" : ""}`}>Gestion</Link>}

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
              <span style={{ fontWeight: 500, color: "var(--text)", fontSize: "0.875rem" }}>
                {user.name?.split(" ")[0] || user.email}
              </span>
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
      </div>
    </nav>
  );
}

export default Navbar;
