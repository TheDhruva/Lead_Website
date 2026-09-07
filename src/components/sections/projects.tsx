"use client";

import Image from "next/image";
import { useRef } from "react";

import { Reveal } from "@/components/animations/reveal";
import { Container } from "@/components/ui/container";
import { projectRows } from "@/data";
import { useCinematicSection } from "@/hooks/use-cinematic-section";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

type GalleryItem = Project & { number: string; tier: 1 | 2 | 3 };

const gallery: GalleryItem[] = (() => {
  const flat: Project[] = [
    projectRows[0]!.website,
    projectRows[0]!.brands[1]!, // Product Brand Identity
    projectRows[1]!.brands[0]!, // Apparel Typography
    projectRows[1]!.brands[1]!, // Event Poster
    projectRows[1]!.website,
    projectRows[0]!.brands[0]!, // Local Restaurant
  ];
  // reorder to hierarchy: large → small → small → large → small → small
  const ordered = [
    flat[0],
    flat[2],
    flat[3],
    flat[4],
    flat[1],
    flat[5],
  ] as Project[];
  return ordered.map((p, i) => ({
    ...p,
    number: String(i + 1).padStart(2, "0"),
    tier: i < 2 ? 1 : i < 4 ? 2 : 3,
  }));
})();

function ProjectFigure({
  project,
  priority,
}: {
  project: GalleryItem;
  priority?: boolean;
}) {
  const isWebsite = project.variant === "website";
  const href = project.href ?? "#contact";
  const isExternal = href.startsWith("http");
  const prefersReducedMotion = useReducedMotion();

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      aria-label={`${project.title} — ${project.category}`}
      className={cn(
        "group relative block overflow-hidden rounded-lg bg-card",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-secondary)]",
        prefersReducedMotion && "transition-none",
      )}
    >
      <figure className="m-0">
        <div
          className={cn(
            "relative w-full overflow-hidden bg-muted",
            isWebsite ? "aspect-[16/9]" : "aspect-square",
          )}
        >
          <Image
            src={project.image}
            alt={project.imageAlt}
            fill
            sizes={
              isWebsite
                ? "(min-width: 1280px) 62vw, (min-width: 1024px) 65vw, 100vw"
                : "(min-width: 1280px) 28vw, (min-width: 768px) 45vw, 100vw"
            }
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            className={cn(
              "object-cover object-center transition-[transform,opacity] duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              prefersReducedMotion
                ? "transition-none"
                : "group-hover:scale-[1.015]",
            )}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/[0.04] dark:group-hover:bg-black/10"
          />
        </div>
        <figcaption className="flex min-h-[78px] flex-col justify-center p-3.5 md:min-h-[84px] md:p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-foreground-secondary">
            <span>{project.number}</span>
            <span aria-hidden className="h-px w-4 bg-border" />
            <span className="uppercase">{project.category}</span>
          </div>
          <h3 className="mt-1.5 line-clamp-1 font-headline-lg text-[15px] font-semibold leading-tight tracking-[-0.02em] text-foreground md:text-[16px]">
            {project.title}
          </h3>
          <span className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-foreground-secondary transition-colors duration-200 group-hover:text-foreground">
            VIEW <span aria-hidden>↗</span>
          </span>
        </figcaption>
      </figure>
    </a>
  );
}

export function Projects() {
  const ref = useRef<HTMLElement>(null);
  useCinematicSection(ref, "projects");
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      ref={ref}
      id="projects"
      data-scroll-anchor-ratio="0.45"
      className="section-tone-projects relative z-0 overflow-visible scroll-mt-[var(--nav-safe-top)] px-4 pt-[calc(var(--nav-safe-top)+0.75rem)] pb-8 sm:px-5 md:px-[var(--layout-nav-inset)] md:pb-10 lg:pb-12"
      aria-labelledby="projects-heading"
    >
      <Container className="w-full max-w-none">
        <Reveal>
          <header className="cinematic-layer cinematic-layer--heading mb-6 flex flex-col gap-2 border-b border-border pb-5 md:mb-8 md:flex-row md:items-end md:justify-between md:pb-6">
            <div className="min-w-0">
              <h2
                id="projects-heading"
                className="font-headline-lg text-headline-lg tracking-[-0.03em] text-foreground md:text-[34px] lg:text-[36px]"
              >
                Selected Work
              </h2>
              <p className="mt-1.5 max-w-[32rem] font-body-md text-[13px] leading-relaxed text-foreground-secondary md:text-[14px]">
                Digital experiences, identities and visual systems — a curated
                selection.
              </p>
            </div>
            <span className="shrink-0 font-mono text-[11px] tracking-[0.2em] text-foreground-secondary">
              01 — 06
            </span>
          </header>
        </Reveal>

        <div className="flex flex-col gap-6 md:gap-5 lg:gap-6">
          {/* Row 1: 16:9 + 1:1 — heights equal via 1.777:1 (64/36) */}
          <div
            className={cn(
              "grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.777fr)_minmax(0,1fr)] md:gap-5 lg:gap-6",
              "group",
              prefersReducedMotion
                ? ""
                : "[&_a:hover]:opacity-100 [&:has(a:hover)_a:not(:hover)]:opacity-[0.96]",
            )}
          >
            <Reveal index={0} className="min-w-0">
              <ProjectFigure project={gallery[0]!} priority />
            </Reveal>
            <Reveal index={1} className="min-w-0">
              <ProjectFigure project={gallery[1]!} />
            </Reveal>
          </div>

          {/* Row 2: 1:1 + 16:9 — reverse 1:1.777 */}
          <div
            className={cn(
              "grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.777fr)] md:gap-5 lg:gap-6",
              "group",
              prefersReducedMotion
                ? ""
                : "[&_a:hover]:opacity-100 [&:has(a:hover)_a:not(:hover)]:opacity-[0.96]",
            )}
          >
            <Reveal index={1} className="min-w-0">
              <ProjectFigure project={gallery[2]!} />
            </Reveal>
            <Reveal index={2} className="min-w-0">
              <ProjectFigure project={gallery[3]!} />
            </Reveal>
          </div>

          {/* Row 3: 1:1 + 1:1 — full container width, equal 1:1 */}
          <div
            className={cn(
              "grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-5 lg:gap-6",
              "group",
              prefersReducedMotion
                ? ""
                : "[&_a:hover]:opacity-100 [&:has(a:hover)_a:not(:hover)]:opacity-[0.96]",
            )}
          >
            <Reveal index={2} className="min-w-0">
              <ProjectFigure project={gallery[4]!} />
            </Reveal>
            <Reveal index={3} className="min-w-0">
              <ProjectFigure project={gallery[5]!} />
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
