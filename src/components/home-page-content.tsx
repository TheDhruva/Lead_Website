"use client";

import dynamic from "next/dynamic";

import { PageTransition } from "@/components/animations/page-transition";
import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/sections/hero";
import { TheatreIntro } from "@/components/sections/theatre-intro";
import { LazySection } from "@/components/ui/lazy-section";
import { SECTION_IDS } from "@/constants";
import { SCROLL_CONTAINER_ID } from "@/lib/scroll-container";

const Services = dynamic(
  () => import("@/components/sections/services").then((mod) => mod.Services),
  { ssr: false },
);

const VideoShowcase = dynamic(
  () =>
    import("@/components/sections/video-showcase").then(
      (mod) => mod.VideoShowcase,
    ),
  { ssr: false },
);

const Projects = dynamic(
  () => import("@/components/sections/projects").then((mod) => mod.Projects),
  { ssr: false },
);

const Contact = dynamic(
  () => import("@/components/sections/contact").then((mod) => mod.Contact),
  { ssr: false },
);

export function HomePageContent() {
  return (
    <>
      <TheatreIntro />
      <PageTransition className="relative h-[100svh]">
        <a
          href="#work"
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
            >
              <Services />
            </LazySection>
            <LazySection
              id={SECTION_IDS.video}
              className="section-tone-videos section-placeholder"
              minHeight="100svh"
            >
              <VideoShowcase />
            </LazySection>
            <LazySection
              id={SECTION_IDS.projects}
              className="section-tone-projects section-placeholder"
              minHeight="100svh"
            >
              <Projects />
            </LazySection>
            <Contact />
          </main>
        </div>
      </PageTransition>
    </>
  );
}
