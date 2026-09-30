"use client";

import { type RefObject, useCallback, useMemo, useState } from "react";

import { useInView } from "framer-motion";

export type EnterExitState = "hidden" | "show" | "exit";

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
): { ref: (element: T | null) => void; state: EnterExitState } {
  const [element, setElement] = useState<T | null>(null);
  const refObject = useMemo(
    () => ({ current: element }) as RefObject<T>,
    [element],
  );
  const inView = useInView(refObject, { amount });
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
