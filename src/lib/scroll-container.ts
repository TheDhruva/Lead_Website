import type Lenis from "lenis";

export const SCROLL_CONTAINER_ID = "scroll-container";

let lenisInstance: Lenis | null = null;

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

export function scrollContainerTo(
  top: number,
  behavior: ScrollBehavior = "smooth",
): void {
  if (lenisInstance) {
    lenisInstance.scrollTo(top, { immediate: behavior === "auto" });
    return;
  }

  const container = getScrollContainer();
  if (container) {
    container.scrollTo({ top, behavior });
    return;
  }
  window.scrollTo({ top, behavior });
}
