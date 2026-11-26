import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCoursesSync } from "../hooks/useCoursesSync.js";
import SecureVideoModal from "../components/SecureVideoModal.jsx";
import AuthGateModal from "../components/AuthGateModal.jsx";
import PdfPreviewModal from "../components/PdfPreviewModal.jsx";
import {
  BookshelfSection,
  ChapterTabs,
  CoursePdfLine,
  ExerciseTdLine,
  FicheCard,
  SessionVideoCard,
  VideoViewSwitch,
} from "../components/AcademicParts.jsx";
import {
  BookOpen,
  ChevronDown,
  Layers,
  Lightbulb,
  PenLine,
  RefreshCw,
  Search,
  Video,
  X,
} from "../components/Icon.jsx";
import {
  computeBranchStats,
  computeChapterCounts,
  formatChapterNum,
  getCategoryLabel,
  normalizeCategoryKey,
  splitChapterResources,
  stripAccents,
} from "../utils/academicUtils.js";

function Courses() {
  const { isAdmin, isApproved } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Synchronisation WordPress en direct (polling actif uniquement pour l'administrateur)
  const { curriculum, isSyncing, isLive, lastSynced, refreshSync } = useCoursesSync(
    null,
    isAdmin ? 15000 : 0
  );

  const initialYear = searchParams.get("annee") === "2" ? "annee2" : "annee1";
  const [selectedYear, setSelectedYear] = useState(initialYear);

  const rawYearData = curriculum?.[selectedYear] || curriculum?.annee1 || {};
  const yearBranches = useMemo(
    () =>
      Array.isArray(rawYearData.branches)
        ? rawYearData.branches.filter((b) => b && typeof b === "object")
        : [],
    [rawYearData]
  );

  const defaultBranch = yearBranches[0]?.id || "tsi1";
  const initialBranch = searchParams.get("branche") || searchParams.get("fil") || defaultBranch;
  const [selectedBranch, setSelectedBranch] = useState(initialBranch);

  const [activeCat, setActiveCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openChapterIds, setOpenChapterIds] = useState(() => new Set());
  const [chapterTabMap, setChapterTabMap] = useState({});
  const [compactVideoMap, setCompactVideoMap] = useState({});

  const [selectedVideoModal, setSelectedVideoModal] = useState(null);
  const [pdfModalData, setPdfModalData] = useState(null);
  const [authGateData, setAuthGateData] = useState(null);

  // Deep linking depuis l'URL (?annee=, ?branche=, ?video=, ?corr=, ?pdf=)
  useEffect(() => {
    const anneeParam = searchParams.get("annee");
    if (anneeParam === "2") setSelectedYear("annee2");
    else if (anneeParam === "1") setSelectedYear("annee1");

    const branchParam = searchParams.get("branche") || searchParams.get("fil");
    if (branchParam) {
      const yearKey =
        anneeParam === "2" ? "annee2" : anneeParam === "1" ? "annee1" : selectedYear;
      const branches = (curriculum?.[yearKey]?.branches || []).filter(
        (b) => b && typeof b === "object"
      );
      const match = branches.find(
        (b) =>
          String(b.id || "").toLowerCase() === branchParam.toLowerCase() ||
          String(b.nom || "").toLowerCase() === branchParam.toLowerCase()
      );
      if (match) {
        setSelectedBranch(match.id);
      }
    }

    const videoUrlParam = searchParams.get("video");
    const corrUrlParam = searchParams.get("corr");
    const pdfUrlParam = searchParams.get("pdf");
    const titleParam = searchParams.get("title");
    const viewParam = searchParams.get("view");

    if (videoUrlParam) {
      if (!isApproved) {
        setAuthGateData({
          contentType: "video",
          title: titleParam || "Séance de cours (Replay)",
        });
      } else {
        setSelectedVideoModal({
          titre: titleParam || "Séance de cours (Replay)",
          video_url: videoUrlParam,
        });
      }
    } else {
      setSelectedVideoModal(null);
    }

    if (corrUrlParam || (pdfUrlParam && viewParam === "corr")) {
      const targetUrl = corrUrlParam || pdfUrlParam;
      if (!isApproved) {
        setAuthGateData({
          contentType: "correction",
          title: titleParam || "Correction détaillée PDF",
        });
      } else {
        setPdfModalData({
          title: titleParam || "Correction détaillée",
          url: targetUrl,
        });
      }
    } else if (pdfUrlParam) {
      setPdfModalData({
        title: titleParam || "Document pédagogique",
        url: pdfUrlParam,
      });
    } else {
      setPdfModalData(null);
    }
  }, [searchParams, curriculum, selectedYear, isApproved]);

  // Ferme les modales protégées si l'accès membre est révoqué (sans fermer les PDF gratuits)
  useEffect(() => {
    if (!isApproved) {
      setSelectedVideoModal(null);
      setPdfModalData((prev) => (prev?.isCorrection ? null : prev));
    }
  }, [isApproved]);

  // S'assurer que la filière reste valide lors d'un changement d'année
  useEffect(() => {
    const valid = yearBranches.some((b) => b.id === selectedBranch);
    if (!valid && yearBranches.length > 0) {
      setSelectedBranch(yearBranches[0].id);
    }
  }, [yearBranches, selectedBranch]);

  const currentBranch = useMemo(() => {
    return (
      yearBranches.find((b) => b.id === selectedBranch) ||
      yearBranches[0] || { id: "", nom: "", chapitres: [], livres: [] }
    );
  }, [yearBranches, selectedBranch]);

  const allChapters = useMemo(() => {
    return (Array.isArray(currentBranch.chapitres) ? currentBranch.chapitres : []).filter(
      (c) => c && typeof c === "object"
    );
  }, [currentBranch]);

  // Ouverture automatique par ancre #ch-N (parité avec anasskhadir.com)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const match = (window.location.hash || "").match(/^#ch-([\w-]+)$/);
    if (!match) return;
    const targetNum = match[1];
    const found = allChapters.find(
      (c) => String(c.n) === targetNum || String(c.id) === targetNum
    );
    if (found) {
      setOpenChapterIds((prev) => new Set([...prev, found.id]));
    }
  }, [allChapters]);

  const validLivres = useMemo(() => {
    return (Array.isArray(currentBranch.livres) ? currentBranch.livres : []).filter(
      (l) => l && typeof l === "object"
    );
  }, [currentBranch]);

  // Filtres dynamiques par domaine avec compteurs exacts (zéro doublon)
  const domainFilters = useMemo(() => {
    const counts = new Map();
    allChapters.forEach((ch) => {
      const key = normalizeCategoryKey(ch.cat);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([id, count]) => ({
      id,
      label: getCategoryLabel(id),
      count,
    }));
  }, [allChapters]);

  // Reset du filtre de domaine s'il n'existe pas dans la filière courante
  useEffect(() => {
    if (activeCat !== "all" && !domainFilters.some((d) => d.id === activeCat)) {
      setActiveCat("all");
    }
  }, [domainFilters, activeCat]);

  const filteredChapters = useMemo(() => {
    const q = stripAccents(searchQuery).trim();
    return allChapters.filter((ch) => {
      const catKey = normalizeCategoryKey(ch.cat);
      if (activeCat !== "all" && catKey !== activeCat) return false;
      if (!q) return true;
      const haystack = stripAccents(
        `${ch.titre || ""} ${ch.description || ch.desc || ""} ${getCategoryLabel(catKey)} ${ch.n ?? ""}`
      );
      return haystack.includes(q);
    });
  }, [allChapters, activeCat, searchQuery]);

  const stats = useMemo(
    () => computeBranchStats(filteredChapters, validLivres),
    [filteredChapters, validLivres]
  );

  const handleSelectYear = (yr) => {
    setSelectedYear(yr);
    setActiveCat("all");
    const newParams = new URLSearchParams(searchParams);
    newParams.set("annee", yr === "annee2" ? "2" : "1");
    const nextBranches = (curriculum?.[yr]?.branches || []).filter(
      (b) => b && typeof b === "object"
    );
    if (nextBranches.length > 0) {
      newParams.set("branche", nextBranches[0].id);
      setSelectedBranch(nextBranches[0].id);
    }
    setSearchParams(newParams, { replace: false });
  };

  const handleSelectBranch = (brId) => {
    setSelectedBranch(brId);
    setActiveCat("all");
    const newParams = new URLSearchParams(searchParams);
    newParams.set("branche", brId);
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
        title: titre || "Séance de cours (Replay)",
      });
      return;
    }
    const newParams = new URLSearchParams(searchParams);
    newParams.set("video", url);
    if (titre) newParams.set("title", titre);
    setSearchParams(newParams, { replace: false });
    setSelectedVideoModal({
      video_url: url,
      titre: titre || "Vidéo d'explication",
    });
  };

  const closeVideo = () => {
    setSelectedVideoModal(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("video");
    newParams.delete("title");
    newParams.delete("view");
    setSearchParams(newParams, { replace: true });
  };

  const openPdf = ({ url, title, docs, initialIndex = 0 }) => {
    if (!url) return;
    if (!docs) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("pdf", url);
      if (title) newParams.set("title", title);
      setSearchParams(newParams, { replace: false });
    }
    setPdfModalData({ url, title: title || "Document pédagogique", docs, initialIndex });
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
    setPdfModalData({
      url,
      title: title || "Correction détaillée",
      docs,
      initialIndex,
      isCorrection: true,
    });
  };

  const closePdf = () => {
    setPdfModalData(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("pdf");
    newParams.delete("corr");
    newParams.delete("title");
    newParams.delete("view");
    setSearchParams(newParams, { replace: true });
  };

  const statCols = stats.livres > 0 ? 6 : 5;

  return (
    <div className="ak-page">
      {/* ═══ HERO ACADÉMIQUE PLEINE LARGEUR ═══ */}
      <header className="ak-hero">
        <div className="ak-hero-in">
          <div className="ak-hero-top">
            <span className="ak-eyebrow">
              <span className="ak-eyebrow-dot" aria-hidden="true" />
              CPGE {currentBranch.nom || "Mathématiques"} · Programme Officiel
            </span>

            {isAdmin && (
              <>
                {isLive && (
                  <span
                    className="ak-sync-pill"
                    title={
                      lastSynced
                        ? `Dernière synchronisation : ${new Date(lastSynced).toLocaleTimeString()}`
                        : "Données synchronisées"
                    }
                  >
                    <span className="ak-sync-dot" aria-hidden="true" />
                    Synchronisé WordPress
                  </span>
                )}
                <button
                  type="button"
                  className="ak-sync-btn"
                  onClick={() => refreshSync()}
                  disabled={isSyncing}
                  title="Recharger les données en direct depuis WordPress"
                >
                  <RefreshCw size={12} className={isSyncing ? "spin-animate" : ""} />
                  <span>{isSyncing ? "Synchronisation…" : "Actualiser"}</span>
                </button>
              </>
            )}
          </div>

          <h1>
            Cours, Résumés &amp; Exercices{" "}
            <em>{currentBranch.nom || rawYearData.titre}</em>
          </h1>
          <p>{rawYearData.description}</p>

          {/* Sélecteurs Année + Filières intégrés au Hero */}
          <div className="ak-hero-controls">
            <div className="ak-year-seg" role="group" aria-label="Choisir l'année">
              <button
                type="button"
                className={`ak-year-btn ${selectedYear === "annee1" ? "on" : ""}`}
                onClick={() => handleSelectYear("annee1")}
              >
                1ère Année (Sup)
              </button>
              <button
                type="button"
                className={`ak-year-btn ${selectedYear === "annee2" ? "on" : ""}`}
                onClick={() => handleSelectYear("annee2")}
              >
                2ème Année (Spé)
              </button>
            </div>

            <div className="ak-branch-row" role="group" aria-label="Sélectionner votre filière">
              {yearBranches.map((br) => {
                const isSelected = br.id === currentBranch.id;
                return (
                  <button
                    key={br.id}
                    type="button"
                    className={`ak-branch-pill ${isSelected ? "on" : ""}`}
                    onClick={() => handleSelectBranch(br.id)}
                  >
                    <span className="ak-branch-ic" aria-hidden="true">
                      {br.icon || "•"}
                    </span>
                    <span>{br.nom}</span>
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
          className="ak-stats-row"
          style={{ "--ak-stat-cols": statCols }}
          aria-label="Statistiques de la filière"
        >
          <div className="ak-stat">
            <div className="ak-stat-n">{stats.chapitres}</div>
            <div className="ak-stat-l">Chapitres</div>
          </div>
          <div className="ak-stat">
            <div className="ak-stat-n">{stats.cours}</div>
            <div className="ak-stat-l">Séances / Cours</div>
          </div>
          <div className="ak-stat">
            <div className="ak-stat-n">{stats.fiches}</div>
            <div className="ak-stat-l">Fiches Résumé</div>
          </div>
          <div className="ak-stat">
            <div className="ak-stat-n">{stats.tds}</div>
            <div className="ak-stat-l">TD &amp; DL</div>
          </div>
          <div className="ak-stat">
            <div className="ak-stat-n">{stats.videos}</div>
            <div className="ak-stat-l">Replays Vidéo</div>
          </div>
          {stats.livres > 0 && (
            <div className="ak-stat">
              <div className="ak-stat-n">{stats.livres}</div>
              <div className="ak-stat-l">Livres Conseillés</div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ FILTRES PAR DOMAINE & RECHERCHE ═══ */}
      <div className="ak-filters">
        <div className="ak-shell ak-filters-in">
          <div className="ak-filter-block">
            <div className="ak-filter-label">Filtrer par domaine mathématique</div>
            <div className="ak-filter-row" role="group" aria-label="Filtrer par domaine">
              <button
                type="button"
                className={`ak-fb ${activeCat === "all" ? "on" : ""}`}
                onClick={() => setActiveCat("all")}
              >
                <span>Tout afficher</span>
                <span className="ak-fb-cnt">{allChapters.length}</span>
              </button>
              {domainFilters.map((dom) => (
                <button
                  key={dom.id}
                  type="button"
                  className={`ak-fb ${activeCat === dom.id ? "on" : ""}`}
                  onClick={() => setActiveCat(dom.id)}
                >
                  <span>{dom.label}</span>
                  <span className="ak-fb-cnt">{dom.count}</span>
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
              placeholder="Rechercher un chapitre, mot-clé…"
              aria-label="Rechercher un chapitre"
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

      {/* ═══ LISTE DES CHAPITRES + BIBLIOTHÈQUE ═══ */}
      <main className="ak-wrapper ak-shell">
        {filteredChapters.length === 0 ? (
          <div className="ak-empty">
            Aucun chapitre ne correspond à votre recherche.
          </div>
        ) : (
          (() => {
            let lastCat = null;
            return filteredChapters.map((chapter, idx) => {
              const catKey = normalizeCategoryKey(chapter.cat);
              const showSep = catKey !== lastCat;
              lastCat = catKey;

              const isOpen = openChapterIds.has(chapter.id);
              const counts = computeChapterCounts(chapter);
              const numFmt = formatChapterNum(chapter.n ?? idx + 1);
              const catLabel = getCategoryLabel(catKey);
              const chapDesc = chapter.description || chapter.desc || "";

              const activeTab = chapterTabMap[chapter.id] || "all";
              const isCompact = Boolean(compactVideoMap[chapter.id]);

              return (
                <div key={chapter.id || idx}>
                  {showSep && (
                    <div className="ak-sep">
                      <div className="ak-sep-l">
                        <span className="ak-sep-dot" aria-hidden="true" />
                        {catLabel}
                      </div>
                      <div className="ak-sep-line" />
                    </div>
                  )}

                  <article
                    className={`ak-card cat-${catKey} ${isOpen ? "open" : ""}`}
                    style={{ animationDelay: `${Math.min(idx * 0.025, 0.3).toFixed(3)}s` }}
                  >
                    <button
                      type="button"
                      className="ak-card-head"
                      aria-expanded={isOpen}
                      onClick={() => toggleChapter(chapter.id)}
                    >
                      <span className="ak-card-n">{numFmt}</span>
                      <span className="ak-card-titles">
                        <span className="ak-card-titre">{chapter.titre}</span>
                        {chapDesc && <span className="ak-card-desc">{chapDesc}</span>}
                        <span className="ak-card-chips">
                          {counts.totalCours > 0 && (
                            <span className={`ak-chip ${counts.coursActive > 0 ? "ok" : ""}`}>
                              <BookOpen size={11} />
                              <span>{counts.totalCours} cours</span>
                            </span>
                          )}
                          {counts.totalFiches > 0 && (
                            <span className={`ak-chip ${counts.fichesActive > 0 ? "ok" : ""}`}>
                              <Layers size={11} />
                              <span>
                                {counts.totalFiches} fiche{counts.totalFiches > 1 ? "s" : ""}
                              </span>
                            </span>
                          )}
                          {counts.totalTds > 0 && (
                            <span className={`ak-chip ${counts.tdsActive > 0 ? "ok" : ""}`}>
                              <PenLine size={11} />
                              <span>{counts.totalTds} TD/DL</span>
                            </span>
                          )}
                          {counts.videoCount > 0 && (
                            <span className="ak-chip vid">
                              <Video size={11} />
                              <span>
                                {counts.videoCount} vidéo{counts.videoCount > 1 ? "s" : ""}
                              </span>
                            </span>
                          )}
                        </span>
                      </span>

                      <span className={`ak-badge ak-b-${catKey}`}>{catLabel}</span>
                      <span className="ak-card-chev" aria-hidden="true">
                        <ChevronDown size={17} />
                      </span>
                    </button>

                    {/* Corps paresseux du chapitre (Container Query Full-Width) */}
                    {isOpen && (
                      <div className="ak-card-body">
                        {(() => {
                          const { fiches, sessionsVideo, coursDocs, tds } =
                            splitChapterResources(chapter);

                          const totalTypes =
                            (fiches.length > 0 ? 1 : 0) +
                            (sessionsVideo.length > 0 ? 1 : 0) +
                            (coursDocs.length > 0 ? 1 : 0) +
                            (tds.length > 0 ? 1 : 0);

                          if (totalTypes === 0) {
                            return (
                              <div className="ak-empty-mini">
                                Documents à venir pour ce chapitre.
                              </div>
                            );
                          }

                          return (
                            <>
                              <ChapterTabs
                                counts={{
                                  fiches: fiches.length,
                                  videos: sessionsVideo.length,
                                  cours: coursDocs.length,
                                  tds: tds.length,
                                }}
                                activeTab={activeTab}
                                onChange={(tab) =>
                                  setChapterTabMap((prev) => ({
                                    ...prev,
                                    [chapter.id]: tab,
                                  }))
                                }
                              />

                              <div className="ak-ch-stack">
                                {/* 1. Fiches de synthèse (Bandeau horizontal compact) */}
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
                                        <span className="ak-fiches-hint">
                                          Accès direct · Aperçu &amp; PDF
                                        </span>
                                      </div>
                                      <div className="ak-doc-grid" data-count={fiches.length}>
                                        {fiches.map((f, fIdx) => (
                                          <FicheCard
                                            key={fIdx}
                                            fiche={f}
                                            chapTitre={chapter.titre}
                                            onOpenPdf={openPdf}
                                          />
                                        ))}
                                      </div>
                                    </section>
                                  )}

                                {/* 2. Séances vidéo (Grille 3-4 cols pleine largeur + mode liste) */}
                                {sessionsVideo.length > 0 &&
                                  (activeTab === "all" || activeTab === "videos") && (
                                    <section>
                                      <div className="ak-doc-sec-t">
                                        <span className="ak-doc-sec-ic ic-vid" aria-hidden="true">
                                          <Video size={14} />
                                        </span>
                                        <b>Séances de Cours &amp; Replays Vidéo</b>
                                        <span className="ak-doc-sec-n">
                                          {sessionsVideo.length}
                                        </span>
                                        <span className="ak-doc-sec-line" />
                                        {sessionsVideo.length >= 6 && (
                                          <VideoViewSwitch
                                            compact={isCompact}
                                            onChange={(val) =>
                                              setCompactVideoMap((prev) => ({
                                                ...prev,
                                                [chapter.id]: val,
                                              }))
                                            }
                                          />
                                        )}
                                      </div>
                                      <div
                                        className={`ak-session-grid ${
                                          isCompact ? "is-compact" : ""
                                        }`}
                                        data-count={sessionsVideo.length}
                                      >
                                        {sessionsVideo.map((se, sIdx) => (
                                          <SessionVideoCard
                                            key={sIdx}
                                            seance={se}
                                            index={sIdx}
                                            chapTitre={chapter.titre}
                                            isApproved={isApproved}
                                            onOpenPdf={openPdf}
                                            onOpenCorrection={openCorrection}
                                            onOpenVideo={openVideo}
                                          />
                                        ))}
                                      </div>
                                    </section>
                                  )}

                                {/* 3. Cours & Polycopiés PDF */}
                                {coursDocs.length > 0 &&
                                  (activeTab === "all" || activeTab === "cours") && (
                                    <section>
                                      <div className="ak-doc-sec-t">
                                        <span className="ak-doc-sec-ic ic-crs" aria-hidden="true">
                                          <BookOpen size={14} />
                                        </span>
                                        <b>Cours &amp; Polycopiés de référence</b>
                                        <span className="ak-doc-sec-n">{coursDocs.length}</span>
                                        <span className="ak-doc-sec-line" />
                                      </div>
                                      <div className="ak-doc-list" data-count={coursDocs.length}>
                                        {coursDocs.map((c, cIdx) => (
                                          <CoursePdfLine
                                            key={cIdx}
                                            doc={c}
                                            chapTitre={chapter.titre}
                                            onOpenPdf={openPdf}
                                          />
                                        ))}
                                      </div>
                                    </section>
                                  )}

                                {/* 4. TD & Devoirs Libres */}
                                {tds.length > 0 &&
                                  (activeTab === "all" || activeTab === "tds") && (
                                    <section>
                                      <div className="ak-doc-sec-t">
                                        <span className="ak-doc-sec-ic ic-td" aria-hidden="true">
                                          <PenLine size={14} />
                                        </span>
                                        <b>TD &amp; Devoirs Libres (DL)</b>
                                        <span className="ak-doc-sec-n">{tds.length}</span>
                                        <span className="ak-doc-sec-line" />
                                      </div>
                                      <div className="ak-doc-list" data-count={tds.length}>
                                        {tds.map((td, tIdx) => (
                                          <ExerciseTdLine
                                            key={tIdx}
                                            item={td}
                                            index={tIdx}
                                            chapTitre={chapter.titre}
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
                          );
                        })()}
                      </div>
                    )}
                  </article>
                </div>
              );
            });
          })()
        )}

        {/* Note pédagogique */}
        <div className="ak-note">
          <span className="ak-note-ic" aria-hidden="true">
            <Lightbulb size={17} />
          </span>
          <div className="ak-note-txt">
            <strong>Cliquez sur un chapitre</strong> pour déployer son espace pédagogique. Les
            fiches, énoncés et supports PDF s'ouvrent directement dans la visionneuse intégrée. Les
            replays vidéo et corrections détaillées sont accessibles dans votre{" "}
            <strong>Espace Membre</strong>.
          </div>
        </div>

        {/* Bibliothèque CPGE */}
        <BookshelfSection
          livres={validLivres}
          branchNom={currentBranch.nom}
          onOpenPdf={openPdf}
        />
      </main>

      {/* Modale Vidéo sécurisée */}
      {selectedVideoModal && (
        <SecureVideoModal
          videoUrl={selectedVideoModal.video_url}
          title={selectedVideoModal.titre}
          onClose={closeVideo}
        />
      )}

      {/* Visionneuse PDF native (<dialog closedby="any">) avec switcher multi-documents */}
      {pdfModalData && (
        <PdfPreviewModal
          title={pdfModalData.title}
          url={pdfModalData.url}
          docs={pdfModalData.docs}
          initialIndex={pdfModalData.initialIndex || 0}
          onClose={closePdf}
        />
      )}

      {/* Barrière d'accès membre */}
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

export default Courses;
