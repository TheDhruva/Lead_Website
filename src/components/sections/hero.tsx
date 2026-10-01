"use client";

import { memo, useEffect, useRef, useState } from "react";

import { AnimatePresence, m } from "framer-motion";

import { AnimatedText } from "@/components/motion/animated-text";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EASING_OUT, FACE_CYCLE_INTERVAL_MS, MOTION } from "@/constants";
import { heroPortraits } from "@/data";
import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { useCinematicSection } from "@/hooks/use-cinematic-section";
import { type EnterExitState, useEnterExit } from "@/hooks/use-enter-exit";
import { useFaceCycle } from "@/hooks/use-face-cycle";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { frameAlpha, pointerEngine } from "@/lib/pointer-engine";
import { isScrollActive } from "@/lib/scroll-bus";
import { cn } from "@/lib/utils";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";
import type { HeroPortrait } from "@/types";

const CUTOUT_COUNT = heroPortraits.length;
/** Right side stays two expressions ahead so both flanks stay different */
const RIGHT_OFFSET = 2;
/** Primary mobile anchor — person-1 cutout behind headline */
const MOBILE_PORTRAIT_INDEX = 0;

const MOBILE_LINE_EASE = [0.16, 1, 0.3, 1] as const;

/** Portrait stack scroll-away: opacity only. The scroll-linked
 * cinematic drift owns all translation on this element (framer inline
 * transforms would override that drift permanently), so the drift moves
 * the portrait while this fade exits it. */
const STACK_SHOWN = { opacity: 1 };
const STACK_EXITED = { opacity: 0 };

/** CTA disengage on scroll-away: lifts slightly and settles out. */
const CTA_SHOWN = { opacity: 1, y: 0, scale: 1 };
const CTA_EXIT = { opacity: 0, y: -8, scale: 0.99 };

/**
 * Static desktop composition — presence word, headline, copy, CTAs.
 * Memoized on primitive/stable props so the 2.4s face-cycle tick (which
 * lives in `Hero` and only changes portrait indices) never re-renders
 * typography, buttons, or Motion entrance props. CTA scroll-away still
 * responds via `ctaState`; intro handoff via `started`.
 */
const HeroDesktopStatic = memo(function HeroDesktopStatic({
  started,
  ctaState,
  prefersReducedMotion,
  scrollTo,
  ctaRef,
}: {
  started: boolean;
  ctaState: EnterExitState;
  prefersReducedMotion: boolean;
  scrollTo: (hrefOrId: string) => void;
  ctaRef: (element: HTMLDivElement | null) => void;
}) {
  return (
    <>
      {/* PRESENCE — complete-word background layer seated between
          headline and copy with slight overlap on both.
          Behind portraits, headline and copy. */}
      <span
        aria-hidden="true"
        key={started ? "presence-live" : "presence-boot"}
        className="hero-presence pointer-events-none absolute inset-x-0 top-[54%] flex -translate-y-1/2 justify-center overflow-visible select-none"
      >
        <span className="cinematic-layer cinematic-layer--atmosphere font-display leading-none whitespace-nowrap italic text-[clamp(8rem,16vw,18rem)]">
          Presence
        </span>
      </span>

      <m.div
        className="relative z-10 mx-auto flex w-full max-w-none flex-col items-center px-4 text-center sm:px-6 md:px-10"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={started ? { opacity: 1 } : {}}
        transition={{
          duration: 0.5,
          ease: MOTION.reveal.ease,
          delay: prefersReducedMotion ? 0 : 0.05,
        }}
      >
        <p
          id="hero-heading-visual"
          className="cinematic-layer cinematic-layer--headline mb-6 font-condensed text-[clamp(3rem,9vw,9.5rem)] leading-[0.88] font-normal tracking-[-0.01em] text-foreground md:mb-8"
        >
          <AnimatedText
            mode="mount"
            start={started}
            delay={0.12}
            segments="Make Audience"
            className="block uppercase"
          />
          <AnimatedText
            mode="mount"
            start={started}
            delay={0.3}
            segments="Feel Your"
            className="block uppercase"
          />
        </p>
        <p className="cinematic-layer cinematic-layer--copy mx-auto mb-8 max-w-xl text-center font-body-lg text-body-lg text-foreground-secondary md:mb-9">
          <AnimatedText
            mode="mount"
            start={started}
            level="word"
            delay={0.58}
            segments="Beautiful websites, powerful visuals, and videos that make your brand impossible to ignore. A cinematic approach to digital presence."
          />
        </p>
        <div className="cinematic-layer cinematic-layer--cta flex flex-col items-center justify-center gap-4 sm:flex-row">
          <m.div
            ref={ctaRef}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={
              prefersReducedMotion ? false : { opacity: 0, y: 8, scale: 0.98 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1, y: 0, scale: 1 }
                : !started
                  ? {}
                  : ctaState === "exit"
                    ? CTA_EXIT
                    : CTA_SHOWN
            }
            transition={
              ctaState === "exit" && !prefersReducedMotion
                ? { duration: 0.35, ease: EASING_OUT }
                : {
                    duration: 0.5,
                    ease: EASING_OUT,
                    delay: prefersReducedMotion ? 0 : 0.76,
                  }
            }
          >
            <Button size="lg" sfx onClick={() => scrollTo("#contact")}>
              I&apos;m Ready To Grow
            </Button>
            <Button
              size="lg"
              variant="ghost"
              sfx
              onClick={() => scrollTo("#projects")}
            >
              View Work
            </Button>
          </m.div>
        </div>
      </m.div>
    </>
  );
});

function PortraitStack({
  portraits,
  activeIndex,
  side,
  gazeEnabled,
}: {
  portraits: HeroPortrait[];
  activeIndex: number;
  side: "left" | "right";
  gazeEnabled: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const { ref: stackRef, state: stackState } =
    useEnterExit<HTMLDivElement>(0.25);
  const tilt = side === "left" ? -7 : 7;
  const active = portraits[activeIndex] ?? portraits[0]!;
  const frameRef = useRef<HTMLDivElement>(null);
  const gazeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gazeEnabled) {
      if (gazeRef.current) gazeRef.current.style.transform = "";
      return;
    }

    const current = { x: 0, y: 0, rx: 0, ry: 0 };
    const frameCenterRef = { cx: 0, cy: 0, invW: 1, invH: 1 };

    const measureFrame = () => {
      const frameEl = frameRef.current;
      if (!frameEl) return;
      const rect = frameEl.getBoundingClientRect();
      frameCenterRef.cx = rect.left + rect.width / 2;
      frameCenterRef.cy = rect.top + rect.height / 2;
      frameCenterRef.invW = 1 / Math.max(rect.width, 1);
      frameCenterRef.invH = 1 / Math.max(rect.height, 1);
    };

    measureFrame();

    const frameEl = frameRef.current;
    const resizeObserver =
      frameEl && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measureFrame)
        : null;
    resizeObserver?.observe(frameEl!);
    window.addEventListener("resize", measureFrame);
    window.addEventListener("orientationchange", measureFrame);

    const unsubscribe = pointerEngine.subscribe((frame) => {
      if (isScrollActive()) {
        if (gazeRef.current) gazeRef.current.style.transform = "";
        return;
      }

      const gaze = gazeRef.current;

      if (gaze && frame.active) {
        const dx = (frame.currentX - frameCenterRef.cx) * frameCenterRef.invW;
        const dy = (frame.currentY - frameCenterRef.cy) * frameCenterRef.invH;
        const targetX = Math.max(-1, Math.min(1, dx)) * 10;
        const targetY = Math.max(-1, Math.min(1, dy)) * 7;
        const targetRy = Math.max(-1, Math.min(1, dx)) * 4;
        const targetRx = Math.max(-1, Math.min(1, -dy)) * 3;

        const alpha = frameAlpha(frame.dt, 0.08);
        current.x += (targetX - current.x) * alpha;
        current.y += (targetY - current.y) * alpha;
        current.rx += (targetRx - current.rx) * alpha;
        current.ry += (targetRy - current.ry) * alpha;

        gaze.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0) rotateX(${current.rx.toFixed(2)}deg) rotateY(${current.ry.toFixed(2)}deg)`;
      }
    });

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureFrame);
      window.removeEventListener("orientationchange", measureFrame);
      unsubscribe();
    };
  }, [gazeEnabled]);

  if (!active) return null;

  return (
    <m.div
      ref={(el) => {
        frameRef.current = el;
        stackRef(el);
      }}
      className={cn(
        "pointer-events-none absolute top-[44%] hidden h-[34rem] w-80 -translate-y-1/2 lg:block xl:h-[42rem] xl:w-96",
        side === "left" ? "left-0" : "right-0",
      )}
      aria-hidden="true"
      initial={false}
      animate={
        prefersReducedMotion
          ? undefined
          : stackState === "exit"
            ? "exited"
            : "shown"
      }
      variants={{
        shown: {
          ...STACK_SHOWN,
          transition: { duration: 0.3, ease: EASING_OUT },
        },
        // Opacity only: this node owns Motion opacity and nothing else.
        // Scroll-linked cinematic drift (transform + opacity) lives on
        // the wrapper below, so inline Motion styles can never override
        // the drift. Drift moves it, fade exits it — one owner each.
        exited: {
          ...STACK_EXITED,
          transition: { duration: 0.4, ease: EASING_OUT },
        },
      }}
      style={{
        isolation: "isolate",
        mixBlendMode: "normal",
        perspective: "900px",
      }}
    >
      <div
        className="cinematic-layer cinematic-layer--visual absolute inset-0"
        aria-hidden="true"
      >
        <div
          ref={gazeRef}
          className="hero-cutout-gaze absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          <AnimatePresence mode="sync" initial={false}>
            <m.div
              key={active.id}
              className="absolute inset-0"
              style={{ mixBlendMode: "normal" }}
              initial={
                prefersReducedMotion
                  ? false
                  : { opacity: 0.25, scale: 0.98, rotate: tilt * 1.1, y: 14 }
              }
              animate={{ opacity: 1, scale: 1, rotate: tilt, y: 0 }}
              exit={
                prefersReducedMotion
                  ? undefined
                  : { opacity: 0, scale: 0.98, rotate: tilt, y: -10 }
              }
              transition={
                prefersReducedMotion
                  ? { duration: 0.01 }
                  : { duration: 0.6, ease: EASING_OUT }
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.src}
                alt=""
                draggable={false}
                loading={
                  side === "left" && activeIndex === 0 ? "eager" : "lazy"
                }
                fetchPriority={
                  side === "left" && activeIndex === 0 ? "high" : "low"
                }
                decoding="async"
                className="hero-cutout absolute inset-0 h-full w-full object-contain"
              />
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </m.div>
  );
}

function HeroMobile() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollTo } = useSmoothScroll();
  const { departing, hasEntered } = useTheatreIntro();
  const started = departing || hasEntered;
  const { ref: ctaRef, state: ctaState } = useEnterExit<HTMLDivElement>(0.4);
  const { ref: portraitRef, state: portraitState } =
    useEnterExit<HTMLDivElement>(0.3);
  const portrait = heroPortraits[MOBILE_PORTRAIT_INDEX]!;

  return (
    <div className="hero-mobile relative z-10 flex w-full flex-col lg:hidden">
      <div className="hero-mobile__stage relative flex w-full flex-col items-center">
        <div className="hero-mobile__visual cinematic-layer cinematic-layer--visual relative w-full max-w-full">
          {/* Large portrait leads the composition; the headline overlaps
              its lower portion (controlled, readable over the face). */}
          <div className="hero-mobile__portrait-top">
            <m.div
              ref={portraitRef}
              className="h-full"
              aria-hidden="true"
              initial={
                prefersReducedMotion
                  ? false
                  : { opacity: 0, scale: 1.02, y: 14 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1, scale: 1, y: 0 }
                  : !started
                    ? {}
                    : portraitState === "exit"
                      ? { opacity: 0, y: -10, scale: 0.99 }
                      : { opacity: 1, scale: 1, y: 0 }
              }
              transition={
                portraitState === "exit" && !prefersReducedMotion
                  ? { duration: 0.35, ease: MOBILE_LINE_EASE }
                  : prefersReducedMotion
                    ? { duration: 0.01 }
                    : { duration: 0.9, ease: MOBILE_LINE_EASE }
              }
            >
              <div className="hero-mobile__portrait-levitate h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={portrait.src}
                  alt=""
                  draggable={false}
                  decoding="async"
                  loading="eager"
                  fetchPriority="high"
                  className="hero-cutout hero-mobile__portrait-top-img translate-y-[15px]"
                />
              </div>
            </m.div>
          </div>

          <p className="hero-mobile__headline cinematic-layer cinematic-layer--headline font-condensed font-normal text-foreground">
            <AnimatedText
              mode="mount"
              start={started}
              gentle
              delay={0.12}
              segments={[
                { text: "Make", className: "hero-mobile__make" },
                { text: "Audience" },
              ]}
              className="hero-mobile__headline-line1 block uppercase"
            />
            <AnimatedText
              mode="mount"
              start={started}
              gentle
              delay={0.28}
              segments="Feel Your"
              className="block uppercase"
            />
          </p>
        </div>

        {/* PRESENCE — zero-height in-flow anchor between headline and
            copy. The word centers itself exactly on this line, so it
            always follows the headline: no coordinates, no clipping,
            complete word behind everything. */}
        <span
          aria-hidden="true"
          key={started ? "presence-live" : "presence-boot"}
          className="hero-presence hero-mobile__presence-anchor select-none"
        >
          <span className="hero-mobile__presence-word font-display italic">
            Presence
          </span>
        </span>

        <p className="hero-mobile__copy cinematic-layer cinematic-layer--copy relative z-20 mx-auto max-w-[20rem] px-1 pt-6 text-center font-body-lg text-foreground-secondary">
          <AnimatedText
            mode="mount"
            start={started}
            gentle
            level="word"
            delay={0.5}
            segments="Beautiful websites, powerful visuals, and videos that make your brand impossible to ignore. A cinematic approach to digital presence."
          />
        </p>

        <div className="hero-mobile__cta cinematic-layer cinematic-layer--cta relative z-20 flex w-full flex-col items-center gap-2.5 px-1 pt-4 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
          <m.div
            ref={ctaRef}
            className="flex w-full flex-col items-center gap-2.5"
            initial={
              prefersReducedMotion ? false : { opacity: 0, y: 8, scale: 0.98 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1, y: 0, scale: 1 }
                : !started
                  ? {}
                  : ctaState === "exit"
                    ? CTA_EXIT
                    : CTA_SHOWN
            }
            transition={
              ctaState === "exit" && !prefersReducedMotion
                ? { duration: 0.35, ease: MOBILE_LINE_EASE }
                : prefersReducedMotion
                  ? { duration: 0.01 }
                  : { delay: 0.62, duration: 0.5, ease: MOBILE_LINE_EASE }
            }
          >
            <Button
              size="lg"
              sfx
              fullWidth
              className="hero-mobile__cta-primary"
              onClick={() => scrollTo("#contact")}
            >
              I&apos;m Ready To Grow
            </Button>
            <Button
              size="lg"
              variant="ghost"
              sfx
              className="hero-mobile__cta-secondary"
              onClick={() => scrollTo("#projects")}
            >
              View Work
            </Button>
          </m.div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const canReact = useCanPointerReact();
  useCinematicSection(sectionRef, "hero");
  const [heroInView, setHeroInView] = useState(true);
  // Pause the portrait cycle when the hero is fully off-screen — no
  // interval renders or Framer crossfades for an invisible section.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroInView(entry?.isIntersecting ?? true),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const { index } = useFaceCycle(
    isDesktop ? CUTOUT_COUNT : 1,
    FACE_CYCLE_INTERVAL_MS,
    !heroInView,
  );
  const { scrollTo } = useSmoothScroll();
  const prefersReducedMotion = useReducedMotion();
  const { departing, hasEntered } = useTheatreIntro();
  // Hero assembly is gated on the intro handoff: nothing assembles
  // behind the curtain — it emerges as DHRUVA transitions away.
  const started = departing || hasEntered;
  const { ref: ctaRef, state: ctaState } = useEnterExit<HTMLDivElement>(0.4);

  const leftIndex = index % CUTOUT_COUNT;
  const rightIndex = (index + RIGHT_OFFSET) % CUTOUT_COUNT;

  return (
    <section
      ref={sectionRef}
      id="work"
      data-snap-frame
      className="section-frame section-frame--hero section-tone-hero relative items-center"
      aria-labelledby="hero-heading"
    >
      <h1 id="hero-heading" className="sr-only">
        Make Audience Feel Your Presence
      </h1>
      <Container className="relative w-full min-w-0 max-w-none">
        {/* Desktop tree only mounts on ≥1024px viewports — the portrait
            stacks (AnimatePresence + eager images + gaze) never mount on
            mobile, and HeroMobile never mounts on desktop. Breakpoint matches
            lg: so no visual gap; theatre gates first paint regardless. */}
        {isDesktop ? (
          <div className="hidden lg:contents">
            {started ? (
              <PortraitStack
                portraits={heroPortraits}
                activeIndex={leftIndex}
                side="left"
                gazeEnabled={canReact && isDesktop}
              />
            ) : null}

            {/* Static typography/CTAs — memoized, untouched by face ticks */}
            <HeroDesktopStatic
              started={started}
              ctaState={ctaState}
              prefersReducedMotion={prefersReducedMotion}
              scrollTo={scrollTo}
              ctaRef={ctaRef}
            />

            {started ? (
              <PortraitStack
                portraits={heroPortraits}
                activeIndex={rightIndex}
                side="right"
                gazeEnabled={canReact && isDesktop}
              />
            ) : null}
          </div>
        ) : (
          <HeroMobile />
        )}
      </Container>
    </section>
  );
}
