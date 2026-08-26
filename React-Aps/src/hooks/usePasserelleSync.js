import { useState, useEffect, useCallback } from "react";
import {
  getInitialPasserelleData,
  syncPasserelleFromWordPress,
} from "../services/passerelleSyncService.js";

export function usePasserelleSync(wpUrl = null) {
  const [data, setData] = useState(() => getInitialPasserelleData());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const refreshSync = useCallback(
    async (customUrl = null) => {
      setIsSyncing(true);
      setSyncError(null);

      const result = await syncPasserelleFromWordPress(customUrl || wpUrl);

      if (result.success && result.filieres) {
        setData((prev) => ({
          ...prev,
          filieres: result.filieres,
          _isLive: true,
          _lastSynced: result.lastSynced,
        }));
      } else if (result.error) {
        setSyncError(result.error);
      }

      setIsSyncing(false);
      return result;
    },
    [wpUrl]
  );

  // Background auto-sync on mount
  useEffect(() => {
    refreshSync();
  }, [refreshSync]);

  return {
    passerelleData: data,
    isSyncing,
    isLive: Boolean(data._isLive),
    lastSynced: data._lastSynced,
    syncError,
    refreshSync,
  };
}
