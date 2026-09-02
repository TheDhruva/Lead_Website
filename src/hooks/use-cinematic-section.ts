"use client";

import { type RefObject, useEffect } from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  type CinematicSectionPreset,
  registerCinematicSection,
  unregisterCinematicSection,
} from "@/lib/cinematic-scroll-coordinator";

export type { CinematicSectionPreset };

export function useCinematicSection(
  ref: RefObject<HTMLElement | null>,
  preset: CinematicSectionPreset,
): void {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion) {
      if (el) unregisterCinematicSection(el);
      return;
    }

    registerCinematicSection(el, preset, isMobile);

    return () => {
      unregisterCinematicSection(el);
    };
  }, [ref, preset, prefersReducedMotion, isMobile]);
}
