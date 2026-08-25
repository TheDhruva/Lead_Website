"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** Fine pointer + motion OK — desktop cursor reactions only. */
export function useCanPointerReact() {
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const prefersReducedMotion = useReducedMotion();
  return finePointer && !prefersReducedMotion;
}
