import { getScrollContainer, getScrollTop } from "@/lib/scroll-container";
import { getSectionChoreography } from "@/lib/section-choreography";

let lockCount = 0;
let savedScrollTop = 0;

export function isScrollPanelLocked(): boolean {
  return lockCount > 0;
}

export function lockScrollPanel(): void {
  lockCount += 1;
  if (lockCount > 1) return;

  savedScrollTop = getScrollTop();
  const container = getScrollContainer();

  if (container) {
    container.style.overflow = "hidden";
    container.dataset.scrollLocked = "true";
  }

  document.body.style.overflow = "hidden";
}

export function unlockScrollPanel(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;

  const container = getScrollContainer();

  if (container) {
    // Restore any drift while locked without animating — scroll position
    // itself is preserved by overflow:hidden, this only guards edge cases.
    // Skipped when a programmatic navigation is intentionally moving scroll:
    // restoring the stale pre-menu position would yank the in-flight tween
    // back and produce a visible jump at navigation start.
    if (!getSectionChoreography().navigating) {
      if (Math.abs(container.scrollTop - savedScrollTop) > 1) {
        container.scrollTop = savedScrollTop;
      }
    }
    container.style.overflow = "";
    delete container.dataset.scrollLocked;
  }

  document.body.style.overflow = "";
}
