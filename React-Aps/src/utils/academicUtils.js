/**
 * Utilitaires partagés pour l'architecture académique (Courses, Passerelle, Concours).
 * Reprend la logique complète et éprouvée du site anasskhadir.com (multi-PDF, multi-séances,
 * détection YouTube/Drive, normalisation sans accents, compteurs live).
 */

export const CAT_LABELS = {
  algebre: "Algèbre",
  analyse: "Analyse",
  geometrie: "Géométrie",
  probabilites: "Probabilités",
  proba: "Probabilités",
  statistiques: "Statistiques",
  informatique: "Informatique",
};

export function normalizeCategoryKey(cat) {
  const raw = stripAccents(cat || "").trim();
  if (!raw) return "analyse";
  if (raw === "proba" || raw.startsWith("probabilit")) return "probabilites";
  if (raw.startsWith("algebr")) return "algebre";
  if (raw.startsWith("analys")) return "analyse";
  if (raw.startsWith("geometr")) return "geometrie";
  if (raw.startsWith("statist")) return "statistiques";
  return raw;
}

export function getCategoryLabel(cat) {
  const norm = normalizeCategoryKey(cat);
  return CAT_LABELS[norm] || (cat ? String(cat) : "Cours");
}

export function isUrlActive(u) {
  return typeof u === "string" && u.trim() !== "";
}

export function cleanUrl(u) {
  return isUrlActive(u) ? String(u).trim() : "";
}

export function stripAccents(s) {
  const str = String(s || "").toLowerCase();
  return str.normalize ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : str;
}

export function isYouTubeUrl(u) {
  return /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/)/.test(cleanUrl(u));
}

export function formatChapterNum(n) {
  const num = Number(n);
  if (!Number.isNaN(num) && num >= 0 && num < 10) return `0${num}`;
  return String(n ?? "");
}

const BOOK_PALETTES = [
  ["#132a4f", "#0b1a33"],
  ["#1e3a8a", "#132354"],
  ["#154c79", "#0c2d4a"],
  ["#1e40af", "#172554"],
  ["#0f4c5c", "#082b34"],
  ["#2b3a67", "#192342"],
];

export function getBookPalette(str = "") {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return BOOK_PALETTES[h % BOOK_PALETTES.length];
}

export function normalizeLinksList(champ) {
  if (!champ) return [];
  if (typeof champ === "string") {
    const u = cleanUrl(champ);
    return u ? [{ url: u, label: "" }] : [];
  }
  if (Array.isArray(champ)) {
    return champ
      .map((x) => {
        if (typeof x === "string") {
          const u = cleanUrl(x);
          return u ? { url: u, label: "" } : null;
        }
        if (x && typeof x === "object") {
          const u = cleanUrl(
            x.url || x.u || x.exo || x.pdf || x.video || x.videoUrl || x.video_url || x.replayUrl || x.support || x.lien || x.v
          );
          return u ? { url: u, label: x.label || x.titre || x.t || "" } : null;
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof champ === "object") {
    const u = cleanUrl(
      champ.url || champ.u || champ.video || champ.videoUrl || champ.video_url || champ.replayUrl || champ.support || champ.pdf || champ.lien
    );
    return u ? [{ url: u, label: champ.label || champ.titre || champ.t || "" }] : [];
  }
  return [];
}

/**
 * Extrait la liste complète des supports PDF d'une séance (100% rétrocompatible avec `u`, `support`, `pdf`, `supports: [...]`, `corr`).
 */
export function getSessionSupports(c) {
  if (!c || typeof c !== "object") return [];
  const list = [];
  const seen = new Set();

  const pushItem = (item) => {
    if (!item) return;
    if (typeof item === "string") {
      const u = cleanUrl(item);
      if (!u || seen.has(u)) return;
      seen.add(u);
      list.push({ label: "Support PDF", type: "cours", url: u, lock: false });
      return;
    }
    if (typeof item !== "object") return;
    const u = cleanUrl(item.url || item.u || item.pdf || item.support || item.supportUrl || item.support_url);
    if (!u || seen.has(u)) return;
    seen.add(u);
    list.push({
      label: item.label || item.t || item.titre || "Support PDF",
      type: item.type || "cours",
      url: u,
      lock: Boolean(item.lock),
    });
  };

  if (Array.isArray(c.supports) && c.supports.length > 0) {
    c.supports.forEach(pushItem);
    const primaryU = cleanUrl(c.u || c.support || c.supportUrl || c.support_url || c.pdf || c.pdfUrl || c.fiche);
    if (primaryU && !seen.has(primaryU)) {
      list.unshift({ label: "Énoncé / Support", type: "exo", url: primaryU, lock: false });
      seen.add(primaryU);
    }
  } else {
    const primaryU = cleanUrl(c.u || c.support || c.supportUrl || c.support_url || c.pdf || c.pdfUrl || c.fiche);
    if (primaryU) {
      pushItem({ label: "Support PDF", type: "cours", url: primaryU, lock: false });
    }
  }

  if (isUrlActive(c.corr)) {
    pushItem({ label: "Correction PDF", type: "corr", url: c.corr, lock: true });
  } else if (Array.isArray(c.corr)) {
    c.corr.forEach((cr, idx) => {
      if (typeof cr === "string") {
        pushItem({ label: `Correction — Partie ${idx + 1}`, type: "corr", url: cr, lock: true });
      } else if (cr && typeof cr === "object") {
        pushItem({
          label: cr.label || `Correction — Partie ${idx + 1}`,
          type: "corr",
          url: cr.url || cr.u,
          lock: cr.lock !== false,
        });
      }
    });
  }

  return list;
}

/**
 * Extrait la liste des vidéos d'une séance (`v`, `y`, `video`, `videoUrl`, `seances: [...]`).
 */
export function getSessionVideos(c) {
  if (!c) return [];
  if (typeof c === "string") {
    const u = cleanUrl(c);
    return u ? [{ label: "Regarder", url: u }] : [];
  }
  if (typeof c !== "object") return [];

  const list = [];
  const seen = new Set();

  const pushVid = (item, idx) => {
    if (!item) return;
    const u = cleanUrl(
      typeof item === "string"
        ? item
        : item.url || item.v || item.y || item.video || item.videoUrl || item.video_url || item.replayUrl || item.youtube
    );
    if (!u || seen.has(u)) return;
    seen.add(u);
    list.push({
      label: typeof item === "object" && item.label ? item.label : `Séance ${idx + 1}`,
      url: u,
    });
  };

  if (Array.isArray(c.seances) && c.seances.length > 0) {
    c.seances.forEach(pushVid);
  } else if (Array.isArray(c.v) && c.v.length > 0) {
    c.v.forEach(pushVid);
  } else if (Array.isArray(c.video) && c.video.length > 0) {
    c.video.forEach(pushVid);
  }

  const primary = cleanUrl(
    (typeof c.v === "string" && c.v) ||
      (typeof c.y === "string" && c.y) ||
      (typeof c.video === "string" && c.video) ||
      c.videoUrl ||
      c.video_url ||
      c.replayUrl ||
      c.replay_url ||
      c.youtube ||
      c.vid ||
      ""
  );
  if (primary && !seen.has(primary)) {
    list.unshift({ label: list.length > 0 ? "Séance 1" : "Regarder", url: primary });
  }

  return list;
}

/**
 * Extrait les corrections d'un TD / exercice (`corr` ou `correction`, string ou tableau).
 */
export function getTdCorrections(t) {
  if (!t || typeof t !== "object") return [];
  const raw = t.corr ?? t.correction ?? t.correctionUrl ?? t.correction_url ?? null;
  if (!raw) return [];
  if (typeof raw === "string") {
    const u = cleanUrl(raw);
    return u ? [{ label: "Correction", url: u }] : [];
  }
  if (Array.isArray(raw)) {
    return raw
      .map((c, idx) => {
        if (typeof c === "string") {
          const u = cleanUrl(c);
          return u ? { label: `Correction ${idx + 1}`, url: u } : null;
        }
        if (c && typeof c === "object") {
          const u = cleanUrl(c.url || c.u);
          return u ? { label: c.label || c.t || `Correction ${idx + 1}`, url: u } : null;
        }
        return null;
      })
      .filter(Boolean);
  }
  return [];
}

/**
 * Normalise et répartit les ressources d'un chapitre en 4 catégories nettes :
 * `fiches`, `sessionsVideo`, `coursDocs`, `tds` (100% compatible Sup/Spé statique + WordPress live).
 */
export function splitChapterResources(chapter) {
  if (!chapter || typeof chapter !== "object") {
    return { fiches: [], sessionsVideo: [], coursDocs: [], tds: [] };
  }

  // 1. Fiches de synthèse
  let fiches = (Array.isArray(chapter.fiches) ? chapter.fiches : []).filter(
    (f) => f != null && (typeof f === "object" || typeof f === "string")
  );
  if (fiches.length === 0 && (chapter.fiche_url || chapter.fiche_resume_url || chapter.fiche)) {
    fiches = normalizeLinksList(chapter.fiche_url || chapter.fiche_resume_url || chapter.fiche).map((l) => ({
      t: l.label || "Fiche de résumé",
      u: l.url,
      sous: "L'essentiel du chapitre",
    }));
  }

  // 2. Cours -> split entre séances vidéo et polycopiés PDF
  const sessionsVideo = [];
  const coursDocs = [];
  const rawCours = Array.isArray(chapter.cours)
    ? chapter.cours
    : Array.isArray(chapter.sessions)
    ? chapter.sessions
    : [];

  rawCours.forEach((c) => {
    if (!c) return;
    if (typeof c === "string") {
      if (cleanUrl(c)) sessionsVideo.push({ t: "Séance vidéo", v: c });
      return;
    }
    if (typeof c !== "object") return;
    const vids = getSessionVideos(c);
    const sups = getSessionSupports(c);
    if (vids.length > 0) {
      sessionsVideo.push(c);
    } else if (sups.length > 0 || c.u !== undefined) {
      coursDocs.push(c);
    }
  });

  // 3. Tableau `videos` additionnel (ex: format Elementor `videos: [{ t, u: youtube, v: pdf }]`)
  const seenVideoUrls = new Set(sessionsVideo.flatMap((s) => getSessionVideos(s).map((v) => v.url)));
  if (Array.isArray(chapter.videos)) {
    chapter.videos.forEach((v, idx) => {
      if (!v) return;
      if (typeof v === "string") {
        const u = cleanUrl(v);
        if (u && !seenVideoUrls.has(u)) {
          seenVideoUrls.add(u);
          sessionsVideo.push({ t: `Vidéo ${idx + 1}`, sous: "Cours en vidéo & méthodes", v: u });
        }
        return;
      }
      if (typeof v !== "object") return;
      const vidUrl = cleanUrl(v.y || (isYouTubeUrl(v.u) ? v.u : "") || v.video || v.url || v.u);
      const pdfSupport =
        isYouTubeUrl(vidUrl) && isUrlActive(v.v) && !isYouTubeUrl(v.v)
          ? cleanUrl(v.v)
          : cleanUrl(v.support || v.pdf || "");
      const finalVidUrl = vidUrl || cleanUrl(v.v);
      if (finalVidUrl && !seenVideoUrls.has(finalVidUrl)) {
        seenVideoUrls.add(finalVidUrl);
        sessionsVideo.push({
          t: v.t || v.titre || `Vidéo ${idx + 1}`,
          sous: v.sous || "Cours en vidéo & méthodes",
          v: finalVidUrl,
          u: pdfSupport,
          supports: v.supports,
          seances: v.seances,
          cover: v.cover,
        });
      }
    });
  }

  // Fallback chapitre simple avec `video_url` unique (ex: MPSI / PCSI / TSI statique)
  if (isUrlActive(chapter.video_url) && !seenVideoUrls.has(cleanUrl(chapter.video_url))) {
    sessionsVideo.push({
      t: chapter.titre || "Séance vidéo du chapitre",
      sous: chapter.video_duration ? `Explication complète · ${chapter.video_duration}` : "Explication complète & méthodes",
      v: cleanUrl(chapter.video_url),
    });
  }

  // 4. TD / DL / Exercices
  const rawTds = Array.isArray(chapter.tds)
    ? chapter.tds
    : Array.isArray(chapter.items)
    ? chapter.items
    : [];
  const tds = rawTds.filter((t) => t && typeof t === "object");

  // Fallback chapitre simple avec `enonce_url` / `correction_url`
  if (tds.length === 0 && (isUrlActive(chapter.enonce_url) || isUrlActive(chapter.correction_url))) {
    tds.push({
      t: `Fiche d'exercices — ${chapter.titre || "TD"}`,
      sous: "Énoncé d'entraînement & correction détaillée",
      exo: cleanUrl(chapter.enonce_url),
      corr: cleanUrl(chapter.correction_url),
    });
  }

  return { fiches, sessionsVideo, coursDocs, tds };
}

/**
 * Calcule les compteurs de ressources disponibles pour un chapitre (pastilles + stats globales).
 */
export function computeChapterCounts(chapter) {
  const { fiches, sessionsVideo, coursDocs, tds } = splitChapterResources(chapter);

  let coursActive = 0;
  let videoCount = 0;

  coursDocs.forEach((c) => {
    if (getSessionSupports(c).length > 0) coursActive++;
  });
  sessionsVideo.forEach((s) => {
    if (getSessionSupports(s).length > 0) coursActive++;
    videoCount += Math.max(1, getSessionVideos(s).length);
  });

  let fichesActive = 0;
  fiches.forEach((f) => {
    const u = typeof f === "string" ? f : f?.u || f?.url;
    if (isUrlActive(u)) fichesActive++;
  });

  let tdsActive = 0;
  tds.forEach((t) => {
    const corrs = getTdCorrections(t);
    const exo = cleanUrl(t.exo || t.enonce || t.enonce_url || t.u);
    const vid = cleanUrl(t.video || t.v || t.video_url);
    if (exo || corrs.length > 0) tdsActive++;
    if (vid) videoCount++;
  });

  return {
    totalCours: coursDocs.length + sessionsVideo.length,
    coursActive,
    totalFiches: fiches.length,
    fichesActive,
    totalTds: tds.length,
    tdsActive,
    videoCount,
  };
}

export function computeBranchStats(chapters = [], livres = []) {
  let crs = 0;
  let fch = 0;
  let td = 0;
  let vid = 0;

  (chapters || []).forEach((ch) => {
    if (!ch || typeof ch !== "object") return;
    const c = computeChapterCounts(ch);
    crs += c.coursActive;
    fch += c.fichesActive;
    td += c.tdsActive;
    vid += c.videoCount;
  });

  const liv = (livres || []).filter((l) => l && typeof l === "object" && isUrlActive(l.lien || l.url)).length;

  return {
    chapitres: chapters.length,
    cours: crs,
    fiches: fch,
    tds: td,
    videos: vid,
    livres: liv,
  };
}
