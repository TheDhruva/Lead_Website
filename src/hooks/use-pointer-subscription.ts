"use client";

import { useEffect } from "react";

import {
  type PointerFrame,
  type PointerSubscriber,
  pointerEngine,
} from "@/lib/pointer-engine";

/**
 * Subscribe to the shared pointer RAF bus. Callback runs every frame with
 * smoothed viewport coordinates — no React re-renders.
 */
export function usePointerSubscription(
  callback: PointerSubscriber,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    return pointerEngine.subscribe(callback);
  }, [callback, enabled]);
}

export type { PointerFrame };
