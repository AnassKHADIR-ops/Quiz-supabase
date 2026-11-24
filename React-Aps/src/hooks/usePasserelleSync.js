import { useState, useEffect, useCallback, useRef } from "react";
import {
  getInitialPasserelleData,
  syncPasserelleFromWordPress,
  sanitizePasserelleFilieres,
} from "../services/passerelleSyncService.js";

const CACHE_KEY = "passerelle_live_data";

export function usePasserelleSync(wpUrl = null, pollIntervalMs = 10000) {
  const [data, setData] = useState(() => getInitialPasserelleData());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const inFlightRef = useRef(false);
  const fingerprintRef = useRef("");

  if (!fingerprintRef.current && data?.filieres) {
    fingerprintRef.current = JSON.stringify(data.filieres);
  }

  const refreshSync = useCallback(
    async (customUrl = null, force = false) => {
      if (inFlightRef.current && !force) return null;
      inFlightRef.current = true;
      setIsSyncing(true);
      setSyncError(null);

      try {
        const result = await syncPasserelleFromWordPress(customUrl || wpUrl, force);

        if (result.success && result.filieres) {
          const newFingerprint = JSON.stringify(result.filieres);
          if (newFingerprint !== fingerprintRef.current || force) {
            fingerprintRef.current = newFingerprint;
            setData((prev) => ({
              ...prev,
              filieres: result.filieres,
              _isLive: true,
              _lastSynced: result.lastSynced,
            }));
            console.info("[usePasserelleSync] ⚡ Live WordPress change detected and applied!");
          } else {
            setData((prev) => ({
              ...prev,
              _lastSynced: result.lastSynced,
            }));
          }
        } else if (result.error) {
          setSyncError(result.error);
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
          if (parsed && Array.isArray(parsed.filieres)) {
            const sanitized = sanitizePasserelleFilieres(parsed.filieres);
            if (sanitized.length > 0) {
              const newFingerprint = JSON.stringify(sanitized);
              if (newFingerprint !== fingerprintRef.current) {
                fingerprintRef.current = newFingerprint;
                setData((prev) => ({
                  ...prev,
                  filieres: sanitized,
                  _isLive: true,
                  _lastSynced: parsed.updatedAt || new Date().toISOString(),
                }));
                console.info("[usePasserelleSync] 🔄 Synchronized from another active browser tab.");
              }
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
    passerelleData: data,
    isSyncing,
    isLive: Boolean(data._isLive),
    lastSynced: data._lastSynced,
    syncError,
    refreshSync,
  };
}
