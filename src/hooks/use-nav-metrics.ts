"use client";

import { type RefObject, useEffect } from "react";

const SAFE_GAP_PX = 20;

/**
 * Measures the floating navbar and publishes layout CSS variables:
 * --nav-height, --nav-offset, --nav-safe-top
 */
export function useNavMetrics(navRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const publish = () => {
      const rect = nav.getBoundingClientRect();
      const top = rect.top;
      const height = rect.height;
      const safeTop = top + height + SAFE_GAP_PX;

      document.documentElement.style.setProperty("--nav-height", `${height}px`);
      document.documentElement.style.setProperty("--nav-offset", `${top}px`);
      document.documentElement.style.setProperty(
        "--nav-safe-top",
        `${safeTop}px`,
      );
    };

    publish();

    const observer = new ResizeObserver(publish);
    observer.observe(nav);

    window.addEventListener("resize", publish, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", publish);
    };
  }, [navRef]);
}
