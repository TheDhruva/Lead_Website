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
      className="bg-surface-container-lowest px-gutter py-16 md:py-20 lg:py-24"
      aria-labelledby="video-heading"
    >
      <Container>
        <Reveal>
          <header className="mb-10 text-center md:mb-12">
            <h2
              id="video-heading"
              className="font-headline-lg text-headline-lg tracking-[-0.03em] text-foreground"
            >
              <span className="mb-2 block font-label-md text-label-md font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Video
              </span>
              <span className="block">Selected Work</span>
            </h2>
          </header>
        </Reveal>

        <div
          className={cn(
            "grid grid-cols-1 gap-5 md:gap-6",
            "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:grid-rows-3",
            "lg:h-[min(48rem,calc(100svh-10rem))] lg:gap-6",
          )}
        >
          {featuredVideo ? (
            <Reveal
              index={1}
              className="relative min-h-0 min-w-0 lg:row-span-3 lg:h-full"
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
              className="relative min-h-0 min-w-0 lg:h-full"
            >
              <VideoCard video={video} className="lg:absolute lg:inset-0" />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
