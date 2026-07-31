"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";

import { MOTION } from "@/constants";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

export function TheatreIntro() {
  const { hasEntered, enter } = useTheatreIntro();
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {!hasEntered ? (
        <m.div
          id="theatre-intro"
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to DHRUVA"
          className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center overflow-hidden bg-[#fafafa] dark:bg-black"
          onClick={enter}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " " ||
              event.key === "Escape"
            ) {
              event.preventDefault();
              enter();
            }
          }}
          tabIndex={0}
          initial={{ opacity: 1, scale: 1 }}
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  scale: 1.06,
                  transition: {
                    duration: MOTION.theatreExit.duration,
                    ease: MOTION.theatreExit.ease,
                  },
                }
          }
        >
          <div
            className="letterbox letterbox-top bg-[#111111] dark:bg-black"
            aria-hidden="true"
          />
          <div className="relative z-20 text-center">
            <h1 className="font-display-lg text-display-lg-mobile tracking-tighter text-[#111111] md:text-display-lg dark:text-white">
              DHRUVA
            </h1>
            <p className="mt-4 font-body-md text-body-md text-[#111111]/55 dark:text-white/50">
              Click To Enter
            </p>
          </div>
          <div
            className="letterbox letterbox-bottom bg-[#111111] dark:bg-black"
            aria-hidden="true"
          />
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
