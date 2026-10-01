"use client";

import {
  type RefObject,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { useInView } from "framer-motion";

import { getScrollContainer } from "@/lib/scroll-container";

export type EnterExitState = "hidden" | "show" | "exit";

interface UseEnterExitOptions {
  /**
   * Optional margin around the observation root (e.g. "0px 0px -6% 0px"
   * to share the css-reveal/section-transition reveal clock). Omitted
   * by default — no margin shift unless a caller opts in.
   */
  rootMargin?: string;
  /**
   * Observe against the canonical `#scroll-container` scrollport instead
   * of the browser viewport. Defaults to true — the page never scrolls
   * the window, so viewport semantics would describe the wrong
   * coordinate system for section visibility.
   */
  useScrollContainerRoot?: boolean;
}

/**
 * useEnterExit — three-state viewport presence for enter AND exit motion.
 *
 * - "hidden": never entered (pre-entrance, renders initial values)
 * - "show": in viewport (entrance plays, exactly as before)
 * - "exit": scrolled away (controlled de-assembly, NOT a reversed replay)
 *
 * Driven by a single IntersectionObserver per instance — state flips only
 * on threshold crossings, never per frame. Works in both scroll
 * directions; re-entering replays the entrance.
 *
 * The observer attaches through a callback ref (not a bare useRef) so
 * late-mounting elements — e.g. breakpoint-conditional trees that mount
 * after the owning component's first effects — are still observed. A
 * bare ref would stay permanently detached in that case.
 */
export function useEnterExit<T extends HTMLElement = HTMLDivElement>(
  amount = 0.5,
  options: UseEnterExitOptions = {},
): { ref: (element: T | null) => void; state: EnterExitState } {
  const { rootMargin, useScrollContainerRoot = true } = options;
  const [element, setElement] = useState<T | null>(null);
  // Canonical scrollport via subscription (no effect-setState cascade):
  // getElementById returns a stable node identity, so the snapshot is
  // cached by reference. Server snapshot is null (viewport fallback).
  const scrollRoot = useSyncExternalStore(
    () => () => {},
    () => (useScrollContainerRoot ? getScrollContainer() : null),
    () => null,
  );
  const rootRef = useMemo(
    () =>
      useScrollContainerRoot && scrollRoot
        ? ({ current: scrollRoot } as RefObject<Element>)
        : undefined,
    [useScrollContainerRoot, scrollRoot],
  );
  const refObject = useMemo(
    () => ({ current: element }) as RefObject<T>,
    [element],
  );
  // Framer's useInView accepts a root + margin; when the scrollport is
  // not yet resolved we fall back to viewport semantics for first paint
  // and correct on the next render — one extra render, no per-frame work.
  const inView = useInView(refObject, {
    amount,
    ...(rootRef ? { root: rootRef } : {}),
    ...(rootMargin ? { margin: rootMargin as never } : {}),
  });
  const [entered, setEntered] = useState(false);

  // Render-phase latch (React-endorsed derived-state pattern).
  if (inView && !entered) {
    setEntered(true);
  }

  const ref = useCallback((el: T | null) => {
    setElement(el);
  }, []);

  if (!entered) {
    return { ref, state: "hidden" };
  }
  return { ref, state: inView ? "show" : "exit" };
}
