"use client";

import { type ReactNode, useEffect, useRef } from "react";

import { SCROLL_CONTAINER_ID } from "@/lib/scroll-container";
import {
  type ScrollDirection,
  publishScrollMotion,
} from "@/lib/scroll-motion-engine";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

interface SmoothScrollProviderProps {
  children: ReactNode;
}

/**
 * Main scroll path is 100% native browser scrolling inside
 * #scroll-container with natural scrolling (no CSS snap).
 *
 * Lenis was removed from this path: its RAF-driven scrollTop interpolation
 * fought native snap (snap yanked mid-flight → Lenis re-interpolated →
 * visible teleport), and nav targets computed for anchor-centering never
 * matched snap-start rest positions.
 *
 * This provider publishes native scroll frames (rAF-throttled, passive
 * listener). Section landing is handled by native CSS scroll snapping on
 * the scroll container, so wheel, trackpad, touch, and keyboard input all
 * share one browser-native interaction model.
 * The scrollable limit (scrollHeight - clientHeight) is cached and refreshed
 * on structural signals only — the hot scroll path reads scrollTop and
 * reuses the cached limit, never measuring layout.
 * Context stays (always null) so existing consumers don't break.
 */
export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const { hasEntered } = useTheatreIntro();
  const rafIdRef = useRef<number | null>(null);
  const lastScrollRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastDirectionRef = useRef<ScrollDirection>(0);
  useEffect(() => {
    if (!hasEntered) return;

    const container = document.getElementById(SCROLL_CONTAINER_ID);
    if (!container) return;

    lastScrollRef.current = container.scrollTop;
    lastTimeRef.current = performance.now();

    // P0: cached scrollable limit — refreshed on structural signals only,
    // never measured inside the per-frame publish path.
    let cachedLimit = Math.max(
      0,
      container.scrollHeight - container.clientHeight,
    );
    const refreshLimit = () => {
      cachedLimit = Math.max(
        0,
        container.scrollHeight - container.clientHeight,
      );
    };

    const publish = () => {
      rafIdRef.current = null;
      const scroll = container.scrollTop;
      const now = performance.now();
      const dtMs = Math.max(1, now - lastTimeRef.current);
      const delta = scroll - lastScrollRef.current;
      // Lenis-compatible unit: px per animation frame (~16.7ms).
      const velocity = (delta / dtMs) * 16.667;
      const direction: ScrollDirection =
        delta > 0.01 ? 1 : delta < -0.01 ? -1 : lastDirectionRef.current;
      lastDirectionRef.current = direction;
      // Hot path: reuse cached limit (no scrollHeight/clientHeight read).
      const limit = cachedLimit;
      lastScrollRef.current = scroll;
      lastTimeRef.current = now;
      publishScrollMotion({
        scroll,
        velocity,
        direction,
        limit,
        progress: limit > 0 ? scroll / limit : 0,
      });
    };

    const onScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(publish);
    };

    // Structural invalidation: resizes, orientation, and content
    // mount/removal move total scroll height. Scroll itself never
    // refreshes the cache.
    const onResize = () => {
      refreshLimit();
    };
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(refreshLimit);
      ro.observe(container);
    }
    const main = document.getElementById("main-content");
    let mo: MutationObserver | null = null;
    if (main && typeof MutationObserver !== "undefined") {
      mo = new MutationObserver(refreshLimit);
      mo.observe(main, { childList: true, subtree: true });
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    container.addEventListener("scroll", onScroll, { passive: true });
    // Publish the resting frame so late subscribers get a valid snapshot.
    refreshLimit();
    onScroll();

    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      ro?.disconnect();
      mo?.disconnect();
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [hasEntered]);

  return <>{children}</>;
}
