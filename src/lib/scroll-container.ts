export const SCROLL_CONTAINER_ID = "scroll-container";

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
  const container = getScrollContainer();
  return container?.scrollTop ?? window.scrollY;
}

export interface ScrollContainerOptions {
  behavior?: ScrollBehavior;
  /** Accepted for API compatibility; native smooth scrolling owns the timing. */
  duration?: number;
  programmatic?: boolean;
  lock?: boolean;
}

/**
 * The ONE authoritative way to move page scroll position.
 * Native container.scrollTo only — CSS snap settles the final stop, so no
 * JS easing, duration, or correction loop may compete with it.
 */
export function scrollContainerTo(
  top: number,
  behaviorOrOptions: ScrollBehavior | ScrollContainerOptions = "smooth",
): void {
  const behavior =
    typeof behaviorOrOptions === "string"
      ? behaviorOrOptions
      : (behaviorOrOptions.behavior ?? "smooth");

  const container = getScrollContainer();
  if (container) {
    container.scrollTo({ top, behavior });
    return;
  }
  window.scrollTo({ top, behavior });
}
