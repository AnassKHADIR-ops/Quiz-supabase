import { useEffect, useRef, useState } from "react";

/**
 * Observe un élément et retourne true quand il entre dans le viewport.
 * Usage : const [ref, visible] = useScrollAnimation();
 */
export function useScrollAnimation(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el); // se déclenche une seule fois
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

/**
 * Anime un nombre de 0 à target.
 * Usage : const count = useCounter(350, visible);
 */
export function useCounter(target, active, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);

  return count;
}

/**
 * Active la classe "visible" sur tous les éléments .fade-up dans la page.
 * À appeler une fois dans App.jsx.
 */
export function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  const observe = () => {
    document.querySelectorAll(".fade-up, .fade-in").forEach((el) => {
      if (!el.classList.contains("visible")) observer.observe(el);
    });
  };

  // Observer initial + MutationObserver pour les éléments ajoutés dynamiquement
  observe();
  const mutObs = new MutationObserver(observe);
  mutObs.observe(document.body, { childList: true, subtree: true });

  return () => { observer.disconnect(); mutObs.disconnect(); };
}
