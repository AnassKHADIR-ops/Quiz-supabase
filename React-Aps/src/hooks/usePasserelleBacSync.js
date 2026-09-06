import { useState, useEffect, useCallback, useRef } from "react";
import {
  getInitialPasserelleBacData,
  syncPasserelleBacFromWordPress,
} from "../services/passerelleBacSyncService.js";

const CACHE_KEY = "passerelle_bac_live_data";

export function usePasserelleBacSync(wpUrl = null, pollIntervalMs = 10000) {
  const [data, setData] = useState(() => getInitialPasserelleBacData());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const inFlightRef = useRef(false);
  const fingerprintRef = useRef("");

  // Initialize fingerprint from initial data
  if (!fingerprintRef.current && data?.themes) {
    fingerprintRef.current = JSON.stringify(data.themes);
  }

  const refreshSync = useCallback(
    async (customUrl = null, force = false) => {
      // Avoid overlapping requests unless explicitly forced
      if (inFlightRef.current && !force) return null;
      inFlightRef.current = true;
      setIsSyncing(true);
      setSyncError(null);

      try {
        const result = await syncPasserelleBacFromWordPress(customUrl || wpUrl, force);

        if (result.success && result.themes) {
          const newFingerprint = JSON.stringify(result.themes);
          if (newFingerprint !== fingerprintRef.current || force) {
            fingerprintRef.current = newFingerprint;
            setData((prev) => ({
              ...prev,
              categories: result.categories || prev.categories,
              themes: result.themes,
              _isLive: true,
              _lastSynced: result.lastSynced,
            }));
            console.info("[usePasserelleBacSync] ⚡ Live WordPress change detected and applied!");
          } else {
            setData((prev) => ({
              ...prev,
              _lastSynced: result.lastSynced,
            }));
          }
        } else if (result.reason) {
          setSyncError(result.reason);
        }
        return result;
      } catch (err) {
        setSyncError(err.message);
      } finally {
        setIsSyncing(false);
        inFlightRef.current = false;
      }
    },
    [wpUrl]
  );

  // Background auto-sync, visibility change, tab focus, cross-tab storage, and periodic polling
  useEffect(() => {
    // 1. Initial sync on mount
    refreshSync(null, false);

    // 2. Immediate sync when user refocuses or returns to the browser tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshSync(null, false);
      }
    };
    const handleFocus = () => {
      refreshSync(null, false);
    };

    // 3. Multi-tab synchronization (Storage event)
    const handleStorage = (e) => {
      if (e.key === CACHE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && Array.isArray(parsed.themes)) {
            const newFingerprint = JSON.stringify(parsed.themes);
            if (newFingerprint !== fingerprintRef.current) {
              fingerprintRef.current = newFingerprint;
              setData((prev) => ({
                ...prev,
                categories: parsed.categories || prev.categories,
                themes: parsed.themes,
                _isLive: true,
                _lastSynced: parsed.updatedAt || new Date().toISOString(),
              }));
              console.info("[usePasserelleBacSync] 🔄 Synchronized from another active browser tab.");
            }
          }
        } catch (err) {}
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);

    // 4. Active periodic heartbeat polling while tab is open (default: every 10 seconds)
    let intervalId = null;
    if (pollIntervalMs > 0) {
      intervalId = setInterval(() => {
        if (!document.hidden) {
          refreshSync(null, false);
        }
      }, pollIntervalMs);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshSync, pollIntervalMs]);

  return {
    passerelleBacData: data,
    isSyncing,
    isLive: Boolean(data._isLive),
    lastSynced: data._lastSynced,
    syncError,
    refreshSync,
  };
}
