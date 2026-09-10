import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext({
  dark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.setAttribute("data-theme", "dark");
      try {
        localStorage.setItem("theme", "dark");
      } catch {}
    } else {
      root.removeAttribute("data-theme");
      try {
        localStorage.setItem("theme", "light");
      } catch {}
    }
  }, [dark]);

  const toggleTheme = useCallback(() => {
    setDark((prev) => !prev);
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}

export default ThemeContext;
