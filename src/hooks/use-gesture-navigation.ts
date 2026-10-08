"use client";

import { useEffect } from "react";

import { startGestureNavigation } from "@/lib/gesture-navigation-controller";

/**
 * Mounts the hybrid gesture navigation controller once around the
 * scroll container. The controller owns no visuals and no React state —
 * it only interprets deliberate wheel/touch gestures into single
 * canonical section navigations on top of native scrolling.
 */
export function useGestureNavigation(): void {
  useEffect(() => startGestureNavigation(), []);
}
