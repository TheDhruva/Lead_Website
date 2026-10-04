import { getCachedSectionTop } from "@/lib/cinematic-scroll-coordinator";
import { requestLazySectionMount } from "@/lib/lazy-section-mount";
import {
  getOffsetInScrollContainer,
  getScrollContainer,
  getScrollTop,
  scrollContainerTo,
} from "@/lib/scroll-container";
import { getScrollMotionFrame } from "@/lib/scroll-motion-engine";
import { setNavigating, setNavigationTarget } from "@/lib/section-choreography";

export function getPageEndScrollY(): number {
  const container = getScrollContainer();

  if (container) {
    return Math.max(0, container.scrollHeight - container.clientHeight);
  }

  return Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
}

/**
 * Distance-aware navigation duration (ms).
 *
 * Nearby sections travel quickly, distant jumps take longer — bounded so
 * nothing teleports and nothing crawls. Derived from actual scrollport
 * geometry (viewport heights of travel), not arbitrary per-link values:
 * short (<1 viewport) 450–650ms, medium 600–800ms, long 800–1100ms.
 */
export function navigationDurationFor(distancePx: number): number {
  const container = getScrollContainer();
  const viewportH = container?.clientHeight ?? window.innerHeight ?? 800;
  const viewports = Math.abs(distancePx) / Math.max(1, viewportH);
  const duration = 450 + Math.min(viewports, 4) * 160;
  return Math.max(450, Math.min(1100, Math.round(duration)));
}

/**
 * Newest-request ownership for the pinned navigation target.
 *
 * A superseding navigation commits its target BEFORE the previous tween
 * is stopped (see below), and stopping that tween fires its settle
 * callback afterwards. Without a sequence guard the OLD flight's settle
 * would immediately clear the NEW flight's pin — the navbar would step
 * through intermediate sections again for the rest of the flight.
 * One id per request: only the newest flight may touch the flags.
 */
let navSeq = 0;

/**
 * Scroll to a section's start position: the section's start within the
 * container, clamped to [0, maxScroll].
 *
 * This lands exactly on the section border-box start (internal section
 * padding `--nav-safe-top` already clears the floating navbar, and the
 * Design Work deck entry lands on its heading with card 1 active). Exactly
 * one controlled scroll action; native scroll snapping handles manual
 * wheel, trackpad, touch, and keyboard section landing separately.
 *
 * Navigation marks the choreography `navigating` so observers treat the
 * travel as arrival, and ALWAYS yields: user input or a newer request
 * settles (cancels) the tween, clearing the flag. Reduced-motion jumps
 * instantly to the same destination.
 */
export function scrollToSectionElement(target: HTMLElement): () => void {
  if (target.id) {
    requestLazySectionMount(target.id);
  }

  // Re-resolve after the lazy mount signal — the placeholder may be swapped
  // for the real section on the next tick, which changes offsets.
  const resolveTarget = () =>
    (target.id ? document.getElementById(target.id) : null) ?? target;

  const targetTop = () => {
    const el = resolveTarget();
    const maxScroll = getPageEndScrollY();
    // P1: prefer the coordinator's cached content-space geometry (no
    // layout read). Fall back to synchronous measurement only when the
    // cache is cold or the element isn't registered.
    const cached = getCachedSectionTop(el);
    const raw = cached ?? getOffsetInScrollContainer(el);
    return Math.max(0, Math.min(raw, maxScroll));
  };

  const firstTop = targetTop();
  const distance = Math.abs(firstTop - getScrollTop());
  // Layout-change baseline for the re-aim below: total scrollable height
  // only moves when sections actually mounted/resized, so comparing against
  // this frame-published value lets the re-aim check skip measurement
  // (and its forced style/layout flush) entirely in the common case.
  const startLimit = getScrollMotionFrame().limit;
  // Commit the destination FIRST so a superseding request can never
  // observe a stale target; then flag travel. Both clear on settle —
  // but only for the NEWEST request (navSeq guard above): stopping the
  // previous tween fires its settle callback AFTER this commit.
  const navId = (navSeq += 1);
  setNavigationTarget(target.id || null);
  setNavigating(true);
  // True only when THIS flight was interrupted (user input / supersede),
  // never when it arrived — the re-aim below must not resurrect a
  // cancelled flight, but must still correct a lazy-mount shift after
  // a normal arrival.
  let interrupted = false;
  const onSettled = (info: { cancelled: boolean }) => {
    if (navId !== navSeq) return;
    if (info.cancelled) interrupted = true;
    setNavigating(false);
    setNavigationTarget(null);
  };
  let cancel = scrollContainerTo(firstTop, {
    behavior: "smooth",
    duration: navigationDurationFor(distance),
    programmatic: true,
    onSettled,
  });

  // Single re-aim ONLY if lazy mounting moved the target (placeholder →
  // real section height change). No polling loop, no correction fighting:
  // identical positions never trigger a second scroll action. Skipped for
  // superseded flights (they no longer own the pin) and interrupted ones
  // (the user has control — never restart a cancelled flight).
  //
  // The limit gate makes the common case free: when total scrollable
  // height has not shifted, nothing above the target moved, so no geometry
  // is read and no forced layout happens inside the timer. Measurement
  // runs only after a real layout change (mount swap / content growth),
  // and only then can the target have actually moved.
  const reaimTimer = window.setTimeout(() => {
    if (navId !== navSeq || interrupted) return;
    const limitNow = getScrollMotionFrame().limit;
    if (Math.abs(limitNow - startLimit) <= 2) return;
    const el = resolveTarget();
    if (!document.contains(el)) return;
    const nextTop = targetTop();
    if (Math.abs(nextTop - firstTop) > 2) {
      const nextDistance = Math.abs(nextTop - getScrollTop());
      cancel();
      setNavigationTarget(el.id || null);
      setNavigating(true);
      cancel = scrollContainerTo(nextTop, {
        behavior: "smooth",
        duration: navigationDurationFor(nextDistance),
        programmatic: true,
        onSettled,
      });
    }
  }, 160);

  return () => {
    window.clearTimeout(reaimTimer);
    cancel();
  };
}
