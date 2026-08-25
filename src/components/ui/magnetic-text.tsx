"use client";

import { type HTMLAttributes, useEffect, useRef } from "react";

import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { cn } from "@/lib/utils";

interface MagneticTextProps extends HTMLAttributes<HTMLSpanElement> {
  text: string;
  /** Max letter pull in px */
  strength?: number;
  /** Radius of influence in px */
  radius?: number;
}

/**
 * Brand letters ease toward the cursor, then settle — cinematic magnetism.
 */
export function MagneticText({
  text,
  className,
  strength = 10,
  radius = 110,
  ...props
}: MagneticTextProps) {
  const canReact = useCanPointerReact();
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!canReact) return;

    let raf = 0;
    let running = true;
    const pointer = { x: 0, y: 0, active: false };
    const letters = Array.from(text).map(() => ({ x: 0, y: 0 }));

    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };

    const onLeaveWindow = () => {
      pointer.active = false;
    };

    const tick = () => {
      if (!running) return;

      letterRefs.current.forEach((el, index) => {
        if (!el) return;
        const state = letters[index]!;
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
            const force = (1 - dist / radius) ** 1.15;
            targetX = (dx / dist) * strength * force;
            targetY = (dy / dist) * strength * force;
          }
        }

        state.x += (targetX - state.x) * 0.16;
        state.y += (targetY - state.y) * 0.16;

        if (Math.abs(state.x) < 0.01 && Math.abs(state.y) < 0.01) {
          el.style.transform = "";
        } else {
          el.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0)`;
        }
      });

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onLeaveWindow);
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onLeaveWindow);
      letterRefs.current.forEach((el) => {
        if (el) el.style.transform = "";
      });
    };
  }, [canReact, radius, strength, text]);

  const chars = Array.from(text);

  return (
    <span
      className={cn("magnetic-text inline-flex", className)}
      aria-label={text}
      {...props}
    >
      {chars.map((char, index) => (
        <span
          key={`${char}-${index}`}
          ref={(node) => {
            letterRefs.current[index] = node;
          }}
          className="magnetic-text__letter inline-block will-change-transform"
          aria-hidden="true"
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}
