import {
  getOffsetInScrollContainer,
  getScrollContainer,
  scrollContainerTo,
} from "@/lib/scroll-container";

/** Fallback when CSS vars are not yet measured (~108px) */
const NAV_SAFE_FALLBACK_PX = 108;

/** Read --nav-safe-top from the document (set by useNavMetrics). */
export function getNavSafeTopPx(): number {
  if (typeof window === "undefined") return NAV_SAFE_FALLBACK_PX;

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--nav-safe-top")
    .trim();

  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : NAV_SAFE_FALLBACK_PX;
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
  if (isContactSection(target)) {
    scrollContainerTo(getPageEndScrollY(), {
      behavior: "smooth",
      duration: 1.05,
      programmatic: true,
    });
    return;
  }

  scrollContainerTo(getOffsetInScrollContainer(target), {
    behavior: "smooth",
    duration: 1.05,
    programmatic: true,
  });
}
