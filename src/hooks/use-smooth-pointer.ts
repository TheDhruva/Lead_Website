"use client";

import { type RefObject, useEffect, useRef } from "react";

import { useCanPointerReact } from "@/hooks/use-can-pointer-react";

interface PointerSmoothOptions {
  /** 0–1 lerp toward target each frame */
  ease?: number;
  enabled?: boolean;
}

/**
 * Smooth viewport pointer. Writes into a ref to avoid re-renders.
 * x/y are client coords; nx/ny are -1…1 from viewport center.
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

    let raf = 0;
    let running = true;
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { x: target.x, y: target.y };
    let hasPointer = false;

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      hasPointer = true;
    };

    const tick = () => {
      if (!running) return;
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;
      const hw = window.innerWidth / 2 || 1;
      const hh = window.innerHeight / 2 || 1;
      pointerRef.current = {
        x: current.x,
        y: current.y,
        nx: (current.x - hw) / hw,
        ny: (current.y - hh) / hh,
        active: hasPointer,
      };
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      pointerRef.current.active = false;
    };
  }, [active, ease]);

  return pointerRef;
}

/**
 * Smooth pointer relative to an element center.
 * Writes --px/--py (px) and --nx/--ny (-1…1) on the element.
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

    let raf = 0;
    let running = true;
    const target = { x: 0, y: 0, inside: false };
    const current = { x: 0, y: 0 };

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const lx = event.clientX - rect.left;
      const ly = event.clientY - rect.top;
      target.x = lx;
      target.y = ly;
      target.inside =
        lx >= 0 && ly >= 0 && lx <= rect.width && ly <= rect.height;
    };

    const onLeave = () => {
      target.inside = false;
      const rect = el.getBoundingClientRect();
      target.x = rect.width / 2;
      target.y = rect.height / 2;
    };

    const tick = () => {
      if (!running) return;
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;
      const rect = el.getBoundingClientRect();
      const nx = rect.width ? (current.x / rect.width) * 2 - 1 : 0;
      const ny = rect.height ? (current.y / rect.height) * 2 - 1 : 0;
      stateRef.current = {
        x: current.x,
        y: current.y,
        nx,
        ny,
        inside: target.inside,
      };

      if (cssVars) {
        el.style.setProperty("--spot-x", `${current.x}px`);
        el.style.setProperty("--spot-y", `${current.y}px`);
        el.style.setProperty("--spot-nx", nx.toFixed(4));
        el.style.setProperty("--spot-ny", ny.toFixed(4));
        el.dataset.spotActive = target.inside ? "true" : "false";
      }

      raf = requestAnimationFrame(tick);
    };

    const rect = el.getBoundingClientRect();
    target.x = rect.width / 2;
    target.y = rect.height / 2;
    current.x = target.x;
    current.y = target.y;

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeAttribute("data-spot-active");
    };
  }, [active, ease, cssVars, ref]);

  return stateRef;
}
