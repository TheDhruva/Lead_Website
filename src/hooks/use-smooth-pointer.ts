"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { pointerEngine, pointerLocalToElement } from "@/lib/pointer-engine";
import { isScrollActive } from "@/lib/scroll-bus";
import { getScrollContainer } from "@/lib/scroll-container";

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
      if (isScrollActive()) return;

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
  const [inView, setInView] = useState(true);
  const active = canReact && enabled && inView;
  const stateRef = useRef({ x: 0, y: 0, nx: 0, ny: 0, inside: false });
  const boundsRef = useRef({ width: 0, height: 0, left: 0, top: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || !canReact || !enabled) {
      setInView(false);
      return;
    }

    const scrollRoot = getScrollContainer();
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry?.isIntersecting ?? false);
      },
      {
        root: scrollRoot ?? null,
        rootMargin: "15% 0px",
        threshold: 0,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [canReact, enabled, ref]);

  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;

    const current = { x: 0, y: 0 };

    const measureBounds = () => {
      const rect = el.getBoundingClientRect();
      boundsRef.current = {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
      };
      current.x = rect.width / 2;
      current.y = rect.height / 2;
    };

    measureBounds();

    const resizeObserver = new ResizeObserver(measureBounds);
    resizeObserver.observe(el);
    window.addEventListener("resize", measureBounds);
    window.addEventListener("orientationchange", measureBounds);

    const unsubscribe = pointerEngine.subscribe((frame) => {
      if (isScrollActive()) return;

      const bounds = boundsRef.current;
      const local = pointerLocalToElement(el, frame.targetX, frame.targetY);
      const targetX = local.inside ? local.x : bounds.width / 2;
      const targetY = local.inside ? local.y : bounds.height / 2;

      current.x += (targetX - current.x) * ease;
      current.y += (targetY - current.y) * ease;

      const nx = bounds.width ? (current.x / bounds.width) * 2 - 1 : 0;
      const ny = bounds.height ? (current.y / bounds.height) * 2 - 1 : 0;

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

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureBounds);
      window.removeEventListener("orientationchange", measureBounds);
      unsubscribe();
    };
  }, [active, cssVars, ease, ref]);

  useEffect(() => {
    const el = ref.current;
    if (active || !el || !cssVars) return;
    el.style.removeProperty("--spot-x");
    el.style.removeProperty("--spot-y");
    el.style.removeProperty("--spot-nx");
    el.style.removeProperty("--spot-ny");
    delete el.dataset.spotActive;
  }, [active, cssVars, ref]);

  return stateRef;
}
