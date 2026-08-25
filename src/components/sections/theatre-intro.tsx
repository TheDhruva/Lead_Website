"use client";

import { useCallback, useEffect, useState } from "react";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";

import { MOTION } from "@/constants";
import { useIsMounted } from "@/hooks/use-lenis";
import { useInk } from "@/providers/ink-provider";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

/** Zoom multiplier on exit — type stays vector-sharp while filling the frame */
const TITLE_EXIT_SCALE = 10;
const TITLE_EXIT_SCALE_RETURN = 8;

const chromeFade = {
  duration: 0.28,
  ease: [0.4, 0, 1, 1] as const,
};

export function TheatreIntro() {
  const { isReturning, enter } = useTheatreIntro();
  const { onEnterReady } = useInk();
  const prefersReducedMotion = useReducedMotion();
  const mounted = useIsMounted();
  const [phase, setPhase] = useState<"idle" | "exiting" | "gone">("idle");

  useEffect(() => {
    document.documentElement.classList.add("theatre-active");
    document.getElementById("theatre-boot")?.remove();
  }, []);

  const beginExit = useCallback(() => {
    setPhase((current) => (current === "idle" ? "exiting" : current));
  }, []);

  useEffect(() => onEnterReady(beginExit), [onEnterReady, beginExit]);

  useEffect(() => {
    if (prefersReducedMotion || phase !== "idle") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "Escape"
      ) {
        event.preventDefault();
        beginExit();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prefersReducedMotion, phase, beginExit]);

  const exitDuration = isReturning
    ? MOTION.theatreExitReturn.duration
    : MOTION.theatreExit.duration;
  const exitEase = isReturning
    ? MOTION.theatreExitReturn.ease
    : MOTION.theatreExit.ease;
  const exiting = phase === "exiting";

  if (prefersReducedMotion) return null;

  return (
    <AnimatePresence>
      {phase !== "gone" ? (
        <m.div
          id="theatre-intro"
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to DHRUVA. Click or draw to enter."
          className="theatre-intro theatre-stage fixed inset-0 z-[100] cursor-pointer overflow-hidden"
          onClick={beginExit}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " " ||
              event.key === "Escape"
            ) {
              event.preventDefault();
              beginExit();
            }
          }}
          tabIndex={0}
          initial={{ opacity: 1 }}
          animate={exiting ? { opacity: [1, 1, 0] } : { opacity: 1 }}
          transition={
            exiting
              ? {
                  duration: exitDuration,
                  times: [0, 0.82, 1],
                  ease: exitEase,
                }
              : { duration: 0 }
          }
          onAnimationComplete={() => {
            if (phase !== "exiting") return;
            setPhase("gone");
            document.documentElement.classList.remove("theatre-active");
            document.documentElement.classList.add("theatre-settling");
            window.setTimeout(() => {
              enter();
            }, MOTION.theatreSettleMs);
            window.setTimeout(() => {
              document.documentElement.classList.remove("theatre-settling");
            }, 420);
          }}
        >
          <div className="theatre-stage__paper" aria-hidden="true" />
          <div className="theatre-stage__vignette" aria-hidden="true" />
          <div className="theatre-stage__grain" aria-hidden="true" />

          <m.header
            className="theatre-stage__chrome"
            initial={{ opacity: 1 }}
            animate={exiting ? { opacity: 0 } : { opacity: 1 }}
            transition={chromeFade}
          >
            <span>Creative Portfolio</span>
            <span>Vol. 2026</span>
          </m.header>

          <div className="theatre-stage__center">
            <m.div
              className={[
                "theatre-intro__title-scaler origin-center will-change-transform",
                exiting ? "theatre-intro__title--cutout" : "",
              ].join(" ")}
              initial={{ scale: 1 }}
              animate={{
                scale: exiting
                  ? isReturning
                    ? TITLE_EXIT_SCALE_RETURN
                    : TITLE_EXIT_SCALE
                  : 1,
              }}
              transition={
                exiting
                  ? { duration: exitDuration, ease: exitEase }
                  : { duration: 0 }
              }
            >
              <h1 className="theatre-stage__title">The Dhruva</h1>
            </m.div>

            <m.p
              className="theatre-stage__tagline"
              initial={{ opacity: 1 }}
              animate={exiting ? { opacity: 0 } : { opacity: 1 }}
              transition={chromeFade}
            >
              Curating high-performance
              <br />
              digital environments for the
              <br />
              avant-garde
            </m.p>
          </div>

          <m.div
            className="theatre-stage__enter"
            initial={{ opacity: 1 }}
            animate={exiting ? { opacity: 0 } : { opacity: 1 }}
            transition={chromeFade}
          >
            <span>
              {mounted && isReturning
                ? "Click or draw to continue"
                : "Click or draw to enter"}
            </span>
            <svg
              className="theatre-stage__chevron"
              viewBox="0 0 16 10"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1.5 1.5L8 8.5L14.5 1.5"
                stroke="currentColor"
                strokeWidth="1.15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
