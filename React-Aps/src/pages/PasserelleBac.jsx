import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { usePasserelleBacSync } from "../hooks/usePasserelleBacSync.js";
import SecureVideoModal from "../components/SecureVideoModal.jsx";
import AuthGateModal from "../components/AuthGateModal.jsx";
import {
  getEmbedUrl,
  getDownloadUrl,
  getDrivePreviewUrl,
  getDriveDownloadUrl,
} from "../utils/driveUtils.js";
import {
  BookOpen,
  FileText,
  CheckCircle,
  PlayCircle,
  Video,
  Search,
  Lock,
  ShieldCheck,
  Download,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  RefreshCw,
  GraduationCap,
  Award,
} from "../components/Icon.jsx";

function PDFPreviewModal({ title, url, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose} style={{ zIndex: 1000 }}>
      <div
        className="document-preview-modal"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          maxWidth: 960,
          width: "95vw",
          height: "88vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 18,
          overflow: "hidden",
          background: "var(--card-bg, #ffffff)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
        }}
      >
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <FileText size={20} style={{ color: "var(--primary)", flexShrink: 0 }} />
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
              title={title}
            >
              {title}
            </h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a
              className="btn btn-secondary btn-sm"
              href={getDownloadUrl(url)}
              target="_blank"
              rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Download size={14} /> Télécharger
            </a>
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
        <div style={{ flex: 1, position: "relative", background: "#f1f5f9" }}>
          <iframe
            title={title}
            src={getEmbedUrl(url, "pdf")}
            style={{ width: "100%", height: "100%", border: "none" }}
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
}

export default function PasserelleBac() {
  const { user, isApproved, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // WordPress live data sync
  const { passerelleBacData, isSyncing, isLive, lastSynced, refreshSync } = usePasserelleBacSync();

  const [activeCategory, setActiveCategory] = useState(() => searchParams.get("cat") || "all");
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");

  const [videoModalData, setVideoModalData] = useState(null);
  const [pdfModalData, setPdfModalData] = useState(null);
  const [authGateData, setAuthGateData] = useState(null);

  // Deep linking handling from URL
  useEffect(() => {
    const videoParam = searchParams.get("video");
    const corrParam = searchParams.get("corr");
    const pdfParam = searchParams.get("pdf");
    const titleParam = searchParams.get("title");

    if (videoParam) {
      if (!isApproved) {
        setAuthGateData({
          contentType: "video",
          title: titleParam || "Vidéo d'explication",
        });
      } else {
        setVideoModalData({
          titre: titleParam || "Vidéo d'explication",
          video_url: videoParam,
        });
      }
    } else {
      setVideoModalData(null);
    }

    if (corrParam) {
      if (!isApproved) {
        setAuthGateData({
          contentType: "correction",
          title: titleParam || "Correction détaillée PDF",
        });
      } else {
        setPdfModalData({
          title: titleParam || "Correction détaillée",
          url: corrParam,
        });
      }
    } else if (pdfParam) {
      setPdfModalData({
        title: titleParam || "Document pédagogique",
        url: pdfParam,
      });
    } else {
      setPdfModalData(null);
    }
  }, [searchParams, isApproved]);

  // Handle open actions
  const handleOpenPdf = (url, title) => {
    if (!url) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set("pdf", url);
    if (title) newParams.set("title", title);
    setSearchParams(newParams, { replace: false });
    setPdfModalData({ title, url });
  };

  const handleOpenCorrection = (url, title) => {
    if (!url) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set("corr", url);
    if (title) newParams.set("title", title);
    setSearchParams(newParams, { replace: false });

    if (!isApproved) {
      setAuthGateData({
        contentType: "correction",
        title: title || "Correction détaillée PDF",
      });
      return;
    }
    setPdfModalData({ title, url });
  };

  const handleOpenVideo = (url, title) => {
    if (!url) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set("video", url);
    if (title) newParams.set("title", title);
    setSearchParams(newParams, { replace: false });

    if (!isApproved) {
      setAuthGateData({
        contentType: "video",
        title: title || "Vidéo Corrigé",
      });
      return;
    }
    setVideoModalData({
      titre: title || "Vidéo Corrigé",
      video_url: url,
    });
  };

  const handleClosePdf = () => {
    setPdfModalData(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("pdf");
    newParams.delete("corr");
    newParams.delete("title");
    setSearchParams(newParams, { replace: true });
  };

  const handleCloseVideo = () => {
    setVideoModalData(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("video");
    newParams.delete("title");
    setSearchParams(newParams, { replace: true });
  };

  // Filter themes and items based on search and selected category
  const filteredThemes = useMemo(() => {
    const themes = passerelleBacData?.themes || [];
    const q = searchQuery.toLowerCase().trim();

    return themes
      .map((theme) => {
        // Check category match
        if (activeCategory !== "all" && theme.id !== activeCategory && theme.categorie !== activeCategory) {
          return null;
        }

        if (!q) return theme;

        const themeMatch =
          theme.titre.toLowerCase().includes(q) ||
          (theme.meta && theme.meta.toLowerCase().includes(q));

        const matchedItems = (theme.items || []).filter((item) =>
          item.label.toLowerCase().includes(q) ||
          (item.sous && item.sous.toLowerCase().includes(q))
        );

        if (themeMatch) {
          return theme;
        }

        if (matchedItems.length > 0) {
          return {
            ...theme,
            items: matchedItems,
          };
        }

        return null;
      })
      .filter(Boolean);
  }, [passerelleBacData, activeCategory, searchQuery]);

  // Statistics counters
  const stats = useMemo(() => {
    const themes = passerelleBacData?.themes || [];
    let sujetsCount = 0;
    let exercicesCount = 0;
    let correctionsCount = 0;
    let videosCount = 0;

    for (const t of themes) {
      const isSujetTheme = t.id === "sujets" || t.categorie === "sujets";
      for (const item of t.items || []) {
        if (isSujetTheme) {
          sujetsCount++;
        } else {
          exercicesCount++;
        }
        if (item.correction) {
          correctionsCount++;
        }
        if (Array.isArray(item.video)) {
          videosCount += item.video.length;
        } else if (item.video) {
          videosCount++;
        }
      }
    }

    return { sujetsCount, exercicesCount, correctionsCount, videosCount };
  }, [passerelleBacData]);

  const categoriesList = useMemo(() => {
    return [
      { id: "all", label: "🌟 Tous les Modules" },
      ...(passerelleBacData?.categories || []),
    ];
  }, [passerelleBacData]);

  return (
    <div className="passerelle-bac-page">
      <style>{`
        .passerelle-bac-page {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          padding-bottom: 60px;
        }
        .pb-hero {
          background: linear-gradient(145deg, var(--surface) 0%, rgba(217, 161, 58, 0.08) 50%, var(--surface) 100%);
          border-bottom: 1px solid var(--border);
          padding: 48px 24px 36px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .pb-hero::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, rgba(217, 161, 58, 0.4), #d9a13a, rgba(217, 161, 58, 0.4), transparent);
        }
        .pb-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #b57809;
          background: rgba(181, 120, 9, 0.1);
          border: 1px solid rgba(181, 120, 9, 0.25);
          padding: 6px 16px;
          border-radius: 30px;
          margin-bottom: 16px;
        }
        .pb-eyebrow::before {
          content: "";
          width: 6px;
          height: 6px;
          background: #b57809;
          border-radius: 50%;
        }
        .pb-title {
          font-size: clamp(28px, 4.5vw, 44px);
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text);
          margin-bottom: 14px;
          line-height: 1.2;
        }
        .pb-title em {
          font-style: normal;
          color: #d97706;
          background: linear-gradient(135deg, #d97706, #b45309);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .pb-desc {
          font-size: 15.5px;
          color: var(--text-muted);
          max-width: 680px;
          margin: 0 auto 24px;
          line-height: 1.65;
        }
        .pb-badges {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .pb-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
        }
        .pb-badge-bac {
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
          border: 1px solid rgba(37, 99, 235, 0.2);
        }
        .pb-badge-prepa {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .pb-badge-elite {
          background: rgba(217, 119, 6, 0.1);
          color: #d97706;
          border: 1px solid rgba(217, 119, 6, 0.25);
        }

        /* Stats Row */
        .pb-stats-row {
          display: flex;
          justify-content: center;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .pb-stat-item {
          padding: 18px 28px;
          text-align: center;
          border-right: 1px solid var(--border);
          flex: 1;
          min-width: 130px;
        }
        .pb-stat-item:last-child {
          border-right: none;
        }
        .pb-stat-num {
          font-size: 28px;
          font-weight: 800;
          color: #d97706;
          line-height: 1;
        }
        .pb-stat-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 6px;
        }

        /* Container */
        .pb-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 28px 20px 0;
        }

        /* Toolbar */
        .pb-toolbar {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
        .pb-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pb-filter-btn {
          padding: 9px 18px;
          border-radius: 30px;
          border: 1.5px solid var(--border);
          background: var(--surface);
          color: var(--text);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }
        .pb-filter-btn:hover {
          border-color: #d9a13a;
          color: #d97706;
          background: rgba(217, 161, 58, 0.08);
        }
        .pb-filter-btn.active {
          background: linear-gradient(135deg, #d97706, #b45309);
          color: #ffffff;
          border-color: #d97706;
          box-shadow: 0 4px 14px rgba(217, 119, 6, 0.25);
        }

        .pb-search-sync-row {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .pb-search-box {
          flex: 1;
          min-width: 260px;
          position: relative;
        }
        .pb-search-input {
          width: 100%;
          padding: 11px 40px 11px 40px;
          border-radius: 12px;
          border: 1.5px solid var(--border);
          background: var(--surface);
          color: var(--text);
          font-size: 14px;
          font-weight: 500;
          transition: border-color 0.2s;
        }
        .pb-search-input:focus {
          outline: none;
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15);
        }
        .pb-search-ic {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .pb-search-clear {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: grid;
          place-items: center;
        }

        /* Live Sync Badge */
        .pb-sync-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-muted);
        }
        .pb-sync-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }
        .pb-sync-refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 14px;
          border-radius: 10px;
          border: 1.5px solid var(--border);
          background: var(--surface);
          color: var(--text);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pb-sync-refresh-btn:hover {
          border-color: #d97706;
          color: #d97706;
        }

        /* Theme Card Block */
        .pb-theme-block {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 24px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
        }
        .pb-theme-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }
        .pb-theme-icon {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          border: 1px solid var(--border);
          background: rgba(217, 161, 58, 0.1);
        }
        .pb-theme-info {
          flex: 1;
          min-width: 0;
        }
        .pb-theme-title {
          font-size: 19px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 4px;
        }
        .pb-theme-meta {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.45;
        }
        .pb-theme-count {
          font-size: 12px;
          font-weight: 700;
          color: #d97706;
          background: rgba(217, 119, 6, 0.1);
          border: 1px solid rgba(217, 119, 6, 0.2);
          padding: 4px 12px;
          border-radius: 20px;
          white-space: nowrap;
        }

        /* Item Row */
        .pb-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          gap: 16px;
          flex-wrap: wrap;
          transition: background 0.18s ease;
        }
        .pb-item-row:hover {
          background: rgba(217, 161, 58, 0.04);
        }
        .pb-item-label {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14.5px;
          font-weight: 600;
          color: var(--text);
          min-width: 220px;
          flex: 1;
          line-height: 1.5;
        }
        .pb-item-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          background: #d9a13a;
        }
        .pb-item-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        /* Action Buttons */
        .pb-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 600;
          text-decoration: none;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .pb-btn:hover {
          transform: translateY(-1px);
        }
        .pb-btn:active {
          transform: none;
        }

        .pb-btn-pdf {
          background: rgba(37, 99, 235, 0.08);
          color: #2563eb;
          border-color: rgba(37, 99, 235, 0.22);
        }
        .pb-btn-pdf:hover {
          background: rgba(37, 99, 235, 0.15);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
        }

        .pb-btn-corr {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border-color: rgba(16, 185, 129, 0.25);
        }
        .pb-btn-corr:hover {
          background: rgba(16, 185, 129, 0.18);
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
        }

        .pb-btn-video {
          background: rgba(220, 38, 38, 0.08);
          color: #dc2626;
          border-color: rgba(220, 38, 38, 0.22);
        }
        .pb-btn-video:hover {
          background: rgba(220, 38, 38, 0.15);
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);
        }

        /* Banner info box */
        .pb-info-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-left: 4px solid #d97706;
          border-radius: 12px;
          padding: 18px 22px;
          margin-top: 24px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .pb-info-text {
          font-size: 13.5px;
          color: var(--text-muted);
          line-height: 1.6;
        }
        .pb-info-text strong {
          color: var(--text);
        }
      `}</style>

      {/* Hero Header */}
      <section className="pb-hero">
        <div className="pb-eyebrow">
          Concours d'entrée en 1ère Année CPGE & Transition Lycée → Sup
        </div>
        <h1 className="pb-title">
          Passerelle <em>Bac → Prépa</em>
        </h1>
        <p className="pb-desc">
          Modules d'approfondissement, devoirs d'entraînement et annales officielles des concours
          d'entrée pour réussir votre intégration en CPGE MPSI, PCSI & TSI (Al Zahrawi, LYDEX Benguerir, LYMED Tétouan).
        </p>

        <div className="pb-badges">
          <span className="pb-badge pb-badge-bac">🎓 Terminale Maths Expertes</span>
          <span className="pb-badge pb-badge-prepa">📐 Niveau 1ère Année CPGE</span>
          <span className="pb-badge pb-badge-elite">🏆 Concours d'Excellence</span>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="pb-stats-row">
        <div className="pb-stat-item">
          <div className="pb-stat-num">{stats.sujetsCount}</div>
          <div className="pb-stat-label">Sujets de Concours</div>
        </div>
        <div className="pb-stat-item">
          <div className="pb-stat-num">{stats.exercicesCount}</div>
          <div className="pb-stat-label">Exercices Ciblés</div>
        </div>
        <div className="pb-stat-item">
          <div className="pb-stat-num">{stats.correctionsCount}</div>
          <div className="pb-stat-label">Corrigés Détaillés</div>
        </div>
        <div className="pb-stat-item">
          <div className="pb-stat-num">{stats.videosCount}</div>
          <div className="pb-stat-label">Vidéos Explicatives</div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="pb-container">
        {/* Navigation back */}
        <div style={{ marginBottom: 20 }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: "13.5px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} /> Retour à l'accueil
          </Link>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="pb-toolbar">
          {/* Category Pill Filters */}
          <div className="pb-filters">
            {categoriesList.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`pb-filter-btn ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => {
                  setActiveCategory(cat.id);
                  const p = new URLSearchParams(searchParams);
                  if (cat.id === "all") p.delete("cat");
                  else p.set("cat", cat.id);
                  setSearchParams(p, { replace: false });
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search bar + Live Sync */}
          <div className="pb-search-sync-row">
            <div className="pb-search-box">
              <Search className="pb-search-ic" size={17} />
              <input
                type="text"
                className="pb-search-input"
                placeholder="Rechercher un sujet, exercice (ex: Zahrawi, Hölder, Gamma, Möbius)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  const p = new URLSearchParams(searchParams);
                  if (e.target.value.trim()) p.set("q", e.target.value);
                  else p.delete("q");
                  setSearchParams(p, { replace: true });
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="pb-search-clear"
                  onClick={() => {
                    setSearchQuery("");
                    const p = new URLSearchParams(searchParams);
                    p.delete("q");
                    setSearchParams(p, { replace: true });
                  }}
                  aria-label="Effacer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Sync status and refresh button */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div className="pb-sync-badge">
                <span className="pb-sync-dot" />
                <span>{isLive ? "WordPress Synchronisé" : "Données Locales"}</span>
              </div>
              <button
                type="button"
                className="pb-sync-refresh-btn"
                onClick={() => refreshSync(null, true)}
                disabled={isSyncing}
                title="Forcer la mise à jour depuis anasskhadir.com"
              >
                <RefreshCw size={14} className={isSyncing ? "spinner" : ""} />
                <span>{isSyncing ? "Mise à jour..." : "Actualiser"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Themes and Items Listing */}
        {filteredThemes.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              background: "var(--surface)",
              borderRadius: 16,
              border: "1px dashed var(--border)",
              marginTop: 20,
            }}
          >
            <p style={{ fontSize: "16px", color: "var(--text-muted)", marginBottom: 12 }}>
              Aucun résultat trouvé pour votre recherche <strong>"{searchQuery}"</strong>.
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
                setSearchParams({}, { replace: true });
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          filteredThemes.map((theme) => {
            return (
              <section key={theme.id} className="pb-theme-block">
                {/* Theme Header */}
                <div className="pb-theme-header">
                  <div className="pb-theme-icon">{theme.icon || "📚"}</div>
                  <div className="pb-theme-info">
                    <h2 className="pb-theme-title">{theme.titre}</h2>
                    {theme.meta && <p className="pb-theme-meta">{theme.meta}</p>}
                  </div>
                  <div className="pb-theme-count">
                    {theme.items?.length || 0} document{(theme.items?.length || 0) > 1 ? "s" : ""}
                  </div>
                </div>

                {/* Items List */}
                <div className="pb-theme-body">
                  {(theme.items || []).map((item, idx) => {
                    const hasEnonce = Boolean(item.enonce);
                    const hasCorrection = Boolean(item.correction);
                    const hasVideo = Boolean(item.video);
                    const isMultiPartVideo = Array.isArray(item.video);

                    return (
                      <div key={item.id || idx} className="pb-item-row">
                        <div className="pb-item-label">
                          <span className="pb-item-dot" />
                          <span>{item.label}</span>
                        </div>

                        <div className="pb-item-actions">
                          {/* Énoncé PDF (Open for everyone) */}
                          {hasEnonce && (
                            <button
                              type="button"
                              className="pb-btn pb-btn-pdf"
                              onClick={() => handleOpenPdf(item.enonce, `Sujet : ${item.label}`)}
                            >
                              <FileText size={14} />
                              <span>Sujet PDF</span>
                            </button>
                          )}

                          {/* Correction PDF (Gated for members) */}
                          {hasCorrection && (
                            <button
                              type="button"
                              className="pb-btn pb-btn-corr"
                              onClick={() => handleOpenCorrection(item.correction, `Correction : ${item.label}`)}
                              title={isApproved ? "Voir le corrigé détaillé" : "Réservé aux membres — Cliquez pour vous connecter"}
                            >
                              <CheckCircle size={14} />
                              <span>Corrigé PDF</span>
                              {!isApproved && <Lock size={12} style={{ opacity: 0.85, marginLeft: 2 }} />}
                            </button>
                          )}

                          {/* Vidéos (Gated for members, with multi-part support) */}
                          {hasVideo && (
                            <>
                              {isMultiPartVideo ? (
                                item.video.map((vUrl, partIdx) => (
                                  <button
                                    key={partIdx}
                                    type="button"
                                    className="pb-btn pb-btn-video"
                                    onClick={() =>
                                      handleOpenVideo(
                                        vUrl,
                                        `${item.label} · Partie ${partIdx + 1}`
                                      )
                                    }
                                    title={isApproved ? "Regarder la vidéo" : "Réservé aux membres — Cliquez pour vous connecter"}
                                  >
                                    <PlayCircle size={14} />
                                    <span>Partie {partIdx + 1}</span>
                                    {!isApproved && <Lock size={12} style={{ opacity: 0.85, marginLeft: 2 }} />}
                                  </button>
                                ))
                              ) : (
                                <button
                                  type="button"
                                  className="pb-btn pb-btn-video"
                                  onClick={() =>
                                    handleOpenVideo(item.video, `Vidéo : ${item.label}`)
                                  }
                                  title={isApproved ? "Regarder la vidéo" : "Réservé aux membres — Cliquez pour vous connecter"}
                                >
                                  <PlayCircle size={14} />
                                  <span>Vidéo Corrigé</span>
                                  {!isApproved && <Lock size={12} style={{ opacity: 0.85, marginLeft: 2 }} />}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        {/* Pedagogical Note */}
        <div className="pb-info-box">
          <Award size={24} style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }} />
          <div className="pb-info-text">
            <strong>Conseil méthodologique :</strong> Ces épreuves et exercices sont conçus pour évaluer
            votre capacité de raisonnement abstrait, la maîtrise des quantificateurs logiques et votre rigueur
            de rédaction. Travaillez chaque sujet en temps libre avant de consulter les corrigés et vidéos explicatives.
          </div>
        </div>
      </main>

      {/* PDF Modal */}
      {pdfModalData && (
        <PDFPreviewModal
          title={pdfModalData.title}
          url={pdfModalData.url}
          onClose={handleClosePdf}
        />
      )}

      {/* Video Modal */}
      {videoModalData && (
        <SecureVideoModal
          videoUrl={videoModalData.video_url}
          title={videoModalData.titre}
          onClose={handleCloseVideo}
        />
      )}

      {/* Member Access Gate Modal */}
      {authGateData && (
        <AuthGateModal
          isOpen={true}
          onClose={() => setAuthGateData(null)}
          contentType={authGateData.contentType}
          title={authGateData.title}
        />
      )}
    </div>
  );
}
