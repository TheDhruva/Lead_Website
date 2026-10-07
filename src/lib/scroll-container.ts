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

/**
 * Snap-suspend coordination — the single authority over snap interference
 * during programmatic movement.
 *
 * Manual scrolling runs snap-free (post-gesture section settling owns
 * landing — see section-settle.ts). A controlled tween still suspends
 * any snap alignment defensively for its duration so nothing can
 * re-target scroll position mid-flight, then restores it. Refcounted
 * so overlapping/superseded flights never leave snap disabled.
 */
let snapSuspendCount = 0;

export function suspendContainerSnap(): void {
  if (typeof document === "undefined") return;
  const container = getScrollContainer();
  if (!container) return;
  if (snapSuspendCount === 0) {
    container.dataset.snapSuspended = "true";
    // Inline style beats the Tailwind snap utilities without touching
    // class lists (no layout churn from class swaps mid-flight).
    container.style.scrollSnapType = "none";
  }
  snapSuspendCount += 1;
}

export function restoreContainerSnap(): void {
  if (typeof document === "undefined") return;
  if (snapSuspendCount === 0) return;
  snapSuspendCount -= 1;
  if (snapSuspendCount > 0) return;
  const container = getScrollContainer();
  if (!container) return;
  delete container.dataset.snapSuspended;
  container.style.removeProperty("scroll-snap-type");
}

/** For tests/diagnostics only — never branch runtime behavior on this. */
export function isContainerSnapSuspended(): boolean {
  return snapSuspendCount > 0;
}

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
    restoreContainerSnap();
    onSettled?.({ cancelled });
  };

  // Cancellation deadband: a single wheel tick (1–4px of trackpad
  // momentum or an accidental nudge) must not strand a long flight
  // mid-section. Accumulate wheel displacement and cancel only on
  // meaningful input (~2–3 deliberate ticks); touch and scroll-keys
  // stay instant-cancel since finger-down and keypresses are
  // unambiguous intent. No timers — purely input-driven.
  const WHEEL_CANCEL_PX = 24;
  let wheelAccum = 0;
  const cancelOnWheel = (event: WheelEvent) => {
    wheelAccum += Math.abs(event.deltaY) + Math.abs(event.deltaX);
    if (wheelAccum >= WHEEL_CANCEL_PX) finish(true);
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
    container.removeEventListener("wheel", cancelOnWheel);
    container.removeEventListener("touchmove", cancelOnInput);
    window.removeEventListener("keydown", cancelOnKey);
  };

  container.addEventListener("wheel", cancelOnWheel, { passive: true });
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
  // Suspend snap for the whole flight: the browser must not re-target
  // scroll position while this tween owns it. Restored in finish().
  suspendContainerSnap();
  raf = requestAnimationFrame(tick);
  activeTween = { id, raf, cancel };
  return cancel;
}
