"use client";

import { useEffect } from "react";

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

    const id = hash.slice(1);
    let attempts = 0;

    const tryScroll = () => {
      const target = document.getElementById(id);
      if (target) {
        scrollToSectionElement(target);
        return;
      }

      attempts += 1;
      if (attempts < 24) {
        window.requestAnimationFrame(tryScroll);
      }
    };

    const timer = window.setTimeout(tryScroll, 120);
    return () => window.clearTimeout(timer);
  }, [hasEntered]);
}
