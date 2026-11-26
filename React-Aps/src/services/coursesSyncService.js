import { CPGE_CURRICULUM } from "../data/coursesBranchesData.js";

const CACHE_KEY = "courses_live_curriculum";
const CACHE_TIMESTAMP_KEY = "courses_last_synced";

import {
  decodeHtmlEntities,
  extractJsVariable,
  safeParseJsLiteral,
  safeEvalLiteral,
} from "./wpSyncUtils.js";

export { extractJsVariable };

/**
 * Removes null / malformed items from a curriculum structure (handles live WP responses & legacy localStorage cache).
 */
export function sanitizeCurriculum(raw) {
  if (!raw || typeof raw !== "object") return CPGE_CURRICULUM;

  const sanitizeList = (arr, allowString = false) =>
    Array.isArray(arr)
      ? arr.filter((x) => x != null && (typeof x === "object" || (allowString && typeof x === "string" && x.trim() !== "")))
      : [];

  const sanitizeItemWithNested = (item) => {
    if (!item || typeof item !== "object") return item;
    const out = { ...item };
    if (Array.isArray(out.supports)) {
      out.supports = out.supports.filter((x) => x && typeof x === "object");
    }
    if (Array.isArray(out.seances)) {
      out.seances = out.seances.filter((x) => x != null && (typeof x === "object" || typeof x === "string"));
    }
    if (Array.isArray(out.corr)) {
      out.corr = out.corr.filter((x) => x != null && (typeof x === "object" || typeof x === "string"));
    }
    if (Array.isArray(out.v)) {
      out.v = out.v.filter((x) => x != null && (typeof x === "object" || typeof x === "string"));
    }
    return out;
  };

  const sanitizeYear = (yrObj, fallbackYr) => {
    if (!yrObj || !Array.isArray(yrObj.branches) || yrObj.branches.length === 0) {
      return fallbackYr;
    }
    const cleanBranches = yrObj.branches
      .filter((b) => b && typeof b === "object")
      .map((b, bIdx) => ({
        ...b,
        id: b.id || `branch-${bIdx + 1}`,
        nom: b.nom || b.id || `Filière ${bIdx + 1}`,
        chapitres: sanitizeList(b.chapitres).map((ch, cIdx) => ({
          ...ch,
          id: ch.id || `${b.id || "ch"}-${ch.n ?? cIdx + 1}`,
          n: ch.n ?? cIdx + 1,
          titre: typeof ch.titre === "string" ? ch.titre : `Chapitre ${cIdx + 1}`,
          description: ch.description || ch.desc || ch.meta || "",
          cours: sanitizeList(ch.cours).map(sanitizeItemWithNested),
          sessions: Array.isArray(ch.sessions) ? sanitizeList(ch.sessions).map(sanitizeItemWithNested) : undefined,
          fiches: sanitizeList(ch.fiches, true),
          tds: sanitizeList(ch.tds).map(sanitizeItemWithNested),
          items: Array.isArray(ch.items) ? sanitizeList(ch.items).map(sanitizeItemWithNested) : undefined,
          videos: sanitizeList(ch.videos, true).map((v) => (typeof v === "object" ? sanitizeItemWithNested(v) : v)),
        })),
        livres: sanitizeList(b.livres),
      }));

    return cleanBranches.length > 0 ? { ...fallbackYr, ...yrObj, branches: cleanBranches } : fallbackYr;
  };

  return {
    ...CPGE_CURRICULUM,
    ...raw,
    annee1: sanitizeYear(raw.annee1, CPGE_CURRICULUM.annee1),
    annee2: sanitizeYear(raw.annee2, CPGE_CURRICULUM.annee2),
  };
}

/**
 * Normalizes an array of CH items from Elementor (ECT/ECS format) into the format expected by Courses.jsx.
 */
export function normalizeChArray(chList, branchId) {
  if (!Array.isArray(chList)) return [];

  return chList
    .filter((ch) => ch && typeof ch === "object")
    .map((ch, idx) => {
      const num = ch.n || ch.num || idx + 1;
      const cat = String(ch.cat || (Array.isArray(ch.tags) && ch.tags[0]) || "algebre").toLowerCase();
      const id = ch.id || `${branchId}-${num}`;

      // Normalize single links
      let fiche_url = ch.fiche_url || null;
      if (!fiche_url && typeof ch.fiche === "string") fiche_url = ch.fiche;

      let enonce_url = ch.enonce_url || null;
      let correction_url = ch.correction_url || null;
      let video_url = ch.video_url || null;

      const cleanCours = Array.isArray(ch.cours) ? ch.cours.filter((x) => x && typeof x === "object") : [];
      const cleanFiches = Array.isArray(ch.fiches)
        ? ch.fiches.filter((x) => x != null && (typeof x === "object" || typeof x === "string"))
        : [];
      const rawTds = Array.isArray(ch.tds) ? ch.tds : Array.isArray(ch.exercices) ? ch.exercices : [];
      const cleanTds = rawTds.filter((x) => x && typeof x === "object");
      const cleanVideos = Array.isArray(ch.videos)
        ? ch.videos.filter((x) => x != null && (typeof x === "object" || typeof x === "string"))
        : [];

      if (cleanTds.length > 0) {
        const premierTd = cleanTds[0];
        if (premierTd.exo) enonce_url = premierTd.exo;
        if (typeof premierTd.corr === "string" && premierTd.corr) correction_url = premierTd.corr;
      }

      const explicitFicheUrl = fiche_url;

      return {
        id,
        n: num,
        titre: ch.titre || `Chapitre ${num}`,
        cat: cat === "probabilites" ? "proba" : cat,
        badge: ch.badge || (cat === "algebre" ? "Algèbre" : cat === "analyse" ? "Analyse" : cat === "proba" || cat === "probabilites" ? "Probabilités" : cat === "geometrie" ? "Géométrie" : "Cours"),
        description: ch.description || ch.meta || ch.desc || "",
        fiche_url: explicitFicheUrl,
        enonce_url,
        correction_url,
        video_url,
        cours: cleanCours,
        fiches: cleanFiches.length > 0 ? cleanFiches : (explicitFicheUrl ? [{ t: "Fiche de résumé", sous: "L'essentiel du chapitre", u: explicitFicheUrl }] : []),
        tds: cleanTds,
        videos: cleanVideos,
      };
    });
}

/**
 * Normalizes an array of DATA.chapitres from Elementor (Informatique format).
 */
export function normalizeDataChapitres(chapitresList, branchId) {
  if (!Array.isArray(chapitresList)) return [];

  return chapitresList
    .filter((ch) => ch && typeof ch === "object")
    .map((ch, idx) => {
      const num = ch.num != null ? ch.num : idx + 1;
      const cat = Array.isArray(ch.tags) && ch.tags.length > 0 ? ch.tags[0] : "algebre";
      const id = ch.id || `${branchId}-${num}`;

      const cleanCours = Array.isArray(ch.cours) ? ch.cours.filter((c) => c && typeof c === "object") : [];
      const cleanFiches = Array.isArray(ch.fiches) ? ch.fiches.filter((f) => f && typeof f === "object") : [];
      const cleanExercices = Array.isArray(ch.exercices) ? ch.exercices.filter((e) => e && typeof e === "object") : [];
      const cleanVideos = Array.isArray(ch.videos)
        ? ch.videos.filter((v) => v != null && (typeof v === "object" || typeof v === "string"))
        : [];

      let fiche_url = null;
      if (cleanFiches.length > 0) {
        fiche_url = cleanFiches[0].pdf || cleanFiches[0].u || null;
      }

      let enonce_url = null;
      let correction_url = null;
      let video_url = null;

      if (cleanExercices.length > 0) {
        const ex = cleanExercices[0];
        enonce_url = ex.enonce || null;
        if (typeof ex.correction === "string") correction_url = ex.correction;
        else if (Array.isArray(ex.correction) && ex.correction.length > 0) correction_url = ex.correction[0]?.url || null;
        if (typeof ex.video === "string") video_url = ex.video;
      }

      return {
        id,
        n: num,
        titre: ch.titre || `Chapitre ${num}`,
        cat: cat === "probabilites" ? "proba" : cat,
        badge: "Informatique",
        description: ch.meta || ch.desc || "",
        fiche_url,
        enonce_url,
        correction_url,
        video_url,
        cours: cleanCours.map((c) => ({
          t: c.titre || c.t || "Cours",
          u: c.pdf || c.u || "",
          v: c.video || "",
          sous: c.desc || (c.niveau ? `${c.niveau} • ${c.duree || ""}` : ""),
        })),
        fiches: cleanFiches.map((f) => ({
          t: f.titre || f.t || "Fiche résumé",
          u: f.pdf || f.u || "",
          sous: "Fiche résumé",
        })),
        tds: cleanExercices.map((e) => ({
          t: e.titre || e.t || "Exercice",
          exo: e.enonce || "",
          corr: typeof e.correction === "string" ? e.correction : (Array.isArray(e.correction) && e.correction[0]?.url) || "",
          video: typeof e.video === "string" ? e.video : (Array.isArray(e.video) && e.video[0]?.url) || "",
          sous: e.temps ? `Temps estimé : ${e.temps}` : "",
        })),
        videos: cleanVideos,
      };
    });
}

/**
 * Normalizes LIVRES array.
 */
export function normalizeLivresArray(livresList) {
  if (!Array.isArray(livresList)) return [];
  return livresList
    .filter((l) => l && typeof l === "object")
    .map((l) => ({
      titre: l.titre || "Ouvrage de référence",
      auteur: l.auteur || "",
      lien: l.lien || "",
      cover: l.cover || null,
    }));
}

/**
 * Determines branch and year mapping from page slug or title.
 */
export function mapPageToBranch(slug = "", title = "") {
  const s = `${slug} ${title}`.toLowerCase();

  // Exclude non-course pages
  if (
    slug.startsWith("concours-") ||
    slug.startsWith("programmes-") ||
    slug === "home" ||
    slug === "about" ||
    slug === "contact" ||
    slug === "merci" ||
    slug === "contribution" ||
    slug === "transition-sup-spe"
  ) {
    return null;
  }

  if (s.includes("ect2") || s.includes("ect-2") || s.includes("cours-exo-ect2")) {
    return { year: "annee2", branchId: "ect2", branchNom: "ECT 2" };
  }
  if (s.includes("ect1") || s.includes("ect-1") || s.includes("cours-exo-ect1")) {
    return { year: "annee1", branchId: "ect1", branchNom: "ECT 1" };
  }
  if (s.includes("ecs2") || s.includes("ecs-2") || s.includes("cours-exo-ecs2")) {
    return { year: "annee2", branchId: "ecs2", branchNom: "ECS 2" };
  }
  if (s.includes("ecs1") || s.includes("ecs-1") || s.includes("cours-exo-ecs1")) {
    return { year: "annee1", branchId: "ecs1", branchNom: "ECS 1" };
  }
  if (s.includes("informatique") || s.includes("info-cpge") || s.includes("info-prepa")) {
    return { year: "annee1", branchId: "info", branchNom: "Informatique CPGE" };
  }
  if (s.includes("mpsi")) {
    return { year: "annee1", branchId: "mpsi", branchNom: "MPSI" };
  }
  if (s.includes("pcsi")) {
    return { year: "annee1", branchId: "pcsi", branchNom: "PCSI" };
  }
  if (s.includes("tsi1") || s.includes("tsi-1")) {
    return { year: "annee1", branchId: "tsi1", branchNom: "TSI 1" };
  }
  if (s.includes("tsi2") || s.includes("tsi-2")) {
    return { year: "annee2", branchId: "tsi2", branchNom: "TSI 2" };
  }
  if (s.includes("psi") && !s.includes("mpsi") && !s.includes("pcsi")) {
    return { year: "annee2", branchId: "psi", branchNom: "PSI" };
  }
  if (s.includes("mp") && !s.includes("mpsi")) {
    return { year: "annee2", branchId: "mp", branchNom: "MP" };
  }

  return null;
}

/**
 * Parses all WordPress pages returned by /wp-json/wp/v2/pages
 * and merges the live data into a full CPGE_CURRICULUM structure.
 */
export function parseWordPressCurriculum(pages) {
  if (!Array.isArray(pages)) return null;

  // Clone base curriculum
  const curriculum = JSON.parse(JSON.stringify(CPGE_CURRICULUM));
  let updatedAny = false;

  for (const page of pages) {
    const content = page.content?.rendered || page.content || "";
    if (!content && !page.meta?._elementor_data) continue;

    const slug = page.slug || "";
    const title = page.title?.rendered || page.title || "";
    const mapping = mapPageToBranch(slug, title);
    if (!mapping) continue;

    const { year, branchId, branchNom } = mapping;

    // 1. Try extracting `CH` (ECT/ECS format)
    const rawCH = extractJsVariable(content, "CH");
    const rawLIVRES = extractJsVariable(content, "LIVRES");

    // 2. Try extracting `DATA` (Informatique format)
    const rawDATA = extractJsVariable(content, "DATA");

    let normalizedChapitres = null;
    let normalizedLivres = null;

    if (rawCH && Array.isArray(rawCH) && rawCH.length > 0) {
      normalizedChapitres = normalizeChArray(rawCH, branchId);
      if (rawLIVRES && Array.isArray(rawLIVRES)) {
        normalizedLivres = normalizeLivresArray(rawLIVRES);
      }
    } else if (rawDATA && typeof rawDATA === "object") {
      if (Array.isArray(rawDATA.chapitres) && rawDATA.chapitres.length > 0) {
        normalizedChapitres = normalizeDataChapitres(rawDATA.chapitres, branchId);
      }
      if (Array.isArray(rawDATA.livres)) {
        normalizedLivres = normalizeLivresArray(rawDATA.livres);
      }
    }

    if (
      (normalizedChapitres && normalizedChapitres.length > 0) ||
      (normalizedLivres && normalizedLivres.length > 0)
    ) {
      updatedAny = true;
      const targetYearObj = curriculum[year] || curriculum.annee1;
      let branch = targetYearObj.branches.find((b) => b.id === branchId);

      if (!branch) {
        // Create new branch if not existing
        branch = {
          id: branchId,
          nom: branchNom,
          label: `Filière ${branchNom}`,
          badge: "Programme Officiel",
          icon: branchNom.charAt(0),
          chapitres: [],
          livres: [],
        };
        targetYearObj.branches.push(branch);
      }

      if (normalizedChapitres && normalizedChapitres.length > 0) {
        branch.chapitres = normalizedChapitres;
      }
      if (normalizedLivres && normalizedLivres.length > 0) {
        branch.livres = normalizedLivres;
      }
    }
  }

  return updatedAny ? curriculum : null;
}

function getStorageItem(key) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

function setStorageItem(key, val) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, val);
    }
  } catch (e) {
    // Ignore
  }
}

function removeStorageItem(key) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (e) {
    // Ignore
  }
}

/**
 * Returns initial cached curriculum or bundled fallback.
 */
export function getInitialCurriculumData() {
  try {
    const cached = getStorageItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const hasValidAnnee1 = Array.isArray(parsed?.annee1?.branches) && parsed.annee1.branches.length > 0;
      const hasValidAnnee2 = Array.isArray(parsed?.annee2?.branches) && parsed.annee2.branches.length > 0;
      if (parsed && (hasValidAnnee1 || hasValidAnnee2)) {
        const sanitized = sanitizeCurriculum(parsed);
        return {
          curriculum: sanitized,
          _isLive: true,
          _lastSynced: getStorageItem(CACHE_TIMESTAMP_KEY) || null,
        };
      }
      removeStorageItem(CACHE_KEY);
    }
  } catch (e) {
    console.warn("[CoursesSync] Failed to read cached curriculum:", e);
    removeStorageItem(CACHE_KEY);
  }

  return {
    curriculum: CPGE_CURRICULUM,
    _isLive: false,
    _lastSynced: null,
  };
}

/**
 * Fetches the latest live courses data from the WordPress REST API.
 * Bypasses client-side and HTTP caching with aggressive anti-cache headers & query params.
 */
export async function syncCoursesFromWordPress(customUrl = null, force = true) {
  if (force) {
    // Invalidate local cache immediately on manual refresh
    removeStorageItem(CACHE_KEY);
    removeStorageItem(CACHE_TIMESTAMP_KEY);
  }

  const baseUrl =
    customUrl ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_WP_API_URL) ||
    (typeof window !== "undefined" && window.__WP_API_URL__) ||
    "https://anasskhadir.com/wp-json";

  const cleanBaseUrl = baseUrl.replace(/\/wp\/v2\/?$/, ""); // Normalize base URL
  const nonce = Math.random().toString(36).substring(2, 9);
  const timestamp = Date.now();

  const antiCacheHeaders = {
    Accept: "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  };

  // 1. Try dedicated fast educational JSON endpoint if registered on WordPress
  try {
    const customEndpointUrl = `${cleanBaseUrl}/edu/v1/curriculum?_t=${timestamp}&_nonce=${nonce}`;
    const customResp = await fetch(customEndpointUrl, {
      method: "GET",
      headers: antiCacheHeaders,
      cache: "no-store",
    });

    if (customResp.ok) {
      const customData = await customResp.json();
      if (customData && (customData.annee1 || customData.annee2)) {
        const sanitizedCustom = sanitizeCurriculum(customData);
        const now = new Date().toISOString();
        setStorageItem(CACHE_KEY, JSON.stringify(sanitizedCustom));
        setStorageItem(CACHE_TIMESTAMP_KEY, now);
        return {
          success: true,
          curriculum: sanitizedCustom,
          lastSynced: now,
        };
      }
    }
  } catch (e) {
    // Fall back to standard WP REST API pages endpoint
  }

  // 2. Fetch via standard WordPress pages REST API with status=publish & orderby=modified
  const fetchUrl = `${cleanBaseUrl}/wp/v2/pages?status=publish&orderby=modified&order=desc&per_page=100&_fields=id,slug,title,content.rendered,modified&_t=${timestamp}&_nocache=${nonce}`;

  try {
    const response = await fetch(fetchUrl, {
      method: "GET",
      headers: antiCacheHeaders,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} (${response.statusText})`);
    }

    const pages = await response.json();
    const liveCurriculum = parseWordPressCurriculum(pages);

    if (liveCurriculum) {
      const sanitizedLive = sanitizeCurriculum(liveCurriculum);
      const now = new Date().toISOString();
      setStorageItem(CACHE_KEY, JSON.stringify(sanitizedLive));
      setStorageItem(CACHE_TIMESTAMP_KEY, now);

      return {
        success: true,
        curriculum: sanitizedLive,
        lastSynced: now,
      };
    } else {
      return {
        success: false,
        reason: "NO_PARSED_BRANCHES",
        curriculum: CPGE_CURRICULUM,
      };
    }
  } catch (err) {
    console.warn("[CoursesSync] Could not sync live courses from WordPress:", err.message);
    return {
      success: false,
      error: err.message,
      curriculum: CPGE_CURRICULUM,
    };
  }
}

