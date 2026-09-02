import {
  collectCinematicLayoutElements,
  tickCinematicSections,
} from "@/lib/cinematic-scroll-coordinator";
import { pointerEngine } from "@/lib/pointer-engine";
import { getScrollContainer } from "@/lib/scroll-container";
import { tickScrollGuidance } from "@/lib/scroll-intent-guidance";
import {
  type ScrollLayoutSnapshot,
  createScrollLayoutSnapshot,
} from "@/lib/scroll-layout-snapshot";
import {
  type ScrollMotionFrame,
  getScrollMotionFrame,
  subscribeScrollMotion,
} from "@/lib/scroll-motion-engine";
import {
  collectSpotlightLayoutElements,
  tickServicesSpotlight,
} from "@/lib/services-mobile-spotlight";

const SCROLL_ACTIVE_CLASS = "is-scroll-active";
const SCROLL_IDLE_MS = 160;
/** Below this velocity, visual ticks run every other frame. */
const LOW_VELOCITY_THRESHOLD = 0.08;

let unsubscribe: (() => void) | null = null;
let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null;
let scrollActive = false;
let lastScrollY = -1;
let visualTickCounter = 0;

function setScrollActive(next: boolean): void {
  if (scrollActive === next) return;
  scrollActive = next;
  getScrollContainer()?.classList.toggle(SCROLL_ACTIVE_CLASS, next);
  pointerEngine.setScrollPaused(next);
}

function scheduleScrollInactive(): void {
  if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
  scrollIdleTimer = setTimeout(() => {
    scrollIdleTimer = null;
    setScrollActive(false);
  }, SCROLL_IDLE_MS);
}

function buildLayoutSnapshot(): ScrollLayoutSnapshot {
  const elements: HTMLElement[] = [];
  collectCinematicLayoutElements(elements);
  collectSpotlightLayoutElements(elements);
  return createScrollLayoutSnapshot(elements);
}

function shouldSkipVisualTick(motion: ScrollMotionFrame): boolean {
  if (Math.abs(motion.velocity) >= LOW_VELOCITY_THRESHOLD) {
    return false;
  }
  visualTickCounter += 1;
  return visualTickCounter % 2 !== 0;
}

function onScrollMotion(motion: ScrollMotionFrame): void {
  const isMoving =
    Math.abs(motion.velocity) > 0.025 ||
    (lastScrollY >= 0 && Math.abs(motion.scroll - lastScrollY) > 0.5);

  if (isMoving) {
    setScrollActive(true);
    scheduleScrollInactive();
  }

  lastScrollY = motion.scroll;

  tickScrollGuidance(motion);

  if (shouldSkipVisualTick(motion)) {
    return;
  }

  const snapshot = buildLayoutSnapshot();
  tickCinematicSections(motion, snapshot);
  tickServicesSpotlight(motion, snapshot);
}

export function isScrollActive(): boolean {
  return scrollActive;
}

export function ensureScrollBus(): void {
  if (unsubscribe) return;
  unsubscribe = subscribeScrollMotion(onScrollMotion);
}

export function stopScrollBus(): void {
  unsubscribe?.();
  unsubscribe = null;
  if (scrollIdleTimer) {
    clearTimeout(scrollIdleTimer);
    scrollIdleTimer = null;
  }
  setScrollActive(false);
  lastScrollY = -1;
  visualTickCounter = 0;
}

export function flushScrollBus(): void {
  visualTickCounter = 0;
  const motion = getScrollMotionFrame();
  tickScrollGuidance(motion);
  const snapshot = buildLayoutSnapshot();
  tickCinematicSections(motion, snapshot);
  tickServicesSpotlight(motion, snapshot);
}
