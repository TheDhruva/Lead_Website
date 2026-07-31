"use client";

import { type ReactNode, memo } from "react";

import { m, useReducedMotion } from "framer-motion";

import { MOTION } from "@/constants";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}

function RevealComponent({
  children,
  className,
  delay = 0,
  y = MOTION.reveal.y,
  once = true,
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      className={cn(className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.18, margin: "0px 0px -8% 0px" }}
      transition={{
        duration: MOTION.reveal.duration,
        delay,
        ease: MOTION.reveal.ease,
      }}
    >
      {children}
    </m.div>
  );
}

export const Reveal = memo(RevealComponent);
