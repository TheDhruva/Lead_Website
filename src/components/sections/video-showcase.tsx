"use client";

import { m, useReducedMotion } from "framer-motion";

import { Container } from "@/components/ui/container";
import { SectionTitle } from "@/components/ui/section-title";
import { VideoCard } from "@/components/ui/video-card";
import { EASING_CINEMATIC } from "@/constants";
import { videoItems } from "@/data";

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
        <m.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: EASING_CINEMATIC }}
        >
          <SectionTitle as="h2" id="video-heading" className="mb-10 md:mb-12">
            Video Showcase
          </SectionTitle>
        </m.div>

        <div
          className={[
            "grid grid-cols-1 gap-6 md:gap-7",
            // Desktop editorial: ~40% featured | ~60% stacked landscapes
            "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-rows-2",
            "lg:h-[min(620px,calc(100svh-13.5rem))] lg:gap-8",
          ].join(" ")}
        >
          {featuredVideo ? (
            <m.div
              className="flex min-h-0 min-w-0 justify-center lg:row-span-2 lg:justify-start"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.6,
                delay: prefersReducedMotion ? 0 : 0.05,
                ease: EASING_CINEMATIC,
              }}
            >
              <VideoCard video={featuredVideo} featured priority />
            </m.div>
          ) : null}

          {supportingVideos.map((video, index) => (
            <m.div
              key={video.id}
              className="min-h-0 min-w-0"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.6,
                delay: prefersReducedMotion ? 0 : 0.14 + index * 0.1,
                ease: EASING_CINEMATIC,
              }}
            >
              <VideoCard video={video} />
            </m.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
