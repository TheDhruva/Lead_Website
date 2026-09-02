import type Lenis from "lenis";

import { LENIS_EASING, getLenisSnap } from "@/lib/lenis-section-snap";

export const SCROLL_CONTAINER_ID = "scroll-container";

let lenisInstance: Lenis | null = null;
let programmaticScrollUntil = 0;

export function markProgrammaticScroll(durationMs = 1300): void {
  programmaticScrollUntil = performance.now() + durationMs;
}

export function isProgrammaticScroll(): boolean {
  return performance.now() < programmaticScrollUntil;
}

export function registerLenis(instance: Lenis | null): void {
  lenisInstance = instance;
}

export function getLenis(): Lenis | null {
  return lenisInstance;
}

export function getScrollContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById(SCROLL_CONTAINER_ID);
}

/** Offset of `el` from the top of the scroll container content. */
export function getOffsetInScrollContainer(el: HTMLElement): number {
  const container = getScrollContainer();
  if (!container) {
    return el.getBoundingClientRect().top + window.scrollY;
  }

  const containerTop = container.getBoundingClientRect().top;
  return el.getBoundingClientRect().top - containerTop + container.scrollTop;
}

export function getScrollTop(): number {
  if (lenisInstance) {
    return lenisInstance.scroll;
  }

  const container = getScrollContainer();
  return container?.scrollTop ?? window.scrollY;
}

export interface ScrollContainerOptions {
  behavior?: ScrollBehavior;
  duration?: number;
  programmatic?: boolean;
}

export function scrollContainerTo(
  top: number,
  behaviorOrOptions: ScrollBehavior | ScrollContainerOptions = "smooth",
): void {
  const options =
    typeof behaviorOrOptions === "string"
      ? { behavior: behaviorOrOptions }
      : behaviorOrOptions;

  const behavior = options.behavior ?? "smooth";
  const duration = options.duration ?? 1.05;
  const immediate = behavior === "auto";

  if (options.programmatic !== false && !immediate) {
    markProgrammaticScroll(duration * 1000 + 200);
    getLenisSnap()?.stop();
    window.setTimeout(
      () => {
        getLenisSnap()?.start();
      },
      duration * 1000 + 250,
    );
  }

  if (lenisInstance) {
    lenisInstance.scrollTo(top, {
      immediate,
      duration,
      easing: LENIS_EASING,
    });
    return;
  }

  const container = getScrollContainer();
  if (container) {
    container.scrollTo({ top, behavior });
    return;
  }
  window.scrollTo({ top, behavior });
}
