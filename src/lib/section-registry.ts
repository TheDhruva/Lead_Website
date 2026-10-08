import { SECTION_ORDER } from "@/constants";
import { scrollToSectionElement } from "@/lib/scroll-position";

/**
 * Canonical navigable section order — aliases the shared SECTION_ORDER.
 *
 * Navbar links, the floating nav, the active-section observer, and the
 * gesture navigation controller all describe the same five sections;
 * this order is what gesture intent resolves against when it picks a
 * next/previous destination.
 */
export const NAVIGABLE_SECTION_ORDER = SECTION_ORDER;

export type NavigableSectionId = (typeof NAVIGABLE_SECTION_ORDER)[number];

/**
 * Adjacent section in a travel direction (1 = down/next, -1 = up/prev).
 * Null at the ends or for unknown ids — callers treat that as
 * "no navigation, keep free scrolling".
 */
export function getSectionNeighbor(
  id: string,
  direction: 1 | -1,
): NavigableSectionId | null {
  const idx = (NAVIGABLE_SECTION_ORDER as readonly string[]).indexOf(id);
  if (idx === -1) return null;
  return NAVIGABLE_SECTION_ORDER[idx + direction] ?? null;
}

export function getSectionElement(id: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById(id);
}

/**
 * THE canonical section-navigation command — navbar clicks and gesture
 * intent both resolve here (`useSmoothScroll` → `navigateToSectionId`,
 * gesture controller → `navigateToSectionId`): same element, same
 * clamped target, same distance-aware tween, same lazy-mount re-aim.
 * There is exactly one navigation implementation.
 *
 * Returns the flight's cancel handle so a caller that owns the gesture
 * (the gesture controller) can implement explicit takeover without
 * touching tween internals. Callers that don't manage flights
 * (navbar) simply ignore the return.
 */
export function navigateToSectionId(id: string): (() => void) | undefined {
  const el = getSectionElement(id);
  if (!el) return undefined;
  return scrollToSectionElement(el);
}
