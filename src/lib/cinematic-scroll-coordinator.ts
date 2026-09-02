import { ensureScrollBus } from "@/lib/scroll-bus";
import {
  type ScrollLayoutSnapshot,
  createScrollLayoutSnapshot,
  getSnapshotRect,
} from "@/lib/scroll-layout-snapshot";
import {
  type ScrollMotionFrame,
  computeSectionEnterProgress,
  computeSectionExitProgress,
  computeSectionTravelProgress,
  computeVelocityScale,
  getScrollMotionFrame,
} from "@/lib/scroll-motion-engine";

export type CinematicSectionPreset =
  "hero" | "services" | "videos" | "projects" | "contact";

interface CinematicEntry {
  element: HTMLElement;
  isMobile: boolean;
}

/** Skip sections more than ~1 viewport away from the visible area. */
const OFFSCREEN_MARGIN_VH = 0.2;

const entries = new Map<HTMLElement, CinematicEntry>();

function clearCinematicVars(el: HTMLElement): void {
  el.style.removeProperty("--section-progress");
  el.style.removeProperty("--section-exit");
  el.style.removeProperty("--section-enter");
  el.style.removeProperty("--velocity-scale");
}

function isNearViewport(rect: DOMRect, viewportH: number): boolean {
  const margin = viewportH * OFFSCREEN_MARGIN_VH;
  return rect.bottom > -margin && rect.top < viewportH + margin;
}

export function collectCinematicLayoutElements(out: HTMLElement[]): void {
  entries.forEach(({ element }) => {
    out.push(element);
  });
}

export function tickCinematicSections(
  motion: ScrollMotionFrame,
  snapshot?: ScrollLayoutSnapshot,
): void {
  if (entries.size === 0) return;

  const layout =
    snapshot ??
    createScrollLayoutSnapshot(
      Array.from(entries.values(), (entry) => entry.element),
    );
  const { viewportH } = layout;

  entries.forEach(({ element, isMobile }) => {
    const rect = getSnapshotRect(layout, element);
    if (!rect || !isNearViewport(rect, viewportH)) {
      return;
    }

    const velocityScale = computeVelocityScale(
      motion.velocity,
      isMobile,
    ).toFixed(4);

    element.style.setProperty(
      "--section-progress",
      computeSectionTravelProgress(rect, viewportH).toFixed(4),
    );
    element.style.setProperty(
      "--section-exit",
      computeSectionExitProgress(rect, viewportH).toFixed(4),
    );
    element.style.setProperty(
      "--section-enter",
      computeSectionEnterProgress(rect, viewportH).toFixed(4),
    );
    element.style.setProperty("--velocity-scale", velocityScale);
  });
}

export function registerCinematicSection(
  element: HTMLElement,
  preset: CinematicSectionPreset,
  isMobile: boolean,
): void {
  entries.set(element, { element, isMobile });
  element.dataset.cinematic = preset;
  ensureScrollBus();
  tickCinematicSections(getScrollMotionFrame());
}

export function unregisterCinematicSection(element: HTMLElement): void {
  entries.delete(element);
  delete element.dataset.cinematic;
  clearCinematicVars(element);
}
