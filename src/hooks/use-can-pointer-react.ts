"use client";

import { MEDIA_FINE_HOVER } from "@/constants/breakpoints";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** Fine pointer + motion OK — desktop cursor reactions only. */
export function useCanPointerReact() {
  const finePointer = useMediaQuery(MEDIA_FINE_HOVER);
  const prefersReducedMotion = useReducedMotion();
  return finePointer && !prefersReducedMotion;
}
