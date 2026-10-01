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
  /**
   * Controlled tween length (ms). When provided with smooth behavior the
   * container animates on a bounded rAF loop instead of delegating timing
   * to the browser — this is what makes navigation distance-aware.
   * Omitted = native `behavior` scroll (manual-feel paths).
   */
  duration?: number;
  programmatic?: boolean;
  lock?: boolean;
  /** Always invoked exactly once: on arrival or on interruption. */
  onSettled?: (info: { cancelled: boolean }) => void;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Restrained ease — decisive settle, no overshoot, no elastic feel. */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

interface ActiveTween {
  id: number;
  raf: number;
  cancel: () => void;
}

let activeTween: ActiveTween | null = null;
let tweenSeq = 0;

function stopActiveTween(): void {
  const current = activeTween;
  activeTween = null;
  if (!current) return;
  cancelAnimationFrame(current.raf);
  // finish(true) still runs: the guard below tolerates a cleared slot so
  // superseded tweens always settle their callbacks (never sticky flags).
  current.cancel();
}

/**
 * The ONE authoritative way to move page scroll position.
 *
 * Two paths, one scroller:
 * - Native (`behavior` only): manual-feel travel, browser-owned timing.
 * - Controlled tween (`duration` + smooth): navbar/CTA navigation with
 *   distance-aware timing. Yields instantly to real user input
 *   (wheel / touch / scroll keys) and to newer programmatic requests —
 *   the site never fights the user. Reduced-motion always jumps.
 */
export function scrollContainerTo(
  top: number,
  behaviorOrOptions: ScrollBehavior | ScrollContainerOptions = "smooth",
): () => void {
  const options: ScrollContainerOptions =
    typeof behaviorOrOptions === "string"
      ? { behavior: behaviorOrOptions }
      : behaviorOrOptions;
  const behavior = options.behavior ?? "smooth";
  const duration = options.duration;
  const onSettled = options.onSettled;

  const container = getScrollContainer();
  if (!container) {
    window.scrollTo({ top, behavior });
    onSettled?.({ cancelled: false });
    return () => {};
  }

  // A newer request always wins over an in-flight tween.
  stopActiveTween();

  const useTween =
    behavior === "smooth" &&
    typeof duration === "number" &&
    duration > 0 &&
    !prefersReducedMotion();

  if (!useTween) {
    if (behavior === "auto" || prefersReducedMotion()) {
      container.scrollTop = Math.max(0, top);
    } else {
      container.scrollTo({ top, behavior });
    }
    onSettled?.({ cancelled: false });
    return () => {};
  }

  const start = container.scrollTop;
  const delta = top - start;
  if (Math.abs(delta) < 1) {
    onSettled?.({ cancelled: false });
    return () => {};
  }

  const id = (tweenSeq += 1);
  const startTime =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  let settled = false;

  const finish = (cancelled: boolean) => {
    if (settled) return;
    if (activeTween && activeTween.id !== id) return;
    settled = true;
    activeTween = null;
    cancelAnimationFrame(raf);
    detach();
    onSettled?.({ cancelled });
  };

  const cancelOnInput = () => finish(true);
  // Only keys that scroll cancel — typing in the contact form must not
  // abort navigation.
  const cancelOnKey = (event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight":
      case "PageUp":
      case "PageDown":
      case "Home":
      case "End":
      case " ":
        finish(true);
        break;
      default:
        break;
    }
  };

  const detach = () => {
    container.removeEventListener("wheel", cancelOnInput);
    container.removeEventListener("touchmove", cancelOnInput);
    window.removeEventListener("keydown", cancelOnKey);
  };

  container.addEventListener("wheel", cancelOnInput, { passive: true });
  container.addEventListener("touchmove", cancelOnInput, { passive: true });
  window.addEventListener("keydown", cancelOnKey);

  let raf = 0;
  const tick = () => {
    if (settled || activeTween?.id !== id) return;
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const t = Math.max(0, Math.min(1, (now - startTime) / duration));
    container.scrollTop = start + delta * easeInOutCubic(t);
    if (t >= 1) {
      finish(false);
      return;
    }
    raf = requestAnimationFrame(tick);
    if (activeTween?.id === id && activeTween) {
      activeTween.raf = raf;
    }
  };

  const cancel = () => finish(true);
  raf = requestAnimationFrame(tick);
  activeTween = { id, raf, cancel };
  return cancel;
}
