import { requestLazySectionMount } from "@/lib/lazy-section-mount";
import {
  getOffsetInScrollContainer,
  getScrollContainer,
  getScrollTop,
  scrollContainerTo,
} from "@/lib/scroll-container";
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
 * Scroll to a section's SNAP position: the section's start within the
 * container, clamped to [0, maxScroll].
 *
 * This must match where CSS `scroll-snap-align: start` settles (section
 * border-box start == snapport start; internal section padding
 * `--nav-safe-top` already clears the floating navbar, and the Design
 * Work deck entry lands on its heading with card 1 active). Exactly one
 * controlled scroll action; snap finishes the job.
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
    return Math.max(0, Math.min(getOffsetInScrollContainer(el), maxScroll));
  };

  const firstTop = targetTop();
  const distance = Math.abs(firstTop - getScrollTop());
  // Commit the destination FIRST so a superseding request can never
  // observe a stale target; then flag travel. Both clear on settle.
  setNavigationTarget(target.id || null);
  setNavigating(true);
  const onSettled = () => {
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
  // identical positions never trigger a second scroll action.
  const reaimTimer = window.setTimeout(() => {
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
