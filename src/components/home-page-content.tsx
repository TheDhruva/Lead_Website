"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

import { FloatingNav } from "@/components/layout/floating-nav";
import { GlobalCanvas } from "@/components/layout/global-canvas";
import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/sections/hero";
import { TheatreIntro } from "@/components/sections/theatre-intro";
import { LazySection } from "@/components/ui/lazy-section";
import { SectionSkeleton } from "@/components/ui/section-skeleton";
import { SECTION_IDS } from "@/constants";
import { projectRows, services, videoItems } from "@/data";
import { useContainerKeyboardScroll } from "@/hooks/use-container-keyboard-scroll";
import { useGestureNavigation } from "@/hooks/use-gesture-navigation";
import { useHashScroll } from "@/hooks/use-hash-scroll";
import { useSectionSettle } from "@/hooks/use-section-settle";
import {
  SCROLL_CONTAINER_ID,
  getScrollContainer,
} from "@/lib/scroll-container";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

const Services = dynamic(
  () => import("@/components/sections/services").then((mod) => mod.Services),
  {
    ssr: false,
    loading: () => (
      <SectionSkeleton tone="services" id={SECTION_IDS.services} />
    ),
  },
);

const VideoShowcase = dynamic(
  () =>
    import("@/components/sections/video-showcase").then(
      (mod) => mod.VideoShowcase,
    ),
  {
    ssr: false,
    loading: () => <SectionSkeleton tone="videos" id={SECTION_IDS.video} />,
  },
);

const Projects = dynamic(
  () => import("@/components/sections/projects").then((mod) => mod.Projects),
  {
    ssr: false,
    loading: () => (
      <SectionSkeleton tone="projects" id={SECTION_IDS.projects} />
    ),
  },
);

const Contact = dynamic(
  () => import("@/components/sections/contact").then((mod) => mod.Contact),
  { ssr: false },
);

// P1 hydration: post-enter-only UI (no visual content) splits out of the
// initial client bundle. Both render null / gated button only.
const AudioGestureUnlock = dynamic(
  () =>
    import("@/components/audio-gesture-unlock").then(
      (mod) => mod.AudioGestureUnlock,
    ),
  { ssr: false },
);

const MuteButton = dynamic(
  () => import("@/components/ui/mute-button").then((mod) => mod.MuteButton),
  { ssr: false },
);

function HashScrollSync() {
  useHashScroll();
  useContainerKeyboardScroll();
  useSectionSettle();
  useGestureNavigation();
  return null;
}

/**
 * P1 cold-entry staging: warm the next dynamic chunk well before
 * its LazySection mounts. Stage 1 of the heavy-section pipeline:
 *   Stage 1 (this observer, ~2 viewports out): prefetch JS chunk
 *     → download + evaluation happen off the entry frame.
 *   Stage 2 (LazySection mount margin): mount section + DOM.
 *   Stage 3 (section code): prepare important media (eager first
 *     image/poster, video metadata arm).
 *   Stage 4 (visibility): animations + autoplay begin.
 * Never force-mounts — LazySection still owns mounting.
 */
function SectionChunkPrefetch() {
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window))
      return;
    const jobs: { id: string; load: () => Promise<unknown> }[] = [
      {
        id: SECTION_IDS.services,
        load: () => import("@/components/sections/services"),
      },
      {
        id: SECTION_IDS.video,
        load: () => import("@/components/sections/video-showcase"),
      },
      {
        id: SECTION_IDS.projects,
        load: () => import("@/components/sections/projects"),
      },
      {
        id: SECTION_IDS.contact,
        load: () => import("@/components/sections/contact"),
      },
    ];
    const prefetched = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          const job = jobs.find((j) => j.id === id);
          if (!job || prefetched.has(id)) continue;
          prefetched.add(id);
          void job.load().catch(() => {});
          observer.unobserve(entry.target);
        }
      },
      // ~2 viewports + margin ahead of the 900/2000px mount margins.
      {
        root: getScrollContainer(),
        rootMargin: "0px 0px 2200px 0px",
        threshold: 0,
      },
    );
    // Observe lazily: targets may not exist until first paint.
    const raf = requestAnimationFrame(() => {
      for (const job of jobs) {
        const el = document.getElementById(job.id);
        if (el) observer.observe(el);
      }
    });
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);
  return null;
}

export function HomePageContent() {
  const { hasEntered, bootstrapped } = useTheatreIntro();
  const showMute = bootstrapped;

  return (
    <>
      {!hasEntered ? <TheatreIntro /> : null}
      <HashScrollSync />
      <SectionChunkPrefetch />
      <AudioGestureUnlock />
      {showMute ? <MuteButton /> : null}
      <div data-page-shell className="relative h-[100svh]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[110] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <GlobalCanvas />
        <div
          id={SCROLL_CONTAINER_ID}
          className="scroll-panel relative h-[100svh] w-full overflow-x-hidden overflow-y-auto"
        >
          <Navbar />
          <FloatingNav />
          <main id="main-content">
            <Hero />
            <LazySection
              id={SECTION_IDS.services}
              className="section-tone-services section-placeholder"
              minHeight="100svh"
              rootMargin="0px 0px 900px 0px"
              srContent={
                <>
                  <h2 className="sr-only">Our Services</h2>
                  <dl className="sr-only">
                    {services.map((service) => (
                      <div key={service.id}>
                        <dt>{service.title}</dt>
                        <dd>{service.description}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              }
            >
              <Services />
            </LazySection>
            <LazySection
              id={SECTION_IDS.video}
              className="section-tone-videos section-placeholder"
              minHeight="100svh"
              // Heavier section (player + media): mount well before entry
              // so chunk evaluation, render, and the first video's byte
              // fetch clear the scroll path before active scrolling
              // arrives instead of bursting mid-gesture.
              rootMargin="0px 0px 2000px 0px"
              srContent={
                <>
                  <h2 className="sr-only">Video Showcase</h2>
                  <dl className="sr-only">
                    {videoItems.map((video) => (
                      <div key={video.id}>
                        <dt>{video.title}</dt>
                        <dd>
                          {video.category} — {video.meta}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </>
              }
            >
              <VideoShowcase />
            </LazySection>
            <LazySection
              id={SECTION_IDS.projects}
              className="section-tone-projects section-placeholder"
              // Reserve the deck's genuine geometry (track 480svh + pb-10
              // below md, 600svh + md:pb-14 at/above) so the
              // placeholder → skeleton → deck chain never changes
              // document height mid-scroll. A 100svh placeholder here
              // would grow ~500svh on mount and visibly jump the page
              // on fast first-visit flicks.
              minHeight="calc(480svh + 2.5rem)"
              minHeightMd="calc(600svh + 3.5rem)"
              // Design Work carries the image stack — mount early so
              // chunk + image fetches clear the scroll path before entry.
              rootMargin="0px 0px 2000px 0px"
              srContent={
                <>
                  <h2 className="sr-only">Projects</h2>
                  <ul className="sr-only">
                    {projectRows
                      .flatMap((row) => [row.website, ...row.brands])
                      .map((project) => (
                        <li key={project.id}>
                          {project.title} — {project.description}
                        </li>
                      ))}
                  </ul>
                </>
              }
            >
              <Projects />
            </LazySection>
            <LazySection
              id={SECTION_IDS.contact}
              className="section-tone-contact section-placeholder"
              minHeight="100svh"
              srContent={
                <>
                  <h2 className="sr-only">Contact</h2>
                  <p className="sr-only">
                    Tell us about your project — video editing, website
                    development, or brand design.
                  </p>
                </>
              }
            >
              <Contact />
            </LazySection>
          </main>
        </div>
      </div>
    </>
  );
}
