"use client";

import {
  type ReactElement,
  type ReactNode,
  cloneElement,
  useId,
  useState,
} from "react";

import { cn } from "@/lib/utils";

interface TooltipProps {
  content: ReactNode;
  children: ReactElement<{ "aria-describedby"?: string }>;
  side?: "top" | "bottom";
  className?: string;
}

/**
 * Minimal CSS-only Tooltip primitive (shadcn-style API, no Radix dep).
 * Only used sparingly — icon-only controls already carry aria-labels.
 * Respects prefers-reduced-motion.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const trigger = cloneElement(children, {
    "aria-describedby": visible ? id : undefined,
  });

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {trigger}
      <span
        id={id}
        role="tooltip"
        aria-hidden={!visible}
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 rounded-md border border-border bg-card px-2.5 py-1.5 font-sans text-xs font-medium whitespace-nowrap text-foreground shadow-[var(--shadow-md)] transition-opacity duration-150",
          side === "top"
            ? "-top-2 -translate-y-full"
            : "-bottom-2 translate-y-full",
          visible ? "opacity-100" : "opacity-0",
          "motion-reduce:transition-none",
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
