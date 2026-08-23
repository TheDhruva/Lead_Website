"use client";

import { m, useReducedMotion } from "framer-motion";

import { Container } from "@/components/ui/container";
import { VideoCard } from "@/components/ui/video-card";
import { EASING_CINEMATIC } from "@/constants";
import { videoItems } from "@/data";
import { cn } from "@/lib/utils";

const featuredVideo = videoItems.find((item) => item.featured) ?? videoItems[0];
const supportingVideos = videoItems.filter((item) => !item.featured);

export function VideoShowcase() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="video"
      className="bg-surface-container-lowest px-gutter py-16 md:py-20 lg:py-24"
      aria-labelledby="video-heading"
    >
      <Container>
        <m.header
          className="mb-10 text-center md:mb-12"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: EASING_CINEMATIC }}
        >
          <h2
            id="video-heading"
            className="font-headline-lg text-headline-lg text-foreground"
          >
            <span className="mb-2 block font-label-md text-label-md font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Video
            </span>
            <span className="block">Selected Work</span>
          </h2>
        </m.header>

        <div
          className={cn(
            "grid grid-cols-1 gap-5 md:gap-6",
            "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:grid-rows-3",
            "lg:h-[min(48rem,calc(100svh-10rem))] lg:gap-6",
          )}
        >
          {featuredVideo ? (
            <m.div
              className="relative min-h-0 min-w-0 lg:row-span-3 lg:h-full"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.6,
                delay: prefersReducedMotion ? 0 : 0.05,
                ease: EASING_CINEMATIC,
              }}
            >
              <VideoCard
                video={featuredVideo}
                featured
                priority
                className="lg:absolute lg:inset-0"
              />
            </m.div>
          ) : null}

          {supportingVideos.map((video, index) => (
            <m.div
              key={video.id}
              className="relative min-h-0 min-w-0 lg:h-full"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.6,
                delay: prefersReducedMotion ? 0 : 0.14 + index * 0.1,
                ease: EASING_CINEMATIC,
              }}
            >
              <VideoCard video={video} className="lg:absolute lg:inset-0" />
            </m.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
