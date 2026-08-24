"use client";

import dynamic from "next/dynamic";

import { PageTransition } from "@/components/animations/page-transition";
import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/sections/hero";
import { TheatreIntro } from "@/components/sections/theatre-intro";
import { LazySection } from "@/components/ui/lazy-section";
import { SECTION_IDS } from "@/constants";

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
      <PageTransition className="relative">
        <a
          href="#work"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[110] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content">
          <Hero />
          <LazySection
            id={SECTION_IDS.services}
            className="bg-background"
            minHeight="min(58svh, 620px)"
          >
            <Services />
          </LazySection>
          <LazySection
            id={SECTION_IDS.video}
            className="bg-surface-container-lowest"
            minHeight="min(78svh, 920px)"
          >
            <VideoShowcase />
          </LazySection>
          <LazySection
            id={SECTION_IDS.projects}
            className="bg-background"
            minHeight="min(130svh, 1500px)"
          >
            <Projects />
          </LazySection>
          <LazySection
            id={SECTION_IDS.contact}
            className="bg-surface-container-lowest"
            minHeight="min(62svh, 680px)"
          >
            <Contact />
          </LazySection>
        </main>
      </PageTransition>
    </>
  );
}
