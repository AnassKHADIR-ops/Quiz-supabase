import { useState, useEffect, useCallback } from "react";
import { DEFAULT_CONCOURS } from "../data/concoursData.js";

const CACHE_KEY = "concours_live_data";
const CACHE_TIMESTAMP_KEY = "concours_last_synced";

import {
  decodeHtmlEntities,
  extractJsVariable,
  safeParseJsLiteral,
  safeEvalLiteral,
} from "./wpSyncUtils.js";

export { extractJsVariable };

export function parseConcoursPayload(rawPayload) {
  if (!rawPayload) return null;

  if (Array.isArray(rawPayload)) {
    // If it's a valid array of concours blocks
    if (rawPayload.length > 0 && (rawPayload[0]?.sujets || rawPayload[0]?.titre)) {
      return rawPayload;
    }
    // If it's a WordPress REST API response: [{ id: ..., content: { rendered: ... } }]
    if (rawPayload.length > 0 && rawPayload[0]?.content?.rendered) {
      return parseConcoursPayload(rawPayload[0].content.rendered);
    }
    return null;
  }

  if (typeof rawPayload === "object") {
    if (Array.isArray(rawPayload.CONCOURS)) return rawPayload.CONCOURS;
    if (rawPayload.content?.rendered) {
      return parseConcoursPayload(rawPayload.content.rendered);
    }
  }

  if (typeof rawPayload === "string") {
    try {
      const parsed = JSON.parse(rawPayload);
      if (parsed) {
        const result = parseConcoursPayload(parsed);
        if (result) return result;
      }
    } catch {}

    const extracted = extractJsVariable(rawPayload, "CONCOURS");
    if (Array.isArray(extracted) && extracted.length > 0 && (extracted[0]?.sujets || extracted[0]?.titre)) {
      return extracted;
    }
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
        if (Array.isArray(parsed?.concours) && parsed.concours.length > 0 && (parsed.concours[0]?.sujets || parsed.concours[0]?.titre)) {
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
