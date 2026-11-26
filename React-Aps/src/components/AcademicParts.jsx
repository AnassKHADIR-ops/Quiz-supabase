import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Folder,
  LayoutGrid,
  Layers,
  List,
  Lock,
  PenLine,
  Play,
  Video,
} from "./Icon.jsx";
import {
  extractDriveFileId,
  getDriveImageUrls,
  getYoutubeThumbnail,
} from "../utils/driveUtils.js";
import {
  cleanUrl,
  getBookPalette,
  getSessionSupports,
  getSessionVideos,
  getTdCorrections,
  isUrlActive,
} from "../utils/academicUtils.js";

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80";

/**
 * Tiroir fluide animé via CSS grid-template-rows (0fr -> 1fr) avec gestion `inert` accessible.
 */
function SmoothDrawer({ id, open, className = "ak-drawer", children }) {
  const drawerRef = useRef(null);

  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;
    el.inert = !open;
    if (open && typeof window !== "undefined") {
      const timer = setTimeout(() => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > window.innerHeight - 16 && el.parentElement?.scrollIntoView) {
          el.parentElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <div ref={drawerRef} id={id} className={`${className} ${open ? "open" : ""}`}>
      <div className="ak-drawer-clip">{children}</div>
    </div>
  );
}

/**
 * Carte Fiche de synthèse horizontale compacte (style couverture livre + aperçu Drive).
 */
export function FicheCard({ fiche, chapTitre, onOpenPdf }) {
  const isObj = Boolean(fiche && typeof fiche === "object");
  const url = isObj ? cleanUrl(fiche.u || fiche.url) : cleanUrl(fiche);
  const titre = isObj ? fiche.t || fiche.label || fiche.titre || "Fiche de synthèse" : "Fiche de synthèse";
  const sous = isObj ? fiche.sous || "L'essentiel du chapitre" : "L'essentiel du chapitre";
  const dispo = isUrlActive(url);
  const targetCover = (isObj && fiche.cover) || url;

  const srcs = useMemo(() => getDriveImageUrls(targetCover), [targetCover]);
  const [imgIdx, setImgIdx] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  if (!fiche) return null;

  const handleImgError = () => {
    if (imgIdx + 1 < srcs.length) setImgIdx((p) => p + 1);
    else setImgFailed(true);
  };

  const inner = (
    <>
      <span className="ak-doc-thumb">
        <span className="ak-gen" style={{ background: "linear-gradient(150deg, #3730a3, #1e1b4b)" }}>
          <span className="ak-gen-k">Résumé</span>
          <span className="ak-gen-orn" />
          <span className="ak-gen-t">{titre}</span>
        </span>
        {srcs.length > 0 && !imgFailed && (
          <img
            className="ak-doc-img"
            src={srcs[imgIdx]}
            alt={`Aperçu de ${titre}`}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            onError={handleImgError}
          />
        )}
        {dispo && (
          <span className="ak-doc-loupe" aria-hidden="true">
            <Eye size={12} />
          </span>
        )}
      </span>
      <span className="ak-doc-info">
        <span className="ak-doc-t">{titre}</span>
        {sous && <span className="ak-doc-d">{sous}</span>}
        {dispo ? (
          <span className="ak-doc-cta">
            Feuilleter le PDF <ChevronRight size={12} />
          </span>
        ) : (
          <span className="ak-doc-d" style={{ fontStyle: "italic" }}>
            Bientôt disponible
          </span>
        )}
      </span>
    </>
  );

  if (dispo) {
    return (
      <button
        type="button"
        className="ak-doc-card"
        onClick={() => onOpenPdf({ url, title: `${titre}${chapTitre ? ` — ${chapTitre}` : ""}` })}
        aria-label={`Ouvrir : ${titre}`}
      >
        {inner}
      </button>
    );
  }
  return <div className="ak-doc-card soon">{inner}</div>;
}

/**
 * Carte Séance Vidéo 16:9 avec tiroirs fluides multi-PDF & multi-séances.
 */
export function SessionVideoCard({
  seance,
  index,
  chapTitre,
  isApproved,
  onOpenPdf,
  onOpenCorrection,
  onOpenVideo,
}) {
  const uid = useId();
  const [openDrawer, setOpenDrawer] = useState(null); // null | "pdf" | "vid"

  if (!seance || typeof seance !== "object") return null;

  const titre = seance.t || seance.titre || seance.title || seance.name || `Séance ${index + 1}`;
  const sous = seance.sous || seance.description || seance.desc || "Théorie & démonstrations · Replay";

  const videos = getSessionVideos(seance);
  const supports = getSessionSupports(seance);
  const primaryVideo = videos.length > 0 ? videos[0].url : "";
  const thumbUrl = getYoutubeThumbnail(primaryVideo || seance) || FALLBACK_THUMB;

  const hasMultiPdf = supports.length > 1;
  const hasMultiVid = videos.length > 1;
  const hasCorrPdf = supports.some((s) => s.type === "corr");
  const openableSupports = supports.filter((s) => !s.lock || isApproved);

  const epNum = index + 1 < 10 ? `0${index + 1}` : String(index + 1);
  const pdfDrawerId = `${uid}-pdf`;
  const vidDrawerId = `${uid}-vid`;

  const toggleDrawer = (which) => {
    setOpenDrawer((prev) => (prev === which ? null : which));
  };

  const handleOpenSupport = (sup) => {
    const docTitle = `${titre} — ${sup.label}${chapTitre ? ` — ${chapTitre}` : ""}`;
    if (sup.lock && !isApproved) {
      onOpenCorrection(sup.url, docTitle);
      return;
    }
    if (openableSupports.length >= 2) {
      const idx = Math.max(0, openableSupports.findIndex((x) => x.url === sup.url));
      onOpenPdf({
        url: sup.url,
        title: `${titre}${chapTitre ? ` — ${chapTitre}` : ""}`,
        docs: openableSupports,
        initialIndex: idx,
      });
    } else {
      onOpenPdf({ url: sup.url, title: docTitle });
    }
  };

  return (
    <article className={`ak-session-card ${openDrawer ? "drawer-open" : ""}`}>
      {primaryVideo ? (
        <button
          type="button"
          className="ak-session-thumb"
          onClick={() =>
            onOpenVideo(primaryVideo, `${titre}${chapTitre ? ` — ${chapTitre}` : ""}`)
          }
          aria-label={`Regarder : ${titre}`}
        >
          <img
            className="ak-session-thumb-img"
            src={thumbUrl}
            alt={`Miniature : ${titre}`}
            loading="lazy"
            decoding="async"
          />
          <div className="ak-session-ov">
            <div className="ak-session-ov-top">
              <span className="ak-session-idx">#{epNum}</span>
              <span className={`ak-session-badge ${isApproved ? "is-member" : ""}`}>
                {!isApproved && <Lock size={10} />}
                <span>{isApproved ? "Replay HD" : "Membre"}</span>
              </span>
            </div>
            {(hasMultiPdf || hasMultiVid) && (
              <div className="ak-session-ov-bot">
                {hasMultiPdf && (
                  <span className={`ak-session-pill ${hasCorrPdf ? "has-corr" : ""}`}>
                    <Folder size={11} />
                    <span>
                      {supports.length} PDF{hasCorrPdf ? " · Énoncé & Corrigé" : ""}
                    </span>
                  </span>
                )}
                {hasMultiVid && (
                  <span className="ak-session-pill">
                    <Video size={11} />
                    <span>{videos.length} Séances</span>
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="ak-session-play" aria-hidden="true">
            <Play size={18} style={{ marginLeft: 2, fill: "currentColor" }} />
          </div>
        </button>
      ) : supports.length > 0 ? (
        <button
          type="button"
          className="ak-session-thumb"
          onClick={() => handleOpenSupport(supports[0])}
          aria-label={`Ouvrir le support : ${titre}`}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#bfdbfe",
            gap: 6,
          }}
        >
          <FileText size={32} />
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Support de cours PDF
          </span>
        </button>
      ) : null}

      <div className="ak-session-info">
        <h4 className="ak-session-t" title={titre}>
          {titre}
        </h4>
        {sous && (
          <p className="ak-session-d" title={sous}>
            {sous}
          </p>
        )}
        <div className="ak-session-actions">
          {hasMultiPdf ? (
            <button
              type="button"
              className="ak-btn ak-btn-pdf ak-btn-multi"
              aria-expanded={openDrawer === "pdf"}
              aria-controls={pdfDrawerId}
              onClick={() => toggleDrawer("pdf")}
            >
              <Folder size={14} />
              <span>Supports</span>
              <span className="ak-btn-cnt">{supports.length}</span>
              <ChevronDown size={13} className="ak-btn-chev" />
            </button>
          ) : supports.length === 1 ? (
            <button
              type="button"
              className="ak-btn ak-btn-pdf"
              onClick={() => handleOpenSupport(supports[0])}
            >
              <FileText size={14} />
              <span>Support PDF</span>
              {supports[0].lock && !isApproved && <Lock size={11} />}
            </button>
          ) : null}

          {hasMultiVid ? (
            <button
              type="button"
              className="ak-btn ak-btn-video ak-btn-multi"
              aria-expanded={openDrawer === "vid"}
              aria-controls={vidDrawerId}
              onClick={() => toggleDrawer("vid")}
            >
              <Play size={12} style={{ fill: "currentColor" }} />
              <span>{`${videos.length} Séances`}</span>
              {!isApproved && <Lock size={11} />}
              <ChevronDown size={13} className="ak-btn-chev" />
            </button>
          ) : primaryVideo ? (
            <button
              type="button"
              className="ak-btn ak-btn-video"
              onClick={() =>
                onOpenVideo(primaryVideo, `${titre}${chapTitre ? ` — ${chapTitre}` : ""}`)
              }
            >
              <Play size={12} style={{ fill: "currentColor" }} />
              <span>Regarder</span>
              {!isApproved && <Lock size={11} />}
            </button>
          ) : null}
        </div>
      </div>

      {/* Tiroir multi-PDF */}
      {hasMultiPdf && (
        <SmoothDrawer id={pdfDrawerId} open={openDrawer === "pdf"}>
          <div className="ak-drawer-in">
            <div className="ak-drawer-head">
              <span className="ak-drawer-k">
                <Folder size={12} /> {`Dossier PDF (${supports.length})`}
              </span>
              <span className="ak-drawer-sub">Cliquer pour ouvrir</span>
            </div>
            <div className="ak-drawer-list">
              {supports.map((s, si) => {
                const isCorr = s.type === "corr";
                const isExo = s.type === "exo";
                const icCls = isCorr ? "t-corr" : isExo ? "t-exo" : "t-crs";
                const metaTxt = isCorr
                  ? "Correction détaillée PDF"
                  : isExo
                  ? "Énoncé du sujet PDF"
                  : "Support de séance PDF";
                const locked = s.lock && !isApproved;

                return (
                  <button
                    key={si}
                    type="button"
                    className="ak-drawer-item"
                    onClick={() => handleOpenSupport(s)}
                  >
                    <span className={`ak-di-ic ${icCls}`}>
                      {isCorr ? <CheckCircle size={14} /> : isExo ? <PenLine size={14} /> : <FileText size={14} />}
                    </span>
                    <span className="ak-di-txt">
                      <span className="ak-di-label">{s.label}</span>
                      <span className="ak-di-meta">{metaTxt}</span>
                    </span>
                    <span
                      className={`ak-di-tag ${
                        locked ? "tag-lock" : isCorr ? "tag-corr" : "tag-view"
                      }`}
                    >
                      {locked ? (
                        <>
                          <Lock size={11} /> Membre
                        </>
                      ) : (
                        <>
                          <Eye size={11} /> Lire
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </SmoothDrawer>
      )}

      {/* Tiroir multi-vidéos */}
      {hasMultiVid && (
        <SmoothDrawer id={vidDrawerId} open={openDrawer === "vid"}>
          <div className="ak-drawer-in">
            <div className="ak-drawer-head">
              <span className="ak-drawer-k">
                <Video size={12} /> Replays du sujet ({videos.length})
              </span>
              <span className="ak-drawer-sub">Choisir une séance</span>
            </div>
            <div className="ak-drawer-list">
              {videos.map((v, vi) => (
                <button
                  key={vi}
                  type="button"
                  className="ak-drawer-item"
                  onClick={() =>
                    onOpenVideo(v.url, `${titre} — ${v.label}${chapTitre ? ` — ${chapTitre}` : ""}`)
                  }
                >
                  <span className="ak-di-ic t-vid">
                    <Play size={13} style={{ fill: "currentColor" }} />
                  </span>
                  <span className="ak-di-txt">
                    <span className="ak-di-label">{v.label}</span>
                    <span className="ak-di-meta">Replay vidéo HD · Espace Membre</span>
                  </span>
                  <span className="ak-di-tag tag-lock">
                    {!isApproved && <Lock size={11} />} Voir
                  </span>
                </button>
              ))}
            </div>
          </div>
        </SmoothDrawer>
      )}
    </article>
  );
}

/**
 * Ligne Cours / Polycopié PDF (sans vidéo associée).
 */
export function CoursePdfLine({ doc, chapTitre, onOpenPdf }) {
  if (!doc || typeof doc !== "object") return null;
  const supports = getSessionSupports(doc);
  const primary = supports[0];
  const titre = doc.t || doc.titre || "Cours complet";
  const sous = doc.sous || doc.description || "";
  const dispo = Boolean(primary?.url);

  return (
    <div className={`ak-doc-line-wrap ${dispo ? "" : "soon"}`}>
      <div className="ak-doc-line">
        <span className="ak-doc-line-ic ic-sky" aria-hidden="true">
          <BookOpen size={15} />
        </span>
        <span className="ak-doc-line-txt">
          <span className="ak-doc-line-t">{titre}</span>
          {sous && <span className="ak-doc-line-d">{sous}</span>}
        </span>
        <span className="ak-doc-line-b">
          {dispo ? (
            <button
              type="button"
              className="ak-btn ak-btn-pdf"
              onClick={() =>
                onOpenPdf({
                  url: primary.url,
                  title: `${titre}${chapTitre ? ` — ${chapTitre}` : ""}`,
                  docs: supports.length > 1 ? supports : undefined,
                  initialIndex: 0,
                })
              }
            >
              <FileText size={14} />
              <span>Consulter</span>
            </button>
          ) : (
            <span className="ak-btn ak-btn-soon">Bientôt disponible</span>
          )}
        </span>
      </div>
    </div>
  );
}

/**
 * Ligne TD / DL / Exercice avec tiroir multi-corrigés fluide.
 */
export function ExerciseTdLine({
  item,
  index,
  chapTitre,
  isApproved,
  onOpenPdf,
  onOpenCorrection,
  onOpenVideo,
}) {
  const uid = useId();
  const [corrOpen, setCorrOpen] = useState(false);

  if (!item || typeof item !== "object") return null;

  const titre = item.t || item.titre || item.title || `Fiche TD ${index + 1}`;
  const sous = item.sous || item.description || "";
  const exoUrl = cleanUrl(item.exo || item.enonce || item.enonce_url || item.u);
  const corrs = getTdCorrections(item);
  const videoUrl = cleanUrl(
    typeof item.video === "string" ? item.video : item.v || item.video_url || item.videoUrl
  );
  const dispo = Boolean(exoUrl || corrs.length > 0 || videoUrl);
  const drawerId = `${uid}-td`;

  const handleOpenCorr = (corrItem) => {
    const docTitle = `${titre} — ${corrItem.label}${chapTitre ? ` — ${chapTitre}` : ""}`;
    if (isApproved && corrs.length > 1) {
      const docs = corrs.map((c) => ({ label: c.label, type: "corr", url: c.url }));
      const idx = Math.max(0, corrs.findIndex((c) => c.url === corrItem.url));
      onOpenCorrection(corrItem.url, docTitle, docs, idx);
    } else {
      onOpenCorrection(corrItem.url, docTitle);
    }
  };

  return (
    <div className={`ak-doc-line-wrap ${dispo ? "" : "soon"}`}>
      <div className="ak-doc-line">
        <span className="ak-doc-line-ic" aria-hidden="true">
          <PenLine size={15} />
        </span>
        <span className="ak-doc-line-txt">
          <span className="ak-doc-line-t">{titre}</span>
          {sous && <span className="ak-doc-line-d">{sous}</span>}
        </span>
        <span className="ak-doc-line-b">
          {exoUrl && (
            <button
              type="button"
              className="ak-btn ak-btn-exo"
              onClick={() =>
                onOpenPdf({
                  url: exoUrl,
                  title: `${titre} — Énoncé${chapTitre ? ` — ${chapTitre}` : ""}`,
                })
              }
            >
              <PenLine size={14} />
              <span>Énoncé</span>
            </button>
          )}

          {corrs.length === 1 && (
            <button
              type="button"
              className="ak-btn ak-btn-corr"
              onClick={() => handleOpenCorr(corrs[0])}
            >
              <CheckCircle size={14} />
              <span>Correction</span>
              {!isApproved && <Lock size={11} />}
            </button>
          )}

          {corrs.length > 1 && (
            <button
              type="button"
              className="ak-btn ak-btn-corr ak-btn-multi"
              aria-expanded={corrOpen}
              aria-controls={drawerId}
              onClick={() => setCorrOpen((o) => !o)}
            >
              <CheckCircle size={14} />
              <span>Corrigés</span>
              <span className="ak-btn-cnt">{corrs.length}</span>
              <ChevronDown size={13} className="ak-btn-chev" />
            </button>
          )}

          {videoUrl && (
            <button
              type="button"
              className="ak-btn ak-btn-video"
              onClick={() =>
                onOpenVideo(videoUrl, `${titre} — Vidéo${chapTitre ? ` — ${chapTitre}` : ""}`)
              }
            >
              <Play size={12} style={{ fill: "currentColor" }} />
              <span>Vidéo</span>
              {!isApproved && <Lock size={11} />}
            </button>
          )}

          {!dispo && <span className="ak-btn ak-btn-soon">Bientôt disponible</span>}
        </span>
      </div>

      {corrs.length > 1 && (
        <SmoothDrawer id={drawerId} open={corrOpen} className="ak-drawer ak-td-drawer">
          <div className="ak-drawer-in">
            <div className="ak-drawer-head">
              <span className="ak-drawer-k">
                <CheckCircle size={12} /> {`Corrections disponibles (${corrs.length})`}
              </span>
            </div>
            <div className="ak-drawer-list">
              {corrs.map((c, ci) => (
                <button
                  key={ci}
                  type="button"
                  className="ak-drawer-item"
                  onClick={() => handleOpenCorr(c)}
                >
                  <span className="ak-di-ic t-corr">
                    <CheckCircle size={14} />
                  </span>
                  <span className="ak-di-txt">
                    <span className="ak-di-label">{c.label}</span>
                    <span className="ak-di-meta">Correction détaillée · Espace Membre</span>
                  </span>
                  <span className={`ak-di-tag ${isApproved ? "tag-corr" : "tag-lock"}`}>
                    {isApproved ? (
                      <>
                        <Eye size={11} /> Lire
                      </>
                    ) : (
                      <>
                        <Lock size={11} /> Ouvrir
                      </>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </SmoothDrawer>
      )}
    </div>
  );
}

/**
 * Onglets rapides internes à un chapitre (`Tout voir`, `Fiches`, `Vidéos`, `Cours PDF`, `TD & DL`).
 */
export function ChapterTabs({ counts, activeTab, onChange }) {
  const tabs = [];
  if (counts.fiches > 0) tabs.push({ id: "fiches", label: "Fiches", n: counts.fiches, Icon: Layers });
  if (counts.videos > 0) tabs.push({ id: "videos", label: "Vidéos", n: counts.videos, Icon: Video });
  if (counts.cours > 0) tabs.push({ id: "cours", label: "Cours PDF", n: counts.cours, Icon: BookOpen });
  if (counts.tds > 0) tabs.push({ id: "tds", label: "TD & DL", n: counts.tds, Icon: PenLine });

  if (tabs.length < 2) return null;

  return (
    <div className="ak-ch-tabs" role="tablist" aria-label="Sections du chapitre">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "all"}
        className={`ak-ch-tab ${activeTab === "all" ? "on" : ""}`}
        onClick={() => onChange("all")}
      >
        Tout voir
      </button>
      {tabs.map(({ id, label, n, Icon }) => {
        const on = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={on}
            className={`ak-ch-tab ${on ? "on" : ""}`}
            onClick={() => onChange(id)}
          >
            <Icon size={13} />
            <span>{label}</span>
            <span className="ak-ch-tab-n">{n}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Sélecteur Grille / Liste compacte pour les chapitres contenant >= 6 séances vidéo.
 */
export function VideoViewSwitch({ compact, onChange }) {
  return (
    <div className="ak-view-switch" role="group" aria-label="Mode d'affichage des vidéos">
      <button
        type="button"
        className={`ak-vsw-btn ${!compact ? "on" : ""}`}
        aria-pressed={!compact}
        onClick={() => onChange(false)}
      >
        <LayoutGrid size={13} />
        <span>Grille</span>
      </button>
      <button
        type="button"
        className={`ak-vsw-btn ${compact ? "on" : ""}`}
        aria-pressed={compact}
        onClick={() => onChange(true)}
      >
        <List size={13} />
        <span>Liste</span>
      </button>
    </div>
  );
}

/**
 * Carte Ouvrage de référence (Bibliothèque CPGE).
 */
export function BookCard({ livre, onOpenPdf }) {
  const safeLivre = livre && typeof livre === "object" ? livre : null;
  const titre = safeLivre?.titre || "Ouvrage de référence";
  const auteur = safeLivre?.auteur || "";
  const lien = cleanUrl(safeLivre?.lien || safeLivre?.url);
  const cover = safeLivre?.cover || null;
  const dispo = isUrlActive(lien);

  const srcs = useMemo(() => {
    if (cover) return getDriveImageUrls(cover);
    if (lien && extractDriveFileId(lien)) return getDriveImageUrls(lien);
    return [];
  }, [cover, lien]);

  const palette = useMemo(() => getBookPalette(titre), [titre]);
  const [imgIdx, setImgIdx] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  if (!safeLivre) return null;

  const handleImgError = () => {
    if (imgIdx + 1 < srcs.length) setImgIdx((p) => p + 1);
    else setImgFailed(true);
  };

  const inner = (
    <>
      <span className="ak-livre-cover">
        <span
          className="ak-gen"
          style={{ background: `linear-gradient(150deg, ${palette[0]}, ${palette[1]})` }}
        >
          <span className="ak-gen-orn" />
          <span className="ak-gen-t">{titre}</span>
          {auteur && <span className="ak-gen-b">{auteur}</span>}
        </span>
        {!imgFailed && srcs.length > 0 && (
          <img
            className="ak-doc-img"
            src={srcs[imgIdx]}
            alt={`Couverture de ${titre}`}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            onError={handleImgError}
          />
        )}
        {dispo && (
          <span className="ak-livre-loupe" aria-hidden="true">
            <Eye size={14} />
          </span>
        )}
      </span>
      <span className="ak-livre-meta">
        <span className="ak-livre-titre">{titre}</span>
        {auteur && <span className="ak-livre-auteur">{auteur}</span>}
      </span>
    </>
  );

  if (dispo) {
    const fullTitle = `${titre}${auteur ? ` — ${auteur}` : ""}`;
    return (
      <button
        type="button"
        className="ak-livre"
        onClick={() => onOpenPdf({ url: lien, title: fullTitle })}
        aria-label={`Ouvrir : ${fullTitle}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="ak-livre ak-livre-bientot">
      {inner}
      <span className="ak-livre-ruban">Bientôt</span>
    </div>
  );
}

export function BookshelfSection({ livres, branchNom, onOpenPdf }) {
  const validLivres = Array.isArray(livres)
    ? livres.filter((l) => l && typeof l === "object")
    : [];
  if (validLivres.length === 0) return null;

  return (
    <section className="ak-livres-section" aria-label="Bibliothèque conseillée">
      <div className="ak-livres-tete">
        <span className="ak-livres-tag">Bibliothèque CPGE</span>
        <h2 className="ak-livres-h">
          Les ouvrages de référence conseillés{branchNom ? ` en ${branchNom}` : ""}
        </h2>
        <p className="ak-livres-sub">
          Cliquez sur un ouvrage pour le feuilleter et le télécharger au format PDF.
        </p>
      </div>
      <div className="ak-livres-grid">
        {validLivres.map((livre, idx) => (
          <BookCard key={idx} livre={livre} onOpenPdf={onOpenPdf} />
        ))}
      </div>
    </section>
  );
}
