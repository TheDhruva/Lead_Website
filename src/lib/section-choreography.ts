import { useSyncExternalStore } from "react";

import { SECTION_IDS } from "@/constants";
import {
  type ScrollDirection,
  getScrollMotionFrame,
} from "@/lib/scroll-motion-engine";

/**
 * Canonical scroll-choreography state — ONE continuous composition.
 *
 * `#scroll-container` is the canonical scrollport. This module is the
 * single source of truth derived from it:
 *
 *   #scroll-container
 *         ↓
 *   section coordinator (this file)
 *         ↓
 *   activeSection ──┬── section choreography (CSS vars, enter/settle/exit)
 *                   └── navbar active state (desktop + mobile)
 *
 * Only meaningful semantic changes touch React state (active section,
 * programmatic-navigation flag). Continuous motion stays on MotionValues,
 * CSS vars, and rAF — never per-frame setState.
 */

/** Canonical section order for the one continuous composition. */
export const CHOREOGRAPHY_ORDER = [
  SECTION_IDS.work,
  SECTION_IDS.services,
  SECTION_IDS.video,
  SECTION_IDS.projects,
  SECTION_IDS.contact,
] as const;

export type ChoreographySectionId = (typeof CHOREOGRAPHY_ORDER)[number];

export interface SectionChoreographyState {
  /** Visually dominant section (navbar highlights this). */
  activeId: string;
  /** Previously dominant section — the exit side of the handoff. */
  previousId: string | null;
  /** Order-derived direction of the last handoff (-1 up, 1 down). */
  direction: ScrollDirection;
  /** True while a navbar/CTA programmatic scroll is in flight. */
  navigating: boolean;
  /**
   * Requested destination while navigating — the navbar stays visually
   * committed to this until arrival/interruption instead of flickering
   * through intermediate sections. Null when travelling manually.
   */
  navigationTargetId: string | null;
}

const INITIAL_STATE: SectionChoreographyState = {
  activeId: CHOREOGRAPHY_ORDER[0]!,
  previousId: null,
  direction: 0,
  navigating: false,
  navigationTargetId: null,
};

let state: SectionChoreographyState = INITIAL_STATE;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): SectionChoreographyState {
  return state;
}

function getServerSnapshot(): SectionChoreographyState {
  return INITIAL_STATE;
}

/** React binding — navbar, sections, and sound subscribe to this. */
export function useSectionChoreography(): SectionChoreographyState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Current snapshot without subscribing (event handlers, utilities). */
export function getSectionChoreography(): SectionChoreographyState {
  return state;
}

function orderIndexOf(id: string): number {
  return (CHOREOGRAPHY_ORDER as readonly string[]).indexOf(id);
}

/**
 * Report the visually dominant section. Called by the shared
 * IntersectionObserver only when dominance actually changes — never per
 * frame. Direction is derived from canonical order (deterministic and
 * reversible), falling back to the live motion frame when the order
 * carries no information.
 */
export function reportActiveSection(id: string): void {
  if (state.activeId === id) return;
  const prevIndex = orderIndexOf(state.activeId);
  const nextIndex = orderIndexOf(id);
  let direction: ScrollDirection = getScrollMotionFrame().direction;
  if (prevIndex !== -1 && nextIndex !== -1 && nextIndex !== prevIndex) {
    direction = nextIndex > prevIndex ? 1 : -1;
  }
  state = {
    activeId: id,
    previousId: state.activeId,
    direction,
    navigating: state.navigating,
    navigationTargetId: state.navigationTargetId,
  };
  emit();
}

/**
 * Flag programmatic (navbar/CTA) navigation. While true, observers and
 * sound treat visibility changes as travel rather than manual arrival.
 * Always cleared on settle OR user interruption — never sticky.
 */
export function setNavigating(navigating: boolean): void {
  if (state.navigating === navigating) return;
  state = { ...state, navigating };
  emit();
}

/**
 * Pin (or release) the navbar's committed destination. Set together with
 * `setNavigating(true)` at navigation start; cleared on settle or user
 * interruption. Newest request wins — superseding navigations overwrite.
 */
export function setNavigationTarget(id: string | null): void {
  if (state.navigationTargetId === id) return;
  state = { ...state, navigationTargetId: id };
  emit();
}
