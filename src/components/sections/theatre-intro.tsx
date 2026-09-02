"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, m } from "framer-motion";

import { THEATRE_INTRO_LOAD_MS, THEATRE_INTRO_REVEAL_MS } from "@/constants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { useAudio } from "@/providers/audio-provider";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

const ENTRANCE_EASE = [0.16, 1, 0.3, 1] as const;
const EXIT_EASE = [0.4, 0, 0.2, 1] as const;
const EXIT_DURATION = 0.68;

type IntroPhase = "reveal" | "loading" | "ready" | "exiting" | "gone";

const titleSlideEnter = {
  initial: { opacity: 0, y: 44 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.14, duration: 0.88, ease: ENTRANCE_EASE },
};

const titleSlideExit = {
  opacity: 0,
  y: -44,
};

export function TheatreIntro() {
  const { isReturning, enter, bootstrapped } = useTheatreIntro();
  const { unlockAudio, tryAutoplayAmbient, play } = useAudio();
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<IntroPhase>("reveal");
  const [loadProgress, setLoadProgress] = useState(0);
  const loadFrameRef = useRef<number | null>(null);
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
      if (fromUserGesture) {
        unlockFromGesture();
        requestAnimationFrame(() => play("elementAppear"));
      } else if (isReturning) {
        tryAutoplayAmbient();
      }

      setPhase((current) =>
        current === "reveal" || current === "loading" || current === "ready"
          ? "exiting"
          : current,
      );
    },
    [isReturning, play, tryAutoplayAmbient, unlockFromGesture],
  );

  useEffect(() => {
    if (prefersReducedMotion || phase !== "loading") return;

    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(
        100,
        ((now - start) / THEATRE_INTRO_LOAD_MS) * 100,
      );
      setLoadProgress(progress);

      if (progress < 100) {
        loadFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      if (isReturning) {
        window.setTimeout(() => beginExit(false), 120);
      } else {
        setPhase("ready");
      }
    };

    loadFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (loadFrameRef.current !== null) {
        cancelAnimationFrame(loadFrameRef.current);
        loadFrameRef.current = null;
      }
    };
  }, [prefersReducedMotion, phase, isReturning, beginExit]);

  useEffect(() => {
    if (prefersReducedMotion || phase !== "ready") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        beginExit(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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
          initial={{ opacity: 1 }}
          animate={{ opacity: exiting ? 0 : 1 }}
          transition={{
            duration: exiting ? 0.35 : 0,
            delay: exiting ? 0.42 : 0,
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
              <m.div
                className="theatre-stage__title-row"
                aria-label="THE DHRUVA"
                initial={titleSlideEnter.initial}
                animate={exiting ? titleSlideExit : titleSlideEnter.animate}
                transition={
                  exiting
                    ? { duration: EXIT_DURATION, ease: EXIT_EASE }
                    : titleSlideEnter.transition
                }
              >
                <span className="theatre-stage__title-part theatre-stage__title-part--left">
                  THE
                </span>
                <span className="theatre-stage__title-part theatre-stage__title-part--right">
                  DHRUVA
                </span>
              </m.div>

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
              aria-valuenow={Math.round(loadProgress)}
              aria-label="Loading portfolio"
            >
              <m.div
                className="theatre-stage__progress-fill"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: loadProgress / 100 }}
                transition={{ duration: 0.12, ease: "linear" }}
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
