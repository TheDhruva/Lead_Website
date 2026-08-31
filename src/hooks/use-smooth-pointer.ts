"use client";

import { type RefObject, useEffect, useRef } from "react";

import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { pointerEngine, pointerLocalToElement } from "@/lib/pointer-engine";

interface PointerSmoothOptions {
  /** 0–1 lerp toward target each frame (element-local smoothing) */
  ease?: number;
  enabled?: boolean;
}

/**
 * Smooth viewport pointer via shared PointerEngine.
 * Writes into a ref — no re-renders.
 */
export function useSmoothPointer(
  enabled = true,
  { ease = 0.12 }: PointerSmoothOptions = {},
) {
  const canReact = useCanPointerReact();
  const active = canReact && enabled;
  const pointerRef = useRef({
    x: 0,
    y: 0,
    nx: 0,
    ny: 0,
    active: false,
  });

  useEffect(() => {
    if (!active) {
      pointerRef.current.active = false;
      return;
    }

    const current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    return pointerEngine.subscribe((frame) => {
      current.x += (frame.currentX - current.x) * ease;
      current.y += (frame.currentY - current.y) * ease;
      const hw = window.innerWidth / 2 || 1;
      const hh = window.innerHeight / 2 || 1;
      pointerRef.current = {
        x: current.x,
        y: current.y,
        nx: (current.x - hw) / hw,
        ny: (current.y - hh) / hh,
        active: frame.active,
      };
    });
  }, [active, ease]);

  return pointerRef;
}

/**
 * Smooth pointer relative to an element center.
 * Writes --spot-x/--spot-y on the element via shared PointerEngine.
 */
export function useElementPointerVars(
  ref: RefObject<HTMLElement | null>,
  {
    ease = 0.16,
    enabled = true,
    cssVars = true,
  }: PointerSmoothOptions & { cssVars?: boolean } = {},
) {
  const canReact = useCanPointerReact();
  const active = canReact && enabled;
  const stateRef = useRef({ x: 0, y: 0, nx: 0, ny: 0, inside: false });

  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;

    const current = { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    current.x = rect.width / 2;
    current.y = rect.height / 2;

    return pointerEngine.subscribe((frame) => {
      const local = pointerLocalToElement(el, frame.targetX, frame.targetY);
      const targetX = local.inside ? local.x : rect.width / 2;
      const targetY = local.inside ? local.y : rect.height / 2;

      current.x += (targetX - current.x) * ease;
      current.y += (targetY - current.y) * ease;

      const freshRect = el.getBoundingClientRect();
      const nx = freshRect.width ? (current.x / freshRect.width) * 2 - 1 : 0;
      const ny = freshRect.height ? (current.y / freshRect.height) * 2 - 1 : 0;

      stateRef.current = {
        x: current.x,
        y: current.y,
        nx,
        ny,
        inside: local.inside,
      };

      if (cssVars) {
        el.style.setProperty("--spot-x", `${current.x}px`);
        el.style.setProperty("--spot-y", `${current.y}px`);
        el.style.setProperty("--spot-nx", nx.toFixed(4));
        el.style.setProperty("--spot-ny", ny.toFixed(4));
        el.dataset.spotActive = local.inside ? "true" : "false";
      }
    });
  }, [active, ease, cssVars, ref]);

  return stateRef;
}
