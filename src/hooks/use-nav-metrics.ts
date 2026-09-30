"use client";

import { type RefObject, useEffect } from "react";

const SAFE_GAP_PX = 20;

/**
 * Measures the top navbar and publishes layout CSS variables:
 * --nav-height, --nav-offset, --nav-safe-top
 *
 * The bar sits at the very top of the scroll container and scrolls away
 * with the page, so metrics are scroll-independent: height comes from
 * layout (offsetHeight) and offset is always zero. No scroll listeners —
 * publishing on scroll would shift section padding mid-gesture.
 */
export function useNavMetrics(navRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const publish = () => {
      const height = nav.offsetHeight;
      const safeTop = height + SAFE_GAP_PX;

      document.documentElement.style.setProperty("--nav-height", `${height}px`);
      document.documentElement.style.setProperty("--nav-offset", "0px");
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
