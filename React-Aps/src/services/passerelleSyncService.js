import { PASSERELLE_DATA } from "../data/passerelleData.js";
import { extractYouTubeId } from "../utils/driveUtils.js";

const CACHE_KEY = "passerelle_live_data";
const CACHE_TIMESTAMP_KEY = "passerelle_last_synced";

/**
 * Decodes common HTML entities before parsing extracted JS blocks.
 */
function decodeHtmlEntities(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#34;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&nbsp;/g, " ");
}

/**
 * Safely evaluates a JS object/array literal extracted from a script tag.
 */
function safeEvalLiteral(codeStr) {
  if (!codeStr || typeof codeStr !== "string") return null;
  const decoded = decodeHtmlEntities(codeStr);
  const trimmed = decoded.trim().replace(/;$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    try {
      const fn = new Function(`return (${trimmed});`);
      return fn();
    } catch (e) {
      console.warn("[PasserelleSync] Failed to evaluate JS literal:", e);
      return null;
    }
  }
}

/**
 * Extracts a JavaScript variable (e.g. var FILIERES = [...]; or var DATA = {...};)
 * from HTML content using bracket matching.
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
 * Normalizes live JSON filières array into the format expected by the React app.
 * Preserves partial items (e.g. séances with only PDF, or only video, or multi-part corrections).
 */
export function normalizeLiveFilieres(filieres) {
  if (!Array.isArray(filieres)) return [];

  return filieres.map((f) => {
    const nom = f.nom || f.id || "Filière";
    const cleanId = (f.id || f.nom || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    const defaultDe =
      cleanId === "mp"
        ? "MPSI"
        : cleanId === "psi"
        ? "PCSI / MPSI"
        : cleanId === "tsi"
        ? "TSI 1"
        : cleanId === "ecs"
        ? "ECS 1"
        : cleanId === "ect"
        ? "ECT 1"
        : nom;

    const defaultVers =
      cleanId === "mp"
        ? "MP"
        : cleanId === "psi"
        ? "PSI"
        : cleanId === "tsi"
        ? "TSI 2"
        : cleanId === "ecs"
        ? "ECS 2"
        : cleanId === "ect"
        ? "ECT 2"
        : nom;

    const defaultIcon =
      cleanId === "mp"
        ? "∑"
        : cleanId === "psi"
        ? "∫"
        : cleanId === "tsi"
        ? "T"
        : cleanId === "ecs"
        ? "E"
        : cleanId === "ect"
        ? "€"
        : f.icon || "∑";

    return {
      id: cleanId || "filiere",
      nom: nom,
      de: f.de || defaultDe,
      vers: f.vers || defaultVers,
      icon: f.icon || defaultIcon,
      chapitres: Array.isArray(f.chapitres)
        ? f.chapitres.map((c, cIdx) => ({
            id: c.id || `${cleanId}-chap-${cIdx + 1}`,
            titre: c.titre || `Chapitre ${cIdx + 1}`,
            why: c.why || "",
            fiche: c.fiche || c.ficheUrl || c.fiche_url || null,
            items: Array.isArray(c.items)
              ? c.items.map((it, itIdx) => {
                  const videoUrl =
                    it.video ||
                    it.videoUrl ||
                    it.video_url ||
                    it.replayUrl ||
                    it.replay_url ||
                    it.youtube ||
                    it.youtubeId ||
                    it.v ||
                    it.vid ||
                    null;
                  const enonceUrl = it.enonce || it.enonceUrl || it.enonce_url || it.sujet || null;
                  const corrUrl = it.correction || it.correctionUrl || it.correction_url || it.corr || null;
                  const thumb = it.thumbnail || it.thumbnailUrl || it.thumbnail_url || it.cover || it.thumb || null;
                  const ytId = extractYouTubeId(typeof videoUrl === "string" ? videoUrl : null);
                  const finalThumb = thumb || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null);

                  return {
                    id: it.id || `${cleanId}-item-${cIdx + 1}-${itIdx + 1}`,
                    titre: it.titre || it.title || `Fiche ${itIdx + 1}`,
                    enonce: enonceUrl,
                    enonce_url: enonceUrl,
                    correction: corrUrl,
                    correction_url: corrUrl,
                    video: videoUrl,
                    video_url: videoUrl,
                    videoUrl: videoUrl,
                    youtubeId: ytId,
                    thumbnail: finalThumb,
                    thumbnailUrl: finalThumb,
                    sous: it.sous || null,
                  };
                })
              : [],
            seances: Array.isArray(c.seances)
              ? c.seances.map((s, sIdx) => {
                  const videoUrl =
                    s.video ||
                    s.videoUrl ||
                    s.video_url ||
                    s.replayUrl ||
                    s.replay_url ||
                    s.youtube ||
                    s.youtubeId ||
                    s.youtube_id ||
                    s.v ||
                    s.vid ||
                    s.url ||
                    null;
                  const supportUrl =
                    s.support ||
                    s.supportUrl ||
                    s.support_url ||
                    s.pdf ||
                    s.pdfUrl ||
                    s.pdf_url ||
                    s.fiche ||
                    s.u ||
                    null;
                  const thumb =
                    s.thumbnail ||
                    s.thumbnailUrl ||
                    s.thumbnail_url ||
                    s.cover ||
                    s.thumb ||
                    null;
                  const ytId = extractYouTubeId(typeof videoUrl === "string" ? videoUrl : null);
                  const finalThumb =
                    thumb || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null);

                  return {
                    id: s.id || `${cleanId}-seance-${cIdx + 1}-${sIdx + 1}`,
                    titre: s.titre || s.title || `Séance ${sIdx + 1}`,
                    video: videoUrl,
                    video_url: videoUrl,
                    videoUrl: videoUrl,
                    youtubeId: ytId,
                    support: supportUrl,
                    support_url: supportUrl,
                    supportUrl: supportUrl,
                    thumbnail: finalThumb,
                    thumbnailUrl: finalThumb,
                    sous: s.sous || s.description || s.desc || (videoUrl ? "Théorie & Replay interactif" : "Support de cours PDF"),
                  };
                })
              : [],
          }))
        : [],
      livres: Array.isArray(f.livres)
        ? f.livres.map((l) => ({
            titre: l.titre || "Ouvrage",
            auteur: l.auteur || "",
            lien: l.lien || l.url || "",
            cover: l.cover || l.cover_url || null,
          }))
        : [],
    };
  });
}

/**
 * Parses Passerelle payload from raw JSON, extracted JS variables, or <script> tags.
 */
export function parsePasserellePayload(payloadText) {
  if (!payloadText || typeof payloadText !== "string") return null;

  const trimmed = payloadText.trim();

  // 1. Direct JSON array / object (Parse WITHOUT pre-decoding HTML entities on raw JSON)
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && parsed[0]?.content?.rendered) {
          return parsePasserellePayload(parsed[0].content.rendered);
        }
        // Direct array of filières
        if (parsed.length > 0 && (parsed[0].nom || parsed[0].chapitres || parsed[0].id)) {
          return parsed;
        }
      }
      if (parsed && Array.isArray(parsed.filieres)) return parsed.filieres;
      if (parsed && Array.isArray(parsed.data)) return parsed.data;
      if (parsed && parsed.content?.rendered) {
        return parsePasserellePayload(parsed.content.rendered);
      }
    } catch (e) {
      console.warn("[PasserelleSync] Direct JSON parse attempt failed, trying extraction:", e.message);
    }
  }

  // 2. Extract `FILIERES` JavaScript variable (Primary WordPress Elementor format)
  const rawFILIERES = extractJsVariable(payloadText, "FILIERES");
  if (rawFILIERES && Array.isArray(rawFILIERES) && rawFILIERES.length > 0) {
    return rawFILIERES;
  }

  // 3. Extract `DATA` or `PASSERELLE_DATA`
  const rawDATA = extractJsVariable(payloadText, "DATA");
  if (rawDATA) {
    if (Array.isArray(rawDATA)) return rawDATA;
    if (Array.isArray(rawDATA.filieres)) return rawDATA.filieres;
  }

  const rawPASSERELLE = extractJsVariable(payloadText, "PASSERELLE_DATA");
  if (rawPASSERELLE) {
    if (Array.isArray(rawPASSERELLE)) return rawPASSERELLE;
    if (Array.isArray(rawPASSERELLE.filieres)) return rawPASSERELLE.filieres;
  }

  // 4. Extract <script id="passerelle-data" type="application/json"> via DOMParser
  if (typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(payloadText, "text/html");
      const scriptTag = doc.getElementById("passerelle-data");

      if (scriptTag && scriptTag.textContent) {
        const parsed = JSON.parse(scriptTag.textContent.trim());
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.filieres)) return parsed.filieres;
      }
    } catch (e) {}
  }

  // 5. Fallback regex match for <script id="passerelle-data"...>
  try {
    const match = payloadText.match(/<script[^>]*id=["']passerelle-data["'][^>]*>([\s\S]*?)<\/script>/i);
    if (match && match[1]) {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.filieres)) return parsed.filieres;
    }
  } catch (e) {
    console.warn("[PasserelleSync] Script tag regex parse failed:", e);
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
 * Fetches the latest live data from WordPress with aggressive anti-cache headers.
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

  const candidateUrls = customUrl
    ? [customUrl]
    : [
        `${cleanBaseUrl}/wp/v2/pages?slug=transition-sup-spe&status=publish&_fields=id,slug,title,content.rendered&_t=${timestamp}&_nocache=${nonce}`,
        `${cleanBaseUrl}/wp/v2/pages/4368?_fields=id,slug,title,content.rendered&_t=${timestamp}&_nocache=${nonce}`,
        `${cleanBaseUrl}/edu/v1/passerelle?_t=${timestamp}&_nonce=${nonce}`,
        `https://anasskhadir.com/transition-sup-spe/?_t=${timestamp}&_nocache=${nonce}`,
      ];

  console.info(`[PasserelleSync] 🔄 Starting live sync (force=${force})...`);

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

        const totalChapitres = normalizedFilieres.reduce((acc, f) => acc + (f.chapitres?.length || 0), 0);
        const totalItems = normalizedFilieres.reduce(
          (acc, f) => acc + (f.chapitres || []).reduce((iAcc, c) => iAcc + (c.items?.length || 0), 0),
          0
        );
        const totalSeances = normalizedFilieres.reduce(
          (acc, f) => acc + (f.chapitres || []).reduce((sAcc, c) => sAcc + (c.seances?.length || 0), 0),
          0
        );
        const totalLivres = normalizedFilieres.reduce((acc, f) => acc + (f.livres?.length || 0), 0);

        console.info(
          `[PasserelleSync] ✅ Live WordPress data successfully parsed from ${url} (${normalizedFilieres.length} filières, ${totalChapitres} chapitres, ${totalItems} fiches/exercices, ${totalSeances} séances, ${totalLivres} livres).`
        );

        return {
          success: true,
          filieres: normalizedFilieres,
          lastSynced: now,
        };
      }
    } catch (err) {
      console.warn(`[PasserelleSync] Error fetching from ${url}:`, err.message);
    }
  }

  console.warn("[PasserelleSync] ⚠️ Live parse failed across all candidate endpoints. Falling back to local bundled data.");
  return {
    success: false,
    reason: "NO_PASSERELLE_PAYLOAD_FOUND",
    filieres: PASSERELLE_DATA.filieres,
  };
}
