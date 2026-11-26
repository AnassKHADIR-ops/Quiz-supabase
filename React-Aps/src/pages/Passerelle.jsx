import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { usePasserelleSync } from "../hooks/usePasserelleSync.js";
import SecureVideoModal from "../components/SecureVideoModal.jsx";
import AuthGateModal from "../components/AuthGateModal.jsx";
import PdfPreviewModal from "../components/PdfPreviewModal.jsx";
import {
  BookshelfSection,
  ChapterTabs,
  ExerciseTdLine,
  FicheCard,
  SessionVideoCard,
  VideoViewSwitch,
} from "../components/AcademicParts.jsx";
import {
  ChevronDown,
  Layers,
  PenLine,
  RefreshCw,
  Search,
  Video,
  X,
} from "../components/Icon.jsx";
import {
  formatChapterNum,
  isUrlActive,
  normalizeLinksList,
  stripAccents,
} from "../utils/academicUtils.js";

function Passerelle() {
  const { isAdmin, isApproved } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Synchronisation WordPress en direct (polling uniquement pour l'administrateur)
  const { passerelleData, isSyncing, isLive, lastSynced, refreshSync } = usePasserelleSync(
    null,
    isAdmin ? 10000 : 0
  );

  const [activeFiliereId, setActiveFiliereId] = useState(
    () => searchParams.get("fil") || searchParams.get("filiere") || "mp"
  );
  const [openChapterIds, setOpenChapterIds] = useState(() => new Set());
  const [chapterTabMap, setChapterTabMap] = useState({});
  const [compactVideoMap, setCompactVideoMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const [videoModalData, setVideoModalData] = useState(null);
  const [pdfModalData, setPdfModalData] = useState(null);
  const [authGateData, setAuthGateData] = useState(null);
  const prevUrlMediaRef = useRef({ video: null, pdf: null, corr: null, isApproved: null });

  const validFilieres = useMemo(() => {
    return Array.isArray(passerelleData?.filieres)
      ? passerelleData.filieres.filter((f) => f && typeof f === "object")
      : [];
  }, [passerelleData]);

  const filiere = useMemo(() => {
    return (
      validFilieres.find((f) => f.id === activeFiliereId) ||
      validFilieres[0] || { id: "", nom: "", chapitres: [], livres: [] }
    );
  }, [validFilieres, activeFiliereId]);

  const validChapitres = useMemo(() => {
    return Array.isArray(filiere?.chapitres)
      ? filiere.chapitres.filter((c) => c && typeof c === "object")
      : [];
  }, [filiere]);

  const validLivres = useMemo(() => {
    return Array.isArray(filiere?.livres)
      ? filiere.livres.filter((l) => l && typeof l === "object")
      : [];
  }, [filiere]);

  const validPlan = useMemo(() => {
    return Array.isArray(passerelleData?.plan)
      ? passerelleData.plan.filter((p) => p && typeof p === "object")
      : [];
  }, [passerelleData]);

  // Deep linking URL (?fil=, ?chap=, ?video=, ?corr=, ?pdf=)
  useEffect(() => {
    const filParam = searchParams.get("fil") || searchParams.get("filiere");
    if (filParam && validFilieres.length > 0) {
      const matchFil = validFilieres.find(
        (f) =>
          String(f?.id || "").toLowerCase() === filParam.toLowerCase() ||
          String(f?.nom || "").toLowerCase() === filParam.toLowerCase() ||
          String(f?.de || "").toLowerCase() === filParam.toLowerCase() ||
          String(f?.vers || "").toLowerCase() === filParam.toLowerCase()
      );
      if (matchFil) setActiveFiliereId(matchFil.id);
    }

    const videoUrlParam = searchParams.get("video");
    const corrUrlParam = searchParams.get("corr");
    const pdfUrlParam = searchParams.get("pdf");
    const titleParam = searchParams.get("title");
    const chapParam = searchParams.get("chap") || searchParams.get("chapitre");
    const viewParam = searchParams.get("view");
    const prevMedia = prevUrlMediaRef.current;
    const videoChanged = videoUrlParam !== prevMedia.video;
    const pdfChanged = pdfUrlParam !== prevMedia.pdf;
    const corrChanged = corrUrlParam !== prevMedia.corr;
    const approvalChanged = prevMedia.isApproved !== null && isApproved !== prevMedia.isApproved;

    if (videoUrlParam) {
      if (videoChanged || approvalChanged) {
        if (!isApproved) {
          setAuthGateData({
            contentType: "video",
            title: titleParam || "Vidéo d'explication",
          });
        } else {
          setVideoModalData((prev) =>
            prev && prev.video_url === videoUrlParam
              ? prev
              : {
                  titre: titleParam || "Vidéo d'explication",
                  video_url: videoUrlParam,
                }
          );
        }
      }
    } else if (prevMedia.video) {
      setVideoModalData(null);
    }

    if (corrUrlParam) {
      if (corrChanged || approvalChanged) {
        if (!isApproved) {
          setAuthGateData({
            contentType: "correction",
            title: titleParam || "Correction détaillée PDF",
          });
        } else {
          setPdfModalData((prev) =>
            prev && prev.url === corrUrlParam
              ? prev
              : {
                  title: titleParam || "Correction détaillée",
                  url: corrUrlParam,
                  isCorrection: true,
                }
          );
        }
      }
    } else if (pdfUrlParam) {
      if (pdfChanged) {
        setPdfModalData((prev) =>
          prev && prev.url === pdfUrlParam
            ? prev
            : {
                title: titleParam || "Document pédagogique",
                url: pdfUrlParam,
                isCorrection: false,
              }
        );
      }
    } else if (prevMedia.pdf || prevMedia.corr) {
      setPdfModalData(null);
    }

    prevUrlMediaRef.current = {
      video: videoUrlParam,
      pdf: pdfUrlParam,
      corr: corrUrlParam,
      isApproved,
    };

    if (chapParam && validChapitres.length > 0) {
      const foundChap = validChapitres.find(
        (c) =>
          String(c.id) === String(chapParam) ||
          stripAccents(c.titre).includes(stripAccents(chapParam))
      );
      if (foundChap) {
        setOpenChapterIds((prev) => new Set([...prev, foundChap.id]));
        if (viewParam === "video" && !videoUrlParam) {
          let targetVideo = null;
          let targetTitle = foundChap.titre;

          for (const item of (foundChap.items || []).filter((it) => it && typeof it === "object")) {
            const vLinks = normalizeLinksList(item.video);
            if (vLinks.length > 0 && isUrlActive(vLinks[0].url)) {
              targetVideo = vLinks[0].url;
              targetTitle = item.titre;
              break;
            }
          }
          if (!targetVideo) {
            for (const s of (foundChap.seances || []).filter((se) => se && typeof se === "object")) {
              const vLinks = normalizeLinksList(s.video);
              if (vLinks.length > 0 && isUrlActive(vLinks[0].url)) {
                targetVideo = vLinks[0].url;
                targetTitle = s.titre;
                break;
              }
            }
          }
          if (targetVideo) {
            if (!isApproved) {
              setAuthGateData({
                contentType: "video",
                title: targetTitle || "Vidéo d'explication",
              });
            } else {
              setVideoModalData({ titre: targetTitle, video_url: targetVideo });
            }
          }
        }
      }
    }
  }, [searchParams, validFilieres, validChapitres, isApproved]);

  useEffect(() => {
    if (!isApproved) {
      setVideoModalData(null);
      setPdfModalData((prev) => (prev?.isCorrection ? null : prev));
    }
  }, [isApproved]);

  const handleSelectFiliere = (fId) => {
    setActiveFiliereId(fId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("fil", fId);
    setSearchParams(newParams, { replace: false });
  };

  const toggleChapter = (chapId) => {
    setOpenChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapId)) next.delete(chapId);
      else next.add(chapId);
      return next;
    });
  };

  const openVideo = (url, titre) => {
    if (!url) return;
    if (!isApproved) {
      setAuthGateData({
        contentType: "video",
        title: titre || "Vidéo d'explication",
      });
      return;
    }
    const newParams = new URLSearchParams(searchParams);
    newParams.set("video", url);
    if (titre) newParams.set("title", titre);
    setSearchParams(newParams, { replace: false });
    setVideoModalData({ titre: titre || "Vidéo d'explication", video_url: url });
  };

  const closeVideo = () => {
    setVideoModalData(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("video");
    newParams.delete("title");
    newParams.delete("view");
    setSearchParams(newParams, { replace: true });
  };

  const openCorrection = (url, title, docs = null, initialIndex = 0) => {
    if (!url) return;
    if (!isApproved) {
      setAuthGateData({
        contentType: "correction",
        title: title || "Correction détaillée PDF",
      });
      return;
    }
    if (!docs) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("corr", url);
      if (title) newParams.set("title", title);
      setSearchParams(newParams, { replace: false });
    }
    setPdfModalData({ title, url, docs, initialIndex, isCorrection: true });
  };

  const openPdf = (arg, legacyTitle) => {
    const payload =
      typeof arg === "string"
        ? { url: arg, title: legacyTitle }
        : arg && typeof arg === "object"
        ? arg
        : {};
    const { url, title, docs, initialIndex = 0 } = payload;
    if (!url) return;
    if (!docs) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("pdf", url);
      if (title) newParams.set("title", title);
      setSearchParams(newParams, { replace: false });
    }
    setPdfModalData({
      title: title || "Document pédagogique",
      url,
      docs,
      initialIndex,
      isCorrection: false,
    });
  };

  const closePdf = () => {
    setPdfModalData(null);
    if (searchParams.has("pdf") || searchParams.has("corr") || searchParams.has("title")) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("pdf");
      newParams.delete("corr");
      newParams.delete("title");
      setSearchParams(newParams, { replace: true });
    }
  };

  const filteredChapitres = useMemo(() => {
    const q = stripAccents(searchQuery).trim();
    if (!q) return validChapitres;
    return validChapitres.filter((c) => {
      const inTitle = stripAccents(c.titre).includes(q);
      const inWhy = c.why && stripAccents(c.why).includes(q);
      const inItems = (c.items || []).some((it) => it && stripAccents(it.titre).includes(q));
      const inSeances = (c.seances || []).some((s) => s && stripAccents(s.titre).includes(q));
      return inTitle || inWhy || inItems || inSeances;
    });
  }, [validChapitres, searchQuery]);

  const totalItemsCount = useMemo(
    () =>
      validChapitres.reduce(
        (acc, c) =>
          acc + (Array.isArray(c.items) ? c.items.filter((it) => it && typeof it === "object").length : 0),
        0
      ),
    [validChapitres]
  );

  const totalSeancesCount = useMemo(
    () =>
      validChapitres.reduce(
        (acc, c) =>
          acc +
          (Array.isArray(c.seances) ? c.seances.filter((se) => se && typeof se === "object").length : 0),
        0
      ),
    [validChapitres]
  );

  return (
    <div className="ak-page">
      {/* ═══ HERO ACADÉMIQUE PLEINE LARGEUR ═══ */}
      <header className="ak-hero">
        <div className="ak-hero-in">
          <div className="ak-hero-top">
            <span className="ak-eyebrow">
              <span className="ak-eyebrow-dot" aria-hidden="true" />
              {passerelleData.eyebrow || "Accompagnement Mathématiques · Sup → Spé"}
            </span>

            {isAdmin && (
              <>
                {isLive && (
                  <span
                    className="ak-sync-pill"
                    title={
                      lastSynced
                        ? `Dernière synchronisation : ${new Date(lastSynced).toLocaleTimeString()}`
                        : "En direct WordPress"
                    }
                  >
                    <span className="ak-sync-dot" aria-hidden="true" />
                    En direct WordPress
                  </span>
                )}
                <button
                  type="button"
                  className="ak-sync-btn"
                  onClick={() => refreshSync(null, true)}
                  disabled={isSyncing}
                  title="Synchroniser depuis WordPress"
                >
                  <RefreshCw size={12} className={isSyncing ? "spin-animate" : ""} />
                  <span>{isSyncing ? "Synchronisation…" : "Actualiser"}</span>
                </button>
              </>
            )}
          </div>

          <h1>
            La Passerelle <em>Sup → Spé</em>
          </h1>
          <p>{passerelleData.description}</p>

          {/* Sélecteur de filières intégré au Hero */}
          <div className="ak-hero-controls">
            <div className="ak-branch-row" role="group" aria-label="Choisir votre filière">
              {validFilieres.map((f, fIdx) => {
                const isSelected = f.id === filiere.id;
                return (
                  <button
                    key={f.id || fIdx}
                    type="button"
                    className={`ak-branch-pill ${isSelected ? "on" : ""}`}
                    onClick={() => handleSelectFiliere(f.id)}
                  >
                    <span className="ak-branch-ic" aria-hidden="true">
                      {f.icon || "•"}
                    </span>
                    <span>
                      {f.de} → {f.vers}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* ═══ BARRE DE STATISTIQUES FLOTTANTE ═══ */}
      <div className="ak-shell ak-stats-wrap">
        <div
          className="ak-stats-row cols-4"
          style={{ "--ak-stat-cols": 4 }}
          aria-label="Statistiques Passerelle"
        >
          <div className="ak-stat">
            <div className="ak-stat-n">{validFilieres.length}</div>
            <div className="ak-stat-l">Filières</div>
          </div>
          <div className="ak-stat">
            <div className="ak-stat-n">{validChapitres.length}</div>
            <div className="ak-stat-l">Chapitres ({filiere?.nom})</div>
          </div>
          <div className="ak-stat">
            <div className="ak-stat-n">{totalItemsCount}</div>
            <div className="ak-stat-l">Fiches d'exercices</div>
          </div>
          <div className="ak-stat">
            <div className="ak-stat-n">{totalSeancesCount}</div>
            <div className="ak-stat-l">Séances &amp; Replays</div>
          </div>
        </div>
      </div>

      {/* ═══ RECHERCHE ═══ */}
      <div className="ak-filters">
        <div className="ak-shell ak-filters-in">
          <div className="ak-filter-block">
            <div className="ak-filter-label">
              Programme de transition · {filiere?.de} → {filiere?.vers}
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
              placeholder="Rechercher un chapitre, exercice…"
              aria-label="Rechercher un chapitre ou exercice"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="ak-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Effacer la recherche"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ LISTE DES CHAPITRES + BIBLIOTHÈQUE + FEUILLE DE ROUTE ═══ */}
      <main className="ak-wrapper ak-shell">
        {filteredChapitres.length === 0 ? (
          <div className="ak-empty">Aucun chapitre ne correspond à votre recherche.</div>
        ) : (
          filteredChapitres.map((chap, idx) => {
            const isOpen = openChapterIds.has(chap.id);
            const items = (Array.isArray(chap.items) ? chap.items : []).filter(
              (it) => it && typeof it === "object"
            );
            const seances = (Array.isArray(chap.seances) ? chap.seances : []).filter(
              (se) => se && typeof se === "object"
            );
            const fiches = Array.isArray(chap.fiches)
              ? chap.fiches.filter((fi) => fi != null && (typeof fi === "object" || typeof fi === "string"))
              : normalizeLinksList(chap.fiche).map((l) => ({
                  t: l.label || "Fiche de synthèse",
                  u: l.url,
                  sous: "L'essentiel du chapitre",
                }));

            const activeTab = chapterTabMap[chap.id] || "all";
            const isCompact = Boolean(compactVideoMap[chap.id]);

            return (
              <article
                key={chap.id || idx}
                className={`ak-card cat-algebre ${isOpen ? "open" : ""}`}
                style={{ animationDelay: `${Math.min(idx * 0.025, 0.3).toFixed(3)}s` }}
              >
                <button
                  type="button"
                  className="ak-card-head"
                  aria-expanded={isOpen}
                  onClick={() => toggleChapter(chap.id)}
                >
                  <span className="ak-card-n">{formatChapterNum(idx + 1)}</span>
                  <span className="ak-card-titles">
                    <span className="ak-card-titre">{chap.titre}</span>
                    {chap.why && <span className="ak-card-desc">{chap.why}</span>}
                    <span className="ak-card-chips">
                      {fiches.length > 0 && (
                        <span className="ak-chip ok">
                          <Layers size={11} />
                          <span>
                            {fiches.length} fiche{fiches.length > 1 ? "s" : ""}
                          </span>
                        </span>
                      )}
                      {items.length > 0 && (
                        <span className="ak-chip ok">
                          <PenLine size={11} />
                          <span>
                            {items.length} exercice{items.length > 1 ? "s" : ""}
                          </span>
                        </span>
                      )}
                      {seances.length > 0 && (
                        <span className="ak-chip vid">
                          <Video size={11} />
                          <span>
                            {seances.length} séance{seances.length > 1 ? "s" : ""}
                          </span>
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="ak-card-chev" aria-hidden="true">
                    <ChevronDown size={17} />
                  </span>
                </button>

                {isOpen && (
                  <div className="ak-card-body">
                    {fiches.length === 0 && seances.length === 0 && items.length === 0 ? (
                      <div className="ak-empty-mini">
                        Contenu pédagogique en cours de finalisation.
                      </div>
                    ) : (
                      <>
                        <ChapterTabs
                          counts={{
                            fiches: fiches.length,
                            videos: seances.length,
                            cours: 0,
                            tds: items.length,
                          }}
                          activeTab={activeTab}
                          onChange={(tab) =>
                            setChapterTabMap((prev) => ({ ...prev, [chap.id]: tab }))
                          }
                        />

                        <div className="ak-ch-stack">
                          {fiches.length > 0 &&
                            (activeTab === "all" || activeTab === "fiches") && (
                              <section className="ak-fiches-shelf">
                                <div className="ak-doc-sec-t">
                                  <span className="ak-doc-sec-ic ic-fch" aria-hidden="true">
                                    <Layers size={14} />
                                  </span>
                                  <b>Fiches de synthèse</b>
                                  <span className="ak-doc-sec-n">{fiches.length}</span>
                                  <span className="ak-doc-sec-line" />
                                  <span className="ak-fiches-hint">Accès direct · PDF</span>
                                </div>
                                <div className="ak-doc-grid" data-count={fiches.length}>
                                  {fiches.map((f, fIdx) => (
                                    <FicheCard
                                      key={fIdx}
                                      fiche={f}
                                      chapTitre={chap.titre}
                                      onOpenPdf={openPdf}
                                    />
                                  ))}
                                </div>
                              </section>
                            )}

                          {seances.length > 0 &&
                            (activeTab === "all" || activeTab === "videos") && (
                              <section>
                                <div className="ak-doc-sec-t">
                                  <span className="ak-doc-sec-ic ic-vid" aria-hidden="true">
                                    <Video size={14} />
                                  </span>
                                  <b>Séances à distance &amp; Replays</b>
                                  <span className="ak-doc-sec-n">{seances.length}</span>
                                  <span className="ak-doc-sec-line" />
                                  {seances.length >= 6 && (
                                    <VideoViewSwitch
                                      compact={isCompact}
                                      onChange={(val) =>
                                        setCompactVideoMap((prev) => ({
                                          ...prev,
                                          [chap.id]: val,
                                        }))
                                      }
                                    />
                                  )}
                                </div>
                                <div
                                  className={`ak-session-grid ${isCompact ? "is-compact" : ""}`}
                                  data-count={seances.length}
                                >
                                  {seances.map((se, sIdx) => (
                                    <SessionVideoCard
                                      key={se.id || sIdx}
                                      seance={se}
                                      index={sIdx}
                                      chapTitre={chap.titre}
                                      isApproved={isApproved}
                                      onOpenPdf={openPdf}
                                      onOpenCorrection={openCorrection}
                                      onOpenVideo={openVideo}
                                    />
                                  ))}
                                </div>
                              </section>
                            )}

                          {items.length > 0 &&
                            (activeTab === "all" || activeTab === "tds") && (
                              <section>
                                <div className="ak-doc-sec-t">
                                  <span className="ak-doc-sec-ic ic-td" aria-hidden="true">
                                    <PenLine size={14} />
                                  </span>
                                  <b>S'entraîner (Fiches d'exercices &amp; Annales)</b>
                                  <span className="ak-doc-sec-n">{items.length}</span>
                                  <span className="ak-doc-sec-line" />
                                </div>
                                <div className="ak-doc-list" data-count={items.length}>
                                  {items.map((it, itIdx) => (
                                    <ExerciseTdLine
                                      key={it.id || itIdx}
                                      item={it}
                                      index={itIdx}
                                      chapTitre={chap.titre}
                                      isApproved={isApproved}
                                      onOpenPdf={openPdf}
                                      onOpenCorrection={openCorrection}
                                      onOpenVideo={openVideo}
                                    />
                                  ))}
                                </div>
                              </section>
                            )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}

        {/* Bibliothèque d'ouvrages conseillés */}
        <BookshelfSection
          livres={validLivres}
          branchNom={filiere?.nom}
          onOpenPdf={openPdf}
        />

        {/* Feuille de route de l'été */}
        {validPlan.length > 0 && (
          <section className="ak-roadmap" aria-label="Feuille de route de l'été">
            <div className="ak-livres-tete" style={{ marginBlockEnd: 0 }}>
              <span className="ak-livres-tag">Organisation</span>
              <h2 className="ak-livres-h">Feuille de route de l'été</h2>
              <p className="ak-livres-sub">
                Une progression régulière pour aborder la 2ème année avec sérénité.
              </p>
            </div>
            <div className="ak-roadmap-grid">
              {validPlan.map((step, pIdx) => (
                <div key={pIdx} className="ak-roadmap-item">
                  <span className="ak-roadmap-tag">{step.semaine}</span>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--ak-ink)" }}>
                    {step.titre}
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--ak-ink-s)", lineHeight: 1.55 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {videoModalData && (
        <SecureVideoModal
          videoUrl={videoModalData.video_url || videoModalData.url}
          title={videoModalData.titre || videoModalData.title}
          chapter={{
            titre: videoModalData.titre || videoModalData.title,
            video_url: videoModalData.video_url || videoModalData.url,
          }}
          onClose={closeVideo}
        />
      )}

      {pdfModalData && (
        <PdfPreviewModal
          title={pdfModalData.title}
          url={pdfModalData.url}
          docs={pdfModalData.docs}
          initialIndex={pdfModalData.initialIndex || 0}
          onClose={closePdf}
        />
      )}

      {authGateData && (
        <AuthGateModal
          isOpen={Boolean(authGateData)}
          contentType={authGateData.contentType || "member"}
          title={authGateData.title}
          onClose={() => setAuthGateData(null)}
        />
      )}
    </div>
  );
}

export default Passerelle;
