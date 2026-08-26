import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCoursesSync } from "../hooks/useCoursesSync.js";
import SecureVideoModal from "../components/SecureVideoModal.jsx";
import {
  getDriveImageUrls,
  extractDriveFileId,
  getYoutubeThumbnail,
  getEmbedUrl,
  getDownloadUrl,
  getDrivePreviewUrl,
  getDriveDownloadUrl
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
  Zap,
  Download,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Target,
  Trophy,
  Award,
  ChevronDown,
  X,
  RefreshCw
} from "../components/Icon.jsx";

const CATEGORIES = [
  { id: "all", label: "Tous les chapitres" },
  { id: "algebre", label: "Algèbre" },
  { id: "analyse", label: "Analyse" },
  { id: "geometrie", label: "Géométrie" },
  { id: "probabilites", label: "Probabilités" },
  { id: "proba", label: "Probabilités" },
];

const LEATHER_PALETTES = [
  ["#1e293b", "#0f172a"],
  ["#451a03", "#290d02"],
  ["#14532d", "#052e16"],
  ["#4c0519", "#27020d"],
  ["#311042", "#190624"],
  ["#164e63", "#082f49"],
];

function getLeatherPalette(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return LEATHER_PALETTES[hash % LEATHER_PALETTES.length];
}

function CourseBookCard({ livre, onOpenPdf }) {
  const { titre, auteur, lien, cover } = livre;
  const hasLink = Boolean(lien && lien.trim() !== "");

  const srcs = useMemo(() => {
    if (cover) return getDriveImageUrls(cover);
    if (lien && extractDriveFileId(lien)) return getDriveImageUrls(lien);
    return [];
  }, [cover, lien]);

  const [imgIdx, setImgIdx] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  const handleImgError = () => {
    if (imgIdx + 1 < srcs.length) {
      setImgIdx((prev) => prev + 1);
    } else {
      setImgFailed(true);
    }
  };

  const palette = useMemo(() => getLeatherPalette(titre), [titre]);

  const handleClick = () => {
    if (!hasLink) return;
    onOpenPdf(lien, `${titre} ${auteur ? `— ${auteur}` : ""}`);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: "100%",
        maxWidth: 165,
        cursor: hasLink ? "pointer" : "default",
        userSelect: "none",
      }}
      className="book-card"
    >
      {/* 3D Book Cover Container */}
      <div
        className="livre-cover-container"
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1.45",
          borderRadius: "3px 8px 8px 3px",
          overflow: "hidden",
          background: "var(--surface-2)",
          boxShadow: "0 8px 20px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.12)",
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
        }}
      >
        {/* Leather Spine Gradient */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 9,
            zIndex: 3,
            background: "linear-gradient(90deg, rgba(0,0,0,0.35), rgba(0,0,0,0.02))",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 9,
            top: 0,
            bottom: 0,
            width: 1.5,
            zIndex: 3,
            background: "rgba(200, 165, 106, 0.6)",
          }}
        />

        {/* Fallback Leather Typography Cover */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "22px 12px 14px 18px",
            background: `linear-gradient(150deg, ${palette[0]}, ${palette[1]})`,
            color: "#f8fafc",
          }}
        >
          <div
            style={{
              width: 24,
              height: 2,
              background: "rgba(217, 161, 58, 0.75)",
              margin: "6px 0 10px",
            }}
          />
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              lineHeight: 1.3,
              fontFamily: "'Outfit', serif",
              wordBreak: "break-word",
            }}
          >
            {titre}
          </div>
          {auteur && (
            <div
              style={{
                marginTop: "auto",
                fontSize: "0.68rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                opacity: 0.85,
              }}
            >
              {auteur}
            </div>
          )}
        </div>

        {/* Real Cover Image (Drive Thumbnail) */}
        {!imgFailed && srcs.length > 0 && (
          <img
            src={srcs[imgIdx]}
            alt={titre}
            referrerPolicy="no-referrer"
            onError={handleImgError}
            loading="lazy"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 2,
            }}
          />
        )}

        {/* Ribbon badge if upcoming */}
        {!hasLink && (
          <span
            style={{
              position: "absolute",
              top: 10,
              right: -2,
              zIndex: 5,
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "white",
              background: "#b45309",
              padding: "2px 8px",
              borderRadius: "3px 0 0 3px",
            }}
          >
            Bientôt
          </span>
        )}

        {/* Hover Eye Overlay */}
        {hasLink && (
          <div
            className="livre-loupe"
            style={{
              position: "absolute",
              zIndex: 4,
              right: 8,
              bottom: 8,
              width: 30,
              height: 30,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              fontSize: "0.9rem",
              background: "rgba(0,0,0,0.7)",
              color: "white",
            }}
          >
            👁
          </div>
        )}
      </div>

      {/* Book Metadata Under Cover */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 2px" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text)", lineHeight: 1.35 }}>
          {titre}
        </div>
        {auteur && (
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {auteur}
          </div>
        )}
      </div>
    </div>
  );
}

function isUrlActive(u) {
  return typeof u === "string" && u.trim() !== "";
}

function normalizeLinks(champ) {
  if (!champ) return [];
  if (typeof champ === "string") return [{ url: champ, label: "" }];
  if (Array.isArray(champ)) {
    return champ.map((x) => {
      if (typeof x === "string") return { url: x, label: "" };
      return { url: (x && (x.url || x.u || x.exo || x.pdf || x.v)) || "", label: (x && (x.label || x.t)) || "" };
    });
  }
  return [];
}

function CourseFicheCard({ fiche, chapTitre, onOpenPdf }) {
  const url = fiche.url || fiche.u || (typeof fiche === "string" ? fiche : "");
  const titre = fiche.label || fiche.titre || fiche.t || "Fiche de synthèse";
  const sous = fiche.sous || "L'essentiel du chapitre";
  const isActif = isUrlActive(url);
  const targetCover = fiche.cover || url;
  const srcs = useMemo(() => getDriveImageUrls(targetCover), [targetCover]);
  const [imgIdx, setImgIdx] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  const handleImgError = () => {
    if (imgIdx + 1 < srcs.length) setImgIdx((p) => p + 1);
    else setImgFailed(true);
  };

  return (
    <article className={`doc-card ${isActif ? "" : "soon"}`}>
      <div
        className="doc-thumb"
        onClick={() => isActif && onOpenPdf(url, `${titre} — ${chapTitre}`)}
        role={isActif ? "button" : undefined}
      >
        <span className="gen" style={{ background: "linear-gradient(150deg, #6d4a72, #3a2440)" }}>
          <span className="gen-k">Résumé</span>
          <span className="gen-orn" />
          <span className="gen-t">{titre}</span>
        </span>
        {srcs.length > 0 && !imgFailed && (
          <img
            className="doc-img"
            src={srcs[imgIdx]}
            alt={titre}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            loading="lazy"
            onError={handleImgError}
          />
        )}
        {isActif && <span className="doc-loupe">👁</span>}
      </div>
      <div className="doc-info">
        <span className="doc-t">{titre}</span>
        {sous && <span className="doc-d">{sous}</span>}
      </div>
    </article>
  );
}

function CourseSessionCard({ seance, index, chapTitre, onOpenPdf, onOpenVideo }) {
  const titre = seance.titre || seance.t || `Séance ${index + 1}`;
  const sous = seance.sous || "Théorie & Replay interactif";
  const videoUrl = seance.video || seance.v || seance.vid || "";
  const supportUrl = seance.support || seance.u || seance.pdf || "";

  const thumbUrl = getYoutubeThumbnail(videoUrl) || "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80";

  return (
    <article className="session-card">
      {isUrlActive(videoUrl) ? (
        <div
          className="session-thumb-wrap"
          onClick={() => onOpenVideo(videoUrl, `${titre} — ${chapTitre}`)}
        >
          <img className="session-thumb-img" src={thumbUrl} alt={titre} loading="lazy" />
          <div className="session-lock-ov">
            <span className="session-lock-badge">▶️ Replay Vidéo</span>
            <div className="session-play-btn">▶</div>
          </div>
        </div>
      ) : null}
      <div className="session-info">
        <span className="session-t">{titre}</span>
        {sous && <span className="session-d">{sous}</span>}
        <div className="session-actions">
          {isUrlActive(supportUrl) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenPdf(supportUrl, `Support : ${titre} — ${chapTitre}`)}
              style={{
                background: "var(--tss-btn-fiche-bg, #eef5ff)",
                color: "var(--tss-btn-fiche-color, #1a4f8c)",
                borderColor: "var(--tss-btn-fiche-border, rgba(26,79,140,.2))",
              }}
            >
              📄 Support PDF
            </button>
          )}
          {isUrlActive(videoUrl) && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onOpenVideo(videoUrl, `${titre} — ${chapTitre}`)}
              style={{
                background: "linear-gradient(135deg, #c4302b, #9e201b)",
                borderColor: "transparent",
                color: "#fff",
              }}
            >
              ▶️ Regarder
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function CourseExerciseLine({ item, index, chapTitre, onOpenPdf, onOpenVideo }) {
  const titre = item.titre || item.t || `Exercice ${index + 1}`;
  const sous = item.sous || "";
  const enonceUrl = item.enonce || item.exo || item.u || "";
  const corrUrl = item.correction || item.corr || "";
  const videoUrl = item.video || item.v || "";

  return (
    <div className="doc-line">
      <span className="doc-line-ic" aria-hidden="true">📝</span>
      <div className="doc-line-txt">
        <span className="doc-line-t">
          <span style={{ color: "var(--primary)", fontWeight: 700, marginRight: 6 }}>
            #{index + 1}
          </span>
          {titre}
        </span>
        {sous && <span className="doc-line-d">{sous}</span>}
      </div>
      <div className="doc-line-b">
        {isUrlActive(enonceUrl) && (
          <button
            onClick={() => onOpenPdf(enonceUrl, `Énoncé : ${titre} — ${chapTitre}`)}
            className="btn btn-secondary btn-sm"
            style={{
              background: "var(--tss-btn-enonce-bg, #f4efff)",
              color: "var(--tss-btn-enonce-color, #5b3ca8)",
              borderColor: "var(--tss-btn-enonce-border, rgba(91,60,168,.2))",
            }}
          >
            <FileText size={13} />
            <span>Énoncé</span>
          </button>
        )}
        {isUrlActive(corrUrl) && (
          <button
            onClick={() => onOpenPdf(corrUrl, `Correction : ${titre} — ${chapTitre}`)}
            className="btn btn-secondary btn-sm"
            style={{
              background: "var(--tss-btn-corr-bg, #ebfaf5)",
              color: "var(--tss-btn-corr-color, #0f7a56)",
              borderColor: "var(--tss-btn-corr-border, rgba(15,122,86,.2))",
              fontWeight: 600,
            }}
          >
            <CheckCircle size={13} />
            <span>Correction</span>
          </button>
        )}
        {isUrlActive(videoUrl) && (
          <button
            onClick={() => onOpenVideo(videoUrl, `Vidéo : ${titre} — ${chapTitre}`)}
            className="btn btn-primary btn-sm"
            style={{
              background: "linear-gradient(135deg, #c4302b, #9e201b)",
              borderColor: "transparent",
              color: "#fff",
            }}
          >
            <PlayCircle size={13} />
            <span>Vidéo</span>
          </button>
        )}
      </div>
    </div>
  );
}

function Courses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dynamic live synchronization from WordPress
  const { curriculum, isSyncing, isLive, lastSynced, refreshSync } = useCoursesSync();

  // Selected Year: "annee1" (Sup) or "annee2" (Spé)
  const initialYear = searchParams.get("annee") === "2" ? "annee2" : "annee1";
  const [selectedYear, setSelectedYear] = useState(initialYear);

  // Selected Branch (filière)
  const yearData = curriculum[selectedYear] || curriculum.annee1 || { branches: [] };
  const defaultBranch = yearData.branches[0]?.id || "tsi1";
  const initialBranch = searchParams.get("branche") || searchParams.get("fil") || defaultBranch;
  const [selectedBranch, setSelectedBranch] = useState(initialBranch);

  const [activeCat, setActiveCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openChapterIds, setOpenChapterIds] = useState(new Set(["mp-4", "mpsi-1", "tsi1-1"]));
  const [selectedVideoModal, setSelectedVideoModal] = useState(null);
  const [pdfModalData, setPdfModalData] = useState(null);

  // Deep linking from WordPress / Login: ?annee=2&branche=mp&video=...&title=... or ?pdf=...
  useEffect(() => {
    const anneeParam = searchParams.get("annee");
    if (anneeParam === "2") setSelectedYear("annee2");
    else if (anneeParam === "1") setSelectedYear("annee1");

    const branchParam = searchParams.get("branche") || searchParams.get("fil");
    if (branchParam) {
      const yearKey = anneeParam === "2" ? "annee2" : (anneeParam === "1" ? "annee1" : selectedYear);
      const branches = curriculum[yearKey]?.branches || [];
      const match = branches.find(
        (b) =>
          b.id.toLowerCase() === branchParam.toLowerCase() ||
          b.nom.toLowerCase() === branchParam.toLowerCase()
      );
      if (match) {
        setSelectedBranch(match.id);
      }
    }

    const videoUrlParam = searchParams.get("video");
    const pdfUrlParam = searchParams.get("pdf") || searchParams.get("corr");
    const titleParam = searchParams.get("title");

    if (videoUrlParam) {
      setSelectedVideoModal({
        titre: titleParam || "Séance de cours (Replay)",
        video_url: videoUrlParam,
      });
    } else if (pdfUrlParam) {
      setPdfModalData({
        title: titleParam || "Document / Correction",
        url: pdfUrlParam,
      });
    }
  }, [searchParams, curriculum]);

  // If year changes, ensure valid branch
  useEffect(() => {
    const branches = curriculum[selectedYear]?.branches || [];
    const valid = branches.some((b) => b.id === selectedBranch);
    if (!valid && branches.length > 0) {
      setSelectedBranch(branches[0].id);
    }
  }, [selectedYear, selectedBranch, curriculum]);

  // Sync URL query params
  useEffect(() => {
    const anneeParam = selectedYear === "annee2" ? "2" : "1";
    const currentParams = Object.fromEntries(searchParams.entries());
    setSearchParams(
      { ...currentParams, annee: anneeParam, branche: selectedBranch },
      { replace: true }
    );
  }, [selectedYear, selectedBranch, setSearchParams]);

  // Current branch object
  const currentBranch = useMemo(() => {
    const branches = curriculum[selectedYear]?.branches || [];
    return branches.find((b) => b.id === selectedBranch) || branches[0] || { chapitres: [] };
  }, [selectedYear, selectedBranch, curriculum]);

  // Filtered chapters
  const filteredChapters = useMemo(() => {
    const list = currentBranch.chapitres || [];
    return list.filter((c) => {
      const matchesCat =
        activeCat === "all" ||
        c.cat === activeCat ||
        (activeCat === "proba" && c.cat === "probabilites") ||
        (activeCat === "probabilites" && c.cat === "proba");
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.titre.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        String(c.n).includes(q);
      return matchesCat && matchesSearch;
    });
  }, [currentBranch, activeCat, searchQuery]);

  // Handle deep-linking from search or external Elementor link
  useEffect(() => {
    const videoParam = searchParams.get("video");
    const pdfParam = searchParams.get("pdf") || searchParams.get("corr");
    const titleParam = searchParams.get("title");

    if (videoParam) {
      setSelectedVideoModal({
        titre: titleParam || "Explication vidéo",
        video_url: videoParam,
      });
    } else if (pdfParam) {
      setPdfModalData({
        url: pdfParam,
        title: titleParam || "Document pédagogique",
      });
    }
  }, [searchParams]);

  const toggleChapterAccordion = (chapId) => {
    setOpenChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapId)) next.delete(chapId);
      else next.add(chapId);
      return next;
    });
  };

  const openVideo = (url, titre) => {
    if (!url) return;
    setSelectedVideoModal({
      video_url: url,
      titre: titre || "Vidéo d'explication",
    });
  };

  const openPdf = (url, title) => {
    if (!url) return;
    setPdfModalData({ url, title });
  };

  return (
    <div className="page" style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 18px 80px" }}>
      {/* ── Breadcrumb & Back ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button className="btn btn-secondary" onClick={() => navigate("/")} style={{ borderRadius: 12 }}>
          <ArrowLeft size={16} /> Retour au portail
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.88rem", color: "var(--text-muted)" }}>
          <Link to="/" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
            Accueil
          </Link>
          <ChevronRight size={14} />
          <span style={{ fontWeight: 600, color: "var(--text)" }}>
            CPGE {selectedYear === "annee1" ? "1ère Année (Sup)" : "2ème Année (Spé)"}
          </span>
          <ChevronRight size={14} />
          <span style={{ fontWeight: 700, color: "var(--primary)" }}>
            {currentBranch.nom}
          </span>
        </div>
      </div>

      {/* ── Main Banner ── */}
      <div
        className="card fade-up"
        style={{
          background: "linear-gradient(135deg, rgba(67, 97, 238, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)",
          border: "1px solid rgba(67, 97, 238, 0.18)",
          borderRadius: 20,
          padding: "32px 28px",
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "var(--surface)",
                  padding: "4px 14px",
                  borderRadius: 99,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                  border: "1px solid var(--border)",
                }}
              >
                <Sparkles size={14} /> PROGRAMME MATHÉMATIQUES CPGE • ESPACE MEMBRE ACTIF
              </div>

              {isLive && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#059669",
                    padding: "4px 12px",
                    borderRadius: 99,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                  title={lastSynced ? `Dernière synchronisation : ${new Date(lastSynced).toLocaleTimeString()}` : "Données synchronisées"}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                  Synchronisé avec WordPress
                </div>
              )}

              <button
                onClick={() => refreshSync()}
                disabled={isSyncing}
                title="Recharger les données depuis WordPress"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 99,
                  padding: "4px 10px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  cursor: isSyncing ? "wait" : "pointer",
                }}
              >
                <RefreshCw size={12} className={isSyncing ? "spin-animate" : ""} />
                {isSyncing ? "Synchronisation..." : "Actualiser"}
              </button>
            </div>
            <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)", fontWeight: 800, margin: "0 0 8px" }}>
              {yearData.titre}
            </h1>
            <p style={{ maxWidth: 720, color: "var(--text-muted)", fontSize: "0.98rem", lineHeight: 1.6 }}>
              {yearData.description}
            </p>
          </div>

          {/* Année Switcher Buttons */}
          <div
            style={{
              display: "flex",
              background: "var(--surface)",
              padding: 4,
              borderRadius: 14,
              border: "1px solid var(--border)",
              gap: 4,
            }}
          >
            <button
              onClick={() => setSelectedYear("annee1")}
              className={`btn btn-sm ${selectedYear === "annee1" ? "btn-primary" : "btn-secondary"}`}
              style={{ borderRadius: 10, padding: "8px 16px", fontWeight: 700 }}
            >
              1ère Année (Sup)
            </button>
            <button
              onClick={() => setSelectedYear("annee2")}
              className={`btn btn-sm ${selectedYear === "annee2" ? "btn-primary" : "btn-secondary"}`}
              style={{ borderRadius: 10, padding: "8px 16px", fontWeight: 700 }}
            >
              2ème Année (Spé)
            </button>
          </div>
        </div>

        {/* ── Filières / Branches Pills ── */}
        <div style={{ marginTop: 24, borderTop: "1px solid rgba(67, 97, 238, 0.14)", paddingTop: 20 }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 10 }}>
            Sélectionnez votre filière :
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {yearData.branches.map((br) => {
              const isSelected = br.id === selectedBranch;
              return (
                <button
                  key={br.id}
                  onClick={() => setSelectedBranch(br.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 18px",
                    borderRadius: 14,
                    border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                    background: isSelected ? "var(--primary)" : "var(--surface)",
                    color: isSelected ? "white" : "var(--text)",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: isSelected ? "0 4px 14px rgba(67, 97, 238, 0.3)" : "none",
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      display: "grid",
                      placeItems: "center",
                      fontSize: "0.9rem",
                      background: isSelected ? "rgba(255,255,255,0.25)" : "var(--surface-2)",
                      color: isSelected ? "white" : "var(--primary)",
                    }}
                  >
                    {br.icon || "•"}
                  </span>
                  <span>{br.nom}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          borderRadius: 16,
          marginBottom: 24,
          border: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          {/* Categories */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`btn btn-sm ${activeCat === cat.id ? "btn-primary" : "btn-secondary"}`}
                style={{ borderRadius: 20, padding: "6px 14px", fontSize: "0.82rem" }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div style={{ position: "relative", minWidth: 260, flex: "1 1 260px", maxWidth: 400 }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Rechercher un chapitre, concept, fiche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 14px 8px 36px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--bg-subtle, #f8fafc)",
                fontSize: "0.88rem",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Chapters List ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filteredChapters.map((chapter) => {
          const hasMultiDocs =
            (chapter.cours && chapter.cours.length > 0) ||
            (chapter.fiches && chapter.fiches.length > 0) ||
            (chapter.tds && chapter.tds.length > 0) ||
            (chapter.videos && chapter.videos.length > 0);

          const isOpen = openChapterIds.has(chapter.id);

          const hasVideo = !!chapter.video_url || (chapter.videos && chapter.videos.length > 0);
          const hasCorrection = !!chapter.correction_url;
          const hasEnonce = !!chapter.enonce_url;
          const hasFiche = !!chapter.fiche_url;
          const hasQuiz = !!chapter.quiz_id;

          return (
            <div
              key={chapter.id}
              className="card chapter-card fade-up"
              style={{
                padding: 0,
                borderRadius: 16,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                overflow: "hidden",
                boxShadow: isOpen ? "0 4px 18px rgba(0,0,0,0.06)" : "0 1px 4px rgba(0,0,0,0.02)",
              }}
            >
              {/* Card Header (Accordion toggle if multi docs, or single line) */}
              <div
                onClick={() => hasMultiDocs && toggleChapterAccordion(chapter.id)}
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  padding: "20px 22px",
                  cursor: hasMultiDocs ? "pointer" : "default",
                  userSelect: "none",
                }}
              >
                {/* Chapter Number Badge */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: isOpen ? "var(--primary)" : "rgba(67, 97, 238, 0.1)",
                    color: isOpen ? "white" : "var(--primary)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    fontSize: "1.15rem",
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                  }}
                >
                  {chapter.n}
                </div>

                {/* Chapter Info */}
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span className="badge badge-primary">{chapter.badge || "Chapitre"}</span>
                    {hasVideo && (
                      <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Video size={11} /> Vidéos & Replays
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "2px 0 4px", color: "var(--text)" }}>
                    {chapter.titre}
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.45, margin: 0 }}>
                    {chapter.description}
                  </p>
                </div>

                {/* Simple Single Chapter Action Buttons (when no sub-lists) */}
                {!hasMultiDocs && (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {hasFiche && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openPdf(chapter.fiche_url, `Fiche : ${chapter.titre}`)}
                        style={{ borderRadius: 10, background: "#eef5ff", color: "#1a4f8c", borderColor: "rgba(26,79,140,.2)" }}
                      >
                        <BookOpen size={14} /> Fiche résumé
                      </button>
                    )}
                    {hasEnonce && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openPdf(chapter.enonce_url, `Énoncé : ${chapter.titre}`)}
                        style={{ borderRadius: 10, background: "#f4efff", color: "#5b3ca8", borderColor: "rgba(91,60,168,.2)" }}
                      >
                        <FileText size={14} /> Énoncé
                      </button>
                    )}
                    {hasCorrection && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openPdf(chapter.correction_url, `Correction : ${chapter.titre}`)}
                        style={{ borderRadius: 10, background: "#ebfaf5", color: "#0f7a56", borderColor: "rgba(15,122,86,.25)", fontWeight: 700 }}
                      >
                        <CheckCircle size={14} /> Correction PDF
                      </button>
                    )}
                    {hasVideo && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openVideo(chapter.video_url, chapter.titre)}
                        style={{ borderRadius: 10, background: "#c4302b", borderColor: "#c4302b", color: "white", fontWeight: 700 }}
                      >
                        <PlayCircle size={14} /> Vidéo
                      </button>
                    )}
                  </div>
                )}

                {/* Chevron for Multi-Document Chapters */}
                {hasMultiDocs && (
                  <div style={{ color: "var(--text-muted)", transition: "transform 0.25s ease", transform: isOpen ? "rotate(180deg)" : "none" }}>
                    <ChevronDown size={20} />
                  </div>
                )}
              </div>

              {/* Multi-Document Accordion Body */}
              {hasMultiDocs && isOpen && (
                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    padding: "20px 22px 26px",
                  }}
                >
                  {(() => {
                    const seances = (chapter.cours || chapter.sessions || chapter.videos || []).map((s, idx) => ({
                      titre: s.t || s.titre || `Séance ${idx + 1}`,
                      sous: s.sous || "Théorie & Replay interactif",
                      video: s.v || s.video || s.vid || "",
                      support: s.u || s.support || s.pdf || "",
                    }));

                    let fiches = chapter.fiches || [];
                    if (fiches.length === 0 && (chapter.fiche_resume_url || chapter.fiche)) {
                      fiches = normalizeLinks(chapter.fiche_resume_url || chapter.fiche).map((l) => ({
                        t: l.label || "Fiche de synthèse",
                        u: l.url,
                        sous: "L'essentiel du chapitre",
                      }));
                    }

                    const tds = chapter.tds || chapter.items || [];

                    const hasMain = seances.length > 0 || tds.length > 0;
                    const hasSide = fiches.length > 0;

                    if (!hasMain && !hasSide) {
                      return (
                        <div style={{ color: "var(--text-muted)", fontSize: "0.88rem", fontStyle: "italic" }}>
                          Contenu pédagogique en cours de finalisation.
                        </div>
                      );
                    }

                    return (
                      <div className={`ch-grid ${hasMain && hasSide ? "" : "solo"}`}>
                        {/* Colonne Gauche : Séances + TDs */}
                        {hasMain && (
                          <div className="ch-main">
                            {seances.length > 0 && (
                              <section className="doc-sec">
                                <div className="doc-sec-t">
                                  <i>🎬</i>
                                  <b>Séances à distance & Replays</b>
                                  <span className="doc-sec-n">{seances.length}</span>
                                  <s />
                                </div>
                                <div className="session-grid">
                                  {seances.map((se, sIdx) => (
                                    <CourseSessionCard
                                      key={sIdx}
                                      seance={se}
                                      index={sIdx}
                                      chapTitre={chapter.titre}
                                      onOpenPdf={openPdf}
                                      onOpenVideo={openVideo}
                                    />
                                  ))}
                                </div>
                              </section>
                            )}

                            {tds.length > 0 && (
                              <section className="doc-sec">
                                <div className="doc-sec-t">
                                  <i>📝</i>
                                  <b>S'entraîner (Fiches d'exercices & Annales)</b>
                                  <span className="doc-sec-n">{tds.length}</span>
                                  <s />
                                </div>
                                <div className="doc-list">
                                  {tds.map((td, tIdx) => (
                                    <CourseExerciseLine
                                      key={tIdx}
                                      item={td}
                                      index={tIdx}
                                      chapTitre={chapter.titre}
                                      onOpenPdf={openPdf}
                                      onOpenVideo={openVideo}
                                    />
                                  ))}
                                </div>
                              </section>
                            )}
                          </div>
                        )}

                        {/* Colonne Droite : Fiches de synthèse */}
                        {hasSide && (
                          <aside className="ch-side">
                            <section className="doc-sec">
                              <div className="doc-sec-t">
                                <i>📑</i>
                                <b>Fiches de synthèse</b>
                                <span className="doc-sec-n">{fiches.length}</span>
                                <s />
                              </div>
                              <div className="doc-grid">
                                {fiches.map((f, fIdx) => (
                                  <CourseFicheCard
                                    key={fIdx}
                                    fiche={f}
                                    chapTitre={chapter.titre}
                                    onOpenPdf={openPdf}
                                  />
                                ))}
                              </div>
                            </section>
                          </aside>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}

        {filteredChapters.length === 0 && (
          <div className="empty-state" style={{ padding: "48px 16px", textAlign: "center" }}>
            <Search size={38} className="empty-state-icon" style={{ color: "var(--text-faint)" }} />
            <h3>Aucun chapitre trouvé</h3>
            <p>Aucun module ne correspond à vos filtres actuels.</p>
          </div>
        )}
      </div>

      {/* ── Bibliothèque de Référence (Books Shelf) ── */}
      {currentBranch.livres && currentBranch.livres.length > 0 && (
        <div
          className="card fade-up"
          style={{
            marginTop: 48,
            borderRadius: 20,
            padding: "36px 28px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 14px",
                borderRadius: 99,
                background: "rgba(217, 161, 58, 0.12)",
                color: "#b57809",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: 10,
              }}
            >
              <BookOpen size={14} /> Bibliothèque CPGE · {currentBranch.nom}
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 6px", color: "var(--text)" }}>
              Les ouvrages de référence conseillés en {currentBranch.nom}
            </h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.92rem" }}>
              Cliquez sur un ouvrage pour le consulter et le télécharger directement en PDF.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "28px 20px",
              justifyItems: "center",
            }}
          >
            {currentBranch.livres.map((livre, lIdx) => (
              <CourseBookCard key={lIdx} livre={livre} onOpenPdf={openPdf} />
            ))}
          </div>
        </div>
      )}

      {/* ── Secure Video Modal ── */}
      {selectedVideoModal && (
        <SecureVideoModal
          videoUrl={selectedVideoModal.video_url}
          title={selectedVideoModal.titre}
          onClose={() => setSelectedVideoModal(null)}
        />
      )}

      {/* ── PDF Preview Modal ── */}
      {pdfModalData && (
        <div className="modal-backdrop" onMouseDown={() => setPdfModalData(null)} style={{ zIndex: 1000 }}>
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
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>
                {pdfModalData.title}
              </h3>
              <div className="document-preview-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <a
                  className="btn btn-secondary btn-sm"
                  href={getDownloadUrl(pdfModalData.url)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Download size={14} /> Télécharger
                </a>
                <button
                  className="management-modal-close"
                  onClick={() => setPdfModalData(null)}
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
                title={pdfModalData.title}
                src={getEmbedUrl(pdfModalData.url, "pdf")}
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="fullscreen"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses;
