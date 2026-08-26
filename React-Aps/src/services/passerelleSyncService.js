import { PASSERELLE_DATA } from "../data/passerelleData.js";

const CACHE_KEY = "passerelle_live_data";
const CACHE_TIMESTAMP_KEY = "passerelle_last_synced";

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

  const trimmed = payloadText.trim();

  // If payload is already a JSON array or object
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.filieres)) return parsed.filieres;
      if (parsed && Array.isArray(parsed.data)) return parsed.data;
    } catch (e) {
      // Continue to HTML parsing
    }
  }

  // Parse HTML for <script id="passerelle-data" ...>
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(payloadText, "text/html");
    const scriptTag = doc.getElementById("passerelle-data");

    if (scriptTag && scriptTag.textContent) {
      const parsed = JSON.parse(scriptTag.textContent.trim());
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.filieres)) return parsed.filieres;
    }
  } catch (e) {
    // Fallback to regex extraction
  }

  // Fallback regex match for <script id="passerelle-data"...>...</script>
  try {
    const match = payloadText.match(/<script[^>]*id=["']passerelle-data["'][^>]*>([\s\S]*?)<\/script>/i);
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
 */
export async function syncPasserelleFromWordPress(customUrl = null) {
  const wpUrl =
    customUrl ||
    import.meta.env.VITE_WP_PASSERELLE_URL ||
    (typeof window !== "undefined" && window.__WP_PASSERELLE_URL__) ||
    null;

  if (!wpUrl) {
    return { success: false, reason: "NO_WP_URL" };
  }

  try {
    const response = await fetch(wpUrl, {
      method: "GET",
      headers: {
        Accept: "application/json, text/html, */*",
      },
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const text = await response.text();
    const rawFilieres = parsePasserellePayload(text);

    if (rawFilieres && Array.isArray(rawFilieres) && rawFilieres.length > 0) {
      const normalizedFilieres = normalizeLiveFilieres(rawFilieres);
      const now = new Date().toISOString();

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          filieres: normalizedFilieres,
          updatedAt: now,
        })
      );
      localStorage.setItem(CACHE_TIMESTAMP_KEY, now);

      return {
        success: true,
        filieres: normalizedFilieres,
        lastSynced: now,
      };
    } else {
      throw new Error("No valid passerelle-data payload found in WordPress response");
    }
  } catch (err) {
    console.warn("[PasserelleSync] Could not sync live data from WordPress:", err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}
