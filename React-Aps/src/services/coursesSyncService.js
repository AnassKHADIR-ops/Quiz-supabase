import { CPGE_CURRICULUM } from "../data/coursesBranchesData.js";

const CACHE_KEY = "courses_live_curriculum";
const CACHE_TIMESTAMP_KEY = "courses_last_synced";

/**
 * Safely evaluates a JS object/array literal extracted from a script tag.
 */
function safeEvalLiteral(codeStr) {
  if (!codeStr || typeof codeStr !== "string") return null;
  const trimmed = codeStr.trim().replace(/;$/, "");
  try {
    // Try strict JSON parse first
    return JSON.parse(trimmed);
  } catch {
    try {
      // Use Function constructor for JS object literals (handling unquoted keys, comments, etc.)
      const fn = new Function(`return (${trimmed});`);
      return fn();
    } catch (e) {
      console.warn("[CoursesSync] Failed to evaluate literal:", e);
      return null;
    }
  }
}

/**
 * Extracts a JavaScript variable (e.g. var CH = [...]; or var DATA = {...}; or var LIVRES = [...];)
 * from an HTML string or script content using bracket matching.
 */
export function extractJsVariable(htmlContent, varName) {
  if (!htmlContent || typeof htmlContent !== "string") return null;

  const regex = new RegExp(`(?:var|let|const|window\\.)\\s*\\b${varName}\\b\\s*=\\s*`, "i");
  const match = regex.exec(htmlContent);
  if (!match) return null;

  const openPos = match.index + match[0].length;
  const startChar = htmlContent.slice(openPos).search(/[\[{]/);
  if (startChar === -1) return null;

  const actualOpenPos = openPos + startChar;
  const openChar = htmlContent[actualOpenPos];
  const closeChar = openChar === "[" ? "]" : "}";

  let depth = 0;
  let inString = null;
  let inComment = false;
  let inSingleLineComment = false;

  for (let i = actualOpenPos; i < htmlContent.length; i++) {
    const ch = htmlContent[i];
    const prev = htmlContent[i - 1];

    if (inSingleLineComment) {
      if (ch === "\n" || ch === "\r") inSingleLineComment = false;
      continue;
    }

    if (inComment) {
      if (prev === "*" && ch === "/") inComment = false;
      continue;
    }

    if (inString) {
      if (ch === inString && prev !== "\\") inString = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }

    if (ch === "/" && htmlContent[i + 1] === "*") {
      inComment = true;
      i++;
      continue;
    }

    if (ch === "/" && htmlContent[i + 1] === "/") {
      inSingleLineComment = true;
      i++;
      continue;
    }

    if (ch === openChar) {
      depth++;
    } else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        const rawBlock = htmlContent.slice(actualOpenPos, i + 1);
        return safeEvalLiteral(rawBlock);
      }
    }
  }

  return null;
}

/**
 * Normalizes an array of CH items from Elementor (ECT/ECS format) into the format expected by Courses.jsx.
 */
export function normalizeChArray(chList, branchId) {
  if (!Array.isArray(chList)) return [];

  return chList.map((ch, idx) => {
    const num = ch.n || ch.num || idx + 1;
    const cat = (ch.cat || (ch.tags && ch.tags[0]) || "algebre").toLowerCase();
    const id = ch.id || `${branchId}-${num}`;

    // Normalize single links
    let fiche_url = ch.fiche_url || null;
    if (!fiche_url && typeof ch.fiche === "string") fiche_url = ch.fiche;

    let enonce_url = ch.enonce_url || null;
    let correction_url = ch.correction_url || null;
    let video_url = ch.video_url || null;

    if (Array.isArray(ch.tds) && ch.tds.length > 0) {
      const premierTd = ch.tds[0];
      if (premierTd.exo) enonce_url = premierTd.exo;
      if (premierTd.corr) correction_url = premierTd.corr;
    }

    if (Array.isArray(ch.cours) && ch.cours.length > 0) {
      const premierCours = ch.cours[0];
      if (premierCours.u && !fiche_url) fiche_url = premierCours.u;
      if (premierCours.video) video_url = premierCours.video;
    }

    return {
      id,
      n: num,
      titre: ch.titre || `Chapitre ${num}`,
      cat: cat === "probabilites" ? "proba" : cat,
      badge: ch.badge || (cat === "algebre" ? "Algèbre" : cat === "analyse" ? "Analyse" : cat === "proba" ? "Probabilités" : "Cours"),
      description: ch.description || ch.meta || ch.desc || "",
      fiche_url,
      enonce_url,
      correction_url,
      video_url,
      cours: Array.isArray(ch.cours) ? ch.cours : [],
      fiches: Array.isArray(ch.fiches) ? ch.fiches : (fiche_url ? [{ t: "Fiche de résumé", u: fiche_url }] : []),
      tds: Array.isArray(ch.tds) ? ch.tds : (Array.isArray(ch.exercices) ? ch.exercices : []),
      videos: Array.isArray(ch.videos) ? ch.videos : (video_url ? [{ titre: "Vidéo d'explication", url: video_url }] : []),
    };
  });
}

/**
 * Normalizes an array of DATA.chapitres from Elementor (Informatique format).
 */
export function normalizeDataChapitres(chapitresList, branchId) {
  if (!Array.isArray(chapitresList)) return [];

  return chapitresList.map((ch, idx) => {
    const num = ch.num != null ? ch.num : idx + 1;
    const cat = Array.isArray(ch.tags) && ch.tags.length > 0 ? ch.tags[0] : "algebre";
    const id = ch.id || `${branchId}-${num}`;

    let fiche_url = null;
    if (Array.isArray(ch.fiches) && ch.fiches.length > 0) {
      fiche_url = ch.fiches[0].pdf || ch.fiches[0].u || null;
    }

    let enonce_url = null;
    let correction_url = null;
    let video_url = null;

    if (Array.isArray(ch.exercices) && ch.exercices.length > 0) {
      const ex = ch.exercices[0];
      enonce_url = ex.enonce || null;
      if (typeof ex.correction === "string") correction_url = ex.correction;
      else if (Array.isArray(ex.correction) && ex.correction.length > 0) correction_url = ex.correction[0].url || null;
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
      cours: (ch.cours || []).map((c) => ({
        t: c.titre,
        u: c.pdf || c.u || "",
        v: c.video || "",
        sous: c.desc || (c.niveau ? `${c.niveau} • ${c.duree || ""}` : ""),
      })),
      fiches: (ch.fiches || []).map((f) => ({
        t: f.titre,
        u: f.pdf || f.u || "",
        sous: "Fiche résumé",
      })),
      tds: (ch.exercices || []).map((e) => ({
        t: e.titre,
        exo: e.enonce || "",
        corr: typeof e.correction === "string" ? e.correction : (Array.isArray(e.correction) && e.correction[0]?.url) || "",
        video: typeof e.video === "string" ? e.video : (Array.isArray(e.video) && e.video[0]?.url) || "",
        sous: e.temps ? `Temps estimé : ${e.temps}` : "",
      })),
      videos: ch.videos || [],
    };
  });
}

/**
 * Normalizes LIVRES array.
 */
export function normalizeLivresArray(livresList) {
  if (!Array.isArray(livresList)) return [];
  return livresList.map((l) => ({
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
    const content = page.content?.rendered || "";
    if (!content) continue;

    const slug = page.slug || "";
    const title = page.title?.rendered || "";
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

/**
 * Returns initial cached curriculum or bundled fallback.
 */
export function getInitialCurriculumData() {
  try {
    const cached = getStorageItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && (parsed.annee1 || parsed.annee2)) {
        return {
          curriculum: parsed,
          _isLive: true,
          _lastSynced: getStorageItem(CACHE_TIMESTAMP_KEY) || null,
        };
      }
    }
  } catch (e) {
    console.warn("[CoursesSync] Failed to read cached curriculum:", e);
  }

  return {
    curriculum: CPGE_CURRICULUM,
    _isLive: false,
    _lastSynced: null,
  };
}

/**
 * Fetches the latest live courses data from the WordPress REST API.
 */
export async function syncCoursesFromWordPress(customUrl = null) {
  const baseUrl =
    customUrl ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_WP_API_URL) ||
    (typeof window !== "undefined" && window.__WP_API_URL__) ||
    "https://anasskhadir.com/wp-json/wp/v2";

  const fetchUrl = `${baseUrl}/pages?per_page=100&_t=${Date.now()}`;

  try {
    const response = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const pages = await response.json();
    const liveCurriculum = parseWordPressCurriculum(pages);

    if (liveCurriculum) {
      const now = new Date().toISOString();
      setStorageItem(CACHE_KEY, JSON.stringify(liveCurriculum));
      setStorageItem(CACHE_TIMESTAMP_KEY, now);

      return {
        success: true,
        curriculum: liveCurriculum,
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
