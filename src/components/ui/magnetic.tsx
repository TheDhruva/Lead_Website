"use client";

import { type HTMLAttributes, type ReactNode, useEffect, useRef } from "react";

import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { cn } from "@/lib/utils";

interface MagneticProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Max pull in px */
  strength?: number;
  /** Influence radius in px */
  radius?: number;
}

/**
 * Whole-element magnetic pull — for CTAs like Hire Me.
 */
export function Magnetic({
  children,
  className,
  strength = 14,
  radius = 150,
  ...props
}: MagneticProps) {
  const canReact = useCanPointerReact();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canReact) return;
    const el = rootRef.current;
    if (!el) return;

    let raf = 0;
    let running = true;
    const pointer = { x: 0, y: 0, active: false };
    const current = { x: 0, y: 0 };

    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };

    const onBlur = () => {
      pointer.active = false;
    };

    const tick = () => {
      if (!running) return;

      let targetX = 0;
      let targetY = 0;

      if (pointer.active) {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = pointer.x - cx;
        const dy = pointer.y - cy;
        const dist = Math.hypot(dx, dy);

        if (dist < radius && dist > 0.001) {
          const force = (1 - dist / radius) ** 1.2;
          targetX = (dx / dist) * strength * force;
          targetY = (dy / dist) * strength * force;
        }
      }

      current.x += (targetX - current.x) * 0.18;
      current.y += (targetY - current.y) * 0.18;

      if (Math.abs(current.x) < 0.02 && Math.abs(current.y) < 0.02) {
        el.style.transform = "";
      } else {
        el.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0)`;
      }

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onBlur);
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onBlur);
      el.style.transform = "";
    };
  }, [canReact, radius, strength]);

  return (
    <div
      ref={rootRef}
      className={cn("magnetic inline-flex will-change-transform", className)}
      {...props}
    >
      {children}
    </div>
  );
}
