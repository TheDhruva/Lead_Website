import { MEDIA_REDUCED_MOTION } from "@/constants/breakpoints";

/**
 * Pure (non-hook) reduced-motion check for lib/provider code that cannot
 * call hooks. Hook code must use `useReducedMotion()` instead — same
 * query, single owner (see constants/breakpoints.ts).
 */
export function isReducedMotionPreferred(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(MEDIA_REDUCED_MOTION).matches
  );
}
