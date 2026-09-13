import { useState, useEffect, useRef } from "react";

/**
 * Hook de sécurité pour le lecteur vidéo de cours :
 * 1. Bloque la touche F12, Ctrl+Maj+I/J/C, Ctrl+U et Ctrl+S
 * 2. Neutralise le clic droit (contextmenu)
 * 3. Détecte l'ouverture des DevTools (console/inspecteur) pour suspendre la lecture
 */
export function useVideoSecurity({ onDevToolsOpen } = {}) {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const onDevToolsOpenRef = useRef(onDevToolsOpen);
  onDevToolsOpenRef.current = onDevToolsOpen;
  const dismissedRef = useRef(false);

  const dismissDevTools = () => {
    dismissedRef.current = true;
    setIsDevToolsOpen(false);
  };

  useEffect(() => {
    // 1. Interception des raccourcis clavier d'inspection et de copie
    const handleKeyDown = (e) => {
      // F12
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        dismissedRef.current = false;
        setIsDevToolsOpen(true);
        onDevToolsOpenRef.current?.();
        return false;
      }

      const isModifier = e.ctrlKey || e.metaKey;

      // Ctrl + Maj + I / J / C (Outils de développement / Inspecter)
      if (isModifier && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) {
        e.preventDefault();
        e.stopPropagation();
        dismissedRef.current = false;
        setIsDevToolsOpen(true);
        onDevToolsOpenRef.current?.();
        return false;
      }

      // Ctrl + U (Afficher le code source)
      if (isModifier && e.key.toUpperCase() === "U") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + S (Enregistrer sous)
      if (isModifier && e.key.toUpperCase() === "S") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 2. Blocage systématique du menu contextuel (clic droit)
    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 3. Détection dynamique de l'ouverture des DevTools (calibrée contre les faux positifs)
    const checkDevTools = () => {
      if (dismissedRef.current) return;

      // Éviter les faux positifs dus au zoom d'affichage Windows (125%, 150%) et volets latéraux (Edge Copilot, Favoris)
      const widthDiff = Math.max(0, window.outerWidth - window.innerWidth);
      const heightDiff = Math.max(0, window.outerHeight - window.innerHeight);

      // Un inspecteur ancré occupe une portion substantielle (> 220px et > 25% de la dimension)
      const thresholdW = Math.max(220, window.outerWidth * 0.22);
      const thresholdH = Math.max(220, window.outerHeight * 0.25);

      const isDocked = (widthDiff > thresholdW && heightDiff > 120) || heightDiff > thresholdH;

      setIsDevToolsOpen((prev) => {
        if (isDocked && !prev) {
          onDevToolsOpenRef.current?.();
        }
        return isDocked;
      });
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("contextmenu", handleContextMenu, { capture: true });
    window.addEventListener("resize", checkDevTools);

    const interval = setInterval(checkDevTools, 1000);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      window.removeEventListener("resize", checkDevTools);
      clearInterval(interval);
    };
  }, []);

  return { isDevToolsOpen, dismissDevTools };
}

export default useVideoSecurity;
