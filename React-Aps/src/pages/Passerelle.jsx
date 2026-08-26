import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { usePasserelleSync } from "../hooks/usePasserelleSync.js";
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
  Download,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  X,
  ChevronDown,
  ArrowLeft,
  ChevronRight,
  RefreshCw
} from "../components/Icon.jsx";

// Helper to normalize and check links
function isUrlActive(u) {
  return typeof u === "string" && u.trim() !== "";
}

function normalizeLinks(champ) {
  if (!champ) return [];
  if (typeof champ === "string") return [{ url: champ, label: "" }];
  if (Array.isArray(champ)) {
    return champ.map((x) => {
      if (typeof x === "string") return { url: x, label: "" };
      return { url: (x && x.url) || "", label: (x && x.label) || "" };
    });
  }
  return [];
}

// ── Palettes de reliure cuir pour livres générés ──
const COUV_COULEURS = [
  ["#22324f", "#16233c"],
  ["#5f2e2e", "#43201f"],
  ["#3c4d38", "#293524"],
  ["#5b4526", "#3f2f18"],
  ["#43384f", "#2d2536"],
  ["#2b4c4f", "#1c3335"]
];

function hashString(s) {
  let h = 0;
  const str = String(s || "");
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function couvCouleurs(titre) {
  return COUV_COULEURS[hashString(titre) % COUV_COULEURS.length];
}

function BookCard({ livre, onOpenPdf }) {
  const titre = livre.titre || "Ouvrage de référence";
  const auteur = livre.auteur || "";
  const hasLink = isUrlActive(livre.lien);
  const targetCover = livre.cover || (livre.lien && livre.lien.includes("drive.google.com") ? livre.lien : null);
  const srcs = useMemo(() => getDriveImageUrls(targetCover), [targetCover]);
  const [imgIdx, setImgIdx] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  const colors = useMemo(() => couvCouleurs(titre), [titre]);

  const handleImgError = () => {
    if (imgIdx + 1 < srcs.length) {
      setImgIdx((prev) => prev + 1);
    } else {
      setImgFailed(true);
    }
  };

  return (
    <div
      className="livre-item"
      onClick={() => hasLink && onOpenPdf(livre.lien, `${titre}${auteur ? ` — ${auteur}` : ""}`)}
      style={{
        cursor: hasLink ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 12,
        width: "100%",
        maxWidth: 172,
        margin: "0 auto",
      }}
    >
      {/* 3D Book Cover */}
      <div
        className="livre-cover-wrap"
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1.46",
          borderRadius: "3px 10px 10px 3px",
          overflow: "hidden",
          background: "#f1e9d8",
          boxShadow: "0 10px 24px rgba(43,29,8,.18), 0 2px 6px rgba(43,29,8,.12)",
          transition: "transform 0.28s ease, box-shadow 0.28s ease",
        }}
      >
        {/* Book Spine shadow */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 10,
            zIndex: 3,
            background: "linear-gradient(90deg, rgba(0,0,0,.35), rgba(0,0,0,.02))",
            pointerEvents: "none",
          }}
        />
        {/* Book Spine gold thread */}
        <div
          style={{
            position: "absolute",
            left: 10,
            top: 0,
            bottom: 0,
            width: 1.5,
            zIndex: 3,
            background: "rgba(217,161,58,.6)",
            pointerEvents: "none",
          }}
        />

        {/* Fallback / Background Leather Cover */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "24px 14px 16px 20px",
            textAlign: "center",
            color: "#f6efe0",
            background: `linear-gradient(150deg, ${colors[0]}, ${colors[1]})`,
          }}
        >
          <div
            style={{
              width: 28,
              height: 2,
              background: "rgba(246,239,224,.7)",
              marginBottom: 12,
              flexShrink: 0,
            }}
          />
          <div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.02rem",
              fontWeight: 700,
              lineHeight: 1.25,
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

        {/* Real Book Cover Image (Drive / Thumbnail) */}
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
              background: "#7c4f04",
              padding: "2px 8px",
              borderRadius: "3px 0 0 3px",
              boxShadow: "0 2px 6px rgba(43,29,8,.3)",
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
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              fontSize: "0.95rem",
              background: "rgba(43,29,8,.75)",
              color: "white",
            }}
          >
            👁
          </div>
        )}
      </div>

      {/* Book Metadata Under Cover */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "0 4px" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--tss-encre)", lineHeight: 1.35 }}>
          {titre}
        </div>
        {auteur && (
          <div style={{ fontSize: "0.75rem", color: "var(--tss-encre-douce)" }}>
            {auteur}
          </div>
        )}
      </div>
    </div>
  );
}

function FicheCard({ fiche, chapTitre, onOpenPdf }) {
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

function SessionVideoCard({ seance, index, chapTitre, onOpenPdf, onOpenVideo }) {
  const titre = seance.titre || `Séance ${index + 1}`;
  const sous = seance.sous || "Théorie & Replay interactif";
  const videoLinks = normalizeLinks(seance.video);
  const premierLienVideo = videoLinks.length > 0 ? videoLinks[0].url : "";
  const supportLinks = normalizeLinks(seance.support);
  const premierLienSupport = supportLinks.length > 0 ? supportLinks[0].url : "";

  const thumbUrl = getYoutubeThumbnail(premierLienVideo) || "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80";

  return (
    <article className="session-card">
      {premierLienVideo ? (
        <div
          className="session-thumb-wrap"
          onClick={() => onOpenVideo(premierLienVideo, `${titre} — ${chapTitre}`)}
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
          {isUrlActive(premierLienSupport) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenPdf(premierLienSupport, `Support : ${titre} — ${chapTitre}`)}
              style={{
                background: "var(--tss-btn-fiche-bg)",
                color: "var(--tss-btn-fiche-color)",
                borderColor: "var(--tss-btn-fiche-border)",
              }}
            >
              📄 Support PDF
            </button>
          )}
          {isUrlActive(premierLienVideo) && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onOpenVideo(premierLienVideo, `${titre} — ${chapTitre}`)}
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

function ExerciseDocLine({ item, index, chapTitre, onOpenPdf, onOpenVideo }) {
  const enonces = normalizeLinks(item.enonce);
  const corrections = normalizeLinks(item.correction);
  const videos = normalizeLinks(item.video);

  return (
    <div className="doc-line">
      <span className="doc-line-ic" aria-hidden="true">📝</span>
      <div className="doc-line-txt">
        <span className="doc-line-t">
          <span style={{ color: "var(--primary)", fontWeight: 700, marginRight: 6 }}>
            #{index + 1}
          </span>
          {item.titre}
        </span>
        {item.sous && <span className="doc-line-d">{item.sous}</span>}
      </div>
      <div className="doc-line-b">
        {/* Énoncés */}
        {enonces.map((en, enIdx) =>
          isUrlActive(en.url) ? (
            <button
              key={enIdx}
              onClick={() => onOpenPdf(en.url, `Énoncé : ${item.titre}`)}
              className="btn btn-secondary btn-sm"
              style={{
                background: "var(--tss-btn-enonce-bg)",
                color: "var(--tss-btn-enonce-color)",
                borderColor: "var(--tss-btn-enonce-border)",
              }}
            >
              <FileText size={13} />
              <span>Énoncé {en.label ? `(${en.label})` : ""}</span>
            </button>
          ) : null
        )}

        {/* Corrections */}
        {corrections.map((co, coIdx) =>
          isUrlActive(co.url) ? (
            <button
              key={coIdx}
              onClick={() => onOpenPdf(co.url, `Correction : ${item.titre}`)}
              className="btn btn-secondary btn-sm"
              style={{
                background: "var(--tss-btn-corr-bg)",
                color: "var(--tss-btn-corr-color)",
                borderColor: "var(--tss-btn-corr-border)",
              }}
            >
              <CheckCircle size={13} />
              <span>Correction {co.label ? `· ${co.label}` : ""}</span>
            </button>
          ) : null
        )}

        {/* Vidéos */}
        {videos.map((vi, viIdx) =>
          isUrlActive(vi.url) ? (
            <button
              key={viIdx}
              onClick={() => onOpenVideo(vi.url, `${item.titre} ${vi.label ? `(${vi.label})` : ""}`)}
              className="btn btn-primary btn-sm"
              style={{
                background: "linear-gradient(135deg, #c4302b, #9e201b)",
                borderColor: "transparent",
                color: "#fff",
              }}
            >
              <PlayCircle size={13} />
              <span>Vidéo {vi.label ? `(${vi.label})` : ""}</span>
            </button>
          ) : null
        )}
      </div>
    </div>
  );
}

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
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>
            {title}
          </h3>
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

function Passerelle() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dynamic real-time synchronization from WordPress
  const { passerelleData, isSyncing, isLive, lastSynced, refreshSync } = usePasserelleSync();

  const [activeFiliereId, setActiveFiliereId] = useState("mp");
  const [openChapterIds, setOpenChapterIds] = useState(new Set(["mp-alg-lin", "ecs-alg-lin"]));
  const [searchQuery, setSearchQuery] = useState("");

  const [videoModalData, setVideoModalData] = useState(null);
  const [pdfModalData, setPdfModalData] = useState(null);

  const filiere = useMemo(() => {
    return (
      (passerelleData.filieres || []).find((f) => f.id === activeFiliereId) ||
      (passerelleData.filieres || [])[0]
    );
  }, [passerelleData, activeFiliereId]);

  // Deep linking from WordPress Elementor: ?fil=mp&chap=...&video=...&title=...
  useEffect(() => {
    const filParam = searchParams.get("fil") || searchParams.get("filiere");
    if (filParam && passerelleData?.filieres) {
      const matchFil = passerelleData.filieres.find(
        (f) =>
          f.id.toLowerCase() === filParam.toLowerCase() ||
          f.nom.toLowerCase() === filParam.toLowerCase() ||
          f.de?.toLowerCase() === filParam.toLowerCase() ||
          f.vers?.toLowerCase() === filParam.toLowerCase()
      );
      if (matchFil) {
        setActiveFiliereId(matchFil.id);
      }
    }

    const videoUrlParam = searchParams.get("video");
    const pdfUrlParam = searchParams.get("pdf") || searchParams.get("corr");
    const titleParam = searchParams.get("title");
    const chapParam = searchParams.get("chap") || searchParams.get("chapitre");
    const viewParam = searchParams.get("view");

    if (videoUrlParam) {
      setVideoModalData({
        titre: titleParam || "Vidéo d'explication",
        video_url: videoUrlParam,
      });
    } else if (pdfUrlParam) {
      setPdfModalData({
        title: titleParam || "Correction détaillée",
        url: pdfUrlParam,
      });
    } else if (chapParam && filiere) {
      const foundChap = (filiere.chapitres || []).find(
        (c) => String(c.id) === String(chapParam) || c.titre.toLowerCase().includes(chapParam.toLowerCase())
      );
      if (foundChap) {
        setOpenChapterIds((prev) => new Set([...prev, foundChap.id]));
        if (viewParam === "video") {
          let targetVideo = null;
          let targetTitle = foundChap.titre;

          for (const item of foundChap.items || []) {
            const vLinks = normalizeLinks(item.video);
            if (vLinks.length && isUrlActive(vLinks[0].url)) {
              targetVideo = vLinks[0].url;
              targetTitle = item.titre;
              break;
            }
          }
          if (!targetVideo) {
            for (const s of foundChap.seances || []) {
              const vLinks = normalizeLinks(s.video);
              if (vLinks.length && isUrlActive(vLinks[0].url)) {
                targetVideo = vLinks[0].url;
                targetTitle = s.titre;
                break;
              }
            }
          }
          if (targetVideo) {
            setVideoModalData({
              titre: targetTitle,
              video_url: targetVideo,
            });
          }
        }
      }
    }
  }, [searchParams, passerelleData]);

  const toggleChapter = (chapId) => {
    setOpenChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapId)) next.delete(chapId);
      else next.add(chapId);
      return next;
    });
  };

  const openVideo = (url, titre) => {
    setVideoModalData({
      titre: titre || "Vidéo d'explication",
      video_url: url,
    });
  };

  const openPdf = (url, title) => {
    setPdfModalData({ title, url });
  };

  // Filtered chapters for current filière
  const filteredChapitres = useMemo(() => {
    if (!filiere) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return filiere.chapitres || [];
    return (filiere.chapitres || []).filter((c) => {
      const inTitle = c.titre.toLowerCase().includes(q);
      const inWhy = c.why && c.why.toLowerCase().includes(q);
      const inItems = (c.items || []).some((it) => it.titre.toLowerCase().includes(q));
      const inSeances = (c.seances || []).some((s) => s.titre.toLowerCase().includes(q));
      return inTitle || inWhy || inItems || inSeances;
    });
  }, [filiere, searchQuery]);

  return (
    <div id="tss" className="passerelle-container page" style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 18px 80px" }}>
      {/* ── Breadcrumb & Back & Sync Status ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => navigate("/")} style={{ borderRadius: 12 }}>
            <ArrowLeft size={16} /> Retour au portail
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.88rem", color: "var(--tss-encre-douce)" }}>
            <Link to="/" style={{ color: "var(--tss-or)", fontWeight: 600, textDecoration: "none" }}>
              Accueil
            </Link>
            <ChevronRight size={14} />
            <span style={{ fontWeight: 600, color: "var(--tss-encre)" }}>
              CPGE Passerelles
            </span>
            <ChevronRight size={14} />
            <span style={{ fontWeight: 700, color: "var(--tss-or)" }}>
              La Passerelle Sup → Spé ({filiere?.nom})
            </span>
          </div>
        </div>

        {/* Live Sync Status Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => refreshSync()}
            disabled={isSyncing}
            className="btn btn-secondary btn-sm"
            style={{
              fontSize: "0.78rem",
              borderRadius: 20,
              padding: "4px 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--tss-carte-subtle)",
              borderColor: "var(--tss-bordure)",
              color: "var(--tss-encre-douce)",
            }}
            title="Synchroniser les données avec le site WordPress"
          >
            <RefreshCw size={13} style={{ animation: isSyncing ? "spin 0.8s linear infinite" : "none" }} />
            <span>{isSyncing ? "Synchronisation..." : isLive ? "🟢 En direct (WordPress)" : "Synchroniser"}</span>
          </button>
        </div>
      </div>

      {/* ── Hero Header ── */}
      <div
        className="passerelle-hero"
        style={{
          background: "linear-gradient(135deg, var(--tss-or-pale) 0%, var(--tss-carte-subtle) 100%)",
          border: "1px solid var(--tss-bordure)",
          borderRadius: 24,
          padding: "42px 28px 36px",
          marginBottom: 32,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 18px",
            borderRadius: 99,
            background: "var(--tss-or-pale)",
            border: "1px solid var(--tss-bordure)",
            color: "var(--tss-or)",
            fontSize: "0.78rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            marginBottom: 16,
          }}
        >
          <ShieldCheck size={15} /> {passerelleData.eyebrow || "Accompagnement Mathématiques"}
        </div>

        <h1
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight: 800,
            color: "var(--tss-encre)",
            margin: "0 0 12px 0",
            letterSpacing: "-0.02em",
          }}
        >
          La Passerelle <span style={{ color: "var(--tss-or)", fontStyle: "italic" }}>Sup → Spé</span>
        </h1>

        <p
          style={{
            color: "var(--tss-encre-douce)",
            fontSize: "1.05rem",
            maxWidth: 620,
            margin: "0 auto 28px",
            lineHeight: 1.6,
          }}
        >
          {passerelleData.description}
        </p>

        {/* Bridge Node Illustration */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
            background: "var(--tss-carte)",
            padding: "10px 24px",
            borderRadius: 99,
            border: "1px solid var(--tss-bordure)",
            boxShadow: "var(--tss-shadow-md)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--tss-encre)" }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--tss-carte-subtle)",
                display: "grid",
                placeItems: "center",
                fontSize: "0.85rem",
                color: "var(--tss-encre-moyenne)",
                border: "1px solid var(--tss-bordure)",
              }}
            >
              Sup
            </span>
            <span>Terminer</span>
          </div>

          <div style={{ color: "var(--tss-or)", fontWeight: 800, fontSize: "1.2rem" }}>➔</div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--tss-or)" }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--tss-or)",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                fontSize: "0.85rem",
                boxShadow: "0 2px 8px rgba(181, 120, 9, 0.35)",
              }}
            >
              Spé
            </span>
            <span>Anticiper</span>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div
        className="stats-row"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 12,
          background: "var(--tss-carte)",
          border: "1px solid var(--tss-bordure)",
          borderRadius: 16,
          padding: "16px 20px",
          marginBottom: 28,
          textAlign: "center",
          boxShadow: "var(--tss-shadow-sm)",
        }}
      >
        <div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--tss-or)", fontFamily: "serif" }}>
            {(passerelleData.filieres || []).length}
          </div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--tss-encre-douce)", letterSpacing: "0.08em" }}>
            Filières
          </div>
        </div>
        <div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--tss-or)", fontFamily: "serif" }}>
            {filiere?.chapitres?.length || 0}
          </div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--tss-encre-douce)", letterSpacing: "0.08em" }}>
            Chapitres ({filiere?.nom})
          </div>
        </div>
        <div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--tss-or)", fontFamily: "serif" }}>
            {(filiere?.chapitres || []).reduce((acc, c) => acc + (c.items?.length || 0), 0)}
          </div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--tss-encre-douce)", letterSpacing: "0.08em" }}>
            Fiches d'exercices
          </div>
        </div>
        <div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--tss-or)", fontFamily: "serif" }}>
            {(filiere?.chapitres || []).reduce((acc, c) => acc + (c.seances?.length || 0), 0)}
          </div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--tss-encre-douce)", letterSpacing: "0.08em" }}>
            Séances & Replays
          </div>
        </div>
      </div>

      {/* ── Filières Tabs & Controls ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        {/* Filière Selector */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(passerelleData.filieres || []).map((f) => {
            const isSelected = activeFiliereId === f.id;
            return (
              <button
                key={f.id}
                onClick={() => {
                  setActiveFiliereId(f.id);
                  setSearchParams({ fil: f.id });
                }}
                className={`btn ${isSelected ? "btn-primary" : "btn-secondary"}`}
                style={{
                  borderRadius: 14,
                  padding: "10px 20px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  borderColor: isSelected ? undefined : "var(--tss-bordure)",
                  background: isSelected ? "linear-gradient(135deg, #b57809, #7c4f04)" : "var(--tss-carte)",
                  color: isSelected ? "#ffffff" : "var(--tss-encre)",
                  boxShadow: isSelected ? "0 4px 14px rgba(181, 120, 9, 0.25)" : "none",
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: isSelected ? "rgba(255,255,255,0.2)" : "var(--tss-or-pale)",
                    color: isSelected ? "#ffffff" : "var(--tss-or)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "0.9rem",
                  }}
                >
                  {f.icon}
                </span>
                <span>
                  {f.de} → {f.vers}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Expand/Collapse All */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setOpenChapterIds(new Set((filiere?.chapitres || []).map((c) => c.id)))}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.8rem", padding: "6px 12px", borderRadius: 8 }}
            >
              Tout déplier
            </button>
            <button
              onClick={() => setOpenChapterIds(new Set())}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.8rem", padding: "6px 12px", borderRadius: 8 }}
            >
              Tout replier
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ position: "relative", minWidth: 260 }}>
            <input
              type="text"
              placeholder="Rechercher un chapitre, exercice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{
                paddingLeft: 38,
                borderRadius: 12,
                fontSize: "0.9rem",
                background: "var(--tss-carte)",
                color: "var(--tss-encre)",
                borderColor: "var(--tss-bordure)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--tss-encre-douce)",
                pointerEvents: "none",
              }}
            >
              <Search size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Chapters List for Selected Filière ── */}
      <div style={{ display: "grid", gap: 14, marginBottom: 40 }}>
        {filteredChapitres.map((chap, idx) => {
          const isOpen = openChapterIds.has(chap.id);
          const hasFiche = normalizeLinks(chap.fiche).length > 0;
          const items = chap.items || [];
          const seances = chap.seances || [];

          return (
            <div
              key={chap.id}
              className="card chapter-accordion-item"
              style={{
                borderRadius: 16,
                border: "1px solid var(--tss-bordure)",
                background: "var(--tss-carte)",
                overflow: "hidden",
                boxShadow: "var(--tss-shadow-sm)",
              }}
            >
              {/* Header Toggle */}
              <button
                onClick={() => toggleChapter(chap.id)}
                style={{
                  width: "100%",
                  padding: "18px 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14,
                  background: isOpen ? "var(--tss-or-pale)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: isOpen ? "var(--tss-or)" : "var(--tss-or-pale)",
                      color: isOpen ? "#ffffff" : "var(--tss-or-fonce)",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      fontSize: "1.05rem",
                      flexShrink: 0,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {idx + 1}
                  </div>

                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--tss-encre)" }}>
                      {chap.titre}
                    </h3>
                    {chap.why && (
                      <p style={{ margin: "3px 0 0 0", fontSize: "0.85rem", color: "var(--tss-encre-douce)" }}>
                        {chap.why}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {items.length > 0 && (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 99,
                        background: "var(--tss-or-pale)",
                        color: "var(--tss-or)",
                      }}
                    >
                      {items.length} fiche{items.length > 1 ? "s" : ""}
                    </span>
                  )}
                  {seances.length > 0 && (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 99,
                        background: "rgba(239, 68, 68, 0.12)",
                        color: "#ef4444",
                      }}
                    >
                      📡 {seances.length} séance{seances.length > 1 ? "s" : ""}
                    </span>
                  )}
                  <div
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s ease",
                      color: "var(--tss-or)",
                    }}
                  >
                    <ChevronDown size={20} />
                  </div>
                </div>
              </button>

              {/* Accordion Body */}
              {isOpen && (
                <div
                  style={{
                    padding: "20px 22px 26px",
                    borderTop: "1px solid var(--tss-bordure)",
                    background: "var(--tss-carte-subtle)",
                  }}
                >
                  {(() => {
                    const fiches = Array.isArray(chap.fiches)
                      ? chap.fiches
                      : normalizeLinks(chap.fiche).map((l) => ({
                          titre: l.label || "Fiche de synthèse",
                          url: l.url,
                          sous: "L'essentiel du chapitre",
                        }));

                    const hasMain = seances.length > 0 || items.length > 0;
                    const hasSide = fiches.length > 0;

                    if (!hasMain && !hasSide) {
                      return (
                        <div style={{ color: "var(--tss-encre-douce)", fontSize: "0.88rem", fontStyle: "italic", padding: "8px 0" }}>
                          Contenu pédagogique en cours de finalisation.
                        </div>
                      );
                    }

                    return (
                      <div className={`ch-grid ${hasMain && hasSide ? "" : "solo"}`}>
                        {/* Colonne Gauche : Séances + Items */}
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
                                    <SessionVideoCard
                                      key={se.id || sIdx}
                                      seance={se}
                                      index={sIdx}
                                      chapTitre={chap.titre}
                                      onOpenPdf={openPdf}
                                      onOpenVideo={openVideo}
                                    />
                                  ))}
                                </div>
                              </section>
                            )}

                            {items.length > 0 && (
                              <section className="doc-sec">
                                <div className="doc-sec-t">
                                  <i>📝</i>
                                  <b>S'entraîner (Fiches d'exercices & Annales)</b>
                                  <span className="doc-sec-n">{items.length}</span>
                                  <s />
                                </div>
                                <div className="doc-list">
                                  {items.map((it, itIdx) => (
                                    <ExerciseDocLine
                                      key={it.id || itIdx}
                                      item={it}
                                      index={itIdx}
                                      chapTitre={chap.titre}
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
                                  <FicheCard
                                    key={fIdx}
                                    fiche={f}
                                    chapTitre={chap.titre}
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
      </div>

      {/* ── 📚 Bibliothèque d'ouvrages conseillés ── */}
      {filiere?.livres && filiere.livres.length > 0 && (
        <div
          style={{
            background: "var(--tss-carte-subtle)",
            border: "1px solid var(--tss-bordure)",
            borderRadius: 20,
            padding: "36px 24px",
            marginBottom: 40,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--tss-or)",
                background: "var(--tss-or-pale)",
                padding: "4px 14px",
                borderRadius: 20,
              }}
            >
              Bibliothèque
            </span>
            <h3 style={{ margin: "10px 0 0 0", fontSize: "1.4rem", fontWeight: 700, color: "var(--tss-encre)" }}>
              Les ouvrages conseillés en {filiere.nom}
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 24,
              justifyItems: "center",
            }}
          >
            {filiere.livres.map((livre, lIdx) => (
              <BookCard key={lIdx} livre={livre} onOpenPdf={openPdf} />
            ))}
          </div>
        </div>
      )}

      {/* ── 🗺️ Feuille de route de l'été (Roadmap) ── */}
      <div
        style={{
          background: "var(--tss-carte)",
          border: "1px solid var(--tss-bordure)",
          borderRadius: 20,
          padding: "36px 28px",
          marginBottom: 32,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "1.4rem", fontWeight: 700, color: "var(--tss-encre)" }}>
            Feuille de route de l'été
          </h3>
          <p style={{ margin: 0, color: "var(--tss-encre-douce)", fontSize: "0.92rem" }}>
            Une organisation progressive pour ne pas arriver épuisé à la rentrée.
          </p>
        </div>

        <div style={{ display: "grid", gap: 16, maxWidth: 840, margin: "0 auto" }}>
          {(passerelleData?.plan || []).map((item, pIdx) => (
            <div
              key={pIdx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                padding: "16px 20px",
                borderRadius: 12,
                background: "var(--tss-carte-subtle)",
                border: "1px solid var(--tss-bordure)",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--tss-or)",
                  background: "var(--tss-or-pale)",
                  padding: "4px 12px",
                  borderRadius: 20,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {item.semaine}
              </span>
              <div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem", fontWeight: 700, color: "var(--tss-encre)" }}>
                  {item.titre}
                </h4>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--tss-encre-douce)", lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Secure Video Player Modal ── */}
      {videoModalData && (
        <SecureVideoModal
          videoUrl={videoModalData.video_url || videoModalData.url}
          title={videoModalData.titre || videoModalData.title}
          chapter={{
            titre: videoModalData.titre || videoModalData.title,
            video_url: videoModalData.video_url || videoModalData.url,
          }}
          onClose={() => setVideoModalData(null)}
        />
      )}

      {/* ── PDF Preview Modal ── */}
      {pdfModalData && (
        <PDFPreviewModal
          title={pdfModalData.title}
          url={pdfModalData.url}
          onClose={() => setPdfModalData(null)}
        />
      )}
    </div>
  );
}

export default Passerelle;
