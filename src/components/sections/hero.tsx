"use client";

import { useEffect, useRef } from "react";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EASING_OUT, FACE_CYCLE_INTERVAL_MS } from "@/constants";
import { heroPortraits } from "@/data";
import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { useFaceCycle } from "@/hooks/use-face-cycle";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSmoothPointer } from "@/hooks/use-smooth-pointer";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { cn } from "@/lib/utils";
import type { HeroPortrait } from "@/types";

const CUTOUT_COUNT = heroPortraits.length;
/** Right side stays two expressions ahead so both flanks stay different */
const RIGHT_OFFSET = 2;

function PortraitStack({
  portraits,
  activeIndex,
  side,
  pointerRef,
  gazeEnabled,
}: {
  portraits: HeroPortrait[];
  activeIndex: number;
  side: "left" | "right";
  pointerRef: ReturnType<typeof useSmoothPointer>;
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

    let raf = 0;
    let running = true;
    const current = { x: 0, y: 0, rx: 0, ry: 0 };

    const tick = () => {
      if (!running) return;
      const frame = frameRef.current;
      const gaze = gazeRef.current;
      const pointer = pointerRef.current;

      if (frame && gaze && pointer.active) {
        const rect = frame.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (pointer.x - cx) / Math.max(rect.width, 1);
        const dy = (pointer.y - cy) / Math.max(rect.height, 1);
        const targetX = Math.max(-1, Math.min(1, dx)) * 14;
        const targetY = Math.max(-1, Math.min(1, dy)) * 10;
        const targetRy = Math.max(-1, Math.min(1, dx)) * 5.5;
        const targetRx = Math.max(-1, Math.min(1, -dy)) * 4;

        current.x += (targetX - current.x) * 0.1;
        current.y += (targetY - current.y) * 0.1;
        current.rx += (targetRx - current.rx) * 0.1;
        current.ry += (targetRy - current.ry) * 0.1;

        gaze.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0) rotateX(${current.rx.toFixed(2)}deg) rotateY(${current.ry.toFixed(2)}deg)`;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      if (gazeRef.current) gazeRef.current.style.transform = "";
    };
  }, [gazeEnabled, pointerRef]);

  if (!active) return null;

  return (
    <div
      ref={frameRef}
      className={cn(
        "pointer-events-none absolute top-1/2 hidden h-[22rem] w-56 -translate-y-1/2 lg:block xl:h-[26rem] xl:w-72",
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
  const pointerRef = useSmoothPointer(canReact && isDesktop, { ease: 0.11 });
  const { index } = useFaceCycle(
    isDesktop ? CUTOUT_COUNT : 1,
    FACE_CYCLE_INTERVAL_MS,
  );
  const { scrollTo } = useSmoothScroll();

  const leftIndex = index % CUTOUT_COUNT;
  const rightIndex = (index + RIGHT_OFFSET) % CUTOUT_COUNT;

  return (
    <section
      id="work"
      className="relative flex items-center justify-center px-gutter pt-28 pb-12 md:pt-32 md:pb-16 lg:min-h-[min(100svh,880px)] lg:pb-24"
      aria-labelledby="hero-heading"
    >
      <Container className="relative w-full">
        <PortraitStack
          portraits={heroPortraits}
          activeIndex={leftIndex}
          side="left"
          pointerRef={pointerRef}
          gazeEnabled={canReact && isDesktop}
        />

        <m.div
          className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-2 text-center sm:px-0"
          initial={false}
        >
          <h1
            id="hero-heading"
            className="mb-8 font-headline-xl text-headline-xl font-extrabold tracking-tighter text-foreground md:text-[80px] md:leading-[1.1]"
          >
            Make Audience <br />
            <span className="text-foreground-secondary">
              Feel Your Presence
            </span>
          </h1>
          <p className="mx-auto mb-12 max-w-2xl font-body-lg text-body-lg text-foreground-secondary">
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
          pointerRef={pointerRef}
          gazeEnabled={canReact && isDesktop}
        />
      </Container>
    </section>
  );
}
