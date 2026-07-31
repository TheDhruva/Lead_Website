"use client";

import { type ReactNode, memo } from "react";

import { Reveal } from "./reveal";

interface ScrollTriggerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

function ScrollTriggerComponent({
  children,
  className,
  delay,
}: ScrollTriggerProps) {
  return (
    <Reveal className={className} delay={delay}>
      {children}
    </Reveal>
  );
}

export const ScrollTrigger = memo(ScrollTriggerComponent);
