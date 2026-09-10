import { useContext } from "react";
import ThemeContext from "../context/ThemeContext.jsx";

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.getAttribute("data-theme") === "dark";
    return [isDark, () => {}];
  }
  return [ctx.dark, ctx.toggleTheme];
}

export default useTheme;
