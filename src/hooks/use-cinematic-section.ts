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
  const isCoarsePointer = useMediaQuery("(pointer: coarse)");
  // Cinematic scroll vars are a desktop/fine-pointer treatment: on
  // mobile/coarse pointers the motion is intentionally absent, so skip
  // registration entirely — no getBoundingClientRect, no CSS var writes.
  const cinematicDisabled = prefersReducedMotion || isMobile || isCoarsePointer;

  useEffect(() => {
    const el = ref.current;
    if (!el || cinematicDisabled) {
      if (el) unregisterCinematicSection(el);
      return;
    }

    registerCinematicSection(el, preset, false);

    return () => {
      unregisterCinematicSection(el);
    };
  }, [ref, preset, cinematicDisabled]);
}
