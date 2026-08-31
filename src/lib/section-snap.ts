import { getNavSafeTopPx, getPageEndScrollY } from "@/lib/scroll-position";

function absoluteTop(el: HTMLElement): number {
  return el.getBoundingClientRect().top + window.scrollY;
}

function clampScroll(y: number): number {
  return Math.min(getPageEndScrollY(), Math.max(0, y));
}

function isContactSection(el: HTMLElement): boolean {
  return (
    el.id === "contact" ||
    el.classList.contains("section-frame--contact") ||
    el.classList.contains("section-contact")
  );
}

/** @deprecated Section snap disabled — kept for potential future proximity use */
export function getSectionSnapScrollY(el: HTMLElement): number {
  const vh = window.innerHeight;
  const height = el.offsetHeight;
  const top = absoluteTop(el);
  const navSafe = getNavSafeTopPx();

  if (isContactSection(el)) {
    return getPageEndScrollY();
  }

  if (height >= vh * 0.82) {
    return clampScroll(top - navSafe);
  }

  const centered = top - (vh - height) * 0.38 + navSafe * 0.15;
  return clampScroll(Math.round(centered));
}

export function debounce(fn: () => void, delay: number): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

export { getPageEndScrollY };
