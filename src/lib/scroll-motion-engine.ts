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

/** 0 → section entering; 1 → section leaving viewport */
export function computeSectionTravelProgress(
  rect: DOMRect,
  viewportH: number,
): number {
  const total = viewportH + rect.height;
  if (total <= 0) return 0;
  const traveled = viewportH - rect.top;
  return Math.max(0, Math.min(1, traveled / total));
}

/** 0 → fully visible at top; 1 → scrolled away */
export function computeSectionExitProgress(
  rect: DOMRect,
  viewportH: number,
): number {
  if (viewportH <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - rect.bottom / viewportH));
}

/** 0 → below fold; 1 → fully entered */
export function computeSectionEnterProgress(
  rect: DOMRect,
  viewportH: number,
): number {
  if (viewportH <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - rect.top / viewportH));
}

export function computeVelocityScale(
  velocity: number,
  isMobile: boolean,
): number {
  const absVelocity = Math.abs(velocity);
  const multiplier = isMobile ? 0.005 : 0.009;
  const cap = isMobile ? 0.012 : 0.022;
  return 1 + Math.min(absVelocity * multiplier, cap);
}
