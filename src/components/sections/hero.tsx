"use client";

import Image from "next/image";

import { m, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { MOTION } from "@/constants";
import { heroPortraitsLeft, heroPortraitsRight } from "@/data";
import { useFaceCycle } from "@/hooks/use-face-cycle";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { cn } from "@/lib/utils";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";
import type { HeroPortrait } from "@/types";

function PortraitStack({
  portraits,
  activeIndex,
  side,
}: {
  portraits: HeroPortrait[];
  activeIndex: number;
  side: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute top-1/2 hidden h-80 w-52 -translate-y-1/2 opacity-30 lg:block lg:h-96 lg:w-64 dark:opacity-70 dark:mix-blend-screen",
        side === "left" ? "left-0" : "right-0",
      )}
      aria-hidden="true"
    >
      {portraits.map((portrait, index) => (
        <Image
          key={portrait.id}
          src={portrait.src}
          alt=""
          fill
          sizes="(max-width: 1280px) 208px, 256px"
          priority={index === 0}
          className={cn(
            "rounded-2xl object-cover transition-opacity duration-1000 ease-in-out",
            activeIndex === index ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
    </div>
  );
}

export function Hero() {
  const { index } = useFaceCycle();
  const { scrollTo } = useSmoothScroll();
  const { hasEntered } = useTheatreIntro();
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="work"
      className="relative flex min-h-[min(100svh,880px)] items-center justify-center px-gutter pt-28 pb-16 md:pt-32 md:pb-20 lg:pb-24"
      aria-labelledby="hero-heading"
    >
      <Container className="relative w-full">
        <PortraitStack
          portraits={heroPortraitsLeft}
          activeIndex={index}
          side="left"
        />

        <m.div
          className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-2 text-center sm:px-0"
          initial={
            prefersReducedMotion ? false : { opacity: 0, y: 20, scale: 0.99 }
          }
          animate={
            hasEntered
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 20, scale: 0.99 }
          }
          transition={{
            duration: MOTION.pageEnter.duration,
            delay: prefersReducedMotion ? 0 : 0.2,
            ease: MOTION.pageEnter.ease,
          }}
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
          <Button size="lg" onClick={() => scrollTo("#contact")}>
            I&apos;m Ready To Grow
          </Button>
        </m.div>

        <PortraitStack
          portraits={heroPortraitsRight}
          activeIndex={index}
          side="right"
        />
      </Container>
    </section>
  );
}
