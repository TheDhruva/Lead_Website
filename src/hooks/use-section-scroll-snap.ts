"use client";

import { useEffect } from "react";

import { useLenis } from "@/hooks/use-lenis";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  getScrollContainer,
  getScrollTop,
  isProgrammaticScroll,
} from "@/lib/scroll-container";
import { isScrollPanelLocked } from "@/lib/scroll-lock";
import {
  animateScrollTo,
  cancelScrollSnapAnimation,
} from "@/lib/scroll-snap-motion";
import {
  collectSnapTargets,
  findDirectionalSnapTarget,
} from "@/lib/section-snap";

const TOUCH_SWIPE_MIN_PX = 24;
const SNAP_DURATION = 0.82;
const SNAP_DURATION_REDUCED = 0.28;
const SNAP_COOLDOWN_MS = 520;

interface UseSectionScrollSnapOptions {
  enabled?: boolean;
}

/** Native scroll fallback when Lenis is unavailable (reduced motion). */
export function useSectionScrollSnap({
  enabled = true,
}: UseSectionScrollSnapOptions = {}) {
  const lenis = useLenis();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!enabled || lenis) return;

    const container = getScrollContainer();
    if (!container) return;

    let cancelled = false;
    let cooldownTimer: ReturnType<typeof setTimeout> | null = null;
    let isTouching = false;
    let isSnapping = false;
    let snapLocked = false;
    let touchStartY = 0;

    const snapDuration = prefersReducedMotion
      ? SNAP_DURATION_REDUCED
      : SNAP_DURATION;

    const lockSnap = () => {
      snapLocked = true;
      if (cooldownTimer !== null) clearTimeout(cooldownTimer);
      cooldownTimer = setTimeout(() => {
        snapLocked = false;
        cooldownTimer = null;
      }, SNAP_COOLDOWN_MS);
    };

    const snapToDirection = (direction: number) => {
      if (
        cancelled ||
        isSnapping ||
        snapLocked ||
        isTouching ||
        isScrollPanelLocked() ||
        isProgrammaticScroll()
      ) {
        return;
      }

      const targets = collectSnapTargets();
      const scrollY = getScrollTop();
      const target = findDirectionalSnapTarget(targets, scrollY, direction);
      if (!target || Math.abs(scrollY - target.y) <= 3) return;

      isSnapping = true;
      lockSnap();
      cancelScrollSnapAnimation();
      animateScrollTo(target.y, snapDuration * 1000, () => {
        isSnapping = false;
      });
    };

    const onTouchStart = (event: TouchEvent) => {
      isTouching = true;
      touchStartY = event.touches[0]?.clientY ?? 0;
      cancelScrollSnapAnimation();
    };

    const onTouchEnd = (event: TouchEvent) => {
      isTouching = false;
      const touchEndY = event.changedTouches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - touchEndY;

      if (Math.abs(delta) >= TOUCH_SWIPE_MIN_PX) {
        snapToDirection(delta > 0 ? 1 : -1);
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (snapLocked || isSnapping) return;
      snapToDirection(event.deltaY > 0 ? 1 : -1);
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchcancel", onTouchEnd, { passive: true });
    container.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      cancelled = true;
      if (cooldownTimer !== null) clearTimeout(cooldownTimer);
      cancelScrollSnapAnimation();
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
      container.removeEventListener("wheel", onWheel);
    };
  }, [enabled, lenis, prefersReducedMotion]);
}
