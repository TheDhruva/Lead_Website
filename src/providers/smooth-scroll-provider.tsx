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
 * #scroll-container, with deterministic CSS snap stops.
 *
 * Lenis was removed from this path: its RAF-driven scrollTop interpolation
 * fought native snap (snap yanked mid-flight → Lenis re-interpolated →
 * visible teleport), and nav targets computed for anchor-centering never
 * matched snap-start rest positions.
 *
 * This provider now only publishes native scroll frames (rAF-throttled,
 * passive listener) so the scroll-bus cinematic vars, is-scroll-active
 * gating, and pointer pausing keep working with zero scroll ownership.
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
      const limit = Math.max(
        0,
        container.scrollHeight - container.clientHeight,
      );
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

    container.addEventListener("scroll", onScroll, { passive: true });
    // Publish the resting frame so late subscribers get a valid snapshot.
    onScroll();

    return () => {
      container.removeEventListener("scroll", onScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [hasEntered]);

  return <>{children}</>;
}
