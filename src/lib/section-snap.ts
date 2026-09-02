import {
  getOffsetInScrollContainer,
  getScrollContainer,
  getScrollTop,
} from "@/lib/scroll-container";
import { getPageEndScrollY } from "@/lib/scroll-position";

export interface SnapTarget {
  id: string;
  element: HTMLElement;
  top: number;
  bottom: number;
  y: number;
}

const SNAP_SELECTOR = "[data-snap-frame], section#contact";

/** Scroll position that best frames the section in the viewport. */
export function getSectionSnapY(
  el: HTMLElement,
  viewportH: number,
  maxScroll: number,
): number {
  const top = getOffsetInScrollContainer(el);
  const height = el.offsetHeight;

  if (height <= viewportH + 2) {
    return Math.max(0, Math.min(top, maxScroll));
  }

  const centered = top + (height - viewportH) / 2;
  return Math.max(0, Math.min(centered, maxScroll));
}

export function collectSnapTargets(): SnapTarget[] {
  const container = getScrollContainer();
  if (!container) return [];

  const viewportH = container.clientHeight;
  const maxScroll = getPageEndScrollY();

  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(SNAP_SELECTOR),
  );

  return elements
    .map((element) => {
      const top = getOffsetInScrollContainer(element);
      const bottom = top + element.offsetHeight;

      return {
        id: element.id || "section",
        element,
        top,
        bottom,
        y: getSectionSnapY(element, viewportH, maxScroll),
      };
    })
    .sort((a, b) => a.top - b.top);
}

export function getCurrentSectionIndex(
  targets: SnapTarget[],
  scrollY: number,
): number {
  if (targets.length === 0) return 0;

  let index = 0;
  let nearestDistance = Math.abs(scrollY - targets[0]!.y);

  for (let i = 1; i < targets.length; i += 1) {
    const distance = Math.abs(scrollY - targets[i]!.y);
    if (distance < nearestDistance) {
      index = i;
      nearestDistance = distance;
    }
  }

  return index;
}

export function findNearestSnapTarget(
  targets: SnapTarget[],
  scrollY: number,
): SnapTarget | null {
  if (targets.length === 0) return null;
  return targets[getCurrentSectionIndex(targets, scrollY)] ?? null;
}

export function findDirectionalSnapTarget(
  targets: SnapTarget[],
  scrollY: number,
  direction: number,
): SnapTarget | null {
  if (targets.length === 0) return null;

  const currentIndex = getCurrentSectionIndex(targets, scrollY);

  if (direction > 0) {
    return targets[Math.min(currentIndex + 1, targets.length - 1)] ?? null;
  }

  if (direction < 0) {
    return targets[Math.max(currentIndex - 1, 0)] ?? null;
  }

  return findNearestSnapTarget(targets, scrollY);
}

/** True when the viewport center sits on a section seam — user chose to pause between sections. */
export function isInIntentionalMiddleZone(
  targets: SnapTarget[],
  viewportCenter: number,
  viewportH: number,
): boolean {
  const threshold = viewportH * 0.06;

  for (let i = 0; i < targets.length - 1; i += 1) {
    const boundary = (targets[i]!.bottom + targets[i + 1]!.top) / 2;
    if (Math.abs(viewportCenter - boundary) <= threshold) {
      return true;
    }
  }

  return false;
}

export function getViewportCenter(scrollY: number, viewportH: number): number {
  return scrollY + viewportH / 2;
}

export function shouldSkipSnap(
  targets: SnapTarget[],
  scrollY: number,
  viewportH: number,
  snapThreshold = 4,
): boolean {
  if (targets.length === 0) return true;

  const viewportCenter = getViewportCenter(scrollY, viewportH);

  if (isInIntentionalMiddleZone(targets, viewportCenter, viewportH)) {
    return true;
  }

  const nearest = findNearestSnapTarget(targets, scrollY);
  if (!nearest) return true;

  return Math.abs(scrollY - nearest.y) <= snapThreshold;
}

export function getCurrentScrollY(): number {
  return getScrollTop();
}
