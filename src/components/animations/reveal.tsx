"use client";

import { type ReactNode, memo } from "react";

import { m } from "framer-motion";

import { MOTION } from "@/constants";
import { useEnterExit } from "@/hooks/use-enter-exit";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Extra delay on top of shared rhythm (seconds) */
  delay?: number;
  /** Stagger index within a section — multiplies MOTION.stagger */
  index?: number;
  y?: number;
  scale?: number;
  /**
   * Fire-once legacy mode (stays visible after first reveal).
   * Defaults to replay: entrance on arrival, controlled disengage
   * on departure, re-assembly on return — both scroll directions.
   */
  once?: boolean;
  /** Image-style entrance: unmasked from an 8% clip + subtle scale */
  clip?: boolean;
}

function RevealComponent({
  children,
  className,
  delay = 0,
  index = 0,
  y = MOTION.reveal.y,
  scale = MOTION.reveal.scale,
  once = false,
  clip = false,
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const { ref: revealRef, state: revealState } =
    useEnterExit<HTMLDivElement>(0.15);
  const totalDelay =
    delay +
    (index > 0 ? MOTION.itemBaseDelay + (index - 1) * MOTION.stagger : 0);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const resting = {
    opacity: 0,
    y,
    scale,
    ...(clip ? { clipPath: "inset(8% 0px 8% 0px)" } : {}),
  };
  const assembled = {
    opacity: 1,
    y: 0,
    scale: 1,
    ...(clip ? { clipPath: "inset(0% 0px 0% 0px)" } : {}),
  };
  // Disengage differs from the entrance (rises instead of settling
  // from below) and runs faster with half the stagger delay.
  const disengaged = {
    opacity: 0,
    y: -14,
    scale: 0.99,
    ...(clip ? { clipPath: "inset(6% 0px 6% 0px)" } : {}),
  };

  const target =
    revealState === "show"
      ? assembled
      : revealState === "exit" && !once
        ? disengaged
        : resting;

  return (
    <m.div
      ref={revealRef}
      className={cn(className)}
      initial={resting}
      animate={target}
      transition={
        revealState === "exit" && !once
          ? {
              duration: MOTION.reveal.duration * 0.65,
              delay: totalDelay * 0.5,
              ease: MOTION.reveal.ease,
            }
          : {
              duration: MOTION.reveal.duration,
              delay: totalDelay,
              ease: MOTION.reveal.ease,
            }
      }
    >
      {children}
    </m.div>
  );
}

export const Reveal = memo(RevealComponent);
