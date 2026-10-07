"use client";

import { useCallback, useEffect, useState } from "react";

import { FACE_CYCLE_INTERVAL_MS } from "@/constants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function useFaceCycle(
  length = 2,
  intervalMs = FACE_CYCLE_INTERVAL_MS,
  paused = false,
) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState(
    () => typeof document !== "undefined" && document.hidden === true,
  );
  const safeLength = Math.max(1, length);

  // Pause on tab hide — no interval renders or crossfades for a tab the
  // user cannot see. Resumes automatically on visibility return.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || safeLength < 2 || paused || hidden) return;

    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % safeLength);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, prefersReducedMotion, safeLength, paused, hidden]);

  const reset = useCallback(() => setIndex(0), []);

  return { index, reset };
}
