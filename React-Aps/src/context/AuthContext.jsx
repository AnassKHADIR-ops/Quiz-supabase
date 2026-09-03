import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { authApi } from "../api.js";
import { supabase } from "../lib/supabase.js";

const CACHE_KEY = "ak_cached_user";

function getCachedUser() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedUser(userData) {
  try {
    if (userData) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(CACHE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Synchronous optimistic restoration from localStorage cache (0ms instant render)
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(() => !getCachedUser());

  // Initialize session and listen for auth state changes
  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Ensure loading spinner is never stuck beyond 3.5s on cold starts
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 3500);

    // Initial background session validation (Stale-While-Revalidate)
    authApi.me()
      .then((data) => {
        if (isMounted) {
          setUser(data.user);
          setCachedUser(data.user);
        }
      })
      .catch(() => {
        // Session is expired/invalid
        if (isMounted) {
          setUser(null);
          setCachedUser(null);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Supabase subscription for login/logout/session expiry
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        if (isMounted) {
          setUser(null);
          setCachedUser(null);
          setLoading(false);
        }
      } else if (event === "SIGNED_IN") {
        if (session?.user) {
          try {
            const data = await authApi.fetchProfileForUser(session.user);
            if (isMounted) {
              setUser(data.user);
              setCachedUser(data.user);
            }
          } catch {
            // Keep existing optimistic state if profile query is delayed
          } finally {
            if (isMounted) setLoading(false);
          }
        }
      } else if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        if (session?.user) {
          authApi.fetchProfileForUser(session.user)
            .then((data) => {
              if (isMounted) {
                setUser(data.user);
                setCachedUser(data.user);
              }
            })
            .catch(() => {});
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Real-time synchronization of user status changes from database (e.g. administrator revoking/approving access)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-status-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setUser((prev) => {
              if (!prev) return prev;
              const updated = {
                ...prev,
                name: payload.new.full_name || prev.name,
                email: payload.new.email || prev.email,
                role: payload.new.role || prev.role,
                status: payload.new.status || prev.status,
                approved_at: payload.new.approved_at,
                revoked_at: payload.new.revoked_at,
              };
              setCachedUser(updated);
              return updated;
            });
          }
        }
      )
      .subscribe();

    // Revalidate whenever the user returns to the tab/window
    const handleRevalidate = () => {
      if (document.visibilityState === "visible" && user?.id) {
        authApi.me().then((data) => {
          if (data?.user) {
            setUser(data.user);
            setCachedUser(data.user);
          }
        }).catch(() => {});
      }
    };

    window.addEventListener("focus", handleRevalidate);
    document.addEventListener("visibilitychange", handleRevalidate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", handleRevalidate);
      document.removeEventListener("visibilitychange", handleRevalidate);
    };
  }, [user?.id]);

  const refreshUser = async () => {
    try {
      const data = await authApi.me();
      setUser(data.user);
      setCachedUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      setCachedUser(null);
      return null;
    }
  };

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
    setCachedUser(data.user);
    setLoading(false);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await authApi.register(name, email, password);
    setUser(data.user);
    setCachedUser(data.user);
    setLoading(false);
    return data.user;
  };

  const logout = async () => {
    setUser(null);
    setCachedUser(null);
    setLoading(false);
    await authApi.logout();
  };

  const isStaff = useMemo(() => user?.role === "teacher" || user?.role === "admin", [user]);
  const isTeacher = isStaff;
  const isAdmin = isStaff;
  const isApproved = useMemo(() => isStaff || user?.status === "approved", [isStaff, user]);
  const isPending = useMemo(() => !isStaff && user?.status === "pending", [isStaff, user]);
  const isRejected = useMemo(() => !isStaff && user?.status === "rejected", [isStaff, user]);
  const isRevoked = useMemo(() => !isStaff && user?.status === "revoked", [isStaff, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isStaff,
        isTeacher,
        isAdmin,
        isApproved,
        isPending,
        isRejected,
        isRevoked,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
