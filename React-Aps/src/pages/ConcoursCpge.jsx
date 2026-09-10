import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useConcoursSync } from "../services/concoursSyncService.js";
import SecureVideoModal from "../components/SecureVideoModal.jsx";
import AuthGateModal from "../components/AuthGateModal.jsx";
import {
  Search,
  FileText,
  CheckCircle,
  PlayCircle,
  Lock,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
  X,
  Sparkles
} from "lucide-react";
import PdfPreviewModal from "../components/PdfPreviewModal.jsx";

export default function ConcoursCpge() {
  const { user, isAdmin, isApproved } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dynamic live synchronization from WordPress
  const { concoursList, isSyncing, isLive, lastSynced, refreshSync } = useConcoursSync();

  // Search & Filter state
  const [query, setQuery] = useState("");
  const [activeConcoursTag, setActiveConcoursTag] = useState("all");
  const [openBlocks, setOpenBlocks] = useState(new Set(["cnc", "ccinp", "e3a", "cs"]));
  const [activeTabs, setActiveTabs] = useState({}); // { [concoursId]: filiere }

  // Modals state
  const [pdfModalData, setPdfModalData] = useState(null);
  const [videoModalData, setVideoModalData] = useState(null);
  const [authGateData, setAuthGateData] = useState(null);

  const toggleBlock = (cid) => {
    setOpenBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(cid)) next.delete(cid);
      else next.add(cid);
      return next;
    });
  };

  const handleSelectTab = (cid, filiere) => {
    setActiveTabs((prev) => ({ ...prev, [cid]: filiere }));
  };

  // Video click handler with lock / subscription verification
  const handleOpenVideo = (videoUrl, title) => {
    if (!videoUrl) return;

    if (!isApproved && !isAdmin) {
      setAuthGateData({
        contentType: "video",
        title: title || "Vidéo de correction CPGE",
      });
    } else {
      setVideoModalData({
        url: videoUrl,
        title: title || "Correction Vidéo CPGE",
      });
    }
  };

  const handleOpenPdf = (url, title, type = "Sujet") => {
    if (!url) return;
    setPdfModalData({ url, title: `${type} · ${title}` });
  };

  // Guard against invalid payload shapes
  const validConcoursList = useMemo(() => {
    return (concoursList || []).filter(
      (c) => c && typeof c === "object" && c.id && (Array.isArray(c.sujets) || c.titre)
    );
  }, [concoursList]);

  // Calculate statistics across all concours
  const stats = useMemo(() => {
    let sujetsCount = 0;
    let corrigesCount = 0;
    let videosCount = 0;
    const filieresSet = new Set();

    validConcoursList.forEach((c) => {
      (c.sujets || []).forEach((s) => {
        if (s.filiere) filieresSet.add(s.filiere);
        if (s.enonce) sujetsCount++;
        if (s.correction) corrigesCount++;
        if (s.video) videosCount++;
      });
    });

    return {
      concoursCount: validConcoursList.length,
      filieresCount: filieresSet.size,
      sujetsCount,
      corrigesCount,
      videosCount,
    };
  }, [validConcoursList]);

  // Filter concours blocks according to active tag
  const filteredConcours = useMemo(() => {
    return validConcoursList.filter((c) => {
      const cId = String(c.id || "").toLowerCase();
      if (activeConcoursTag !== "all" && cId !== activeConcoursTag.toLowerCase()) return false;
      return true;
    });
  }, [validConcoursList, activeConcoursTag]);

  return (
    <div
      className="page-container"
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "24px 16px 80px",
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top Breadcrumb & Return */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button
          onClick={() => navigate("/?cat=concours")}
          className="btn btn-sm"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            padding: "8px 16px",
            borderRadius: 12,
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "var(--text)",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={16} />
          <span>Retour aux Formations & Concours</span>
        </button>

        {/* Sync status */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: isLive ? "rgba(16, 185, 129, 0.1)" : "rgba(217, 119, 6, 0.1)",
              color: isLive ? "#059669" : "#d97706",
              padding: "5px 12px",
              borderRadius: 99,
              fontSize: "0.75rem",
              fontWeight: 700,
              border: isLive ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(217, 119, 6, 0.25)",
            }}
            title={lastSynced ? `Dernière synchronisation : ${new Date(lastSynced).toLocaleTimeString()}` : "Données prêtes"}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: isLive ? "#10b981" : "#f59e0b",
              }}
            />
            {isLive ? "Synchronisé avec anasskhadir.com" : "Données locales prêtes"}
          </div>

          <button
            onClick={() => refreshSync(true)}
            disabled={isSyncing}
            className="btn btn-sm"
            title="Actualiser depuis WordPress"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 99,
              padding: "5px 12px",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              cursor: isSyncing ? "wait" : "pointer",
            }}
          >
            <RefreshCw size={12} className={isSyncing ? "spin-animate" : ""} />
            <span>{isSyncing ? "Sync..." : "Actualiser"}</span>
          </button>
        </div>
      </div>

      {/* Hero Banner with Original Styling & Typography */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(217, 161, 58, 0.08) 0%, rgba(217, 161, 58, 0.14) 100%)",
          border: "1px solid rgba(181, 120, 9, 0.22)",
          borderRadius: 20,
          padding: "44px 24px 36px",
          textAlign: "center",
          position: "relative",
          marginBottom: 20,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#b57809",
            background: "rgba(181, 120, 9, 0.1)",
            border: "1px solid rgba(181, 120, 9, 0.25)",
            padding: "5px 16px",
            borderRadius: 30,
            marginBottom: 16,
          }}
        >
          <Sparkles size={13} />
          <span>Excellence CPGE · Mathématiques</span>
        </div>

        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
            fontWeight: 700,
            margin: "0 0 10px",
            color: "var(--text)",
            lineHeight: 1.2,
          }}
        >
          Concours de <em style={{ color: "#b57809", fontStyle: "italic" }}>Mathématiques</em>
        </h1>

        <p
          style={{
            maxWidth: 620,
            margin: "0 auto",
            fontSize: "0.98rem",
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}
        >
          Sujets officiels, corrigés détaillés et vidéos de correction réservées aux membres — organisés par concours, filière et année.
        </p>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 24,
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ padding: "16px", textAlign: "center", borderRight: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 700, color: "#b57809" }}>
            {stats.concoursCount}
          </div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginTop: 4 }}>
            Concours
          </div>
        </div>
        <div style={{ padding: "16px", textAlign: "center", borderRight: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 700, color: "#b57809" }}>
            {stats.filieresCount}
          </div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginTop: 4 }}>
            Filières
          </div>
        </div>
        <div style={{ padding: "16px", textAlign: "center", borderRight: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 700, color: "#2563eb" }}>
            {stats.sujetsCount}
          </div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginTop: 4 }}>
            Sujets PDF
          </div>
        </div>
        <div style={{ padding: "16px", textAlign: "center", borderRight: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 700, color: "#059669" }}>
            {stats.corrigesCount}
          </div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginTop: 4 }}>
            Corrigés PDF
          </div>
        </div>
        <div style={{ padding: "16px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 700, color: "#e11d48" }}>
            {stats.videosCount}
          </div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginTop: 4 }}>
            Vidéos 🔒
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Concours Filter Pills */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
        {/* Search Input */}
        <div style={{ position: "relative" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une année (ex: 2024, 2018), une épreuve (Maths 1, Maths 2), une filière (MP, PSI, TSI)..."
            style={{
              width: "100%",
              padding: "13px 40px 13px 46px",
              borderRadius: 30,
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "0.92rem",
              outline: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
                fontSize: "1rem",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Concours Filter Buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            type="button"
            onClick={() => setActiveConcoursTag("all")}
            style={{
              padding: "8px 18px",
              borderRadius: 30,
              border: activeConcoursTag === "all" ? "1.5px solid #b57809" : "1.5px solid var(--border)",
              background: activeConcoursTag === "all" ? "#b57809" : "var(--surface)",
              color: activeConcoursTag === "all" ? "#ffffff" : "var(--text)",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Tous les concours
          </button>

          {validConcoursList.map((c) => {
            const cId = String(c.id || "");
            const isActive = activeConcoursTag === cId;
            return (
              <button
                key={cId}
                type="button"
                onClick={() => setActiveConcoursTag(cId)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 30,
                  border: isActive ? "1.5px solid #b57809" : "1.5px solid var(--border)",
                  background: isActive ? "#b57809" : "var(--surface)",
                  color: isActive ? "#ffffff" : "var(--text)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s ease",
                }}
              >
                <span>{c.icon || "📄"}</span>
                <span>{cId.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion Blocks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filteredConcours.map((c) => {
          const isOpen = openBlocks.has(c.id) || !!query;
          const filieres = Array.from(new Set((c.sujets || []).map((s) => s.filiere)));
          const currentTab = activeTabs[c.id] || filieres[0] || "MP";

          // Filter by stream
          const streamSujets = (c.sujets || []).filter((s) => s.filiere === currentTab);

          // Filter by search query
          const qLower = query.trim().toLowerCase();
          const searchedSujets = streamSujets.filter((s) => {
            if (!qLower) return true;
            const matchYear = String(s.annee).includes(qLower);
            const matchLabel = (s.label || "").toLowerCase().includes(qLower);
            const matchFiliere = (s.filiere || "").toLowerCase().includes(qLower);
            return matchYear || matchLabel || matchFiliere;
          });

          // Group by year descending
          const years = Array.from(new Set(searchedSujets.map((s) => s.annee))).sort((a, b) => b - a);

          return (
            <div
              key={c.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              {/* Header */}
              <div
                onClick={() => toggleBlock(c.id)}
                style={{
                  padding: "18px 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  userSelect: "none",
                  borderBottom: isOpen ? "1px solid var(--border)" : "none",
                  background: isOpen ? "var(--surface-2, #fafafa)" : "transparent",
                  transition: "background 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      display: "grid",
                      placeItems: "center",
                      fontSize: "1.4rem",
                      background: "rgba(181, 120, 9, 0.1)",
                      border: "1px solid rgba(181, 120, 9, 0.2)",
                    }}
                  >
                    {c.icon || "🏛️"}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1.35rem",
                        fontWeight: 700,
                        margin: 0,
                        color: "var(--text)",
                      }}
                    >
                      {c.titre}
                    </h3>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
                      {c.meta}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#b57809",
                      background: "rgba(181, 120, 9, 0.1)",
                      padding: "4px 10px",
                      borderRadius: 20,
                    }}
                  >
                    {(c.sujets || []).length} épreuves
                  </span>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      background: "var(--surface-3, #f1f5f9)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s ease",
                    }}
                  >
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Body */}
              {isOpen && (
                <div>
                  {/* Filière Tabs */}
                  {filieres.length > 1 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        padding: "8px 22px",
                        background: "var(--surface-3, rgba(0,0,0,0.02))",
                        borderBottom: "1px solid var(--border)",
                        overflowX: "auto",
                      }}
                    >
                      {filieres.map((f) => {
                        const isTabActive = currentTab === f;
                        const countInFiliere = (c.sujets || []).filter((s) => s.filiere === f).length;
                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() => handleSelectTab(c.id, f)}
                            style={{
                              padding: "8px 16px",
                              border: "none",
                              borderBottom: isTabActive ? "2.5px solid #b57809" : "2.5px solid transparent",
                              background: "transparent",
                              color: isTabActive ? "#b57809" : "var(--text-muted)",
                              fontWeight: isTabActive ? 700 : 500,
                              fontSize: "0.88rem",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span>Filière {f}</span>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                background: isTabActive ? "rgba(181, 120, 9, 0.15)" : "var(--surface-2)",
                                padding: "1px 6px",
                                borderRadius: 10,
                              }}
                            >
                              {countInFiliere}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Years & Epreuves List */}
                  {years.length === 0 ? (
                    <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      Aucune épreuve ne correspond à votre recherche pour ce concours.
                    </div>
                  ) : (
                    <div>
                      {years.map((yr) => {
                        const yearSujets = searchedSujets.filter((s) => s.annee === yr);

                        return (
                          <div
                            key={yr}
                            style={{
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            {/* Year Header */}
                            <div
                              style={{
                                padding: "10px 22px",
                                background: "var(--surface-2, #fafafa)",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "'Cormorant Garamond', serif",
                                  fontSize: "1.1rem",
                                  fontWeight: 700,
                                  color: "#7c4f04",
                                  background: "rgba(181, 120, 9, 0.12)",
                                  padding: "2px 10px",
                                  borderRadius: 6,
                                }}
                              >
                                {yr}
                              </span>
                              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                                Session {currentTab} {yr}
                              </span>
                            </div>

                            {/* Rows */}
                            {yearSujets.map((s, sIdx) => {
                              const hasEnonce = Boolean(s.enonce);
                              const hasCorr = Boolean(s.correction);
                              const hasVideo = Boolean(s.video);

                              return (
                                <div
                                  key={sIdx}
                                  style={{
                                    padding: "11px 22px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    flexWrap: "wrap",
                                    borderTop: "1px solid rgba(0,0,0,0.04)",
                                  }}
                                >
                                  {/* Label */}
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 160 }}>
                                    <span
                                      style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: "50%",
                                        background: "#b57809",
                                        flexShrink: 0,
                                      }}
                                    />
                                    <span style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text)" }}>
                                      {s.label}
                                    </span>
                                  </div>

                                  {/* Actions */}
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {/* Sujet PDF */}
                                    {hasEnonce ? (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenPdf(s.enonce, `${c.titre} · ${currentTab} ${yr} · ${s.label}`, "Sujet")}
                                        className="btn btn-sm"
                                        style={{
                                          background: "rgba(37, 99, 235, 0.08)",
                                          color: "#1e40af",
                                          border: "1px solid rgba(37, 99, 235, 0.2)",
                                          borderRadius: 8,
                                          fontWeight: 600,
                                          fontSize: "0.8rem",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 6,
                                          padding: "6px 12px",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <FileText size={14} />
                                        <span>Sujet PDF</span>
                                      </button>
                                    ) : (
                                      <span
                                        style={{
                                          fontSize: "0.78rem",
                                          color: "var(--text-muted)",
                                          padding: "6px 10px",
                                          background: "var(--surface-3)",
                                          borderRadius: 8,
                                        }}
                                      >
                                        Sujet bientôt
                                      </span>
                                    )}

                                    {/* Corrigé PDF */}
                                    {hasCorr ? (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenPdf(s.correction, `${c.titre} · ${currentTab} ${yr} · ${s.label}`, "Corrigé")}
                                        className="btn btn-sm"
                                        style={{
                                          background: "rgba(5, 150, 105, 0.08)",
                                          color: "#065f46",
                                          border: "1px solid rgba(5, 150, 105, 0.2)",
                                          borderRadius: 8,
                                          fontWeight: 600,
                                          fontSize: "0.8rem",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 6,
                                          padding: "6px 12px",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <CheckCircle size={14} />
                                        <span>Corrigé PDF</span>
                                      </button>
                                    ) : (
                                      <span
                                        style={{
                                          fontSize: "0.78rem",
                                          color: "var(--text-muted)",
                                          padding: "6px 10px",
                                          background: "var(--surface-3)",
                                          borderRadius: 8,
                                        }}
                                      >
                                        Corrigé bientôt
                                      </span>
                                    )}

                                    {/* Vidéo privée avec Cadenas 🔒 */}
                                    {hasVideo ? (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenVideo(s.video, `${c.titre} · ${currentTab} ${yr} · ${s.label}`)}
                                        className="btn btn-sm"
                                        style={{
                                          background: "rgba(225, 29, 72, 0.08)",
                                          color: "#9f1239",
                                          border: "1px solid rgba(225, 29, 72, 0.25)",
                                          borderRadius: 8,
                                          fontWeight: 700,
                                          fontSize: "0.8rem",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 6,
                                          padding: "6px 12px",
                                          cursor: "pointer",
                                        }}
                                        title={isApproved || isAdmin ? "Voir la vidéo de correction" : "Réservé aux membres — Cliquez pour débloquer"}
                                      >
                                        {isApproved || isAdmin ? (
                                          <PlayCircle size={14} style={{ color: "#e11d48" }} />
                                        ) : (
                                          <Lock size={14} style={{ color: "#e11d48" }} />
                                        )}
                                        <span>Vidéo Solution</span>
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── PDF Preview Modal ── */}
      {pdfModalData && (
        <PdfPreviewModal
          title={pdfModalData.title}
          url={pdfModalData.url}
          onClose={() => setPdfModalData(null)}
        />
      )}

      {/* ── Secure Video Modal ── */}
      {videoModalData && (
        <SecureVideoModal
          videoUrl={videoModalData.url}
          title={videoModalData.title}
          chapter={{
            titre: videoModalData.title,
            video_url: videoModalData.url,
          }}
          onClose={() => setVideoModalData(null)}
        />
      )}

      {/* ── Auth Gate Modal (Cadenas Déblocage) ── */}
      {authGateData && (
        <AuthGateModal
          isOpen={!!authGateData}
          contentType={authGateData.contentType || "video"}
          title={authGateData.title}
          onClose={() => setAuthGateData(null)}
        />
      )}
    </div>
  );
}
