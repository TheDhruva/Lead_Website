"use client";

import { useCallback, useEffect, useState } from "react";

import { FACE_CYCLE_INTERVAL_MS } from "@/constants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function useFaceCycle(length = 2, intervalMs = FACE_CYCLE_INTERVAL_MS) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const safeLength = Math.max(1, length);

  useEffect(() => {
    if (prefersReducedMotion || safeLength < 2) return;

    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % safeLength);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, prefersReducedMotion, safeLength]);

  const reset = useCallback(() => setIndex(0), []);

  return { index, reset };
}
