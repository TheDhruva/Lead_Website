"use client";

import dynamic from "next/dynamic";

import { PageTransition } from "@/components/animations/page-transition";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Contact } from "@/components/sections/contact";
import { Hero } from "@/components/sections/hero";
import { Projects } from "@/components/sections/projects";
import { Services } from "@/components/sections/services";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

const TheatreIntro = dynamic(
  () =>
    import("@/components/sections/theatre-intro").then(
      (mod) => mod.TheatreIntro,
    ),
  { ssr: false },
);

const VideoShowcase = dynamic(
  () =>
    import("@/components/sections/video-showcase").then(
      (mod) => mod.VideoShowcase,
    ),
  {
    loading: () => (
      <section
        className="bg-surface-container-lowest px-gutter py-16 md:py-20 lg:py-24"
        aria-hidden="true"
      />
    ),
  },
);

export function HomePage() {
  const { hasEntered } = useTheatreIntro();

  return (
    <>
      <TheatreIntro />
      <PageTransition visible={hasEntered} className="relative">
        <a
          href="#work"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[110] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content">
          <Hero />
          <Services />
          <VideoShowcase />
          <Projects />
          <Contact />
        </main>
        <Footer />
      </PageTransition>
    </>
  );
}
