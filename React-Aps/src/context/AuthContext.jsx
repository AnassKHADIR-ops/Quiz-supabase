import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { authApi } from "../api.js";
import { supabase } from "../lib/supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session and listen for auth state changes
  useEffect(() => {
    let isMounted = true;

    // Load initial user profile
    authApi.me()
      .then((data) => {
        if (isMounted) setUser(data.user);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Supabase subscription for login/logout/session expiry
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        try {
          const data = await authApi.me();
          if (isMounted) setUser(data.user);
        } catch {
          if (isMounted) setUser(null);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    try {
      const data = await authApi.me();
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  };

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await authApi.register(name, email, password);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
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
