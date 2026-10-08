import { SECTION_IDS } from "@/constants";
import {
  getOffsetInScrollContainer,
  getScrollContainer,
  setWheelCancelShield,
} from "@/lib/scroll-container";
import { isScrollPanelLocked } from "@/lib/scroll-lock";
import { subscribeScrollMotion } from "@/lib/scroll-motion-engine";
import { getSectionChoreography } from "@/lib/section-choreography";
import {
  getSectionNeighbor,
  navigateToSectionId,
} from "@/lib/section-registry";

/**
 * Hybrid gesture navigation — a lightweight INTENT layer on top of the
 * existing native scroll system.
 *
 * One deliberate gesture navigates at most one major section; small or
 * controlled movements keep scrolling natively. The controller never
 * calls preventDefault, never writes scroll position itself, and never
 * touches React state: once intent is established it hands a single
 * canonical destination to the existing navigation machinery
 * (`navigateToSectionId` → `scrollToSectionElement`, the exact function
 * navbar navigation uses) and the existing tween owns the travel.
 *
 * Transaction model: IDLE → TRACKING → LOCKED → (settle) → IDLE.
 * A locked target never reinterprets the same gesture's residual
 * momentum as a second gesture — a new navigation requires a new
 * gesture (input silence for wheel, a fresh touch sequence for touch).
 *
 * Cost model: per input event only timestamp + arithmetic writes run.
 * DOM queries and layout reads happen at most ONCE per deliberate
 * gesture (at decision time), never per event or per frame.
 */

/** Accumulated direction-consistent wheel travel that counts as intent. */
const WHEEL_TRIGGER_PX = 60;
/** Fast short swipe that counts as intent even below the travel floor. */
const TOUCH_FLICK_MIN_PX = 60;
const TOUCH_FLICK_MAX_MS = 500;
/** px per ms over the trailing touch window. */
const TOUCH_FLICK_MIN_VELOCITY = 0.45;
/** Long deliberate drag that counts as intent at any speed. */
const TOUCH_TRAVEL_MIN_PX = 140;
/** Input/motion gap that ends one gesture and arms the next. */
const IDLE_GAP_MS = 250;
/** Release-timer cadence while locked. */
const RELEASE_CHECK_MS = 220;
/** Failsafe: a lock never outlives this, whatever happens. */
const MAX_LOCK_MS = 3000;
/** Projects entry/exit bands (fraction of a viewport from each end). */
const PROJECTS_EDGE_RATIO = 0.6;
/** Tracks shorter than this behave as normal sections (e.g. reduced motion). */
const PROJECTS_TALL_RATIO = 1.5;
/**
 * Sustained opposite-direction wheel travel that takes over a gesture
 * flight (the user is fighting the tween — a new deliberate intent).
 * Same-direction residual never accumulates here: it is shielded, not
 * counted. Well above any momentum wobble, well below a second section.
 */
const REVERSAL_TAKEOVER_PX = 100;

type Phase = "idle" | "tracking" | "locked";

interface TouchSample {
  y: number;
  t: number;
}

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

let bound = false;

/** Live handle of the bound controller, if any (navbar takeover path). */
let activeApi: { cancel: () => void } | null = null;

/**
 * Abort any tracked gesture and drop flight ownership. Called by
 * explicit navigation (navbar/CTA) before it issues the canonical
 * command — the new tween supersedes through the existing newest-wins
 * machinery, so this never cancels scroll movement itself.
 */
export function cancelGestureNavigation(): void {
  activeApi?.cancel();
}

export function startGestureNavigation(): () => void {
  if (bound) return () => {};
  bound = true;

  let phase: Phase = "idle";
  /** True once a gesture was judged non-navigating — stays quiet until a new gesture. */
  let suppressed = false;
  let wheelAccum = 0;
  let wheelSign: 1 | -1 = 1;
  let gestureTarget: EventTarget | null = null;
  let prevWheelAt = 0;
  let lastInputAt = 0;
  let lastMotionAt = 0;
  let lockStartedAt = 0;
  let releaseTimer: number | null = null;

  // Active touch sequence (touch owns its gesture boundary via touchend).
  let touchStartY = 0;
  let touchStartT = 0;
  let touchTarget: EventTarget | null = null;
  let touchSuppressed = false;
  let touchActive = false;
  let touchMoves: TouchSample[] = [];

  // Owned flight: the tween cancel of the navigation THIS gesture
  // started, its travel direction, and opposite-direction pressure
  // against it. Same-direction residual is shielded at the deadband,
  // never accumulated anywhere.
  let flightCancel: (() => void) | null = null;
  let flightSign: 1 | -1 = 1;
  let reversalAccum = 0;

  const clearReleaseTimer = () => {
    if (releaseTimer !== null) {
      window.clearTimeout(releaseTimer);
      releaseTimer = null;
    }
  };

  /** Drop flight ownership: unshield the deadband, forget the cancel. */
  const disengageFlight = () => {
    setWheelCancelShield(null);
    flightCancel = null;
    reversalAccum = 0;
  };

  const toIdle = () => {
    clearReleaseTimer();
    disengageFlight();
    phase = "idle";
    suppressed = false;
    wheelAccum = 0;
    gestureTarget = null;
  };

  /** True while OUR flight owns the tween — the deadband shield predicate. */
  const shieldWheel = () => phase === "locked" && flightCancel !== null;

  const armReleaseCheck = () => {
    clearReleaseTimer();
    releaseTimer = window.setTimeout(() => {
      releaseTimer = null;
      const now = nowMs();
      // Failsafe first: never trap the user in a stale lock.
      if (now - lockStartedAt > MAX_LOCK_MS) {
        toIdle();
        return;
      }
      // Programmatic travel (ours or the navbar's) still owns scroll.
      if (getSectionChoreography().navigating) {
        armReleaseCheck();
        return;
      }
      // The flight is over (arrival, takeover, or supersede) — drop the
      // cancel handle so the shield predicate below releases with it.
      // The lock itself persists until input AND motion settle.
      flightCancel = null;
      // Recent input or un-settled motion (momentum tail) extends the lock.
      if (now - lastInputAt < IDLE_GAP_MS || now - lastMotionAt < IDLE_GAP_MS) {
        armReleaseCheck();
        return;
      }
      toIdle();
    }, RELEASE_CHECK_MS);
  };

  const enterLocked = () => {
    phase = "locked";
    suppressed = false;
    lockStartedAt = nowMs();
    armReleaseCheck();
  };

  /** Decision-time only: never called per event. */
  function isFormFocused(): boolean {
    const ae = document.activeElement as HTMLElement | null;
    if (!ae) return false;
    const tag = ae.tagName;
    return (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      ae.isContentEditable
    );
  }

  /** Decision-time only: one closest() per deliberate gesture. */
  function isSuppressedTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false;
    return (
      target.closest("input,textarea,select,[contenteditable],video,audio") !==
      null
    );
  }

  /**
   * Decision-time only: a vertically scrollable nested region (e.g. the
   * desktop video rail) owns wheel input over itself — the gesture must
   * not steal browsing inside it. Walks ancestors up to (not including)
   * the scroll container.
   */
  function isNestedScroller(
    target: EventTarget | null,
    container: HTMLElement,
  ): boolean {
    let el = target instanceof Element ? target : null;
    while (el && el !== container) {
      if (el instanceof HTMLElement && el.scrollHeight > el.clientHeight + 8) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  /**
   * Decision-time only (and only when the current section IS Projects):
   * the deck interior belongs to the existing cinematic scroll
   * interaction. Entry band scrolls down freely into the deck, exit band
   * scrolls up freely back through it; only the band edges hand off to
   * the neighboring section.
   */
  function projectsZone(): "entry" | "interior" | "exit" | "short" {
    const container = getScrollContainer();
    const el = document.getElementById(SECTION_IDS.projects);
    if (!container || !el) return "short";
    const viewportH = container.clientHeight || window.innerHeight || 800;
    const trackH = el.offsetHeight;
    if (trackH <= viewportH * PROJECTS_TALL_RATIO) return "short";
    const top = getOffsetInScrollContainer(el);
    const scroll = container.scrollTop;
    if (scroll < top + viewportH * PROJECTS_EDGE_RATIO) return "entry";
    const endTop = top + trackH - viewportH;
    if (scroll > endTop - viewportH * PROJECTS_EDGE_RATIO) return "exit";
    return "interior";
  }

  /**
   * Single decision point for every navigation. Returns after either
   * locking one canonical target or suppressing this gesture — never
   * more than one navigation per call, never called per event.
   */
  function decideAndNavigate(direction: 1 | -1, target: EventTarget | null) {
    if (typeof document !== "undefined" && document.hidden) return;
    // Programmatic travel owns scroll — never second-guess it, and a
    // navbar click implicitly cancels any gesture being tracked.
    if (getSectionChoreography().navigating) {
      suppressed = true;
      return;
    }
    if (
      isScrollPanelLocked() ||
      isFormFocused() ||
      isSuppressedTarget(target)
    ) {
      suppressed = true;
      return;
    }
    const currentId = getSectionChoreography().activeId;
    const neighbor = getSectionNeighbor(currentId, direction);
    if (!neighbor) {
      // Past the ends — leave native overscroll alone.
      suppressed = true;
      return;
    }
    const container = getScrollContainer();
    if (container && isNestedScroller(target, container)) {
      suppressed = true;
      return;
    }
    if (currentId === SECTION_IDS.projects) {
      const zone = projectsZone();
      if (zone === "interior") {
        suppressed = true;
        return;
      }
      if (zone === "entry" && direction > 0) {
        // Downward travel into the deck stays free cinematic scrolling.
        suppressed = true;
        return;
      }
      if (zone === "exit" && direction < 0) {
        // Upward travel back through the deck stays free.
        suppressed = true;
        return;
      }
    }
    // Canonical destination: THE section-navigation command navbar
    // navigation also issues, so gesture and navbar land on exactly the
    // same position through exactly one implementation.
    const flight = navigateToSectionId(neighbor);
    if (!flight) {
      suppressed = true;
      return;
    }
    // Ownership transfer: from this point the tween owns movement.
    // Same-gesture residual wheel is shielded from the cancel deadband
    // (it can no longer tear the flight down); touch/keys still cancel
    // instantly as explicit takeover.
    flightCancel = flight;
    flightSign = direction;
    reversalAccum = 0;
    setWheelCancelShield(shieldWheel);
    enterLocked();
  }

  const resetWheelTracking = () => {
    if (phase === "tracking") {
      phase = "idle";
      wheelAccum = 0;
      gestureTarget = null;
    }
  };

  const onWheel = (event: WheelEvent) => {
    const now = nowMs();
    const gap = now - prevWheelAt;
    prevWheelAt = now;
    lastInputAt = now;
    if (phase === "locked") {
      // Locked flight: same-direction residual stays shielded and is
      // never interpreted. Only sustained OPPOSITE pushing means the
      // user is fighting the tween — that explicit intent takes over.
      if (flightCancel !== null && !event.ctrlKey && !event.metaKey) {
        let dy = event.deltaY;
        if (event.deltaMode === 1) dy *= 16;
        else if (event.deltaMode === 2) dy = dy > 0 ? 800 : -800;
        if (
          Number.isFinite(dy) &&
          dy !== 0 &&
          Math.sign(dy) !== flightSign &&
          Math.abs(event.deltaX) <= Math.abs(dy) * 1.4
        ) {
          reversalAccum += dy;
          if (Math.abs(reversalAccum) >= REVERSAL_TAKEOVER_PX) {
            const stop = flightCancel;
            disengageFlight();
            phase = "idle";
            // Suppressed until a fresh gesture after silence: the user
            // now free-scrolls, and this same push must not retrigger.
            suppressed = true;
            wheelAccum = 0;
            gestureTarget = null;
            stop();
            return;
          }
        }
      }
      return;
    }
    // A fresh gesture after silence re-arms intent detection.
    if (gap > IDLE_GAP_MS) {
      suppressed = false;
      resetWheelTracking();
    }
    if (suppressed) return;
    if (getSectionChoreography().navigating) {
      resetWheelTracking();
      return;
    }
    if (isScrollPanelLocked()) {
      resetWheelTracking();
      return;
    }
    // Pinch-zoom and modifier gestures are never section intent.
    if (event.ctrlKey || event.metaKey) return;
    // Normalize Firefox line/page deltas into px-scale units without any
    // layout read (line ≈ 16px; a page notch is always deliberate).
    let dy = event.deltaY;
    const dx = event.deltaX;
    if (event.deltaMode === 1) dy *= 16;
    else if (event.deltaMode === 2) dy = dy > 0 ? 800 : -800;
    if (!Number.isFinite(dy) || dy === 0) return;
    // Horizontal browsing (rails, carousels) is never section intent.
    if (Math.abs(dx) > Math.abs(dy) * 1.4) return;
    const sign: 1 | -1 = dy > 0 ? 1 : -1;
    if (phase === "idle") {
      phase = "tracking";
      wheelAccum = 0;
      wheelSign = sign;
      gestureTarget = event.target;
    } else if (sign !== wheelSign) {
      // Direction reversal starts a new intent — never sum oscillation
      // into a false trigger.
      wheelAccum = 0;
      wheelSign = sign;
      gestureTarget = event.target;
    }
    wheelAccum += dy;
    if (Math.abs(wheelAccum) >= WHEEL_TRIGGER_PX) {
      const direction = wheelSign;
      const target = gestureTarget;
      // One shot: the same gesture can never trigger again — the lock
      // (on success) or suppression (on abort) owns the remainder.
      phase = "idle";
      wheelAccum = 0;
      gestureTarget = null;
      decideAndNavigate(direction, target);
    }
  };

  const onTouchStart = (event: TouchEvent) => {
    lastInputAt = nowMs();
    if (phase === "locked") {
      touchActive = false;
      touchSuppressed = true;
      return;
    }
    if (
      getSectionChoreography().navigating ||
      isScrollPanelLocked() ||
      event.touches.length !== 1
    ) {
      touchActive = false;
      touchSuppressed = true;
      return;
    }
    const touch = event.touches[0];
    if (!touch) {
      touchActive = false;
      touchSuppressed = true;
      return;
    }
    touchActive = true;
    touchSuppressed = false;
    touchStartY = touch.clientY;
    touchStartT = nowMs();
    touchTarget = event.target;
    touchMoves = [{ y: touch.clientY, t: touchStartT }];
  };

  const onTouchMove = (event: TouchEvent) => {
    lastInputAt = nowMs();
    if (!touchActive || touchSuppressed) return;
    const touch = event.touches[0];
    if (!touch) return;
    touchMoves.push({ y: touch.clientY, t: nowMs() });
    if (touchMoves.length > 8) touchMoves.shift();
    // Deliberately no mid-drag decision: the finger owns the drag and
    // native scrolling already gives immediate feedback. Intent resolves
    // at lift, where the settle tween takes over without fighting touch.
  };

  const onTouchEnd = (event: TouchEvent) => {
    lastInputAt = nowMs();
    if (!touchActive) {
      touchSuppressed = false;
      return;
    }
    touchActive = false;
    if (touchSuppressed || phase === "locked") {
      touchSuppressed = false;
      return;
    }
    const touch = event.changedTouches[0];
    const endY = touch ? touch.clientY : touchStartY;
    const travel = endY - touchStartY;
    const duration = nowMs() - touchStartT;
    // Trailing-window velocity for flick detection.
    let velocity = 0;
    const cutoff = nowMs() - 150;
    const recent = touchMoves.filter((s) => s.t >= cutoff);
    if (recent.length >= 2) {
      const first = recent[0]!;
      const last = recent[recent.length - 1]!;
      const dt = last.t - first.t;
      if (dt > 0) velocity = (last.y - first.y) / dt;
    }
    const target = touchTarget;
    touchTarget = null;
    touchMoves = [];
    const abs = Math.abs(travel);
    const isFlick =
      abs >= TOUCH_FLICK_MIN_PX &&
      duration <= TOUCH_FLICK_MAX_MS &&
      Math.abs(velocity) >= TOUCH_FLICK_MIN_VELOCITY &&
      Math.sign(velocity) === Math.sign(travel);
    if (abs >= TOUCH_TRAVEL_MIN_PX || isFlick) {
      decideAndNavigate(travel > 0 ? -1 : 1, target);
    }
    // Anything smaller was free scrolling — native position stands.
  };

  // Motion activity only feeds the settle detector (timestamps). No
  // geometry, no DOM, no state — the publish path already did the work.
  const unsubscribeMotion = subscribeScrollMotion(() => {
    lastMotionAt = nowMs();
  });

  const attach = (): boolean => {
    const container = getScrollContainer();
    if (!container) return false;
    container.addEventListener("wheel", onWheel, { passive: true });
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return true;
  };

  // The scroll container mounts in the same commit as this effect's owner;
  // retry once next frame if the lookup races it.
  let attached = attach();
  let retryRaf = 0;
  if (!attached) {
    retryRaf = requestAnimationFrame(() => {
      retryRaf = 0;
      attached = attach();
    });
  }

  // Explicit-navigation takeover handle (navbar/CTA supersede through
  // the tween's newest-wins path; this only drops OUR tracking/shield).
  const api = {
    cancel: () => {
      disengageFlight();
      phase = "idle";
      suppressed = false;
      wheelAccum = 0;
      gestureTarget = null;
      touchActive = false;
      touchSuppressed = false;
      touchTarget = null;
      touchMoves = [];
    },
  };
  activeApi = api;

  return () => {
    if (retryRaf) cancelAnimationFrame(retryRaf);
    const container = getScrollContainer();
    container?.removeEventListener("wheel", onWheel);
    container?.removeEventListener("touchstart", onTouchStart);
    container?.removeEventListener("touchmove", onTouchMove);
    container?.removeEventListener("touchend", onTouchEnd);
    container?.removeEventListener("touchcancel", onTouchEnd);
    unsubscribeMotion();
    clearReleaseTimer();
    disengageFlight();
    if (activeApi === api) activeApi = null;
    bound = false;
  };
}
