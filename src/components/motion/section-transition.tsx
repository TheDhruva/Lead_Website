"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

import { getScrollContainer } from "@/lib/scroll-container";
import { cn } from "@/lib/utils";

type SectionTransitionVariant = "rise" | "clip" | "scale";

interface SectionTransitionProps {
  children: ReactNode;
  className?: string;
  /** Motion composition — same language, different arrangement */
  variant?: SectionTransitionVariant;
  /** Stagger delay in ms — applied as --st-delay */
  delay?: number;
}

/**
 * SectionTransition — chapter changes for section headers.
 *
 * Fire-once IntersectionObserver adds .is-visible; CSS owns the motion
 * (translate / scale / opacity / blur / clip — never layout). Variants
 * share one motion language with different compositions so chapters
 * feel related but not identical. Respects reduced motion via CSS.
 *
 * NOTE: currently unused (headers use AnimatedText). Kept as a shared
 * primitive; toggling (not one-shot) so it replays if reintroduced.
 */
export function SectionTransition({
  children,
  className,
  variant = "rise",
  delay = 0,
}: SectionTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }

    const root = getScrollContainer();
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        el.classList.toggle("is-visible", entry.isIntersecting);
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px", root: root ?? null },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("st", `st--${variant}`, className)}
      style={{ "--st-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
