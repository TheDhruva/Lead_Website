import type Snap from "lenis/snap";

const SNAP_SELECTOR = "[data-snap-frame], section#contact";
const registeredElements = new Set<HTMLElement>();

let snapInstance: Snap | null = null;

export function registerLenisSnap(instance: Snap | null): void {
  snapInstance = instance;
  if (!instance) {
    registeredElements.clear();
  }
}

export function getLenisSnap(): Snap | null {
  return snapInstance;
}

export function refreshLenisSnapElements(): void {
  if (!snapInstance) return;

  for (const element of registeredElements) {
    if (!document.contains(element)) {
      registeredElements.delete(element);
    }
  }

  const elements = document.querySelectorAll<HTMLElement>(SNAP_SELECTOR);

  elements.forEach((element) => {
    if (registeredElements.has(element)) return;
    registeredElements.add(element);
    snapInstance!.addElement(element, { align: "start" });
  });

  snapInstance.resize();
}

export function observeLenisSnapTargets(root: HTMLElement): () => void {
  refreshLenisSnapElements();

  const observer = new MutationObserver(() => {
    refreshLenisSnapElements();
  });

  observer.observe(root, { childList: true, subtree: true });

  return () => observer.disconnect();
}

/** Smooth exponential ease — matches Lenis default feel. */
export const LENIS_EASING = (t: number) =>
  Math.min(1, 1.001 - Math.pow(2, -10 * t));
