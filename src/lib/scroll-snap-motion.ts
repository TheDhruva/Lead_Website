import { LENIS_EASING } from "@/lib/lenis-section-snap";
import { getScrollContainer } from "@/lib/scroll-container";

export { LENIS_EASING as SNAP_EASING };

let activeAnimation: number | null = null;

export function cancelScrollSnapAnimation(): void {
  if (activeAnimation !== null) {
    cancelAnimationFrame(activeAnimation);
    activeAnimation = null;
  }
}

export function animateScrollTo(
  targetY: number,
  durationMs: number,
  onComplete?: () => void,
): void {
  const container = getScrollContainer();
  if (!container) return;

  cancelScrollSnapAnimation();

  const startY = container.scrollTop;
  const delta = targetY - startY;

  if (Math.abs(delta) < 2) {
    onComplete?.();
    return;
  }

  const startTime = performance.now();

  const frame = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    const eased = LENIS_EASING(progress);

    container.scrollTop = startY + delta * eased;

    if (progress < 1) {
      activeAnimation = requestAnimationFrame(frame);
    } else {
      activeAnimation = null;
      onComplete?.();
    }
  };

  activeAnimation = requestAnimationFrame(frame);
}
