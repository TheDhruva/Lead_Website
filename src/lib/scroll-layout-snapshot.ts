/** Batched layout reads for one scroll-bus tick — read once, write many. */
export interface ScrollLayoutSnapshot {
  viewportH: number;
  rects: ReadonlyMap<HTMLElement, DOMRect>;
}

export function createScrollLayoutSnapshot(
  elements: Iterable<HTMLElement>,
): ScrollLayoutSnapshot {
  const viewportH = window.innerHeight || 1;
  const rects = new Map<HTMLElement, DOMRect>();

  for (const element of elements) {
    rects.set(element, element.getBoundingClientRect());
  }

  return { viewportH, rects };
}

export function getSnapshotRect(
  snapshot: ScrollLayoutSnapshot,
  element: HTMLElement,
): DOMRect | null {
  return snapshot.rects.get(element) ?? null;
}
