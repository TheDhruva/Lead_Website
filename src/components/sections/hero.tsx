"use client";

import { useEffect, useRef } from "react";

import { AnimatePresence, m } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EASING_OUT, FACE_CYCLE_INTERVAL_MS, MOTION } from "@/constants";
import { heroPortraits } from "@/data";
import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { useFaceCycle } from "@/hooks/use-face-cycle";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { lerp, pointerEngine } from "@/lib/pointer-engine";
import { cn } from "@/lib/utils";
import type { HeroPortrait } from "@/types";

const CUTOUT_COUNT = heroPortraits.length;
/** Right side stays two expressions ahead so both flanks stay different */
const RIGHT_OFFSET = 2;

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

    return pointerEngine.subscribe((frame) => {
      const frameEl = frameRef.current;
      const gaze = gazeRef.current;

      if (frameEl && gaze && frame.active) {
        const rect = frameEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (frame.currentX - cx) / Math.max(rect.width, 1);
        const dy = (frame.currentY - cy) / Math.max(rect.height, 1);
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
  }, [gazeEnabled]);

  if (!active) return null;

  return (
    <div
      ref={frameRef}
      className={cn(
        "pointer-events-none absolute top-1/2 hidden h-[18rem] w-48 -translate-y-1/2 lg:block xl:h-[22rem] xl:w-60",
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
        className="hero-cutout-gaze absolute inset-0 will-change-transform"
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
            {/* Native img — skip next/image optimizer & CSS filters that wash cutouts on light bg */}
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

export function Hero() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const canReact = useCanPointerReact();
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
      id="work"
      data-snap-frame
      className="section-frame section-frame--hero section-tone-hero relative items-center"
      aria-labelledby="hero-heading"
    >
      <Container className="relative w-full">
        <PortraitStack
          portraits={heroPortraits}
          activeIndex={leftIndex}
          side="left"
          gazeEnabled={canReact && isDesktop}
        />

        <m.div
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
            className="mb-5 font-headline-xl text-headline-xl font-extrabold tracking-tighter text-foreground md:mb-6 md:text-[68px] md:leading-[1.08] lg:text-[72px]"
          >
            Make Audience <br />
            <span className="text-foreground-secondary">
              Feel Your Presence
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl font-body-lg text-body-lg text-foreground-secondary md:mb-9">
            Beautiful websites, powerful visuals, and videos that make your
            brand impossible to ignore. A cinematic approach to digital
            presence.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" onClick={() => scrollTo("#contact")}>
              I&apos;m Ready To Grow
            </Button>
            <Button
              size="lg"
              variant="ghost"
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
      </Container>
    </section>
  );
}
