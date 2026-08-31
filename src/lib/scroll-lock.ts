import {
  getLenis,
  getScrollContainer,
  getScrollTop,
} from "@/lib/scroll-container";

let lockCount = 0;
let savedScrollTop = 0;

export function lockScrollPanel(): void {
  lockCount += 1;
  if (lockCount > 1) return;

  savedScrollTop = getScrollTop();
  const container = getScrollContainer();
  const lenis = getLenis();

  lenis?.stop();

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
  const lenis = getLenis();

  if (container) {
    container.style.overflow = "";
    delete container.dataset.scrollLocked;
  }

  document.body.style.overflow = "";

  if (lenis) {
    lenis.start();
    lenis.scrollTo(savedScrollTop, { immediate: true });
  }
}
