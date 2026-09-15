"use client";

import dynamic from "next/dynamic";

import { PageTransition } from "@/components/animations/page-transition";
import { AudioGestureUnlock } from "@/components/audio-gesture-unlock";
import { Navbar } from "@/components/layout/navbar";
import { ScrollIntentGuidance } from "@/components/scroll/scroll-intent-guidance";
import { Hero } from "@/components/sections/hero";
import { TheatreIntro } from "@/components/sections/theatre-intro";
import { LazySection } from "@/components/ui/lazy-section";
import { MuteButton } from "@/components/ui/mute-button";
import { SectionSkeleton } from "@/components/ui/section-skeleton";
import { SECTION_IDS } from "@/constants";
import { projectRows, services, videoItems } from "@/data";
import { useHashScroll } from "@/hooks/use-hash-scroll";
import { SCROLL_CONTAINER_ID } from "@/lib/scroll-container";
import { useAudio } from "@/providers/audio-provider";
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

function HashScrollSync() {
  useHashScroll();
  return null;
}

export function HomePageContent() {
  const { hasEntered, bootstrapped } = useTheatreIntro();
  const { unlocked } = useAudio();
  const showMute = bootstrapped && (hasEntered || unlocked);

  return (
    <>
      {!hasEntered ? <TheatreIntro /> : null}
      <HashScrollSync />
      <ScrollIntentGuidance />
      <AudioGestureUnlock />
      {showMute ? <MuteButton /> : null}
      <PageTransition data-page-shell className="relative h-[100svh]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[110] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Navbar />
        <div
          id={SCROLL_CONTAINER_ID}
          className="scroll-panel h-[100svh] w-full overflow-x-hidden overflow-y-auto"
        >
          <main id="main-content">
            <Hero />
            <LazySection
              id={SECTION_IDS.services}
              className="section-tone-services section-placeholder"
              minHeight="100svh"
              scrollAnchorRatio="0.44"
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
              scrollAnchorRatio="0.47"
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
              minHeight="100svh"
              scrollAnchorRatio="0.45"
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
              scrollAnchorRatio="0.42"
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
      </PageTransition>
    </>
  );
}
