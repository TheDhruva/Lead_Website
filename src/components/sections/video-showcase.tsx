"use client";

import { Reveal } from "@/components/animations/reveal";
import { Container } from "@/components/ui/container";
import { VideoCard } from "@/components/ui/video-card";
import { videoItems } from "@/data";
import { cn } from "@/lib/utils";

const featuredVideo = videoItems.find((item) => item.featured) ?? videoItems[0];
const supportingVideos = videoItems.filter((item) => !item.featured);

export function VideoShowcase() {
  return (
    <section
      id="video"
      data-snap-frame
      className="section-frame section-tone-videos overflow-visible"
      aria-labelledby="video-heading"
    >
      <Container className="relative z-0">
        <Reveal>
          <header className="mb-5 text-center md:mb-7 lg:mb-8">
            <h2
              id="video-heading"
              className="font-headline-lg text-headline-lg tracking-[-0.03em] text-foreground md:text-[34px] lg:text-[36px]"
            >
              Videos
            </h2>
          </header>
        </Reveal>

        <div
          className={cn(
            "relative z-0 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5",
            "max-md:mx-auto max-md:max-w-lg",
            "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:grid-rows-3",
            "lg:h-[min(36rem,calc(100svh-var(--nav-safe-top)-5rem))]",
          )}
        >
          {featuredVideo ? (
            <Reveal
              index={1}
              className="relative z-0 min-h-0 min-w-0 overflow-visible md:col-span-2 lg:col-span-1 lg:row-span-3 lg:h-full"
            >
              <VideoCard
                video={featuredVideo}
                featured
                priority
                className="lg:absolute lg:inset-0"
              />
            </Reveal>
          ) : null}

          {supportingVideos.map((video, index) => (
            <Reveal
              key={video.id}
              index={index + 2}
              className="relative z-0 min-h-0 min-w-0 overflow-visible lg:h-full"
            >
              <VideoCard video={video} className="lg:absolute lg:inset-0" />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
