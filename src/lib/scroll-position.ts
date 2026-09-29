import { requestLazySectionMount } from "@/lib/lazy-section-mount";
import {
  getOffsetInScrollContainer,
  getScrollContainer,
  scrollContainerTo,
} from "@/lib/scroll-container";

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
 * Scroll to a section's SNAP position: the section's start within the
 * container, clamped to [0, maxScroll].
 *
 * This must match where CSS `scroll-snap-align: start` settles (section
 * border-box start == snapport start; internal section padding already
 * clears the floating navbar). The previous anchor-centering math aimed
 * mid-section and fought snap on every navigation — that mismatch was the
 * teleport. Exactly one scroll action; snap finishes the job.
 */
export function scrollToSectionElement(target: HTMLElement): void {
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
  scrollContainerTo(firstTop, { behavior: "smooth" });

  // Single re-aim ONLY if lazy mounting moved the target (placeholder →
  // real section height change). No polling loop, no correction fighting:
  // identical positions never trigger a second scroll action.
  window.setTimeout(() => {
    const el = resolveTarget();
    if (!document.contains(el)) return;
    if (Math.abs(targetTop() - firstTop) > 2) {
      scrollContainerTo(targetTop(), { behavior: "smooth" });
    }
  }, 160);
}
