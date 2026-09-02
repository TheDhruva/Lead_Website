"use client";

import { type HTMLAttributes, useCallback, useEffect, useRef } from "react";

import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { lerp, pointerEngine } from "@/lib/pointer-engine";
import { isScrollActive } from "@/lib/scroll-bus";
import { cn } from "@/lib/utils";

interface MagneticTextProps extends HTMLAttributes<HTMLSpanElement> {
  text: string;
  /** Max letter pull in px — keep subtle */
  strength?: number;
  /** Radius of influence in px */
  radius?: number;
}

interface LetterCenter {
  cx: number;
  cy: number;
}

/** Brand letters ease toward cursor via shared PointerEngine. */
export function MagneticText({
  text,
  className,
  strength = 7,
  radius = 110,
  ...props
}: MagneticTextProps) {
  const canReact = useCanPointerReact();
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const letterCentersRef = useRef<LetterCenter[]>([]);
  const rootRef = useRef<HTMLSpanElement>(null);

  const measureLetterCenters = useCallback(() => {
    letterCentersRef.current = letterRefs.current.map((el) => {
      if (!el) return { cx: 0, cy: 0 };
      const rect = el.getBoundingClientRect();
      return {
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2,
      };
    });
  }, []);

  useEffect(() => {
    if (!canReact) return;

    const letters = Array.from(text).map(() => ({ x: 0, y: 0 }));
    const max = Math.min(12, Math.max(5, strength));

    measureLetterCenters();

    const root = rootRef.current;
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && root
        ? new ResizeObserver(measureLetterCenters)
        : null;
    resizeObserver?.observe(root!);
    window.addEventListener("resize", measureLetterCenters);
    window.addEventListener("orientationchange", measureLetterCenters);

    const unsubscribe = pointerEngine.subscribe((frame) => {
      if (isScrollActive()) {
        letterRefs.current.forEach((el) => {
          if (el) el.style.transform = "";
        });
        return;
      }

      letterRefs.current.forEach((el, index) => {
        if (!el) return;
        const state = letters[index]!;
        const center = letterCentersRef.current[index];
        let targetX = 0;
        let targetY = 0;

        if (frame.active && center) {
          const dx = frame.targetX - center.cx;
          const dy = frame.targetY - center.cy;
          const dist = Math.hypot(dx, dy);
          if (dist < radius && dist > 0.001) {
            const force = (1 - dist / radius) ** 1.25;
            targetX = (dx / dist) * max * force;
            targetY = (dy / dist) * max * force;
          }
        }

        state.x = lerp(state.x, targetX, 0.15);
        state.y = lerp(state.y, targetY, 0.15);

        if (Math.abs(state.x) < 0.01 && Math.abs(state.y) < 0.01) {
          el.style.transform = "";
        } else {
          el.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0)`;
        }
      });
    });

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureLetterCenters);
      window.removeEventListener("orientationchange", measureLetterCenters);
      unsubscribe();
    };
  }, [canReact, measureLetterCenters, radius, strength, text]);

  const chars = Array.from(text);

  return (
    <span
      ref={rootRef}
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
          className="magnetic-text__letter inline-block"
          aria-hidden="true"
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}
