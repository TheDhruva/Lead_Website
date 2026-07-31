"use client";

import { useCallback, useEffect, useState } from "react";

import { FACE_CYCLE_INTERVAL_MS } from "@/constants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function useFaceCycle(intervalMs = FACE_CYCLE_INTERVAL_MS) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const id = window.setInterval(() => {
      setIndex((prev) => (prev === 0 ? 1 : 0));
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, prefersReducedMotion]);

  const reset = useCallback(() => setIndex(0), []);

  return { index, reset };
}
