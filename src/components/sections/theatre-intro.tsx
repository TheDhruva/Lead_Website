"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, m } from "framer-motion";

import {
  THEATRE_INTRO_AUTO_EXIT_MS,
  THEATRE_INTRO_LOAD_MS,
  THEATRE_INTRO_REVEAL_MS,
} from "@/constants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { useAudio } from "@/providers/audio-provider";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

const ENTRANCE_EASE = [0.16, 1, 0.3, 1] as const;
const EXIT_EASE = [0.4, 0, 0.2, 1] as const;
const EXIT_DURATION = 0.68;

type IntroPhase = "reveal" | "loading" | "ready" | "exiting" | "gone";

export function TheatreIntro() {
  const { isReturning, enter, bootstrapped, markDeparting } = useTheatreIntro();
  const { unlockAudio, play } = useAudio();
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<IntroPhase>("reveal");
  const handoffRef = useRef(false);

  useEffect(() => {
    if (!bootstrapped || prefersReducedMotion || handoffRef.current) return;

    handoffRef.current = true;
    document.documentElement.classList.add("theatre-intro-live");

    requestAnimationFrame(() => {
      document.getElementById("theatre-boot")?.remove();
    });
  }, [bootstrapped, prefersReducedMotion]);

  const unlockFromGesture = useCallback(() => {
    unlockAudio();
  }, [unlockAudio]);

  useEffect(() => {
    if (!bootstrapped || prefersReducedMotion || phase !== "reveal") return;

    const timer = window.setTimeout(() => {
      setPhase("loading");
    }, THEATRE_INTRO_REVEAL_MS);

    return () => window.clearTimeout(timer);
  }, [bootstrapped, prefersReducedMotion, phase]);

  const beginExit = useCallback(
    (fromUserGesture = false) => {
      // Audio starts ONLY on explicit user gesture (click/key). No
      // speculative ambient fetch on auto-exit — the 4MB bed downloads
      // solely after the user opts into sound.
      if (fromUserGesture) {
        unlockFromGesture();
        requestAnimationFrame(() => {
          // Layer A (low swell) + Layer B (transition air) together,
          // resolving across the ~0.9s exit into the hero.
          play("intro-swell");
          play("hero-transition");
        });
      }

      // Signal the hero to begin assembling during this exit transition
      // so the handoff feels like one continuous composition. Deferred
      // ~120ms so the intro owns the first beat of the exit while the
      // hero is already stirring underneath the lifting curtain.
      // Fire-and-forget is safe: markDeparting only touches the module
      // snapshot (idempotent), never component state.
      window.setTimeout(() => markDeparting(), 120);
      setPhase((current) =>
        current === "reveal" || current === "loading" || current === "ready"
          ? "exiting"
          : current,
      );
    },
    [play, unlockFromGesture, markDeparting],
  );

  // Loading bar is a CSS animation (theatre-load-fill); when it finishes,
  // advance without any per-frame React state. No RAF loop here.
  const handleLoadAnimationEnd = useCallback(() => {
    if (isReturning) {
      window.setTimeout(() => beginExit(false), 120);
    } else {
      setPhase("ready");
    }
  }, [isReturning, beginExit]);

  useEffect(() => {
    if (prefersReducedMotion || phase !== "ready") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        beginExit(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        beginExit(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prefersReducedMotion, phase, beginExit]);

  useEffect(() => {
    if (prefersReducedMotion || phase !== "ready") return;

    const timer = window.setTimeout(
      () => beginExit(false),
      THEATRE_INTRO_AUTO_EXIT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion, phase, beginExit]);

  const exiting = phase === "exiting";
  const showEnterPrompt = phase === "ready";
  const showProgress = phase === "loading" || phase === "ready" || exiting;
  const contentVisible = phase !== "gone";

  if (!bootstrapped || prefersReducedMotion) {
    return null;
  }

  return (
    <AnimatePresence>
      {contentVisible ? (
        <m.div
          id="theatre-intro"
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to DHRUVA"
          aria-busy={phase === "loading" || undefined}
          className={cn(
            "theatre-intro theatre-curtain fixed inset-0 z-[200] overflow-hidden",
            showEnterPrompt && "cursor-pointer",
          )}
          onClick={() => {
            if (showEnterPrompt) beginExit(true);
          }}
          onKeyDown={(event) => {
            if (!showEnterPrompt) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              beginExit(true);
            }
          }}
          tabIndex={showEnterPrompt ? 0 : -1}
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={
            exiting
              ? { opacity: 0, y: -24, scale: 1.02 }
              : { opacity: 1, y: 0, scale: 1 }
          }
          transition={{
            duration: exiting ? 0.4 : 0,
            delay: exiting ? 0.55 : 0,
            ease: EXIT_EASE,
          }}
          onAnimationComplete={() => {
            if (phase !== "exiting") return;
            setPhase("gone");
            document.documentElement.classList.remove(
              "theatre-active",
              "theatre-intro-live",
            );
            enter();
          }}
        >
          <m.button
            type="button"
            className="theatre-stage__skip"
            initial={{ opacity: 0, y: -8 }}
            animate={
              exiting
                ? { opacity: 0, y: -12 }
                : phase === "reveal"
                  ? { opacity: 0, y: -8 }
                  : { opacity: 1, y: 0 }
            }
            transition={{
              duration: exiting ? EXIT_DURATION : 0.5,
              delay: exiting ? 0 : 0.7,
              ease: ENTRANCE_EASE,
            }}
            onClick={(event) => {
              event.stopPropagation();
              beginExit(true);
            }}
          >
            Skip
          </m.button>

          <m.header
            className="theatre-stage__chrome"
            initial={{ opacity: 0, y: -12 }}
            animate={
              exiting
                ? { opacity: 0, y: -16 }
                : phase === "reveal"
                  ? { opacity: 0, y: -12 }
                  : { opacity: 1, y: 0 }
            }
            transition={{
              duration: exiting ? EXIT_DURATION : 0.58,
              delay: exiting ? 0.02 : 0.48,
              ease: ENTRANCE_EASE,
            }}
          >
            <span>Creative Portfolio</span>
            <span>VOL 2026</span>
          </m.header>

          <div className="theatre-stage__center">
            <div className="theatre-stage__brand">
              <div className="theatre-stage__title-row" aria-label="THE DHRUVA">
                <m.div
                  className="theatre-stage__the"
                  aria-hidden="true"
                  initial={{ opacity: 0 }}
                  animate={
                    exiting ? { opacity: 0, y: -12 } : { opacity: 1, y: 0 }
                  }
                  transition={
                    exiting
                      ? { duration: 0.4, ease: ENTRANCE_EASE }
                      : { duration: 0.55, ease: ENTRANCE_EASE }
                  }
                >
                  {"THE".split("").map((letter, index) => (
                    <m.span
                      key={index}
                      aria-hidden="true"
                      className="theatre-stage__the-letter"
                      initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{
                        duration: 0.55,
                        ease: ENTRANCE_EASE,
                        delay: index * 0.02,
                      }}
                    >
                      {letter}
                    </m.span>
                  ))}
                </m.div>

                <m.div
                  className="theatre-stage__dhruva-row"
                  aria-hidden="true"
                  initial={{ letterSpacing: "0.03em", scale: 1, y: 0 }}
                  animate={
                    exiting
                      ? { letterSpacing: "-0.02em", scale: 1.05, y: -30 }
                      : { letterSpacing: "0em", scale: 1, y: 0 }
                  }
                  transition={
                    exiting
                      ? { duration: 0.9, ease: ENTRANCE_EASE }
                      : { duration: 0.7, ease: ENTRANCE_EASE }
                  }
                >
                  <m.div
                    className="theatre-stage__dhruva-fade"
                    aria-hidden="true"
                    initial={false}
                    animate={exiting ? { opacity: 0 } : { opacity: 1 }}
                    transition={
                      exiting
                        ? { delay: 0.55, duration: 0.35, ease: EXIT_EASE }
                        : { duration: 0.01 }
                    }
                  >
                    {"DHRUVA".split("").map((letter, index) => (
                      <m.span
                        key={index}
                        aria-hidden="true"
                        className="theatre-stage__dhruva-letter"
                        initial={{
                          opacity: 0,
                          y: 14,
                          scale: 0.96,
                          filter: "blur(3px)",
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          filter: "blur(0px)",
                        }}
                        transition={{
                          duration: 0.6,
                          ease: ENTRANCE_EASE,
                          delay: 0.08 + index * 0.022,
                        }}
                      >
                        {letter}
                      </m.span>
                    ))}
                  </m.div>
                </m.div>
              </div>

              <m.p
                className="theatre-stage__tagline"
                initial={{ opacity: 0, y: 22 }}
                animate={
                  exiting
                    ? { opacity: 0, y: -18 }
                    : phase === "reveal"
                      ? { opacity: 0, y: 22 }
                      : { opacity: 1, y: 0 }
                }
                transition={{
                  duration: exiting ? EXIT_DURATION : 0.62,
                  delay: exiting ? 0.08 : 0.52,
                  ease: ENTRANCE_EASE,
                }}
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
            className="theatre-stage__footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: showProgress && !exiting ? 1 : 0 }}
            transition={{ duration: 0.4, ease: ENTRANCE_EASE }}
            aria-hidden={!showProgress}
          >
            <div
              className="theatre-stage__progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Loading portfolio"
            >
              <span
                key={phase === "loading" ? "loading-bar" : "idle-bar"}
                className="theatre-stage__progress-fill theatre-load-fill"
                style={{ animationDuration: `${THEATRE_INTRO_LOAD_MS}ms` }}
                onAnimationEnd={handleLoadAnimationEnd}
                aria-hidden="true"
              />
            </div>

            <m.p
              className={cn(
                "theatre-stage__enter-prompt",
                showEnterPrompt && "theatre-stage__enter-prompt--visible",
              )}
              initial={{ opacity: 0, y: 8 }}
              animate={
                showEnterPrompt && !exiting
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 8 }
              }
              transition={{ duration: 0.42, ease: ENTRANCE_EASE }}
            >
              Press to enter & enable sound
            </m.p>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
