import { PASSERELLE_BAC_DATA } from "../data/passerelleBacData.js";

const CACHE_KEY = "passerelle_bac_live_data";
const CACHE_TIMESTAMP_KEY = "passerelle_bac_last_synced";

import {
  decodeHtmlEntities,
  extractJsVariable,
  safeParseJsLiteral,
  safeEvalLiteral,
} from "./wpSyncUtils.js";

export { extractJsVariable };

/**
 * Normalise les thèmes reçus en direct depuis WordPress.
 */
export function normalizeLiveBacThemes(themes) {
  if (!Array.isArray(themes)) return [];

  return themes.map((t, tIdx) => {
    const rawId = t.id || t.categorie || `theme-${tIdx + 1}`;
    const cleanId = String(rawId).toLowerCase().replace(/[^a-z0-9_-]/g, "");

    const defaultIcon = cleanId.includes("analyse")
      ? "📈"
      : cleanId.includes("algebre")
      ? "🔢"
      : "📋";

    const defaultClass = cleanId.includes("analyse")
      ? "ti-analyse"
      : cleanId.includes("algebre")
      ? "ti-algebre"
      : "ti-annales";

    const items = Array.isArray(t.items)
      ? t.items.map((item, itemIdx) => {
          const rawVideo = item.video || item.videoUrl || item.video_url || item.replayUrl || item.youtube || null;
          let normalizedVideo = null;

          if (Array.isArray(rawVideo)) {
            normalizedVideo = rawVideo.filter((v) => typeof v === "string" && v.trim() !== "");
          } else if (typeof rawVideo === "string" && rawVideo.trim() !== "") {
            normalizedVideo = rawVideo.trim();
          }

          const enonce = item.enonce || item.enonceUrl || item.sujet || item.pdf || null;
          const correction = item.correction || item.correctionUrl || item.corr || null;

          return {
            id: item.id || `${cleanId}-item-${itemIdx + 1}`,
            label: item.label || item.titre || item.title || `Exercice ${itemIdx + 1}`,
            enonce: enonce ? String(enonce).trim() : null,
            correction: correction ? String(correction).trim() : null,
            video: normalizedVideo,
            sous: item.sous || item.desc || null,
          };
        })
      : [];

    return {
      id: cleanId,
      categorie: t.categorie || cleanId,
      titre: t.titre || t.title || `Thème ${tIdx + 1}`,
      meta: t.meta || t.description || "",
      icon: t.icon || defaultIcon,
      iconClass: t.iconClass || defaultClass,
      items,
    };
  });
}

/**
 * Normalise les catégories pour les filtres.
 */
export function normalizeLiveBacCategories(categories, fallbackThemes = []) {
  if (Array.isArray(categories) && categories.length > 0) {
    return categories.map((c) => ({
      id: c.id || String(c.label || "").toLowerCase(),
      label: c.label || c.titre || c.id,
    }));
  }

  // Si non défini, déduire des thèmes
  if (Array.isArray(fallbackThemes) && fallbackThemes.length > 0) {
    return fallbackThemes.map((t) => ({
      id: t.categorie || t.id,
      label: `${t.icon ? t.icon + " " : ""}${t.titre}`,
    }));
  }

  return PASSERELLE_BAC_DATA.categories;
}

/**
 * Analyse le contenu brut d'une page WP (JSON ou HTML) pour en extraire thèmes et catégories.
 */
export function parsePasserelleBacPayload(payloadText) {
  if (!payloadText || typeof payloadText !== "string") return null;

  const trimmed = payloadText.trim();
  let contentHtml = trimmed;

  // Si c'est une réponse JSON brute de l'API WP REST
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (parsed[0]?.content?.rendered) {
          contentHtml = parsed[0].content.rendered;
        } else if (parsed[0]?.items || parsed[0]?.categorie) {
          return { themes: parsed, categories: null };
        }
      } else if (parsed?.content?.rendered) {
        contentHtml = parsed.content.rendered;
      } else if (parsed?.themes) {
        return { themes: parsed.themes, categories: parsed.categories || null };
      }
    } catch (e) {
      console.warn("[PasserelleBacSync] Direct JSON parse attempt failed:", e.message);
    }
  }

  // 1. Extraction de la variable JS THEMES
  const rawThemes = extractJsVariable(contentHtml, "THEMES");
  // 2. Extraction de la variable JS CATEGORIES
  const rawCategories = extractJsVariable(contentHtml, "CATEGORIES");

  if (rawThemes && Array.isArray(rawThemes) && rawThemes.length > 0) {
    return {
      themes: rawThemes,
      categories: rawCategories || null,
    };
  }

  return null;
}

/**
 * Récupère les données depuis le localStorage ou se rabat sur PASSERELLE_BAC_DATA.
 */
export function getInitialPasserelleBacData() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.themes) && parsed.themes.length > 0) {
        return {
          categories: parsed.categories || PASSERELLE_BAC_DATA.categories,
          themes: parsed.themes,
          _isLive: true,
          _lastSynced: localStorage.getItem(CACHE_TIMESTAMP_KEY) || null,
        };
      }
    }
  } catch (e) {
    console.warn("[PasserelleBacSync] Failed to read cached data:", e);
  }

  return {
    ...PASSERELLE_BAC_DATA,
    _isLive: false,
    _lastSynced: null,
  };
}

/**
 * Interroge l'API WordPress avec protection anti-cache.
 */
export async function syncPasserelleBacFromWordPress(customUrl = null, force = true) {
  if (force) {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (e) {}
  }

  const baseWp =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_WP_API_URL) ||
    "https://anasskhadir.com/wp-json";
  const cleanBaseUrl = baseWp.replace(/\/wp\/v2\/?$/, "");

  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 9);

  const antiCacheHeaders = {
    Accept: "application/json, text/html, */*",
    "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  };

  const candidateUrls = customUrl
    ? [customUrl]
    : [
        `${cleanBaseUrl}/wp/v2/pages?slug=concours-dentree-en-premiere-annee&status=publish&_fields=id,slug,title,content.rendered&_t=${timestamp}&_nocache=${nonce}`,
        `${cleanBaseUrl}/wp/v2/pages/4307?_fields=id,slug,title,content.rendered&_t=${timestamp}&_nocache=${nonce}`,
        `https://anasskhadir.com/concours-dentree-en-premiere-annee/?_t=${timestamp}&_nocache=${nonce}`,
      ];

  console.info(`[PasserelleBacSync] 🔄 Starting live sync (force=${force})...`);

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: antiCacheHeaders,
        cache: "no-store",
      });

      if (!response.ok) continue;

      const text = await response.text();
      const payload = parsePasserelleBacPayload(text);

      if (payload && Array.isArray(payload.themes) && payload.themes.length > 0) {
        const normalizedThemes = normalizeLiveBacThemes(payload.themes);
        const normalizedCategories = normalizeLiveBacCategories(payload.categories, normalizedThemes);
        const now = new Date().toISOString();

        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              categories: normalizedCategories,
              themes: normalizedThemes,
              updatedAt: now,
            })
          );
          localStorage.setItem(CACHE_TIMESTAMP_KEY, now);
        } catch (e) {}

        const totalItems = normalizedThemes.reduce((acc, t) => acc + (t.items?.length || 0), 0);
        console.info(
          `[PasserelleBacSync] ✅ Live WordPress data successfully parsed from ${url} (${normalizedThemes.length} thèmes, ${totalItems} exercices/sujets).`
        );

        return {
          success: true,
          categories: normalizedCategories,
          themes: normalizedThemes,
          lastSynced: now,
        };
      }
    } catch (err) {
      console.warn(`[PasserelleBacSync] Error fetching from ${url}:`, err.message);
    }
  }

  console.warn("[PasserelleBacSync] ⚠️ Live parse failed across all candidate endpoints. Falling back to local bundled data.");
  return {
    success: false,
    reason: "NO_PASSERELLE_BAC_PAYLOAD_FOUND",
    categories: PASSERELLE_BAC_DATA.categories,
    themes: PASSERELLE_BAC_DATA.themes,
  };
}
