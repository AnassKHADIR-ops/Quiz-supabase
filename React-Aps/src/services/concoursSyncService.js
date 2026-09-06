import { useState, useEffect, useCallback } from "react";
import { DEFAULT_CONCOURS } from "../data/concoursData.js";

const CACHE_KEY = "concours_live_data";
const CACHE_TIMESTAMP_KEY = "concours_last_synced";

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
      console.warn("[ConcoursSync] Failed to evaluate literal:", e);
      return null;
    }
  }
}

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
    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        const rawBlock = htmlContent.slice(actualOpenPos, i + 1);
        return safeEvalLiteral(rawBlock);
      }
    }
  }
  return null;
}

export function parseConcoursPayload(rawPayload) {
  if (!rawPayload) return null;
  if (Array.isArray(rawPayload)) return rawPayload;
  if (typeof rawPayload === "object" && Array.isArray(rawPayload.CONCOURS)) {
    return rawPayload.CONCOURS;
  }

  if (typeof rawPayload === "string") {
    try {
      const parsed = JSON.parse(rawPayload);
      if (Array.isArray(parsed)) return parsed;
      if (parsed?.content?.rendered) {
        return parseConcoursPayload(parsed.content.rendered);
      }
    } catch {}

    const extracted = extractJsVariable(rawPayload, "CONCOURS");
    if (Array.isArray(extracted)) return extracted;
  }
  return null;
}

export async function fetchLiveConcours({ force = false, customUrl = null } = {}) {
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
        `${cleanBaseUrl}/wp/v2/pages?slug=concours-annales&status=publish&_fields=id,slug,title,content.rendered&_t=${timestamp}&_nocache=${nonce}`,
        `https://anasskhadir.com/concours-annales/?_t=${timestamp}&_nocache=${nonce}`,
      ];

  console.info(`[ConcoursSync] 🔄 Starting live sync from Elementor/WordPress...`);

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: antiCacheHeaders,
        cache: "no-store",
      });

      if (!response.ok) continue;

      const text = await response.text();
      const rawConcours = parseConcoursPayload(text);

      if (rawConcours && Array.isArray(rawConcours) && rawConcours.length > 0) {
        const now = new Date().toISOString();
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              concours: rawConcours,
              updatedAt: now,
            })
          );
          localStorage.setItem(CACHE_TIMESTAMP_KEY, now);
        } catch (e) {
          console.warn("[ConcoursSync] Failed to cache live data:", e);
        }

        console.info(`[ConcoursSync] ✅ Live sync successful via ${url}! (${rawConcours.length} blocs concours)`);
        return {
          concours: rawConcours,
          lastSynced: now,
          isLive: true,
        };
      }
    } catch (err) {
      console.warn(`[ConcoursSync] URL ${url} failed:`, err);
    }
  }

  console.warn("[ConcoursSync] ⚠️ All remote URLs failed, keeping cached or default data.");
  return null;
}

export function useConcoursSync() {
  const [concoursList, setConcoursList] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed?.concours) && parsed.concours.length > 0) {
          return parsed.concours;
        }
      }
    } catch {}
    return DEFAULT_CONCOURS;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isLive, setIsLive] = useState(() => {
    try {
      return !!localStorage.getItem(CACHE_TIMESTAMP_KEY);
    } catch {
      return false;
    }
  });
  const [lastSynced, setLastSynced] = useState(() => {
    try {
      return localStorage.getItem(CACHE_TIMESTAMP_KEY) || null;
    } catch {
      return null;
    }
  });

  const refreshSync = useCallback(async (force = true) => {
    setIsSyncing(true);
    try {
      const result = await fetchLiveConcours({ force });
      if (result?.concours) {
        setConcoursList(result.concours);
        setIsLive(true);
        setLastSynced(result.lastSynced);
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    refreshSync(false);
  }, [refreshSync]);

  return {
    concoursList,
    isSyncing,
    isLive,
    lastSynced,
    refreshSync,
  };
}
