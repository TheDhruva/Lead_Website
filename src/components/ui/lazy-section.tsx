"use client";

import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useState,
} from "react";

import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { cn } from "@/lib/utils";

interface LazySectionProps {
  children: ReactNode;
  /** Section id to keep anchor/scroll targets valid while still hidden. */
  id?: string;
  /** Background class shared by the placeholder and the section. */
  className?: string;
  /** Height reserved for the placeholder before content mounts. */
  minHeight?: CSSProperties["minHeight"];
  /** Start loading this far before the section enters the viewport. */
  rootMargin?: string;
}

/**
 * Defers a below-the-fold section's content (and the JS chunk that renders it)
 * until the user scrolls near it. The placeholder keeps a matching background
 * and id so nav links, section-highlighting and layout stay stable, then the
 * real section is mounted once it is approaching the viewport.
 */
export function LazySection({
  children,
  id,
  className,
  minHeight = "min(66svh, 700px)",
  rootMargin = "0px 0px 600px 0px",
}: LazySectionProps) {
  const { ref, isInView } = useIntersectionObserver<HTMLElement>({
    threshold: 0,
    rootMargin,
    triggerOnce: true,
  });
  const [supported] = useState(
    typeof window === "undefined" || "IntersectionObserver" in window,
  );

  if (!supported) {
    return <div className={className}>{children}</div>;
  }

  if (!isInView) {
    return (
      <section
        ref={ref}
        id={id}
        className={cn("min-h-0", className)}
        style={{ minHeight }}
        aria-hidden="true"
        aria-busy="true"
        tabIndex={-1}
      />
    );
  }

  const divRef = ref as RefObject<HTMLDivElement | null>;

  return (
    <div ref={divRef} className={className}>
      {children}
    </div>
  );
}
