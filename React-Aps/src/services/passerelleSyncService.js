import { PASSERELLE_DATA } from "../data/passerelleData.js";

const CACHE_KEY = "passerelle_live_data";
const CACHE_TIMESTAMP_KEY = "passerelle_last_synced";

/**
 * Normalizes live JSON filières array into the format expected by the React app.
 */
/**
 * Decodes common HTML entities before parsing extracted JS blocks.
 */
function decodeHtmlEntities(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"');
}

/**
 * Normalizes live JSON filières array into the format expected by the React app.
 */
export function normalizeLiveFilieres(filieres) {
  if (!Array.isArray(filieres)) return [];

  return filieres.map((f) => {
    const nom = f.nom || f.id || "Filière";
    const id = (f.id || f.nom || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    return {
      id: id || "filiere",
      nom: nom,
      de: f.de || nom,
      vers: f.vers || nom,
      icon: f.icon || "∑",
      chapitres: Array.isArray(f.chapitres)
        ? f.chapitres.map((c, cIdx) => ({
            id: c.id || `${id}-chap-${cIdx + 1}`,
            titre: c.titre || `Chapitre ${cIdx + 1}`,
            why: c.why || "",
            fiche: c.fiche || null,
            items: Array.isArray(c.items)
              ? c.items.map((it, itIdx) => ({
                  id: it.id || `${id}-item-${cIdx + 1}-${itIdx + 1}`,
                  titre: it.titre || `Fiche ${itIdx + 1}`,
                  enonce: it.enonce || null,
                  correction: it.correction || null,
                  video: it.video || null,
                }))
              : [],
            seances: Array.isArray(c.seances)
              ? c.seances.map((s, sIdx) => ({
                  id: s.id || `${id}-seance-${cIdx + 1}-${sIdx + 1}`,
                  titre: s.titre || `Séance ${sIdx + 1}`,
                  video: s.video || null,
                  support: s.support || null,
                }))
              : [],
          }))
        : [],
      livres: Array.isArray(f.livres)
        ? f.livres.map((l) => ({
            titre: l.titre || "Ouvrage",
            auteur: l.auteur || "",
            lien: l.lien || "",
            cover: l.cover || null,
          }))
        : [],
    };
  });
}

/**
 * Parses <script id="passerelle-data" type="application/json"> from an HTML string or parses raw JSON.
 */
export function parsePasserellePayload(payloadText) {
  if (!payloadText || typeof payloadText !== "string") return null;

  const decoded = decodeHtmlEntities(payloadText);
  const trimmed = decoded.trim();

  // If payload is already a JSON array or object
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        // If it's a list of WP pages, look for passerelle content
        if (parsed.length > 0 && parsed[0].content?.rendered) {
          return parsePasserellePayload(parsed[0].content.rendered);
        }
        return parsed;
      }
      if (parsed && Array.isArray(parsed.filieres)) return parsed.filieres;
      if (parsed && Array.isArray(parsed.data)) return parsed.data;
      if (parsed && parsed.content?.rendered) {
        return parsePasserellePayload(parsed.content.rendered);
      }
    } catch (e) {
      // Continue to HTML parsing
    }
  }

  // Check for JavaScript variables in Elementor (var DATA = ... or var PASSERELLE_DATA = ...)
  try {
    const varMatch = decoded.match(/(?:var|let|const|window\.)\s*(?:DATA|PASSERELLE_DATA)\s*=\s*([\s\S]*?);/i);
    if (varMatch && varMatch[1]) {
      const fn = new Function(`return (${varMatch[1].trim()});`);
      const evaluated = fn();
      if (Array.isArray(evaluated)) return evaluated;
      if (evaluated && Array.isArray(evaluated.filieres)) return evaluated.filieres;
      if (evaluated && Array.isArray(evaluated.chapitres)) return evaluated.chapitres;
    }
  } catch (e) {
    // Continue to DOM parsing
  }

  // Parse HTML for <script id="passerelle-data" ...>
  if (typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(decoded, "text/html");
      const scriptTag = doc.getElementById("passerelle-data");

      if (scriptTag && scriptTag.textContent) {
        const parsed = JSON.parse(scriptTag.textContent.trim());
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.filieres)) return parsed.filieres;
      }
    } catch (e) {
      // Fallback to regex extraction
    }
  }

  // Fallback regex match for <script id="passerelle-data"...>...</script>
  try {
    const match = decoded.match(/<script[^>]*id=["']passerelle-data["'][^>]*>([\s\S]*?)<\/script>/i);
    if (match && match[1]) {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.filieres)) return parsed.filieres;
    }
  } catch (e) {
    console.warn("[PasserelleSync] Failed to parse script payload:", e);
  }

  return null;
}

/**
 * Gets cached data from localStorage or falls back to bundled PASSERELLE_DATA.
 */
export function getInitialPasserelleData() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.filieres) && parsed.filieres.length > 0) {
        return {
          ...PASSERELLE_DATA,
          filieres: parsed.filieres,
          _isLive: true,
          _lastSynced: localStorage.getItem(CACHE_TIMESTAMP_KEY) || null,
        };
      }
    }
  } catch (e) {
    console.warn("[PasserelleSync] Failed to read cached data:", e);
  }

  return {
    ...PASSERELLE_DATA,
    _isLive: false,
    _lastSynced: null,
  };
}

/**
 * Fetches the latest live data from the WordPress/Elementor URL.
 * Uses aggressive anti-cache headers & multi-endpoint fallback.
 */
export async function syncPasserelleFromWordPress(customUrl = null, force = true) {
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

  // List of candidate endpoints to probe in sequence
  const candidateUrls = customUrl
    ? [customUrl]
    : [
        // 1. Dedicated custom REST endpoint if plugin/snippet installed
        `${cleanBaseUrl}/edu/v1/passerelle?_t=${timestamp}&_nonce=${nonce}`,
        // 2. Standard WordPress REST API page with slug transition-sup-spe
        `${cleanBaseUrl}/wp/v2/pages?slug=transition-sup-spe&status=publish&_fields=id,slug,title,content.rendered&_t=${timestamp}&_nocache=${nonce}`,
        // 3. Fallback direct page HTML
        `https://anasskhadir.com/transition-sup-spe/?_t=${timestamp}`,
      ];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: antiCacheHeaders,
        cache: "no-store",
      });

      if (!response.ok) continue;

      const text = await response.text();
      const rawFilieres = parsePasserellePayload(text);

      if (rawFilieres && Array.isArray(rawFilieres) && rawFilieres.length > 0) {
        const normalizedFilieres = normalizeLiveFilieres(rawFilieres);
        const now = new Date().toISOString();

        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              filieres: normalizedFilieres,
              updatedAt: now,
            })
          );
          localStorage.setItem(CACHE_TIMESTAMP_KEY, now);
        } catch (e) {}

        return {
          success: true,
          filieres: normalizedFilieres,
          lastSynced: now,
        };
      }
    } catch (err) {
      // Continue to next candidate URL
    }
  }

  return {
    success: false,
    reason: "NO_PASSERELLE_PAYLOAD_FOUND",
    filieres: PASSERELLE_DATA.filieres,
  };
}

