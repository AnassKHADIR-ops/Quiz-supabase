import { useState, useEffect, useCallback, useRef } from "react";
import {
  getInitialCurriculumData,
  syncCoursesFromWordPress,
} from "../services/coursesSyncService.js";

const CACHE_KEY = "courses_live_curriculum";

export function useCoursesSync(customWpUrl = null, pollIntervalMs = 15000) {
  const [state, setState] = useState(() => getInitialCurriculumData());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const inFlightRef = useRef(false);
  const fingerprintRef = useRef("");

  if (!fingerprintRef.current && state?.curriculum) {
    fingerprintRef.current = JSON.stringify(state.curriculum);
  }

  const refreshSync = useCallback(
    async (url = null, force = false) => {
      if (inFlightRef.current && !force) return null;
      inFlightRef.current = true;
      setIsSyncing(true);
      setSyncError(null);

      try {
        const result = await syncCoursesFromWordPress(url || customWpUrl, force);

        if (result.success && result.curriculum) {
          const newFingerprint = JSON.stringify(result.curriculum);
          if (newFingerprint !== fingerprintRef.current || force) {
            fingerprintRef.current = newFingerprint;
            setState({
              curriculum: result.curriculum,
              _isLive: true,
              _lastSynced: result.lastSynced,
            });
            console.info("[useCoursesSync] ⚡ Live WordPress curriculum updated!");
          } else {
            setState((prev) => ({
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
    [customWpUrl]
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
          if (parsed && (parsed.annee1 || parsed.annee2)) {
            const newFingerprint = JSON.stringify(parsed);
            if (newFingerprint !== fingerprintRef.current) {
              fingerprintRef.current = newFingerprint;
              setState({
                curriculum: parsed,
                _isLive: true,
                _lastSynced: new Date().toISOString(),
              });
              console.info("[useCoursesSync] 🔄 Synchronized from another active browser tab.");
            }
          }
        } catch (err) {}
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);

    // 4. Active periodic heartbeat polling while tab is open (default: every 15 seconds)
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
    curriculum: state.curriculum,
    isSyncing,
    isLive: Boolean(state._isLive),
    lastSynced: state._lastSynced,
    syncError,
    refreshSync,
  };
}
