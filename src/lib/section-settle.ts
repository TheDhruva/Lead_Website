import { SECTION_IDS } from "@/constants";
import {
  getOffsetInScrollContainer,
  getScrollContainer,
  scrollContainerTo,
} from "@/lib/scroll-container";
import { subscribeScrollMotion } from "@/lib/scroll-motion-engine";
import { getSectionChoreography } from "@/lib/section-choreography";

/**
 * Section settling — the lightweight successor to native
 * `scroll-snap-type: y proximity`.
 *
 * Native snap evaluates snap geometry continuously while the user moves,
 * including across the 480/600svh Projects track. Settling instead lets
 * native scrolling run completely free during the gesture and performs
 * ONE short controlled correction after motion truly stops — only when
 * the resting position is already near a section start.
 *
 * Non-goals (by design, to preserve UX):
 * - Never pulls the user mid-gesture; only fires after 220ms of no
 *   motion frames (momentum included — frames stop only at full rest).
 * - Tiny scrolls (<32px of gesture travel) never settle.
 * - Only the nearest section start within 14% of a viewport settles;
 *   anything farther is left exactly where the user left it.
 * - Projects interior travel is free: deep inside the deck track the
 *   settle is skipped entirely; only the track's top boundary settles.
 * - Never competes with navbar/CTA/hash/keyboard navigation: skipped
 *   while `navigating`, and the correction itself is a normal
 *   scrollContainerTo tween — user input or a newer request supersedes
 *   it through the existing single-owner tween machinery.
 * - No loops: a settle that arrives within 4px of its target is a
 *   no-op, and settle-generated motion without fresh user input never
 *   re-triggers (input-recency gate).
 * - Reduced-motion users get no settle correction at all.
 */

const SETTLE_IDLE_MS = 220;
const SETTLE_DURATION_MS = 280;
/** Only correct when already within this fraction of a viewport. */
const SETTLE_MAX_DIST_RATIO = 0.14;
/** Sub-4px drift is imperceptible — leave it alone. */
const SETTLE_MIN_DELTA_PX = 4;
/** Ignore gestures smaller than this ( taps, nudges, trackpad jitter). */
const SETTLE_MIN_GESTURE_PX = 32;
/** Motion must follow genuine user input this recently to settle. */
const GESTURE_WINDOW_MS = 2000;
/** Inside the Projects track beyond this (in viewports from the top),
    travel is storytelling, not section landing — never settle. */
const PROJECTS_INTERIOR_RATIO = 0.6;

const SETTLE_ORDER = [
  SECTION_IDS.work,
  SECTION_IDS.services,
  SECTION_IDS.video,
  SECTION_IDS.projects,
  SECTION_IDS.contact,
] as const;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

let bound = false;

export function startSectionSettle(): () => void {
  if (bound) return () => {};
  bound = true;

  let lastUserInputAt = 0;
  let gestureStartScroll = 0;
  let gestureTracking = false;
  let idleTimer: number | null = null;
  let settling = false;

  const markInput = () => {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const container = getScrollContainer();
    if (!gestureTracking) {
      gestureStartScroll = container?.scrollTop ?? 0;
      gestureTracking = true;
    }
    lastUserInputAt = now;
  };

  const onWheel = () => markInput();
  const onTouchMove = () => markInput();
  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight":
      case "PageUp":
      case "PageDown":
      case "Home":
      case "End":
      case " ":
        markInput();
        break;
      default:
        break;
    }
  };

  const clearIdle = () => {
    if (idleTimer !== null) {
      window.clearTimeout(idleTimer);
      idleTimer = null;
    }
  };

  const maybeSettle = () => {
    idleTimer = null;
    if (settling) return;
    if (typeof document !== "undefined" && document.hidden) return;
    if (prefersReducedMotion()) {
      gestureTracking = false;
      return;
    }
    // Navbar/CTA/hash navigation owns the scroll position while set —
    // never second-guess an in-flight programmatic travel.
    if (getSectionChoreography().navigating) {
      gestureTracking = false;
      return;
    }
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - lastUserInputAt > GESTURE_WINDOW_MS) {
      gestureTracking = false;
      return;
    }
    const container = getScrollContainer();
    if (!container) {
      gestureTracking = false;
      return;
    }
    const scroll = container.scrollTop;
    const viewportH = container.clientHeight || window.innerHeight || 800;
    // Nudges settle nowhere: without meaningful travel the user is
    // already where they want to be.
    if (Math.abs(scroll - gestureStartScroll) < SETTLE_MIN_GESTURE_PX) {
      gestureTracking = false;
      return;
    }
    gestureTracking = false;

    // Idle-time measurement only (never on the scroll hot path): resolve
    // live section tops — placeholder and mounted content share ids.
    const tops = new Map<string, number>();
    for (const id of SETTLE_ORDER) {
      const el = document.getElementById(id);
      if (el) tops.set(id, getOffsetInScrollContainer(el));
    }
    if (tops.size === 0) return;

    // Projects protection: deep interior travel never settles. Only the
    // track's top boundary participates in section landing.
    const projectsTop = tops.get(SECTION_IDS.projects);
    if (typeof projectsTop === "number") {
      const projectsEl = document.getElementById(SECTION_IDS.projects);
      const trackH = projectsEl?.offsetHeight ?? 0;
      if (
        trackH > viewportH * 1.5 &&
        scroll > projectsTop + viewportH * PROJECTS_INTERIOR_RATIO &&
        scroll < projectsTop + trackH - viewportH * PROJECTS_INTERIOR_RATIO
      ) {
        return;
      }
    }

    let best: number | null = null;
    let bestDist = Infinity;
    for (const top of tops.values()) {
      const dist = Math.abs(top - scroll);
      if (dist < bestDist) {
        bestDist = dist;
        best = top;
      }
    }
    if (best === null) return;
    if (bestDist < SETTLE_MIN_DELTA_PX) return;
    if (bestDist > viewportH * SETTLE_MAX_DIST_RATIO) return;

    // Clamp to the scrollable range (same contract as navbar
    // destinations): the tween must always target a reachable offset.
    const maxScroll = Math.max(
      0,
      container.scrollHeight - container.clientHeight,
    );
    const target = Math.max(0, Math.min(best, maxScroll));

    settling = true;
    scrollContainerTo(target, {
      behavior: "smooth",
      duration: SETTLE_DURATION_MS,
      onSettled: () => {
        settling = false;
      },
    });
  };

  const scheduleIdle = () => {
    clearIdle();
    idleTimer = window.setTimeout(maybeSettle, SETTLE_IDLE_MS);
  };

  // Motion frames arrive only while scroll offset changes (native scroll
  // publish path), so "no frames for SETTLE_IDLE_MS" reliably means the
  // gesture plus its momentum tail fully ended.
  const unsubscribe = subscribeScrollMotion(() => {
    if (settling) {
      // Our own correction's frames must not re-arm a settle behind it;
      // the arrival check (<4px ⇒ no-op) handles the rest on completion.
      scheduleIdle();
      return;
    }
    if (getSectionChoreography().navigating) {
      clearIdle();
      return;
    }
    scheduleIdle();
  });

  const container = getScrollContainer();
  container?.addEventListener("wheel", onWheel, { passive: true });
  container?.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("keydown", onKeyDown);

  return () => {
    unsubscribe();
    clearIdle();
    container?.removeEventListener("wheel", onWheel);
    container?.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("keydown", onKeyDown);
    bound = false;
  };
}
