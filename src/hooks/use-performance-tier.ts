"use client";

import { useSyncExternalStore } from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export type PerformanceTier = "high" | "balanced" | "low";

type DeviceCap = "low" | "balanced" | null;

let cachedCap: DeviceCap | undefined;

/** Static device signals — measured once, cached process-wide. */
function getDeviceCap(): DeviceCap {
  if (cachedCap !== undefined) return cachedCap;
  if (typeof navigator === "undefined") {
    cachedCap = null;
    return cachedCap;
  }
  const nav = navigator as Navigator & {
    deviceMemory?: unknown;
  };
  const memory =
    typeof nav.deviceMemory === "number" ? nav.deviceMemory : undefined;
  if (typeof memory === "number" && memory <= 4) {
    cachedCap = "low";
    return cachedCap;
  }
  const cores =
    typeof navigator.hardwareConcurrency === "number"
      ? navigator.hardwareConcurrency
      : undefined;
  cachedCap = typeof cores === "number" && cores <= 4 ? "balanced" : null;
  return cachedCap;
}

function subscribeDeviceCap(): () => void {
  // Static for the session — no subscription needed.
  return () => {};
}

/**
 * Lightweight capability tier — brand-preserving adaptation, not a
 * redesign. LOW never changes layout or content; it only selects
 * cheaper render paths (gentler deck motion, calmer media strategy).
 *
 * Signals:
 * - prefers-reduced-motion → low (motion minimal anyway)
 * - coarse pointer (touch-first/mobile) → low
 * - small viewport (mobile layout) → low
 * - constrained device memory (≤4GB) → low
 * - few logical cores (≤4) → balanced at best
 *
 * Hydration-safe: media signals use the app's SSR-safe media hook and
 * device signals go through a cached external-store snapshot whose
 * server value (null) matches the initial client read pattern.
 */
export function usePerformanceTier(): PerformanceTier {
  const prefersReducedMotion = useReducedMotion();
  const isCoarsePointer = useMediaQuery("(pointer: coarse)");
  const isMobileLayout = useMediaQuery("(max-width: 767px)");
  const deviceCap = useSyncExternalStore(
    subscribeDeviceCap,
    getDeviceCap,
    () => null,
  );

  if (prefersReducedMotion || isCoarsePointer || isMobileLayout) return "low";
  return deviceCap ?? "high";
}
