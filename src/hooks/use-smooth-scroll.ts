"use client";

import { useCallback } from "react";

import { cancelGestureNavigation } from "@/lib/gesture-navigation-controller";
import { navigateToSectionId } from "@/lib/section-registry";

export function useSmoothScroll() {
  const scrollTo = useCallback((hrefOrId: string) => {
    const id = hrefOrId.replace("#", "");
    // Explicit navigation wins: drop any tracked gesture/shield first,
    // then run THE canonical section command — the same one a scroll
    // gesture triggers. Identical element, identical target.
    cancelGestureNavigation();
    navigateToSectionId(id);
  }, []);

  return { scrollTo };
}
