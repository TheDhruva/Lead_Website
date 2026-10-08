/**
 * Breakpoint ownership — the single source of truth for responsive
 * thresholds. CSS media queries and JavaScript `useMediaQuery` calls must
 * use these values so the two systems can never disagree.
 *
 * Model (see globals.css — same boundaries):
 * - below 768px: mobile (single-column, menu-sheet navigation)
 * - 768–1023px: tablet (mobile design language, menu-sheet navigation)
 * - 1024px and up: desktop (full compositions, floating pill nav)
 *
 * Add a new boundary here only if a component genuinely needs one —
 * prefer fluid CSS (clamp/min/max) between these three stops.
 */

/** Mobile layout: single column, menu-sheet navigation. */
export const MEDIA_MOBILE = "(max-width: 767px)";

/** Tablet band: mobile design language at tablet widths. */
export const MEDIA_TABLET = "(min-width: 768px) and (max-width: 1023px)";

/** Desktop: full compositions + floating pill navigation. */
export const MEDIA_DESKTOP = "(min-width: 1024px)";

/** Touch-first / small-screen shredder for motion + media budgets. */
export const MEDIA_COARSE_POINTER = "(pointer: coarse)";

/** Capable of hover-driven pointer reaction (gaze, hover ticks). */
export const MEDIA_FINE_HOVER = "(hover: hover) and (pointer: fine)";

/** OS reduced-motion preference. */
export const MEDIA_REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
