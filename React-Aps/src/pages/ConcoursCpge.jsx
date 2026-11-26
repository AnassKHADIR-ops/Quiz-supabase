import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useConcoursSync } from "../services/concoursSyncService.js";
import SecureVideoModal from "../components/SecureVideoModal.jsx";
import AuthGateModal from "../components/AuthGateModal.jsx";
import PdfPreviewModal from "../components/PdfPreviewModal.jsx";
import {
  CheckCircle,
  ChevronDown,
  FileText,
  Lock,
  Play,
  RefreshCw,
  Search,
  X,
} from "../components/Icon.jsx";
import { stripAccents } from "../utils/academicUtils.js";

export default function ConcoursCpge() {
  const { isAdmin, isApproved } = useAuth();

  // Synchronisation en direct depuis WordPress
  const { concoursList, isSyncing, isLive, lastSynced, refreshSync } = useConcoursSync();

  const [query, setQuery] = useState("");
  const [activeConcoursTag, setActiveConcoursTag] = useState("all");
  const [openBlocks, setOpenBlocks] = useState(() => new Set());
  const [activeTabs, setActiveTabs] = useState({});
  const [openYears, setOpenYears] = useState(() => new Set());

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
    setActiveTabs((prev) => ({
      ...prev,
      [cid]: prev[cid] === filiere ? null : filiere,
    }));
  };

  const toggleYear = (yrKey) => {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(yrKey)) next.delete(yrKey);
      else next.add(yrKey);
      return next;
    });
  };

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

  const validConcoursList = useMemo(() => {
    return (concoursList || [])
      .filter((c) => c && typeof c === "object" && c.id && (Array.isArray(c.sujets) || c.titre))
      .map((c) => ({
        ...c,
        sujets: Array.isArray(c.sujets) ? c.sujets.filter((s) => s && typeof s === "object") : [],
      }));
  }, [concoursList]);

  const stats = useMemo(() => {
    let sujetsCount = 0;
    let corrigesCount = 0;
    let videosCount = 0;
    const filieresSet = new Set();

    validConcoursList.forEach((c) => {
      c.sujets.forEach((s) => {
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

  const filteredConcours = useMemo(() => {
    return validConcoursList.filter((c) => {
      const cId = String(c.id || "").toLowerCase();
      if (activeConcoursTag !== "all" && cId !== activeConcoursTag.toLowerCase()) return false;
      return true;
    });
  }, [validConcoursList, activeConcoursTag]);

  return (
    <div className="ak-page">
      {/* ═══ HERO PLEINE LARGEUR ═══ */}
      <header className="ak-hero">
        <div className="ak-hero-in">
          {isAdmin && (
            <div className="ak-hero-top">
              <span
                className="ak-sync-pill"
                title={
                  lastSynced
                    ? `Dernière synchronisation : ${new Date(lastSynced).toLocaleTimeString()}`
                    : "Données prêtes"
                }
              >
                <span className="ak-sync-dot" aria-hidden="true" />
                {isLive ? "Synchronisé WordPress" : "Données locales"}
              </span>
              <button
                type="button"
                className="ak-sync-btn"
                onClick={() => refreshSync(true)}
                disabled={isSyncing}
                title="Actualiser depuis WordPress"
              >
                <RefreshCw size={12} className={isSyncing ? "spin-animate" : ""} />
                <span>{isSyncing ? "Sync…" : "Actualiser"}</span>
              </button>
            </div>
          )}

          <h1>
            Concours de <em>Mathématiques</em>
          </h1>
          <p>
            Sujets officiels, corrigés détaillés et vidéos de correction — organisés par concours,
            filière (MP, PSI, TSI) et session annuelle.
          </p>
        </div>
      </header>

      {/* ═══ BARRE DE STATISTIQUES FLOTTANTE ═══ */}
      <div className="ak-shell ak-stats-wrap">
        <div
          className="ak-stats-row"
          style={{ "--ak-stat-cols": 5 }}
          aria-label="Statistiques des concours CPGE"
        >
          <div className="ak-stat">
            <div className="ak-stat-n">{stats.concoursCount}</div>
            <div className="ak-stat-l">Concours</div>
          </div>
          <div className="ak-stat">
            <div className="ak-stat-n">{stats.filieresCount}</div>
            <div className="ak-stat-l">Filières</div>
          </div>
          <div className="ak-stat">
            <div className="ak-stat-n">{stats.sujetsCount}</div>
            <div className="ak-stat-l">Sujets PDF</div>
          </div>
          <div className="ak-stat">
            <div className="ak-stat-n">{stats.corrigesCount}</div>
            <div className="ak-stat-l">Corrigés PDF</div>
          </div>
          <div className="ak-stat">
            <div className="ak-stat-n">{stats.videosCount}</div>
            <div className="ak-stat-l">Vidéos Solution</div>
          </div>
        </div>
      </div>

      {/* ═══ FILTRES & RECHERCHE ═══ */}
      <div className="ak-filters">
        <div className="ak-shell ak-filters-in">
          <div className="ak-filter-block">
            <div className="ak-filter-label">Filtrer par concours</div>
            <div className="ak-filter-row" role="group" aria-label="Filtrer par concours">
              <button
                type="button"
                className={`ak-fb ${activeConcoursTag === "all" ? "on" : ""}`}
                onClick={() => setActiveConcoursTag("all")}
              >
                <span>Tous les concours</span>
                <span className="ak-fb-cnt">{validConcoursList.length}</span>
              </button>
              {validConcoursList.map((c) => {
                const cId = String(c.id || "");
                const isActive = activeConcoursTag === cId;
                return (
                  <button
                    key={cId}
                    type="button"
                    className={`ak-fb ${isActive ? "on" : ""}`}
                    onClick={() => setActiveConcoursTag(cId)}
                  >
                    <span>{cId.toUpperCase()}</span>
                    <span className="ak-fb-cnt">{c.sujets.length}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ak-search-box">
            <span className="ak-search-ic" aria-hidden="true">
              <Search size={16} />
            </span>
            <input
              type="search"
              className="ak-search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Année (2024), épreuve (Maths 1), filière (MP)…"
              aria-label="Rechercher un sujet de concours"
            />
            {query && (
              <button
                type="button"
                className="ak-search-clear"
                onClick={() => setQuery("")}
                aria-label="Effacer la recherche"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ BLOCS CONCOURS ═══ */}
      <main className="ak-wrapper ak-shell">
        {filteredConcours.map((c, cIdx) => {
          const qNorm = stripAccents(query).trim();
          const hasQuery = Boolean(qNorm);
          const isOpen = openBlocks.has(c.id) || hasQuery;
          const filieres = Array.from(new Set(c.sujets.map((s) => s.filiere).filter(Boolean)));
          const autoMatchedFiliere = hasQuery
            ? filieres.find((f) =>
                c.sujets.some(
                  (s) =>
                    s.filiere === f &&
                    stripAccents(`${s.annee ?? ""} ${s.label || ""} ${s.filiere || ""}`).includes(qNorm)
                )
              ) || filieres[0]
            : null;
          const currentTab =
            filieres.length <= 1
              ? filieres[0] || "MP"
              : activeTabs[c.id] || autoMatchedFiliere || null;

          const streamSujets = currentTab
            ? c.sujets.filter((s) => s.filiere === currentTab)
            : [];
          const searchedSujets = streamSujets.filter((s) => {
            if (!qNorm) return true;
            return stripAccents(`${s.annee ?? ""} ${s.label || ""} ${s.filiere || ""}`).includes(qNorm);
          });

          const years = Array.from(new Set(searchedSujets.map((s) => s.annee))).sort((a, b) => b - a);

          return (
            <article
              key={c.id}
              className={`ak-card cat-algebre ${isOpen ? "open" : ""}`}
              style={{ animationDelay: `${Math.min(cIdx * 0.03, 0.25).toFixed(3)}s` }}
            >
              <button
                type="button"
                className="ak-card-head"
                aria-expanded={isOpen}
                onClick={() => toggleBlock(c.id)}
              >
                <span className="ak-card-n" style={{ fontSize: "12px" }}>
                  {String(c.id || "").toUpperCase().slice(0, 4)}
                </span>
                <span className="ak-card-titles">
                  <span className="ak-card-titre">{c.titre}</span>
                  {c.meta && <span className="ak-card-desc">{c.meta}</span>}
                </span>
                <span className="ak-badge ak-b-algebre">{c.sujets.length} épreuves</span>
                <span className="ak-card-chev" aria-hidden="true">
                  <ChevronDown size={17} />
                </span>
              </button>

              {isOpen && (
                <div style={{ borderTop: "1px solid var(--ak-br)" }}>
                  {filieres.length > 1 && (
                    <div
                      className={`ak-filiere-tabs ${!currentTab ? "is-collapsed" : ""}`}
                      role="group"
                      aria-label={`Filières ${c.titre}`}
                    >
                      {filieres.map((f) => {
                        const isTabActive = currentTab === f;
                        const countInFiliere = c.sujets.filter((s) => s.filiere === f).length;
                        return (
                          <button
                            key={f}
                            type="button"
                            aria-expanded={isTabActive}
                            className={`ak-filiere-tab ${isTabActive ? "on" : ""}`}
                            onClick={() => handleSelectTab(c.id, f)}
                          >
                            <span>Filière {f}</span>
                            <span className="ak-ch-tab-n">{countInFiliere}</span>
                            <ChevronDown size={13} className="ak-tab-chev" aria-hidden="true" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentTab &&
                    (years.length === 0 ? (
                      <div className="ak-empty-mini" style={{ padding: "28px 16px" }}>
                        Aucune épreuve ne correspond à votre recherche pour ce concours.
                      </div>
                    ) : (
                      <div>
                        {years.map((yr) => {
                          const yearSujets = searchedSujets.filter((s) => s.annee === yr);
                          const yrKey = `${c.id}-${currentTab}-${yr}`;
                          const isYearOpen = openYears.has(yrKey) || hasQuery;
                          return (
                            <div key={yr} className="ak-year-block">
                              <button
                                type="button"
                                className="ak-year-head ak-year-head-btn"
                                aria-expanded={isYearOpen}
                                onClick={() => toggleYear(yrKey)}
                              >
                                <span className="ak-year-badge">{yr}</span>
                                <span
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "var(--ak-ink-s)",
                                    flex: 1,
                                    textAlign: "start",
                                  }}
                                >
                                  Session {currentTab} {yr} · {yearSujets.length} épreuve
                                  {yearSujets.length > 1 ? "s" : ""}
                                </span>
                                <ChevronDown size={15} className="ak-tab-chev" aria-hidden="true" />
                              </button>

                              {isYearOpen &&
                                yearSujets.map((s, sIdx) => {
                                  const hasEnonce = Boolean(s.enonce);
                                  const hasCorr = Boolean(s.correction);
                                  const hasVideo = Boolean(s.video);

                                  return (
                                    <div key={sIdx} className="ak-epreuve-row">
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 10,
                                          minWidth: 160,
                                        }}
                                      >
                                        <span
                                          style={{
                                            width: 7,
                                            height: 7,
                                            borderRadius: "50%",
                                            background: "var(--ak-blue-2)",
                                            flexShrink: 0,
                                          }}
                                        />
                                        <span
                                          style={{
                                            fontFamily: "'Outfit', sans-serif",
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            color: "var(--ak-ink)",
                                          }}
                                        >
                                          {s.label}
                                        </span>
                                      </div>

                                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        {hasEnonce ? (
                                          <button
                                            type="button"
                                            className="ak-btn ak-btn-exo"
                                            onClick={() =>
                                              handleOpenPdf(
                                                s.enonce,
                                                `${c.titre} · ${currentTab} ${yr} · ${s.label}`,
                                                "Sujet"
                                              )
                                            }
                                          >
                                            <FileText size={14} />
                                            <span>Sujet PDF</span>
                                          </button>
                                        ) : (
                                          <span className="ak-btn ak-btn-soon">Sujet bientôt</span>
                                        )}

                                        {hasCorr ? (
                                          <button
                                            type="button"
                                            className="ak-btn ak-btn-corr"
                                            onClick={() =>
                                              handleOpenPdf(
                                                s.correction,
                                                `${c.titre} · ${currentTab} ${yr} · ${s.label}`,
                                                "Corrigé"
                                              )
                                            }
                                          >
                                            <CheckCircle size={14} />
                                            <span>Corrigé PDF</span>
                                          </button>
                                        ) : (
                                          <span className="ak-btn ak-btn-soon">Corrigé bientôt</span>
                                        )}

                                        {hasVideo && (
                                          <button
                                            type="button"
                                            className="ak-btn ak-btn-video"
                                            onClick={() =>
                                              handleOpenVideo(
                                                s.video,
                                                `${c.titre} · ${currentTab} ${yr} · ${s.label}`
                                              )
                                            }
                                          >
                                            <Play size={12} style={{ fill: "currentColor" }} />
                                            <span>Vidéo Solution</span>
                                            {!(isApproved || isAdmin) && <Lock size={11} />}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                </div>
              )}
            </article>
          );
        })}
      </main>

      {pdfModalData && (
        <PdfPreviewModal
          title={pdfModalData.title}
          url={pdfModalData.url}
          onClose={() => setPdfModalData(null)}
        />
      )}

      {videoModalData && (
        <SecureVideoModal
          videoUrl={videoModalData.url}
          title={videoModalData.title}
          onClose={() => setVideoModalData(null)}
        />
      )}

      {authGateData && (
        <AuthGateModal
          isOpen={true}
          contentType={authGateData.contentType}
          title={authGateData.title}
          onClose={() => setAuthGateData(null)}
        />
      )}
    </div>
  );
}
