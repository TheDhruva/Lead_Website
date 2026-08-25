"use client";

import { type CSSProperties, type ReactNode, useRef } from "react";

import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { useElementPointerVars } from "@/hooks/use-smooth-pointer";
import { cn } from "@/lib/utils";

interface CursorSpotlightProps {
  children: ReactNode;
  className?: string;
  /** Soft lamp radius in px */
  size?: number;
  /** 0–1 peak brightness */
  intensity?: number;
}

/**
 * Soft lamp vignette that follows the cursor inside a card frame.
 */
export function CursorSpotlight({
  children,
  className,
  size = 220,
  intensity = 0.2,
}: CursorSpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const canReact = useCanPointerReact();
  useElementPointerVars(ref, { enabled: canReact, ease: 0.18 });

  return (
    <div
      ref={ref}
      className={cn("cursor-spotlight relative", className)}
      style={
        {
          "--spot-size": `${size}px`,
          "--spot-intensity": intensity,
        } as CSSProperties
      }
    >
      {children}
      {canReact ? (
        <div className="cursor-spotlight__lamp" aria-hidden="true" />
      ) : null}
    </div>
  );
}
