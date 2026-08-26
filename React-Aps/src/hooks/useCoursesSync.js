import { useState, useEffect, useCallback } from "react";
import {
  getInitialCurriculumData,
  syncCoursesFromWordPress,
} from "../services/coursesSyncService.js";

export function useCoursesSync(customWpUrl = null) {
  const [state, setState] = useState(() => getInitialCurriculumData());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const refreshSync = useCallback(
    async (url = null) => {
      setIsSyncing(true);
      setSyncError(null);

      const result = await syncCoursesFromWordPress(url || customWpUrl);

      if (result.success && result.curriculum) {
        setState({
          curriculum: result.curriculum,
          _isLive: true,
          _lastSynced: result.lastSynced,
        });
      } else if (result.error) {
        setSyncError(result.error);
      }

      setIsSyncing(false);
      return result;
    },
    [customWpUrl]
  );

  // Background auto-sync on mount
  useEffect(() => {
    refreshSync();
  }, [refreshSync]);

  return {
    curriculum: state.curriculum,
    isSyncing,
    isLive: Boolean(state._isLive),
    lastSynced: state._lastSynced,
    syncError,
    refreshSync,
  };
}
