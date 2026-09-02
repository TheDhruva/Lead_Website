"use client";

import {
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";

import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { lerp, pointerEngine } from "@/lib/pointer-engine";
import { isScrollActive } from "@/lib/scroll-bus";
import { cn } from "@/lib/utils";

interface MagneticProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Max pull in px — keep subtle (6–15) */
  strength?: number;
  /** Influence radius in px */
  radius?: number;
}

/** Whole-element magnetic pull — shared PointerEngine, transform-only. */
export function Magnetic({
  children,
  className,
  strength = 10,
  radius = 140,
  ...props
}: MagneticProps) {
  const canReact = useCanPointerReact();
  const rootRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef({ cx: 0, cy: 0 });

  const measureCenter = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    centerRef.current = {
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
    };
  }, []);

  useEffect(() => {
    if (!canReact) return;
    const el = rootRef.current;
    if (!el) return;

    const current = { x: 0, y: 0 };
    const max = Math.min(15, Math.max(6, strength));

    measureCenter();

    const resizeObserver = new ResizeObserver(measureCenter);
    resizeObserver.observe(el);
    window.addEventListener("resize", measureCenter);
    window.addEventListener("orientationchange", measureCenter);

    const unsubscribe = pointerEngine.subscribe((frame) => {
      if (isScrollActive()) {
        el.style.transform = "";
        return;
      }

      let targetX = 0;
      let targetY = 0;

      if (frame.active) {
        const { cx, cy } = centerRef.current;
        const dx = frame.targetX - cx;
        const dy = frame.targetY - cy;
        const dist = Math.hypot(dx, dy);

        if (dist < radius && dist > 0.001) {
          const force = (1 - dist / radius) ** 1.35;
          targetX = (dx / dist) * max * force;
          targetY = (dy / dist) * max * force;
        }
      }

      current.x = lerp(current.x, targetX, 0.16);
      current.y = lerp(current.y, targetY, 0.16);

      if (Math.abs(current.x) < 0.02 && Math.abs(current.y) < 0.02) {
        el.style.transform = "";
      } else {
        el.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0)`;
      }
    });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureCenter);
      window.removeEventListener("orientationchange", measureCenter);
      unsubscribe();
    };
  }, [canReact, measureCenter, radius, strength]);

  return (
    <div
      ref={rootRef}
      className={cn("magnetic inline-flex", className)}
      {...props}
    >
      {children}
    </div>
  );
}
