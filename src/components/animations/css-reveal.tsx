"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

import { getScrollContainer } from "@/lib/scroll-container";
import { cn } from "@/lib/utils";

interface CssRevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms — applied as --reveal-delay */
  delay?: number;
}

/**
 * Viewport-entry reveal without Framer Motion:
 * IntersectionObserver (fire-once) adds .is-visible, CSS owns the motion.
 * Respects prefers-reduced-motion via CSS (content always visible).
 */
export function CssReveal({ children, className, delay = 0 }: CssRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.classList.contains("is-visible")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }

    const root = getScrollContainer();
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px", root: root ?? null },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("css-reveal", className)}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
