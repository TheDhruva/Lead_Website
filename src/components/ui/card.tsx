import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  innerGlow?: boolean;
}

export function Card({
  children,
  className,
  innerGlow = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground card-shadow transition-colors duration-[250ms]",
        innerGlow && "inner-glow",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
