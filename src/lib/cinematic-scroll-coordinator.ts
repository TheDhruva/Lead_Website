import { ensureScrollBus } from "@/lib/scroll-bus";
import { getScrollContainer } from "@/lib/scroll-container";
import {
  type ScrollLayoutSnapshot,
  createScrollLayoutSnapshot,
} from "@/lib/scroll-layout-snapshot";
import {
  type ScrollMotionFrame,
  type SectionRect,
  computeSectionEnterProgress,
  computeSectionExitProgress,
  computeVelocityScale,
  getScrollMotionFrame,
} from "@/lib/scroll-motion-engine";

export type CinematicSectionPreset =
  "hero" | "services" | "videos" | "projects" | "contact";

interface CinematicEntry {
  element: HTMLElement;
  isMobile: boolean;
  /**
   * Content-space geometry (relative to the scrollport at scrollTop=0),
   * measured outside the hot scroll path. Per-frame viewport rects are
   * derived arithmetically from these offsets + the live scroll position,
   * so scrolling never calls getBoundingClientRect().
   */
  contentTop: number;
  height: number;
  /** Last written custom-property strings — only meaningful changes write. */
  lastEnter: string | null;
  lastExit: string | null;
  lastVelocity: string | null;
}

/** Skip sections more than ~1 viewport away from the visible area. */
const OFFSCREEN_MARGIN_VH = 0.2;

/**
 * Visual quantization for scroll-linked vars. Steps are sized below the
 * just-noticeable difference of every consumer in globals.css (opacity
 * deltas ≤ 0.0045, transform deltas ≤ 0.26px) so output is visually
 * identical, while gentle wheel scrolling crosses a step only every ~18px
 * instead of writing (and invalidating a whole section subtree) every frame.
 */
const PROGRESS_STEP = 100; // 0.01 → enter/exit toFixed(2)
const VELOCITY_STEP = 1000; // 0.001 → velocity-scale toFixed(3)

const entries = new Map<HTMLElement, CinematicEntry>();

let layoutValid = false;
let cachedLimit = -1;
let cachedViewportH = 0;

function clearCinematicVars(el: HTMLElement): void {
  el.style.removeProperty("--section-progress");
  el.style.removeProperty("--section-exit");
  el.style.removeProperty("--section-enter");
  el.style.removeProperty("--velocity-scale");
}

function quantize(value: number, steps: number, digits: number): string {
  return (Math.round(value * steps) / steps).toFixed(digits);
}

/** Measure all section geometry — only on layout invalidation, never per frame. */
function measureAll(): boolean {
  const container = getScrollContainer();
  if (!container || entries.size === 0) return false;

  const snapshot: ScrollLayoutSnapshot = createScrollLayoutSnapshot(
    Array.from(entries.keys()),
  );
  const containerTop = container.getBoundingClientRect().top;
  const scrollTop = container.scrollTop;

  entries.forEach((entry, element) => {
    const rect = snapshot.rects.get(element);
    if (!rect) return;
    entry.contentTop = rect.top - containerTop + scrollTop;
    entry.height = rect.height;
  });

  cachedViewportH = snapshot.viewportH;
  layoutValid = true;
  return true;
}

/**
 * Geometry validity is driven by the scrollable-limit signal: section
 * mounts, content growth, and resizes all move total scroll height, so a
 * limit change is the cue to re-measure. Scroll itself only consumes the
 * cache.
 */
function ensureLayout(limit: number): boolean {
  if (layoutValid && Math.abs(limit - cachedLimit) <= 1) return true;
  cachedLimit = limit;
  return measureAll();
}

function invalidateLayout(): void {
  layoutValid = false;
}

export function tickCinematicSections(motion: ScrollMotionFrame): void {
  if (entries.size === 0) return;
  if (!ensureLayout(motion.limit)) return;

  const viewportH = cachedViewportH;
  const margin = viewportH * OFFSCREEN_MARGIN_VH;

  entries.forEach((entry) => {
    const top = entry.contentTop - motion.scroll;
    const bottom = top + entry.height;

    // Near-viewport gate — pure arithmetic against cached geometry.
    if (bottom < -margin || top > viewportH + margin) return;

    const rect: SectionRect = { top, bottom, height: entry.height };

    const enter = quantize(
      computeSectionEnterProgress(rect, viewportH),
      PROGRESS_STEP,
      2,
    );
    const exit = quantize(
      computeSectionExitProgress(rect, viewportH),
      PROGRESS_STEP,
      2,
    );
    const velocity = quantize(
      computeVelocityScale(motion.velocity, entry.isMobile),
      VELOCITY_STEP,
      3,
    );

    // Write only values that actually changed: identical strings never
    // touch the section subtree (no style invalidation, no recalc).
    if (enter !== entry.lastEnter) {
      entry.element.style.setProperty("--section-enter", enter);
      entry.lastEnter = enter;
    }
    if (exit !== entry.lastExit) {
      entry.element.style.setProperty("--section-exit", exit);
      entry.lastExit = exit;
    }
    if (velocity !== entry.lastVelocity) {
      entry.element.style.setProperty("--velocity-scale", velocity);
      entry.lastVelocity = velocity;
    }
  });
}

export function registerCinematicSection(
  element: HTMLElement,
  preset: CinematicSectionPreset,
  isMobile: boolean,
): void {
  entries.set(element, {
    element,
    isMobile,
    contentTop: 0,
    height: 0,
    lastEnter: null,
    lastExit: null,
    lastVelocity: null,
  });
  element.dataset.cinematic = preset;
  invalidateLayout();
  ensureScrollBus();
  tickCinematicSections(getScrollMotionFrame());
}

export function unregisterCinematicSection(element: HTMLElement): void {
  if (entries.delete(element)) {
    invalidateLayout();
  }
  delete element.dataset.cinematic;
  clearCinematicVars(element);
}
