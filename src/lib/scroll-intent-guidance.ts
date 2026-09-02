import {
  GUIDANCE_IDLE_STREAK_MS,
  GUIDANCE_MIN_SETTLE_DRIFT_RATIO,
  GUIDANCE_SETTLE_EASING,
  GUIDANCE_VELOCITY_IDLE,
  GUIDANCE_VELOCITY_INTERRUPT,
  POST_SETTLE_COOLDOWN_MS,
  getGuidanceSettleDuration,
  getIntentCommitRatio,
} from "@/lib/lenis-config";
import { getSectionAnchorScrollY } from "@/lib/scroll-anchor";
import { ensureScrollBus } from "@/lib/scroll-bus";
import {
  cancelGuidanceSettle,
  getLenis,
  getScrollContainer,
  isGuidanceLocked,
  isGuidanceSettling,
  isProgrammaticScroll,
  lockGuidance,
  markGuidanceSettle,
  scrollContainerTo,
  unlockGuidance,
} from "@/lib/scroll-container";
import { isScrollPanelLocked } from "@/lib/scroll-lock";
import type { ScrollMotionFrame } from "@/lib/scroll-motion-engine";
import { getNavSafeTopPx, getPageEndScrollY } from "@/lib/scroll-position";
import {
  type SnapTarget,
  collectSnapTargets,
  findDirectionalTargetByIndex,
  getStableSectionIndex,
} from "@/lib/section-snap";

const MAIN_CONTENT_ID = "main-content";
const SETTLE_TOLERANCE_PX = 16;
const REVERSAL_CANCEL_RATIO = 0.3;
const POST_TOUCH_SETTLE_MS = 120;
const WHEEL_GESTURE_GAP_MS = 260;
const RESIZE_DEBOUNCE_MS = 140;

type GuidancePhase =
  "idle" | "tracking" | "committed" | "settling" | "cooldown";

interface GestureState {
  startScroll: number;
  direction: -1 | 0 | 1;
  originSectionIndex: number;
  committedTarget: SnapTarget | null;
  targetScrollY: number | null;
}

let container: HTMLElement | null = null;
let phase: GuidancePhase = "idle";
let gesture: GestureState | null = null;
let isTouching = false;
let touchSettleReadyAt = 0;
let wheelGestureActive = false;
let cachedTargets: SnapTarget[] = [];
let targetsCachedAt = 0;
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
let settleCompleteTimer: ReturnType<typeof setTimeout> | null = null;
let wheelGestureTimer: ReturnType<typeof setTimeout> | null = null;
let cooldownTimer: ReturnType<typeof setTimeout> | null = null;
let lastScroll = 0;
let listenersAttached = false;
/** Blocks a new gesture until Lenis momentum fully stops after guidance. */
let blockTrackingUntilIdle = false;
let idleStreakStart = 0;
/** Defer snap-target refresh until the current gesture finishes. */
let pendingTargetRefresh = false;

function isCoarsePointer(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

function getSignedTravel(delta: number, direction: -1 | 0 | 1): number {
  if (direction > 0) return Math.max(0, delta);
  if (direction < 0) return Math.max(0, -delta);
  return Math.abs(delta);
}

function resolveTargetScrollY(
  target: SnapTarget,
  viewportH: number,
  maxScroll: number,
  navSafeTop: number,
): number {
  if (target.id === "contact") return maxScroll;
  return getSectionAnchorScrollY(
    target.element,
    viewportH,
    maxScroll,
    navSafeTop,
  );
}

function invalidateTargets(): void {
  targetsCachedAt = 0;
}

function scheduleTargetRefresh(): void {
  if (phase === "tracking" || phase === "committed" || phase === "settling") {
    pendingTargetRefresh = true;
    return;
  }
  invalidateTargets();
}

function flushPendingTargetRefresh(): void {
  if (!pendingTargetRefresh) return;
  pendingTargetRefresh = false;
  invalidateTargets();
}

function refreshTargets(): SnapTarget[] {
  cachedTargets = collectSnapTargets();
  targetsCachedAt = performance.now();
  return cachedTargets;
}

function getTargets(): SnapTarget[] {
  if (cachedTargets.length === 0 || performance.now() - targetsCachedAt > 600) {
    return refreshTargets();
  }
  return cachedTargets;
}

function clearTimers(): void {
  if (settleCompleteTimer) {
    clearTimeout(settleCompleteTimer);
    settleCompleteTimer = null;
  }
  if (cooldownTimer) {
    clearTimeout(cooldownTimer);
    cooldownTimer = null;
  }
}

function resetGesture(): void {
  phase = "idle";
  gesture = null;
  touchSettleReadyAt = 0;
  clearTimers();
  flushPendingTargetRefresh();
}

function markGuidanceComplete(): void {
  blockTrackingUntilIdle = true;
  idleStreakStart = 0;
}

function updateTrackingGate(motion: ScrollMotionFrame): void {
  if (!blockTrackingUntilIdle) return;

  const hasInput =
    wheelGestureActive ||
    isTouching ||
    Math.abs(motion.velocity) > GUIDANCE_VELOCITY_IDLE;

  if (hasInput) {
    idleStreakStart = 0;
    return;
  }

  if (idleStreakStart === 0) {
    idleStreakStart = performance.now();
    return;
  }

  if (performance.now() - idleStreakStart >= GUIDANCE_IDLE_STREAK_MS) {
    blockTrackingUntilIdle = false;
    idleStreakStart = 0;
  }
}

function canStartTracking(motion: ScrollMotionFrame): boolean {
  if (blockTrackingUntilIdle) return false;
  if (isGuidanceLocked()) return false;
  return Math.abs(motion.velocity) > GUIDANCE_VELOCITY_IDLE;
}

function stopScrollMomentum(): void {
  const lenis = getLenis();
  if (!lenis) return;
  lenis.scrollTo(lenis.scroll, { immediate: true, lock: false });
}

function enterCooldown(): void {
  phase = "cooldown";
  gesture = null;
  markGuidanceComplete();
  lockGuidance(POST_SETTLE_COOLDOWN_MS);

  clearTimers();
  cooldownTimer = setTimeout(() => {
    phase = "idle";
    unlockGuidance();
    cooldownTimer = null;
    flushPendingTargetRefresh();
  }, POST_SETTLE_COOLDOWN_MS);
}

function commitTarget(): void {
  if (!gesture || gesture.committedTarget || !container) return;

  const targets = refreshTargets();
  const viewportH = container.clientHeight || window.innerHeight;
  const maxScroll = getPageEndScrollY();
  const navSafeTop = getNavSafeTopPx();

  const target = findDirectionalTargetByIndex(
    targets,
    gesture.originSectionIndex,
    gesture.direction,
  );

  if (!target) return;

  const targetIndex = targets.findIndex((entry) => entry.id === target.id);
  if (targetIndex === gesture.originSectionIndex) return;

  gesture.committedTarget = target;
  gesture.targetScrollY = resolveTargetScrollY(
    target,
    viewportH,
    maxScroll,
    navSafeTop,
  );
  phase = "committed";
}

function beginSettle(scrollY: number): void {
  const activeGesture = gesture;
  if (
    !activeGesture?.committedTarget ||
    activeGesture.targetScrollY === null ||
    !container
  ) {
    return;
  }

  const viewportH = container.clientHeight || window.innerHeight;
  const navSafeTop = getNavSafeTopPx();
  const targetY = activeGesture.targetScrollY;
  const distance = Math.abs(scrollY - targetY);
  const drift = Math.abs(scrollY - activeGesture.startScroll);
  const targets = getTargets();
  const targetIndex = targets.findIndex(
    (entry) => entry.id === activeGesture.committedTarget!.id,
  );
  const currentIndex = getStableSectionIndex(
    targets,
    scrollY,
    viewportH,
    navSafeTop,
  );

  if (distance <= SETTLE_TOLERANCE_PX) {
    unlockGuidance();
    enterCooldown();
    return;
  }

  if (drift < viewportH * GUIDANCE_MIN_SETTLE_DRIFT_RATIO) {
    unlockGuidance();
    resetGesture();
    return;
  }

  if (
    targetIndex >= 0 &&
    ((activeGesture.direction > 0 && currentIndex >= targetIndex) ||
      (activeGesture.direction < 0 && currentIndex <= targetIndex))
  ) {
    unlockGuidance();
    enterCooldown();
    return;
  }

  phase = "settling";
  stopScrollMomentum();

  const duration = getGuidanceSettleDuration(isCoarsePointer());
  markGuidanceSettle(duration * 1000 + POST_SETTLE_COOLDOWN_MS + 160);

  scrollContainerTo(targetY, {
    behavior: "smooth",
    duration,
    programmatic: true,
    lock: true,
    easing: GUIDANCE_SETTLE_EASING,
  });

  clearTimers();
  settleCompleteTimer = setTimeout(
    () => {
      settleCompleteTimer = null;
      unlockGuidance();
      enterCooldown();
    },
    duration * 1000 + 100,
  );
}

function onWheel(): void {
  if (isGuidanceLocked() || phase === "settling" || phase === "cooldown") {
    return;
  }

  wheelGestureActive = true;
  if (wheelGestureTimer) clearTimeout(wheelGestureTimer);
  wheelGestureTimer = setTimeout(() => {
    wheelGestureActive = false;
    wheelGestureTimer = null;
  }, WHEEL_GESTURE_GAP_MS);
}

function onTouchStart(): void {
  isTouching = true;
  touchSettleReadyAt = 0;

  if (phase === "settling") {
    cancelGuidanceSettle();
    unlockGuidance();
    resetGesture();
    return;
  }

  if (isGuidanceLocked() || wheelGestureActive || !container) return;

  const targets = getTargets();
  const viewportH = container.clientHeight || window.innerHeight;

  phase = "tracking";
  gesture = {
    startScroll: lastScroll,
    direction: 0,
    originSectionIndex: getStableSectionIndex(
      targets,
      lastScroll,
      viewportH,
      getNavSafeTopPx(),
    ),
    committedTarget: null,
    targetScrollY: null,
  };
}

function onTouchEnd(): void {
  isTouching = false;
  touchSettleReadyAt = performance.now() + POST_TOUCH_SETTLE_MS;
}

function onResize(): void {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(scheduleTargetRefresh, RESIZE_DEBOUNCE_MS);
}

function onContentMutation(): void {
  scheduleTargetRefresh();
}

export function tickScrollGuidance(motion: ScrollMotionFrame): void {
  if (!container || !listenersAttached) return;

  if (isProgrammaticScroll() || isScrollPanelLocked()) {
    const settling = phase === "settling" || isGuidanceSettling();
    if (phase !== "idle" && phase !== "cooldown" && !settling) {
      cancelGuidanceSettle();
      unlockGuidance();
      resetGesture();
    }
    if (!settling) {
      lastScroll = motion.scroll;
      return;
    }
  }

  updateTrackingGate(motion);

  if (phase === "cooldown") {
    lastScroll = motion.scroll;
    return;
  }

  // Allow committed/settling phases to finish even while guidance is locked.
  if (isGuidanceLocked() && phase !== "committed" && phase !== "settling") {
    lastScroll = motion.scroll;
    return;
  }

  const viewportH = container.clientHeight || window.innerHeight;
  const navSafeTop = getNavSafeTopPx();
  const commitThreshold = viewportH * getIntentCommitRatio(isCoarsePointer());
  const isMoving = Math.abs(motion.velocity) > GUIDANCE_VELOCITY_IDLE;

  if (phase === "settling") {
    if (
      isMoving &&
      gesture?.committedTarget &&
      motion.direction !== 0 &&
      motion.direction !== gesture.direction &&
      Math.abs(motion.velocity) > GUIDANCE_VELOCITY_INTERRUPT
    ) {
      cancelGuidanceSettle();
      unlockGuidance();
      resetGesture();
    }
    lastScroll = motion.scroll;
    return;
  }

  if (canStartTracking(motion) && phase === "idle") {
    const targets = getTargets();
    phase = "tracking";
    gesture = {
      startScroll: motion.scroll,
      direction: motion.direction || (motion.scroll >= lastScroll ? 1 : -1),
      originSectionIndex: getStableSectionIndex(
        targets,
        motion.scroll,
        viewportH,
        navSafeTop,
      ),
      committedTarget: null,
      targetScrollY: null,
    };
  }

  if (phase === "tracking" && gesture && !gesture.committedTarget) {
    const delta = motion.scroll - gesture.startScroll;

    if (
      motion.direction !== 0 &&
      gesture.direction !== 0 &&
      motion.direction !== gesture.direction &&
      Math.abs(delta) >= commitThreshold * REVERSAL_CANCEL_RATIO
    ) {
      const targets = getTargets();
      gesture = {
        startScroll: motion.scroll,
        direction: motion.direction,
        originSectionIndex: getStableSectionIndex(
          targets,
          motion.scroll,
          viewportH,
          navSafeTop,
        ),
        committedTarget: null,
        targetScrollY: null,
      };
    } else if (motion.direction !== 0) {
      gesture.direction = motion.direction;
    }

    const signedTravel = getSignedTravel(delta, gesture.direction);

    if (signedTravel >= commitThreshold && gesture.direction !== 0) {
      commitTarget();
    }
  }

  const gestureEnded =
    !isMoving &&
    !isTouching &&
    !wheelGestureActive &&
    performance.now() >= touchSettleReadyAt;

  if (phase === "committed" && gesture?.committedTarget && gestureEnded) {
    beginSettle(motion.scroll);
  } else if (phase === "tracking" && gesture && gestureEnded) {
    if (gesture.committedTarget) {
      beginSettle(motion.scroll);
    } else {
      resetGesture();
    }
  }

  lastScroll = motion.scroll;
}

let mutationObserver: MutationObserver | null = null;

export function attachScrollIntentGuidance(): () => void {
  container = getScrollContainer();
  if (!container || listenersAttached) return () => {};

  listenersAttached = true;
  ensureScrollBus();

  container.addEventListener("wheel", onWheel, { passive: true });
  container.addEventListener("touchstart", onTouchStart, { passive: true });
  container.addEventListener("touchend", onTouchEnd, { passive: true });
  container.addEventListener("touchcancel", onTouchEnd, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", scheduleTargetRefresh, {
    passive: true,
  });

  const mainContent = document.getElementById(MAIN_CONTENT_ID);
  mutationObserver = mainContent
    ? new MutationObserver(onContentMutation)
    : null;

  mutationObserver?.observe(mainContent!, {
    childList: true,
    subtree: true,
  });

  return () => {
    listenersAttached = false;
    container?.removeEventListener("wheel", onWheel);
    container?.removeEventListener("touchstart", onTouchStart);
    container?.removeEventListener("touchend", onTouchEnd);
    container?.removeEventListener("touchcancel", onTouchEnd);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", scheduleTargetRefresh);
    mutationObserver?.disconnect();
    mutationObserver = null;
    if (resizeTimer) clearTimeout(resizeTimer);
    if (wheelGestureTimer) clearTimeout(wheelGestureTimer);
    clearTimers();
    cancelGuidanceSettle();
    unlockGuidance();
    resetGesture();
    blockTrackingUntilIdle = false;
    idleStreakStart = 0;
    pendingTargetRefresh = false;
    container = null;
  };
}
