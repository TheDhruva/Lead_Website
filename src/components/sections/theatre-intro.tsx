"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";

import { MOTION } from "@/constants";
import { useIsMounted } from "@/hooks/use-lenis";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

/** Zoom multiplier on exit — SVG stays vector-sharp while filling the frame */
const TITLE_EXIT_SCALE = 18;
const TITLE_EXIT_SCALE_RETURN = 14;
/** Accumulated pointer travel (px) before the intro dismisses */
const CURSOR_EXIT_DISTANCE_PX = 220;

export function TheatreIntro() {
  const { isReturning, enter } = useTheatreIntro();
  const prefersReducedMotion = useReducedMotion();
  const mounted = useIsMounted();
  const [phase, setPhase] = useState<"idle" | "exiting" | "gone">("idle");
  const travelRef = useRef(0);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("theatre-active");
    document.getElementById("theatre-boot")?.remove();
  }, []);

  const beginExit = useCallback(() => {
    setPhase((current) => (current === "idle" ? "exiting" : current));
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || phase !== "idle") return;

    const onPointerMove = (event: PointerEvent) => {
      const point = { x: event.clientX, y: event.clientY };
      const last = lastPointerRef.current;
      lastPointerRef.current = point;
      if (!last) return;

      const dx = point.x - last.x;
      const dy = point.y - last.y;
      travelRef.current += Math.hypot(dx, dy);

      if (travelRef.current >= CURSOR_EXIT_DISTANCE_PX) {
        beginExit();
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [prefersReducedMotion, phase, beginExit]);

  const exitDuration = isReturning
    ? MOTION.theatreExitReturn.duration
    : MOTION.theatreExit.duration;
  const exitEase = isReturning
    ? MOTION.theatreExitReturn.ease
    : MOTION.theatreExit.ease;

  if (prefersReducedMotion) return null;

  return (
    <AnimatePresence>
      {phase !== "gone" ? (
        <m.div
          id="theatre-intro"
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to DHRUVA"
          className="theatre-intro fixed inset-0 z-[100] cursor-pointer overflow-hidden"
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
          animate={
            phase === "exiting" ? { opacity: [1, 1, 0] } : { opacity: 1 }
          }
          transition={
            phase === "exiting"
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
          <div
            className="theatre-intro__curtain absolute inset-0"
            aria-hidden="true"
          />

          <m.div
            className="letterbox letterbox-top theatre-intro__bar"
            aria-hidden="true"
            initial={{ scaleY: 1 }}
            animate={
              phase === "exiting"
                ? { scaleY: 0, opacity: 0 }
                : { scaleY: 1, opacity: 1 }
            }
            style={{ transformOrigin: "top center" }}
            transition={{ duration: exitDuration * 0.8, ease: exitEase }}
          />

          <div className="theatre-intro__title-stage absolute inset-0 z-20 flex items-center justify-center overflow-visible px-6">
            <m.div
              className={[
                "theatre-intro__title-scaler origin-center will-change-transform",
                phase === "exiting" ? "theatre-intro__title--cutout" : "",
              ].join(" ")}
              initial={{ scale: 1 }}
              animate={{
                scale:
                  phase === "exiting"
                    ? isReturning
                      ? TITLE_EXIT_SCALE_RETURN
                      : TITLE_EXIT_SCALE
                    : 1,
              }}
              transition={
                phase === "exiting"
                  ? { duration: exitDuration, ease: exitEase }
                  : { duration: 0 }
              }
            >
              <h1 className="sr-only">DHRUVA</h1>
              <svg
                className="theatre-intro__title-svg"
                viewBox="0 0 900 220"
                role="presentation"
                aria-hidden="true"
              >
                <text
                  x="450"
                  y="168"
                  textAnchor="middle"
                  fill="currentColor"
                  className="theatre-intro__title-text"
                >
                  DHRUVA
                </text>
              </svg>
            </m.div>
          </div>

          <m.p
            className="theatre-intro__prompt absolute left-1/2 z-20 -translate-x-1/2 font-body-md text-body-md whitespace-nowrap"
            initial={{ opacity: 1 }}
            animate={phase === "exiting" ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.22 }}
          >
            {mounted && isReturning
              ? "Welcome back · Move or click to enter"
              : "Move or click to enter"}
          </m.p>

          <m.div
            className="letterbox letterbox-bottom theatre-intro__bar"
            aria-hidden="true"
            initial={{ scaleY: 1 }}
            animate={
              phase === "exiting"
                ? { scaleY: 0, opacity: 0 }
                : { scaleY: 1, opacity: 1 }
            }
            style={{ transformOrigin: "bottom center" }}
            transition={{ duration: exitDuration * 0.8, ease: exitEase }}
          />
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
