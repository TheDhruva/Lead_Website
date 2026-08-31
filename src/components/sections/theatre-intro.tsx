"use client";

import { useCallback, useEffect, useState } from "react";

import { AnimatePresence, m } from "framer-motion";

import {
  MOTION,
  THEATRE_INTRO_RETURN_TIMEOUT_MS,
  THEATRE_INTRO_TIMEOUT_MS,
} from "@/constants";
import { useIsMounted } from "@/hooks/use-lenis";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useAudio } from "@/providers/audio-provider";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

/** Zoom multiplier on exit — type stays vector-sharp while filling the frame */
const TITLE_EXIT_SCALE = 10;
const TITLE_EXIT_SCALE_RETURN = 8;

const chromeFade = {
  duration: 0.28,
  ease: [0.4, 0, 1, 1] as const,
};

const ENTRANCE_EASE = [0.16, 1, 0.3, 1] as const;

type IntroPhase = "entering" | "hold" | "exiting" | "gone";

function entranceMotion(
  delay: number,
  duration: number,
  skip: boolean,
  y = 14,
) {
  if (skip) {
    return {
      initial: false as const,
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    };
  }

  return {
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration, ease: ENTRANCE_EASE },
  };
}

function titleEntranceMotion(skip: boolean) {
  const { delay, duration } = MOTION.theatreEntrance.title;

  if (skip) {
    return {
      initial: false as const,
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 0 },
    };
  }

  return {
    initial: { opacity: 0, y: 16, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { delay, duration, ease: ENTRANCE_EASE },
  };
}

export function TheatreIntro() {
  const { isReturning, enter } = useTheatreIntro();
  const { unlockAudio, play } = useAudio();
  const prefersReducedMotion = useReducedMotion();
  const mounted = useIsMounted();
  const skipEntrance = isReturning;
  const [phase, setPhase] = useState<IntroPhase>(
    skipEntrance ? "hold" : "entering",
  );

  useEffect(() => {
    if (isReturning) return;
    document.documentElement.classList.add("theatre-active");
    document.getElementById("theatre-boot")?.remove();
  }, [isReturning]);

  const beginExit = useCallback(
    (withAudio = false) => {
      if (withAudio) {
        unlockAudio();
        requestAnimationFrame(() => play("elementAppear"));
      }
      setPhase((current) =>
        current === "entering" || current === "hold" ? "exiting" : current,
      );
    },
    [unlockAudio, play],
  );

  useEffect(() => {
    if (prefersReducedMotion || phase !== "entering" || skipEntrance) return;

    const { delay, duration } = MOTION.theatreEntrance.enter;
    const entranceMs = (delay + duration) * 1000 + 60;
    const timer = window.setTimeout(() => {
      setPhase("hold");
    }, entranceMs);

    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion, phase, skipEntrance]);

  useEffect(() => {
    if (prefersReducedMotion || phase !== "hold") return;

    const holdMs = isReturning
      ? THEATRE_INTRO_RETURN_TIMEOUT_MS
      : THEATRE_INTRO_TIMEOUT_MS;
    const timer = window.setTimeout(() => beginExit(false), holdMs);

    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion, phase, isReturning, beginExit]);

  useEffect(() => {
    if (prefersReducedMotion || (phase !== "entering" && phase !== "hold")) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "Escape"
      ) {
        event.preventDefault();
        beginExit(true);
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
  const enterReady = phase === "hold";

  if (prefersReducedMotion || isReturning) return null;

  const {
    chrome,
    subtitle: tagline,
    enter: enterMotion,
  } = MOTION.theatreEntrance;
  const chromeMotion = entranceMotion(
    chrome.delay,
    chrome.duration,
    skipEntrance,
    10,
  );
  const taglineMotion = entranceMotion(
    tagline.delay,
    tagline.duration,
    skipEntrance,
  );
  const enterHintMotion = entranceMotion(
    enterMotion.delay,
    enterMotion.duration,
    skipEntrance,
    8,
  );
  const titleMotion = titleEntranceMotion(skipEntrance);

  return (
    <AnimatePresence>
      {phase !== "gone" ? (
        <m.div
          id="theatre-intro"
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to DHRUVA"
          className="theatre-intro theatre-stage fixed inset-0 z-[100] cursor-pointer overflow-hidden"
          onClick={() => beginExit(true)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " " ||
              event.key === "Escape"
            ) {
              event.preventDefault();
              beginExit(true);
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

          <m.button
            type="button"
            className="theatre-stage__skip"
            initial={chromeMotion.initial}
            animate={exiting ? { opacity: 0 } : chromeMotion.animate}
            transition={exiting ? chromeFade : chromeMotion.transition}
            onClick={(event) => {
              event.stopPropagation();
              beginExit(true);
            }}
          >
            Skip
          </m.button>

          <m.header
            className="theatre-stage__chrome"
            initial={chromeMotion.initial}
            animate={exiting ? { opacity: 0, y: 0 } : chromeMotion.animate}
            transition={exiting ? chromeFade : chromeMotion.transition}
          >
            <span>Creative Portfolio</span>
            <span>VOL 2026</span>
          </m.header>

          <div className="theatre-stage__center">
            <div className="theatre-stage__brand">
              <m.div
                className={[
                  "theatre-intro__title-scaler origin-center will-change-transform",
                  exiting ? "theatre-intro__title--cutout" : "",
                ].join(" ")}
                initial={titleMotion.initial}
                animate={
                  exiting
                    ? {
                        opacity: 1,
                        y: 0,
                        scale: isReturning
                          ? TITLE_EXIT_SCALE_RETURN
                          : TITLE_EXIT_SCALE,
                      }
                    : titleMotion.animate
                }
                transition={
                  exiting
                    ? { duration: exitDuration, ease: exitEase }
                    : titleMotion.transition
                }
              >
                <p className="theatre-stage__title">THE DHRUVA</p>
              </m.div>

              <m.p
                className="theatre-stage__tagline"
                initial={taglineMotion.initial}
                animate={exiting ? { opacity: 0, y: 0 } : taglineMotion.animate}
                transition={exiting ? chromeFade : taglineMotion.transition}
              >
                Curating high-performance
                <br />
                digital environments for the
                <br />
                avant-garde
              </m.p>
            </div>
          </div>

          <m.div
            className={[
              "theatre-stage__enter",
              enterReady ? "theatre-stage__enter--ready" : "",
            ].join(" ")}
            initial={enterHintMotion.initial}
            animate={exiting ? { opacity: 0, y: 0 } : enterHintMotion.animate}
            transition={exiting ? chromeFade : enterHintMotion.transition}
          >
            <span className="theatre-stage__enter-text">
              {mounted && isReturning ? "Welcome back" : "Enter Experience"}
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
