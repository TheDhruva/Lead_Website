export type ScrollDirection = -1 | 0 | 1;

export interface ScrollMotionFrame {
  scroll: number;
  velocity: number;
  direction: ScrollDirection;
  progress: number;
  limit: number;
}

const INITIAL: ScrollMotionFrame = {
  scroll: 0,
  velocity: 0,
  direction: 0,
  progress: 0,
  limit: 0,
};

let frame: ScrollMotionFrame = INITIAL;
const subscribers = new Set<(next: ScrollMotionFrame) => void>();

export function getScrollMotionFrame(): ScrollMotionFrame {
  return frame;
}

export function publishScrollMotion(next: ScrollMotionFrame): void {
  frame = next;
  subscribers.forEach((listener) => listener(next));
}

export function subscribeScrollMotion(
  listener: (next: ScrollMotionFrame) => void,
): () => void {
  subscribers.add(listener);
  listener(frame);
  return () => {
    subscribers.delete(listener);
  };
}

/**
 * Rect subset consumed by the progress math. Structurally compatible with
 * DOMRect and with the coordinator's cached, arithmetically-derived rects.
 */
export interface SectionRect {
  top: number;
  bottom: number;
  height: number;
}

/** 0 → below fold; 1 → fully entered */
export function computeSectionEnterProgress(
  rect: SectionRect,
  viewportH: number,
): number {
  if (viewportH <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - rect.top / viewportH));
}
