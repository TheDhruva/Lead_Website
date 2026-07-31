"use client";

import { type ReactNode, memo } from "react";

import { m, useReducedMotion } from "framer-motion";

import { MOTION } from "@/constants";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  visible: boolean;
}

function PageTransitionComponent({
  children,
  className,
  visible,
}: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div
        className={className}
        style={{ opacity: visible ? 1 : 0 }}
        aria-hidden={!visible}
      >
        {children}
      </div>
    );
  }

  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 28, scale: 0.985 }}
      animate={
        visible
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 28, scale: 0.985 }
      }
      transition={{
        duration: MOTION.pageEnter.duration,
        delay: visible ? MOTION.pageEnter.delay : 0,
        ease: MOTION.pageEnter.ease,
      }}
      style={{ transformOrigin: "50% 20%" }}
    >
      {children}
    </m.div>
  );
}

export const PageTransition = memo(PageTransitionComponent);
