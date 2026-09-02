import { ensureScrollBus } from "@/lib/scroll-bus";
import {
  type ScrollLayoutSnapshot,
  createScrollLayoutSnapshot,
  getSnapshotRect,
} from "@/lib/scroll-layout-snapshot";
import type { ScrollMotionFrame } from "@/lib/scroll-motion-engine";

/** How strongly a new card must beat the current one before switching */
const HYSTERESIS = 0.14;
const ACTIVATE_FLOOR = 0.32;
const EXPAND_CONTENT_AT = 0.48;

export interface ServicesSpotlightState {
  enabled: boolean;
  prefersReducedMotion: boolean;
  cardRefs: Map<string, HTMLElement>;
  activeIdRef: { current: string | null };
  lockUntilRef: { current: number };
  setActiveCard: (id: string | null) => void;
  sectionElement: HTMLElement | null;
}

let state: ServicesSpotlightState | null = null;

function centralityScore(rect: DOMRect, viewportHeight: number): number {
  if (rect.bottom <= 0 || rect.top >= viewportHeight) return 0;

  const cardCenter = rect.top + rect.height / 2;
  const viewCenter = viewportHeight * 0.48;
  const distance = Math.abs(cardCenter - viewCenter);
  const maxDistance = viewportHeight * 0.32;
  const linear = 1 - Math.min(distance / maxDistance, 1);
  return linear * linear;
}

function isSectionNearViewport(
  rect: DOMRect | null,
  viewportH: number,
): boolean {
  if (!rect) return false;
  return rect.bottom > -viewportH * 0.2 && rect.top < viewportH * 1.2;
}

export function collectSpotlightLayoutElements(out: HTMLElement[]): void {
  if (!state?.enabled) return;
  if (state.sectionElement) out.push(state.sectionElement);
  state.cardRefs.forEach((element) => {
    out.push(element);
  });
}

export function registerServicesSpotlight(next: ServicesSpotlightState): void {
  state = next;
  ensureScrollBus();
}

export function unregisterServicesSpotlight(): void {
  state = null;
}

export function tickServicesSpotlight(
  _motion: ScrollMotionFrame,
  snapshot?: ScrollLayoutSnapshot,
): void {
  if (!state?.enabled) return;

  const {
    prefersReducedMotion,
    cardRefs,
    activeIdRef,
    lockUntilRef,
    setActiveCard,
    sectionElement,
  } = state;

  const layout =
    snapshot ??
    createScrollLayoutSnapshot(
      collectSpotlightLayoutElementsIntoArray(sectionElement, cardRefs),
    );
  const { viewportH } = layout;

  const sectionRect = sectionElement
    ? getSnapshotRect(layout, sectionElement)
    : null;

  if (!isSectionNearViewport(sectionRect, viewportH)) return;

  const viewportHeight = viewportH;
  let bestId: string | null = null;
  let bestScore = 0;
  const scores = new Map<string, number>();

  cardRefs.forEach((element, id) => {
    const rect = getSnapshotRect(layout, element);
    if (!rect) return;

    const score = centralityScore(rect, viewportHeight);
    scores.set(id, score);

    const grow = prefersReducedMotion
      ? score >= EXPAND_CONTENT_AT
        ? 2.85
        : 1
      : 1 + score * 1.9;
    const opacity = prefersReducedMotion
      ? score >= EXPAND_CONTENT_AT
        ? 1
        : 0.7
      : 0.55 + score * 0.45;

    element.style.setProperty("--spot-grow", String(grow));
    element.style.setProperty("--spot-opacity", String(opacity));

    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  });

  if (Date.now() < lockUntilRef.current) return;

  const currentId = activeIdRef.current;
  const currentScore = currentId ? (scores.get(currentId) ?? 0) : 0;

  if (!bestId || bestScore < ACTIVATE_FLOOR) {
    if (currentId && currentScore < 0.18) {
      setActiveCard(null);
    }
    return;
  }

  if (bestId === currentId) return;

  if (
    currentId &&
    currentScore > 0.22 &&
    bestScore < currentScore + HYSTERESIS
  ) {
    return;
  }

  setActiveCard(bestId);
}

function collectSpotlightLayoutElementsIntoArray(
  sectionElement: HTMLElement | null,
  cardRefs: Map<string, HTMLElement>,
): HTMLElement[] {
  const elements: HTMLElement[] = [];
  if (sectionElement) elements.push(sectionElement);
  cardRefs.forEach((element) => {
    elements.push(element);
  });
  return elements;
}
