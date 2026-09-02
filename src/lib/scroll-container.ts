import type Lenis from "lenis";

import { LENIS_EASING } from "@/lib/lenis-config";

export const SCROLL_CONTAINER_ID = "scroll-container";

let lenisInstance: Lenis | null = null;
let programmaticScrollUntil = 0;
let guidanceSettlingUntil = 0;
let guidanceLockedUntil = 0;

export function markProgrammaticScroll(durationMs = 1300): void {
  programmaticScrollUntil = performance.now() + durationMs;
}

export function isProgrammaticScroll(): boolean {
  return performance.now() < programmaticScrollUntil;
}

export function lockGuidance(durationMs: number): void {
  guidanceLockedUntil = Math.max(
    guidanceLockedUntil,
    performance.now() + durationMs,
  );
}

export function unlockGuidance(): void {
  guidanceLockedUntil = 0;
}

export function isGuidanceLocked(): boolean {
  return performance.now() < guidanceLockedUntil;
}

export function markGuidanceSettle(durationMs: number): void {
  guidanceSettlingUntil = performance.now() + durationMs;
  lockGuidance(durationMs);
}

export function isGuidanceSettling(): boolean {
  return performance.now() < guidanceSettlingUntil;
}

export function cancelGuidanceSettle(): void {
  guidanceSettlingUntil = 0;
  const lenis = lenisInstance;
  if (lenis) {
    lenis.scrollTo(lenis.scroll, { immediate: true, lock: false });
  }
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
  lock?: boolean;
  easing?: (t: number) => number;
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
  const duration = options.duration ?? 1.02;
  const immediate = behavior === "auto";

  if (options.programmatic !== false && !immediate) {
    markProgrammaticScroll(duration * 1000 + 200);
  }

  if (lenisInstance) {
    lenisInstance.scrollTo(top, {
      immediate,
      duration,
      easing: options.easing ?? LENIS_EASING,
      lock: options.lock ?? false,
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
