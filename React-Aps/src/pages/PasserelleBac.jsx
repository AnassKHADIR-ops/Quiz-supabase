import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { usePasserelleBacSync } from "../hooks/usePasserelleBacSync.js";
import SecureVideoModal from "../components/SecureVideoModal.jsx";
import AuthGateModal from "../components/AuthGateModal.jsx";
import PdfPreviewModal from "../components/PdfPreviewModal.jsx";
import {
  Award,
  CheckCircle,
  FileText,
  Lock,
  PenLine,
  Play,
  RefreshCw,
  Search,
  X,
} from "../components/Icon.jsx";
import { formatChapterNum, stripAccents } from "../utils/academicUtils.js";

export default function PasserelleBac() {
  const { isApproved, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Synchronisation WordPress en direct (polling uniquement pour l'administrateur)
  const { passerelleBacData, isSyncing, isLive, lastSynced, refreshSync } = usePasserelleBacSync(
    null,
    isAdmin ? 15000 : 0
  );

  const [activeCategory, setActiveCategory] = useState(() => searchParams.get("cat") || "all");
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");

  const [videoModalData, setVideoModalData] = useState(null);
  const [pdfModalData, setPdfModalData] = useState(null);
  const [authGateData, setAuthGateData] = useState(null);
  const prevUrlMediaRef = useRef({ video: null, pdf: null, corr: null, isApproved: null });

  // Deep linking depuis l'URL
  useEffect(() => {
    const videoParam = searchParams.get("video");
    const corrParam = searchParams.get("corr");
    const pdfParam = searchParams.get("pdf");
    const titleParam = searchParams.get("title");
    const prevMedia = prevUrlMediaRef.current;
    const videoChanged = videoParam !== prevMedia.video;
    const pdfChanged = pdfParam !== prevMedia.pdf;
    const corrChanged = corrParam !== prevMedia.corr;
    const approvalChanged = prevMedia.isApproved !== null && isApproved !== prevMedia.isApproved;

    if (videoParam) {
      if (videoChanged || approvalChanged) {
        if (!isApproved) {
          setAuthGateData({
            contentType: "video",
            title: titleParam || "Vidéo d'explication",
          });
        } else {
          setVideoModalData((prev) =>
            prev && prev.video_url === videoParam
              ? prev
              : {
                  titre: titleParam || "Vidéo d'explication",
                  video_url: videoParam,
                }
          );
        }
      }
    } else if (prevMedia.video) {
      setVideoModalData(null);
    }

    if (corrParam) {
      if (corrChanged || approvalChanged) {
        if (!isApproved) {
          setAuthGateData({
            contentType: "correction",
            title: titleParam || "Correction détaillée PDF",
          });
        } else {
          setPdfModalData((prev) =>
            prev && prev.url === corrParam
              ? prev
              : {
                  title: titleParam || "Correction détaillée",
                  url: corrParam,
                  isCorrection: true,
                }
          );
        }
      }
    } else if (pdfParam) {
      if (pdfChanged) {
        setPdfModalData((prev) =>
          prev && prev.url === pdfParam
            ? prev
            : {
                title: titleParam || "Document pédagogique",
                url: pdfParam,
                isCorrection: false,
              }
        );
      }
    } else if (prevMedia.pdf || prevMedia.corr) {
      setPdfModalData(null);
    }

    prevUrlMediaRef.current = {
      video: videoParam,
      pdf: pdfParam,
      corr: corrParam,
      isApproved,
    };
  }, [searchParams, isApproved]);

  useEffect(() => {
    if (!isApproved) {
      setVideoModalData(null);
      setPdfModalData((prev) => (prev?.isCorrection ? null : prev));
    }
  }, [isApproved]);

  const handleOpenPdf = (url, title) => {
    if (!url) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set("pdf", url);
    if (title) newParams.set("title", title);
    setSearchParams(newParams, { replace: false });
    setPdfModalData({ title, url, isCorrection: false });
  };

  const handleOpenCorrection = (url, title) => {
    if (!url) return;
    if (!isApproved) {
      setAuthGateData({
        contentType: "correction",
        title: title || "Correction détaillée PDF",
      });
      return;
    }
    const newParams = new URLSearchParams(searchParams);
    newParams.set("corr", url);
    if (title) newParams.set("title", title);
    setSearchParams(newParams, { replace: false });
    setPdfModalData({ title, url, isCorrection: true });
  };

  const handleOpenVideo = (url, title) => {
    if (!url) return;
    if (!isApproved) {
      setAuthGateData({
        contentType: "video",
        title: title || "Vidéo Corrigé",
      });
      return;
    }
    const newParams = new URLSearchParams(searchParams);
    newParams.set("video", url);
    if (title) newParams.set("title", title);
    setSearchParams(newParams, { replace: false });
    setVideoModalData({ titre: title || "Vidéo Corrigé", video_url: url });
  };

  const handleClosePdf = () => {
    setPdfModalData(null);
    if (searchParams.has("pdf") || searchParams.has("corr") || searchParams.has("title")) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("pdf");
      newParams.delete("corr");
      newParams.delete("title");
      setSearchParams(newParams, { replace: true });
    }
  };

  const handleCloseVideo = () => {
    setVideoModalData(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("video");
    newParams.delete("title");
    setSearchParams(newParams, { replace: true });
  };

  const allThemes = useMemo(
    () => (passerelleBacData?.themes || []).filter((t) => t && typeof t === "object"),
    [passerelleBacData]
  );

  const filteredThemes = useMemo(() => {
    const q = stripAccents(searchQuery).trim();
    return allThemes
      .map((theme) => {
        if (activeCategory !== "all" && theme.id !== activeCategory && theme.categorie !== activeCategory) {
          return null;
        }
        const safeItems = (Array.isArray(theme.items) ? theme.items : []).filter(
          (item) => item && typeof item === "object"
        );
        if (!q) return { ...theme, items: safeItems };

        const themeMatch =
          stripAccents(theme.titre).includes(q) || (theme.meta && stripAccents(theme.meta).includes(q));
        const matchedItems = safeItems.filter(
          (item) =>
            stripAccents(item.label).includes(q) || (item.sous && stripAccents(item.sous).includes(q))
        );

        if (themeMatch) return { ...theme, items: safeItems };
        if (matchedItems.length > 0) return { ...theme, items: matchedItems };
        return null;
      })
      .filter(Boolean);
  }, [allThemes, activeCategory, searchQuery]);

  const stats = useMemo(() => {
    let sujetsCount = 0;
    let exercicesCount = 0;
    let correctionsCount = 0;
    let videosCount = 0;

    for (const t of allThemes) {
      const isSujetTheme = t.id === "sujets" || t.categorie === "sujets";
      for (const item of (Array.isArray(t.items) ? t.items : []).filter((it) => it && typeof it === "object")) {
        if (isSujetTheme) sujetsCount++;
        else exercicesCount++;
        if (item.correction) correctionsCount++;
        if (Array.isArray(item.video)) videosCount += item.video.length;
        else if (item.video) videosCount++;
      }
    }

    return { sujetsCount, exercicesCount, correctionsCount, videosCount };
  }, [allThemes]);

  const categoriesList = useMemo(() => {
    const validCats = (passerelleBacData?.categories || []).filter((c) => c && typeof c === "object");
    return validCats.map((cat) => {
      const count = allThemes
        .filter((t) => t.id === cat.id || t.categorie === cat.id)
        .reduce((acc, t) => acc + (Array.isArray(t.items) ? t.items.filter(Boolean).length : 0), 0);
      return { ...cat, count };
    });
  }, [passerelleBacData, allThemes]);

  const totalDocs = stats.sujetsCount + stats.exercicesCount;

  return (
    <div className="ak-page">
      {/* ═══ HERO PLEINE LARGEUR ═══ */}
      <header className="ak-hero">
        <div className="ak-hero-in">
          <div className="ak-hero-top">
            <span className="ak-eyebrow">
              <span className="ak-eyebrow-dot" aria-hidden="true" />
              Concours d'entrée 1ère Année CPGE · Lycée → Sup
            </span>

            {isAdmin && (
              <>
                {isLive && (
                  <span
                    className="ak-sync-pill"
                    title={
                      lastSynced
                        ? `Dernière synchronisation : ${new Date(lastSynced).toLocaleTimeString()}`
                        : "Synchronisé WordPress"
                    }
                  >
                    <span className="ak-sync-dot" aria-hidden="true" />
                    Synchronisé WordPress
                  </span>
                )}
                <button
                  type="button"
                  className="ak-sync-btn"
                  onClick={() => refreshSync(null, true)}
                  disabled={isSyncing}
                  title="Forcer la mise à jour depuis anasskhadir.com"
                >
                  <RefreshCw size={12} className={isSyncing ? "spin-animate" : ""} />
                  <span>{isSyncing ? "Mise à jour…" : "Actualiser"}</span>
                </button>
              </>
            )}
          </div>

          <h1>
            Passerelle <em>Bac → Prépa</em>
          </h1>
          <p>
            Modules d'approfondissement, devoirs d'entraînement et annales officielles des concours
            d'entrée en CPGE MPSI, PCSI &amp; TSI (Al Zahrawi, LYDEX Benguerir, LYMED Tétouan).
          </p>
        </div>
      </header>

      {/* ═══ BARRE DE STATISTIQUES FLOTTANTE ═══ */}
      <div className="ak-shell ak-stats-wrap">
        <div
          className="ak-stats-row cols-4"
          style={{ "--ak-stat-cols": 4 }}
          aria-label="Statistiques Bac vers Prépa"
        >
          <div className="ak-stat">
            <div className="ak-stat-n">{stats.sujetsCount}</div>
            <div className="ak-stat-l">Sujets de Concours</div>
          </div>
          <div className="ak-stat">
            <div className="ak-stat-n">{stats.exercicesCount}</div>
            <div className="ak-stat-l">Exercices Ciblés</div>
          </div>
          <div className="ak-stat">
            <div className="ak-stat-n">{stats.correctionsCount}</div>
            <div className="ak-stat-l">Corrigés Détaillés</div>
          </div>
          <div className="ak-stat">
            <div className="ak-stat-n">{stats.videosCount}</div>
            <div className="ak-stat-l">Vidéos Explicatives</div>
          </div>
        </div>
      </div>

      {/* ═══ FILTRES & RECHERCHE ═══ */}
      <div className="ak-filters">
        <div className="ak-shell ak-filters-in">
          <div className="ak-filter-block">
            <div className="ak-filter-label">Filtrer par module</div>
            <div className="ak-filter-row" role="group" aria-label="Filtrer par module">
              <button
                type="button"
                className={`ak-fb ${activeCategory === "all" ? "on" : ""}`}
                onClick={() => {
                  setActiveCategory("all");
                  const p = new URLSearchParams(searchParams);
                  p.delete("cat");
                  setSearchParams(p, { replace: false });
                }}
              >
                <span>Tous les modules</span>
                <span className="ak-fb-cnt">{totalDocs}</span>
              </button>
              {categoriesList.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`ak-fb ${activeCategory === cat.id ? "on" : ""}`}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    const p = new URLSearchParams(searchParams);
                    p.set("cat", cat.id);
                    setSearchParams(p, { replace: false });
                  }}
                >
                  <span>{cat.label}</span>
                  {cat.count > 0 && <span className="ak-fb-cnt">{cat.count}</span>}
                </button>
              ))}
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
              placeholder="Rechercher un sujet, exercice (Zahrawi, Hölder…)"
              aria-label="Rechercher un sujet ou exercice"
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
                className="ak-search-clear"
                onClick={() => {
                  setSearchQuery("");
                  const p = new URLSearchParams(searchParams);
                  p.delete("q");
                  setSearchParams(p, { replace: true });
                }}
                aria-label="Effacer la recherche"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ THÈMES & RESSOURCES ═══ */}
      <main className="ak-wrapper ak-shell">
        {filteredThemes.length === 0 ? (
          <div className="ak-empty">
            <p style={{ marginBottom: 12 }}>
              Aucun résultat trouvé pour <strong>« {searchQuery} »</strong>.
            </p>
            <button
              type="button"
              className="ak-btn ak-btn-pdf"
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
          filteredThemes.map((theme, tIdx) => {
            const safeItems = (theme.items || []).filter((it) => it && typeof it === "object");
            const catClass =
              theme.id === "analyse"
                ? "cat-analyse"
                : theme.id === "algebre"
                ? "cat-algebre"
                : "cat-geometrie";

            return (
              <section
                key={theme.id || tIdx}
                className={`ak-card open ${catClass}`}
                style={{ animationDelay: `${Math.min(tIdx * 0.04, 0.25).toFixed(3)}s` }}
              >
                <div className="ak-card-head" style={{ cursor: "default" }}>
                  <span className="ak-card-n">{formatChapterNum(tIdx + 1)}</span>
                  <span className="ak-card-titles">
                    <span className="ak-card-titre">{theme.titre}</span>
                    {theme.meta && <span className="ak-card-desc">{theme.meta}</span>}
                  </span>
                  <span className="ak-badge ak-b-default">
                    {safeItems.length} document{safeItems.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="ak-card-body">
                  <div className="ak-doc-list" data-count={safeItems.length}>
                    {safeItems.map((item, idx) => {
                      const hasEnonce = Boolean(item.enonce);
                      const hasCorrection = Boolean(item.correction);
                      const hasVideo = Boolean(item.video);
                      const isMultiPartVideo = Array.isArray(item.video);

                      return (
                        <div key={item.id || idx} className="ak-doc-line-wrap">
                          <div className="ak-doc-line">
                            <span className="ak-doc-line-ic" aria-hidden="true">
                              <PenLine size={15} />
                            </span>
                            <span className="ak-doc-line-txt">
                              <span className="ak-doc-line-t">{item.label}</span>
                              {item.sous && <span className="ak-doc-line-d">{item.sous}</span>}
                            </span>

                            <span className="ak-doc-line-b">
                              {hasEnonce && (
                                <button
                                  type="button"
                                  className="ak-btn ak-btn-exo"
                                  onClick={() => handleOpenPdf(item.enonce, `Sujet : ${item.label}`)}
                                >
                                  <FileText size={14} />
                                  <span>Sujet PDF</span>
                                </button>
                              )}

                              {hasCorrection && (
                                <button
                                  type="button"
                                  className="ak-btn ak-btn-corr"
                                  onClick={() =>
                                    handleOpenCorrection(item.correction, `Correction : ${item.label}`)
                                  }
                                >
                                  <CheckCircle size={14} />
                                  <span>Corrigé PDF</span>
                                  {!isApproved && <Lock size={11} />}
                                </button>
                              )}

                              {hasVideo &&
                                (isMultiPartVideo ? (
                                  item.video.map((vUrl, partIdx) => (
                                    <button
                                      key={partIdx}
                                      type="button"
                                      className="ak-btn ak-btn-video"
                                      onClick={() =>
                                        handleOpenVideo(vUrl, `${item.label} · Partie ${partIdx + 1}`)
                                      }
                                    >
                                      <Play size={12} style={{ fill: "currentColor" }} />
                                      <span>Partie {partIdx + 1}</span>
                                      {!isApproved && <Lock size={11} />}
                                    </button>
                                  ))
                                ) : (
                                  <button
                                    type="button"
                                    className="ak-btn ak-btn-video"
                                    onClick={() =>
                                      handleOpenVideo(item.video, `Vidéo : ${item.label}`)
                                    }
                                  >
                                    <Play size={12} style={{ fill: "currentColor" }} />
                                    <span>Vidéo Corrigé</span>
                                    {!isApproved && <Lock size={11} />}
                                  </button>
                                ))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })
        )}

        {/* Conseil méthodologique */}
        <div className="ak-note">
          <span className="ak-note-ic" aria-hidden="true">
            <Award size={17} />
          </span>
          <div className="ak-note-txt">
            <strong>Conseil méthodologique :</strong> Ces épreuves et exercices développent la
            rigueur de rédaction et la maîtrise des quantificateurs logiques. Travaillez chaque
            sujet avant de consulter les corrigés et vidéos explicatives.
          </div>
        </div>
      </main>

      {pdfModalData && (
        <PdfPreviewModal
          title={pdfModalData.title}
          url={pdfModalData.url}
          onClose={handleClosePdf}
        />
      )}

      {videoModalData && (
        <SecureVideoModal
          videoUrl={videoModalData.video_url}
          title={videoModalData.titre}
          onClose={handleCloseVideo}
        />
      )}

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
