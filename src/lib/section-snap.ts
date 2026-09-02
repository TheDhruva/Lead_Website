import {
  getSectionAnchorScrollY,
  getViewportFocalScrollY,
} from "@/lib/scroll-anchor";
import {
  getOffsetInScrollContainer,
  getScrollContainer,
  getScrollTop,
} from "@/lib/scroll-container";
import { getNavSafeTopPx, getPageEndScrollY } from "@/lib/scroll-position";

export interface SnapTarget {
  id: string;
  element: HTMLElement;
  top: number;
  bottom: number;
  y: number;
}

const SNAP_SELECTOR = "[data-snap-frame], section#contact";

function getViewportHeight(): number {
  return getScrollContainer()?.clientHeight ?? window.innerHeight;
}

/** Scroll position that frames the section's visual anchor. */
export function getSectionSnapY(
  el: HTMLElement,
  viewportH: number,
  maxScroll: number,
): number {
  return getSectionAnchorScrollY(el, viewportH, maxScroll);
}

export function getSectionVisualCenter(target: SnapTarget): number {
  return (target.top + target.bottom) / 2;
}

export function collectSnapTargets(): SnapTarget[] {
  const container = getScrollContainer();
  if (!container) return [];

  const viewportH = container.clientHeight;
  const maxScroll = getPageEndScrollY();
  const navSafeTop = getNavSafeTopPx();

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
        y: getSectionAnchorScrollY(element, viewportH, maxScroll, navSafeTop),
      };
    })
    .sort((a, b) => a.top - b.top);
}

/** Stable section index from scroll position — not IntersectionObserver. */
export function getStableSectionIndex(
  targets: SnapTarget[],
  scrollY: number,
  viewportH = getViewportHeight(),
  navSafeTop = getNavSafeTopPx(),
): number {
  if (targets.length === 0) return 0;

  const focalY = getViewportFocalScrollY(scrollY, viewportH, navSafeTop);

  for (let i = 0; i < targets.length; i += 1) {
    const target = targets[i]!;
    if (focalY >= target.top && focalY < target.bottom) {
      return i;
    }
  }

  let index = 0;
  for (let i = 0; i < targets.length; i += 1) {
    if (targets[i]!.top <= focalY) index = i;
  }

  return index;
}

export function findDirectionalTargetByIndex(
  targets: SnapTarget[],
  originIndex: number,
  direction: number,
): SnapTarget | null {
  if (targets.length === 0) return null;

  if (direction > 0) {
    return targets[Math.min(originIndex + 1, targets.length - 1)] ?? null;
  }

  if (direction < 0) {
    return targets[Math.max(originIndex - 1, 0)] ?? null;
  }

  return targets[originIndex] ?? null;
}

/** Which section the viewport is most aligned with — center-biased, not scroll-top biased. */
export function findNearestSnapTarget(
  targets: SnapTarget[],
  scrollY: number,
  viewportH = getViewportHeight(),
): SnapTarget | null {
  if (targets.length === 0) return null;

  const viewportCenter = scrollY + viewportH / 2;

  let nearest = targets[0]!;
  let nearestDistance = Math.abs(
    viewportCenter - getSectionVisualCenter(nearest),
  );

  for (let i = 1; i < targets.length; i += 1) {
    const target = targets[i]!;
    const distance = Math.abs(viewportCenter - getSectionVisualCenter(target));

    if (distance < nearestDistance) {
      nearest = target;
      nearestDistance = distance;
    }
  }

  return nearest;
}

export function getCurrentSectionIndex(
  targets: SnapTarget[],
  scrollY: number,
  viewportH = getViewportHeight(),
): number {
  return getStableSectionIndex(targets, scrollY, viewportH);
}

export function findDirectionalSnapTarget(
  targets: SnapTarget[],
  scrollY: number,
  direction: number,
  viewportH = getViewportHeight(),
): SnapTarget | null {
  const originIndex = getStableSectionIndex(targets, scrollY, viewportH);
  return findDirectionalTargetByIndex(targets, originIndex, direction);
}

export function shouldSkipSnap(
  targets: SnapTarget[],
  scrollY: number,
  snapThreshold = 8,
): boolean {
  if (targets.length === 0) return true;

  const nearest = findNearestSnapTarget(targets, scrollY);
  if (!nearest) return true;

  return Math.abs(scrollY - nearest.y) <= snapThreshold;
}

export function getCurrentScrollY(): number {
  return getScrollTop();
}
