"use client";

import { useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/animations/reveal";
import { Container } from "@/components/ui/container";
import { VideoCard } from "@/components/ui/video-card";
import { VideoPrefetch } from "@/components/video-prefetch";
import { videoItems } from "@/data";
import { useCinematicSection } from "@/hooks/use-cinematic-section";
import { getScrollContainer } from "@/lib/scroll-container";
import { cn } from "@/lib/utils";

const featuredVideo = videoItems.find((item) => item.featured) ?? videoItems[0];
const supportingVideos = videoItems.filter((item) => !item.featured);

export function VideoShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  useCinematicSection(sectionRef, "videos");
  const [isSectionActive, setIsSectionActive] = useState(false);
  const [primaryVideoId, setPrimaryVideoId] = useState(
    featuredVideo?.id ?? videoItems[0]?.id ?? "",
  );

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    const scrollRoot = getScrollContainer();
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setIsSectionActive(entry.isIntersecting);
      },
      {
        threshold: [0, 0.15, 0.35],
        rootMargin: "-6% 0px -6% 0px",
        root: scrollRoot ?? null,
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !isSectionActive) return;

    const scrollRoot = getScrollContainer();
    const cards = grid.querySelectorAll<HTMLElement>("[data-video-card-id]");

    const observer = new IntersectionObserver(
      (entries) => {
        let bestId = "";
        let bestRatio = 0;

        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).dataset.videoCardId;
          if (!id) return;
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestId = id;
          }
        });

        if (bestRatio > 0 && bestId) {
          setPrimaryVideoId((current) =>
            current === bestId ? current : bestId,
          );
        }
      },
      {
        threshold: [0, 0.2, 0.4, 0.6, 0.8],
        root: scrollRoot ?? null,
      },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [isSectionActive]);

  return (
    <section
      ref={sectionRef}
      id="video"
      data-snap-frame
      data-scroll-anchor-ratio="0.47"
      className="section-frame section-tone-videos max-md:overflow-visible overflow-hidden"
      aria-labelledby="video-heading"
    >
      <VideoPrefetch />
      <Container className="relative z-0 w-full max-w-none">
        <Reveal>
          <header className="cinematic-layer cinematic-layer--header mb-4 text-center md:mb-7 lg:mb-8">
            <h2
              id="video-heading"
              className="font-headline-lg text-headline-lg tracking-[-0.03em] text-foreground md:text-[34px] lg:text-[36px]"
            >
              Videos
            </h2>
          </header>
        </Reveal>

        <div
          ref={gridRef}
          data-scroll-anchor
          className={cn(
            "cinematic-layer cinematic-layer--media relative z-0 grid grid-cols-1 gap-3.5 md:grid-cols-2 md:gap-5",
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
              <div data-video-card-id={featuredVideo.id} className="h-full">
                <VideoCard
                  video={featuredVideo}
                  featured
                  priority
                  sectionActive={isSectionActive}
                  mediaActive={primaryVideoId === featuredVideo.id}
                  className="lg:absolute lg:inset-0"
                />
              </div>
            </Reveal>
          ) : null}

          {supportingVideos.map((video, index) => (
            <Reveal
              key={video.id}
              index={index + 2}
              className="relative z-0 min-h-0 min-w-0 overflow-visible lg:h-full"
            >
              <div data-video-card-id={video.id} className="h-full">
                <VideoCard
                  video={video}
                  loadDelay={(index + 1) * 220}
                  sectionActive={isSectionActive}
                  mediaActive={primaryVideoId === video.id}
                  className="lg:absolute lg:inset-0"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
