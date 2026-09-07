"use client";

import { useEffect } from "react";

import { resolveSectionId } from "@/constants";
import { requestLazySectionMount } from "@/lib/lazy-section-mount";
import { scrollToSectionElement } from "@/lib/scroll-position";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

/**
 * Scrolls to the URL hash once the intro has cleared and sections are mounted.
 */
export function useHashScroll() {
  const { hasEntered } = useTheatreIntro();

  useEffect(() => {
    if (!hasEntered) return;

    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    const id = resolveSectionId(hash.slice(1));
    requestLazySectionMount(id);

    let cancelled = false;
    let rafId = 0;
    let observer: MutationObserver | null = null;

    const scrollOnce = () => {
      if (cancelled) return;
      const target = document.getElementById(id);
      if (!target) return false;
      // wait one frame for layout to settle after mount
      rafId = window.requestAnimationFrame(() => {
        if (cancelled) return;
        const el = document.getElementById(id);
        if (el) scrollToSectionElement(el);
      });
      return true;
    };

    // try after mount signal + rAF
    const timer = window.setTimeout(() => {
      if (scrollOnce()) return;
      // fallback: observe DOM until target appears (lazy mount)
      const main = document.getElementById("main-content");
      if (!main) return;
      observer = new MutationObserver(() => {
        if (scrollOnce() && observer) {
          observer.disconnect();
          observer = null;
        }
      });
      observer.observe(main, { childList: true, subtree: true });
      // safety timeout 3s
      window.setTimeout(() => {
        observer?.disconnect();
        observer = null;
      }, 3000);
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (rafId) window.cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, [hasEntered]);
}
