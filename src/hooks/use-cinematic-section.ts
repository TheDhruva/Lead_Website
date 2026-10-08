"use client";

import { type RefObject, useEffect } from "react";

import { usePerformanceTier } from "@/hooks/use-performance-tier";
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
  // One tier owns the whole capability decision (reduced-motion, coarse
  // pointer, mobile layout, constrained memory) — same outcome as the
  // three separate media queries, minus two subscriptions per section.
  const tier = usePerformanceTier();
  // Design Work owns its own card-stack animation. Other sections keep
  // native scrolling without section-level parallax or per-frame CSS writes.
  const cinematicDisabled = preset !== "projects" || tier === "low";

  useEffect(() => {
    const el = ref.current;
    if (!el || cinematicDisabled) {
      if (el) unregisterCinematicSection(el);
      return;
    }

    registerCinematicSection(el, preset);

    return () => {
      unregisterCinematicSection(el);
    };
  }, [ref, preset, cinematicDisabled]);
}
