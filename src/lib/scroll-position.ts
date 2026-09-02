import { requestLazySectionMount } from "@/lib/lazy-section-mount";
import {
  GUIDANCE_SETTLE_EASING,
  getNavSettleDuration,
} from "@/lib/lenis-config";
import {
  getSectionAnchorScrollY,
  getNavSafeTopPx as readNavSafeTopPx,
} from "@/lib/scroll-anchor";
import { getScrollContainer, scrollContainerTo } from "@/lib/scroll-container";

/** @deprecated Use getNavSafeTopPx from scroll-anchor */
const NAV_SAFE_FALLBACK_PX = 108;

/** Read --nav-safe-top from the document (set by useNavMetrics). */
export function getNavSafeTopPx(): number {
  if (typeof window === "undefined") return NAV_SAFE_FALLBACK_PX;
  return readNavSafeTopPx();
}

/** @deprecated Use getNavSafeTopPx */
export const NAV_CLEARANCE_PX = NAV_SAFE_FALLBACK_PX;

export function getPageEndScrollY(): number {
  const container = getScrollContainer();

  if (container) {
    return Math.max(0, container.scrollHeight - container.clientHeight);
  }

  return Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
}

function isContactSection(el: HTMLElement): boolean {
  return (
    el.id === "contact" ||
    el.classList.contains("section-frame--contact") ||
    el.classList.contains("section-contact")
  );
}

/** Snap sections align to container top — offset is 0. */
export function getSectionScrollOffset(el: HTMLElement): number {
  void el;
  return 0;
}

export function scrollToSectionElement(target: HTMLElement): void {
  if (target.id) {
    requestLazySectionMount(target.id);
  }

  const container = getScrollContainer();
  const viewportH = container?.clientHeight ?? window.innerHeight;
  const maxScroll = getPageEndScrollY();
  const navSafeTop = getNavSafeTopPx();
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const duration = getNavSettleDuration(isCoarsePointer);

  if (isContactSection(target)) {
    scrollContainerTo(getPageEndScrollY(), {
      behavior: "smooth",
      duration,
      programmatic: true,
      lock: true,
      easing: GUIDANCE_SETTLE_EASING,
    });
    return;
  }

  scrollContainerTo(
    getSectionAnchorScrollY(target, viewportH, maxScroll, navSafeTop),
    {
      behavior: "smooth",
      duration,
      programmatic: true,
      lock: true,
      easing: GUIDANCE_SETTLE_EASING,
    },
  );
}
