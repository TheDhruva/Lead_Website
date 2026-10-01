"use client";

import { useCallback, useEffect } from "react";

import {
  ACTIVE_SECTION_ROOT_MARGIN,
  ACTIVE_SECTION_THRESHOLDS,
} from "@/constants";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { getScrollContainer } from "@/lib/scroll-container";
import { getScrollMotionFrame } from "@/lib/scroll-motion-engine";
import {
  getSectionChoreography,
  reportActiveSection,
  useSectionChoreography,
} from "@/lib/section-choreography";

/**
 * Active nav section — shared source of truth for desktop nav, mobile nav,
 * and section choreography.
 *
 * All hook instances report into the canonical section-choreography store
 * and read `activeId` back from it, so navbar and sections can never
 * disagree. The underlying observer is a singleton per section list:
 * mounting a second navbar does not add a second observer. State updates
 * only when the dominant section actually changes (never per frame).
 */

interface SharedObservation {
  count: number;
  disconnect: () => void;
}

const sharedObservations = new Map<string, SharedObservation>();

function ensureSharedObservation(sectionIds: readonly string[]): () => void {
  const key = sectionIds.join("|");
  const existing = sharedObservations.get(key);
  if (existing) {
    existing.count += 1;
    return () => releaseSharedObservation(key);
  }

  const main = document.getElementById("main-content");
  if (!main) return () => {};

  const root = getScrollContainer();
  let observer: IntersectionObserver | null = null;
  const observed = new Set<Element>();

  const collect = () =>
    sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

  const observe = () => {
    observer?.disconnect();
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;

        // Intentional activation zones: the section owning the
        // viewport CENTER is the perceived section. Max-ratio
        // structurally favors short sections, which made tall
        // regions (Design deck) flicker against their neighbors.
        const viewportH = root?.clientHeight ?? window.innerHeight;
        const rootTop = root?.getBoundingClientRect().top ?? 0;
        const centerY = rootTop + viewportH / 2;
        // Confirm 12% further along travel before handing over —
        // hysteresis so boundary straddling can't flap the pill.
        const direction = getScrollMotionFrame().direction || 1;
        const confirmY = centerY + direction * viewportH * 0.12;
        const owns = (el: Element, y: number) => {
          const rect = el.getBoundingClientRect();
          return rect.top <= y && rect.bottom >= y;
        };
        const byRatio = [...visible].sort(
          (a, b) => b.intersectionRatio - a.intersectionRatio,
        );
        const centerOwner = visible.find((entry) =>
          owns(entry.target, centerY),
        );
        const confirmOwner = visible.find((entry) =>
          owns(entry.target, confirmY),
        );
        const currentId = getSectionChoreography().activeId;
        const currentEntry = visible.find(
          (entry) => entry.target.id === currentId,
        );

        let pick: IntersectionObserverEntry | undefined;
        if (!centerOwner) {
          pick = byRatio[0];
        } else if (centerOwner.target.id === currentId) {
          pick = centerOwner;
        } else if (confirmOwner?.target.id === centerOwner.target.id) {
          pick = centerOwner;
        } else {
          pick = currentEntry ?? byRatio[0];
        }

        // One canonical report — the store dedupes, both navbars follow.
        if (pick?.target.id) reportActiveSection(pick.target.id);
      },
      {
        root,
        rootMargin: ACTIVE_SECTION_ROOT_MARGIN,
        threshold: [...ACTIVE_SECTION_THRESHOLDS],
      },
    );
    observed.clear();
    for (const el of collect()) {
      if (!observed.has(el)) {
        observed.add(el);
        observer.observe(el);
      }
    }
  };

  observe();

  // Re-collect only when a section NODE actually swaps (lazy placeholder
  // → real section keeps the same id, so compare node identity, not ids).
  let known = collect();
  const mutations = new MutationObserver(() => {
    const current = collect();
    const changed =
      current.length !== known.length ||
      current.some((el, i) => el !== known[i]);
    if (changed) {
      known = current;
      observe();
    }
  });
  mutations.observe(main, { childList: true, subtree: true });

  const entry: SharedObservation = {
    count: 1,
    disconnect: () => {
      mutations.disconnect();
      observer?.disconnect();
    },
  };
  sharedObservations.set(key, entry);
  return () => releaseSharedObservation(key);
}

function releaseSharedObservation(key: string): void {
  const entry = sharedObservations.get(key);
  if (!entry) return;
  entry.count -= 1;
  if (entry.count <= 0) {
    sharedObservations.delete(key);
    entry.disconnect();
  }
}

export function useActiveSection(sectionIds: readonly string[]) {
  const { activeId, navigating, navigationTargetId } = useSectionChoreography();
  const { scrollTo } = useSmoothScroll();

  useEffect(() => ensureSharedObservation(sectionIds), [sectionIds]);

  const scrollToSection = useCallback(
    (href: string) => {
      scrollTo(href);
    },
    [scrollTo],
  );

  // Navbar display state: while a programmatic navigation is in flight,
  // stay committed to the requested destination instead of flickering
  // through intermediate sections. Manual scrolling always shows the
  // actual dominant section. Interruptions clear the target, so display
  // snaps back to reality instantly.
  const displayId =
    navigating && navigationTargetId ? navigationTargetId : activeId;

  return { activeId, displayId, scrollToSection };
}
