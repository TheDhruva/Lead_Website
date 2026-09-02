"use client";

import { useEffect, useRef } from "react";

import { AnimatePresence, m } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EASING_OUT, FACE_CYCLE_INTERVAL_MS, MOTION } from "@/constants";
import { heroPortraits } from "@/data";
import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { useCinematicSection } from "@/hooks/use-cinematic-section";
import { useFaceCycle } from "@/hooks/use-face-cycle";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { lerp, pointerEngine } from "@/lib/pointer-engine";
import { isScrollActive } from "@/lib/scroll-bus";
import { cn } from "@/lib/utils";
import type { HeroPortrait } from "@/types";

const CUTOUT_COUNT = heroPortraits.length;
/** Right side stays two expressions ahead so both flanks stay different */
const RIGHT_OFFSET = 2;
/** Primary mobile anchor — person-1 cutout behind headline */
const MOBILE_PORTRAIT_INDEX = 0;

const MOBILE_LINE_EASE = [0.16, 1, 0.3, 1] as const;

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

        current.x = lerp(current.x, targetX, 0.08);
        current.y = lerp(current.y, targetY, 0.08);
        current.rx = lerp(current.rx, targetRx, 0.08);
        current.ry = lerp(current.ry, targetRy, 0.08);

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
    <div
      ref={frameRef}
      className={cn(
        "pointer-events-none absolute top-1/2 hidden h-[18rem] w-48 -translate-y-1/2 lg:block xl:h-[22rem] xl:w-60 cinematic-layer cinematic-layer--visual",
        side === "left" ? "left-0 xl:-left-2" : "right-0 xl:-right-2",
      )}
      aria-hidden="true"
      style={{
        isolation: "isolate",
        mixBlendMode: "normal",
        perspective: "900px",
      }}
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
                : { opacity: 0, scale: 0.9, rotate: tilt * 1.4, y: 16 }
            }
            animate={{ opacity: 1, scale: 1, rotate: tilt, y: 0 }}
            exit={
              prefersReducedMotion
                ? undefined
                : { opacity: 0, scale: 0.9, rotate: tilt * 1.4, y: -12 }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.01 }
                : { duration: 0.55, ease: EASING_OUT }
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.src}
              alt=""
              draggable={false}
              loading={side === "left" && activeIndex === 0 ? "eager" : "lazy"}
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
  );
}

function HeroMobile() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollTo } = useSmoothScroll();
  const portrait = heroPortraits[MOBILE_PORTRAIT_INDEX]!;

  const lineMotion = (delay: number) =>
    prefersReducedMotion
      ? { initial: false as const, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.68, ease: MOBILE_LINE_EASE },
        };

  return (
    <div className="hero-mobile relative z-10 flex w-full flex-col lg:hidden">
      <div
        className="hero-mobile__stage relative flex w-full flex-col items-center"
        data-scroll-anchor
      >
        <div className="hero-mobile__visual cinematic-layer cinematic-layer--visual relative w-full max-w-full">
          <m.div
            className="hero-mobile__portrait-bg pointer-events-none"
            aria-hidden="true"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              prefersReducedMotion
                ? { duration: 0.01 }
                : { duration: 0.9, ease: MOBILE_LINE_EASE }
            }
          >
            <div className="hero-mobile__portrait-levitate">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portrait.src}
                alt=""
                draggable={false}
                decoding="async"
                loading="eager"
                fetchPriority="high"
                className="hero-cutout hero-mobile__portrait-img"
              />
            </div>
          </m.div>

          <h1
            id="hero-heading-mobile"
            className="hero-mobile__headline cinematic-layer cinematic-layer--headline font-headline-xl font-extrabold text-foreground"
          >
            <m.span
              className="hero-mobile__headline-line1 block"
              {...lineMotion(0.12)}
            >
              <span className="hero-mobile__make">Make</span> Audience
            </m.span>
            <m.span className="block" {...lineMotion(0.24)}>
              Feel Your
            </m.span>
            <m.span
              className="block text-foreground-secondary"
              {...lineMotion(0.36)}
            >
              Presence
            </m.span>
          </h1>
        </div>

        <m.p
          className="hero-mobile__copy cinematic-layer cinematic-layer--copy relative z-20 mx-auto max-w-[21rem] px-1 pt-3 text-center font-body-lg text-foreground-secondary"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : { delay: 0.46, duration: 0.58, ease: MOBILE_LINE_EASE }
          }
        >
          Beautiful websites, powerful visuals, and videos that make your brand
          impossible to ignore. A cinematic approach to digital presence.
        </m.p>

        <m.div
          className="hero-mobile__cta cinematic-layer cinematic-layer--cta relative z-20 flex w-full flex-col items-center gap-2.5 px-1 pt-4 pb-[max(0.35rem,env(safe-area-inset-bottom))]"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : { delay: 0.56, duration: 0.55, ease: MOBILE_LINE_EASE }
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
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const canReact = useCanPointerReact();
  useCinematicSection(sectionRef, "hero");
  const { index } = useFaceCycle(
    isDesktop ? CUTOUT_COUNT : 1,
    FACE_CYCLE_INTERVAL_MS,
  );
  const { scrollTo } = useSmoothScroll();
  const prefersReducedMotion = useReducedMotion();

  const leftIndex = index % CUTOUT_COUNT;
  const rightIndex = (index + RIGHT_OFFSET) % CUTOUT_COUNT;

  return (
    <section
      ref={sectionRef}
      id="work"
      data-snap-frame
      data-scroll-anchor-ratio="0.4"
      className="section-frame section-frame--hero section-tone-hero relative items-center"
      aria-labelledby="hero-heading"
    >
      <Container className="relative w-full min-w-0 max-w-none">
        <div className="hidden lg:contents">
          <PortraitStack
            portraits={heroPortraits}
            activeIndex={leftIndex}
            side="left"
            gazeEnabled={canReact && isDesktop}
          />

          <m.div
            data-scroll-anchor
            className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-2 text-center sm:px-0"
            initial={
              prefersReducedMotion ? false : { opacity: 0, y: 40, scale: 0.97 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: MOTION.reveal.duration,
              ease: MOTION.reveal.ease,
              delay: prefersReducedMotion ? 0 : 0.12,
            }}
          >
            <h1
              id="hero-heading"
              className="cinematic-layer cinematic-layer--headline mb-5 font-headline-xl text-headline-xl font-extrabold tracking-tighter text-foreground md:mb-6 md:text-[68px] md:leading-[1.08] lg:text-[72px]"
            >
              Make Audience <br />
              <span className="text-foreground-secondary">
                Feel Your Presence
              </span>
            </h1>
            <p className="cinematic-layer cinematic-layer--copy mx-auto mb-8 max-w-2xl font-body-lg text-body-lg text-foreground-secondary md:mb-9">
              Beautiful websites, powerful visuals, and videos that make your
              brand impossible to ignore. A cinematic approach to digital
              presence.
            </p>
            <div className="cinematic-layer cinematic-layer--cta flex flex-col items-center justify-center gap-4 sm:flex-row">
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
            </div>
          </m.div>

          <PortraitStack
            portraits={heroPortraits}
            activeIndex={rightIndex}
            side="right"
            gazeEnabled={canReact && isDesktop}
          />
        </div>

        <HeroMobile />
      </Container>
    </section>
  );
}
