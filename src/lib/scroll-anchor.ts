import {
  getOffsetInScrollContainer,
  getScrollContainer,
} from "@/lib/scroll-container";

export const SCROLL_ANCHOR_SELECTOR = "[data-scroll-anchor]";

/** Fallback when CSS vars are not yet measured (~108px) */
const NAV_SAFE_FALLBACK_PX = 108;

/** Default: center of usable viewport below navbar. */
const DEFAULT_ANCHOR_RATIO = 0.5;

function isContactSection(el: HTMLElement): boolean {
  return (
    el.id === "contact" ||
    el.classList.contains("section-frame--contact") ||
    el.classList.contains("section-contact")
  );
}

/** Read --nav-safe-top from the document (set by useNavMetrics). */
export function getNavSafeTopPx(): number {
  if (typeof window === "undefined") return NAV_SAFE_FALLBACK_PX;

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--nav-safe-top")
    .trim();

  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : NAV_SAFE_FALLBACK_PX;
}

function parseAnchorRatio(sectionEl: HTMLElement): number {
  const raw = sectionEl.dataset.scrollAnchorRatio?.trim();
  if (!raw) return DEFAULT_ANCHOR_RATIO;

  const parsed = parseFloat(raw);
  return Number.isFinite(parsed)
    ? Math.max(0.32, Math.min(0.58, parsed))
    : DEFAULT_ANCHOR_RATIO;
}

/** Resolve the visual anchor element inside a section. */
export function getSectionAnchorElement(sectionEl: HTMLElement): HTMLElement {
  return (
    sectionEl.querySelector<HTMLElement>(SCROLL_ANCHOR_SELECTOR) ?? sectionEl
  );
}

/**
 * Scroll position that centers the visual anchor in the usable viewport
 * (below navbar safe area). Ratio fine-tunes vertical framing within that area.
 */
export function getSectionAnchorScrollY(
  sectionEl: HTMLElement,
  viewportH: number,
  maxScroll: number,
  navSafeTop = getNavSafeTopPx(),
): number {
  if (isContactSection(sectionEl)) {
    return maxScroll;
  }

  const anchor = getSectionAnchorElement(sectionEl);
  const ratio = parseAnchorRatio(sectionEl);
  const anchorTop = getOffsetInScrollContainer(anchor);
  const anchorCenter = anchorTop + anchor.offsetHeight / 2;

  const usableTop = Math.min(navSafeTop, viewportH * 0.35);
  const usableHeight = Math.max(viewportH - usableTop, viewportH * 0.45);
  const focalLine = usableTop + usableHeight * ratio;
  const target = anchorCenter - focalLine;

  return Math.max(0, Math.min(target, maxScroll));
}

export function getViewportHeight(): number {
  return getScrollContainer()?.clientHeight ?? window.innerHeight;
}

/** Viewport focal line used for section index detection (navbar-aware center). */
export function getViewportFocalScrollY(
  scrollY: number,
  viewportH = getViewportHeight(),
  navSafeTop = getNavSafeTopPx(),
): number {
  const usableTop = Math.min(navSafeTop, viewportH * 0.35);
  const usableHeight = Math.max(viewportH - usableTop, viewportH * 0.45);
  return scrollY + usableTop + usableHeight * 0.5;
}
