"use client";

import Image from "next/image";
import { memo } from "react";

import { ArrowUpRight } from "lucide-react";

import { CursorSpotlight } from "@/components/ui/cursor-spotlight";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  className?: string;
  priority?: boolean;
}

function ProjectCardComponent({
  project,
  className,
  priority = false,
}: ProjectCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const isWebsite = project.variant === "website";
  const href = project.href ?? "#contact";
  const isExternal = href.startsWith("http");

  const cardMedia = (
    <>
      <Image
        src={project.image}
        alt={project.imageAlt}
        fill
        sizes={
          isWebsite
            ? "(max-width: 1024px) 100vw, 62vw"
            : "(max-width: 1024px) 50vw, 28vw"
        }
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        className="media-card__media object-cover object-center"
      />

      <span
        className="media-card__accent pointer-events-none absolute top-0 left-0 z-10 h-px w-full bg-[var(--accent-cherry)]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
        aria-hidden="true"
      />

      <div
        className={cn(
          "media-card__caption absolute inset-x-0 bottom-0 p-4 md:p-5",
          isExternal ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <p className="mb-0.5 truncate text-[11px] font-medium tracking-wide text-white/65 uppercase md:text-xs">
          {project.category}
        </p>
        <div className="flex items-end justify-between gap-3">
          <h3
            className={cn(
              "min-w-0 truncate font-semibold tracking-tight text-white drop-shadow-md",
              isWebsite ? "text-lg md:text-2xl" : "text-base md:text-lg",
            )}
          >
            {project.title}
          </h3>
          {isExternal ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full border border-white/25 bg-black/45 px-3 py-1.5",
                "text-[11px] font-semibold tracking-[0.14em] text-white uppercase md:text-xs",
                "transition-colors duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
                "hover:border-white/40 hover:bg-black/60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
              )}
            >
              View
              <ArrowUpRight
                className="h-3.5 w-3.5"
                aria-hidden="true"
                strokeWidth={2}
              />
            </a>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <div
      className={cn(
        "relative h-full w-full",
        isWebsite
          ? "aspect-video lg:aspect-auto"
          : "aspect-square lg:aspect-auto",
        className,
      )}
    >
      <CursorSpotlight
        className="absolute inset-0 h-full w-full rounded-2xl"
        size={isWebsite ? 280 : 200}
        intensity={0.22}
      >
        {isExternal ? (
          <article
            aria-label={`${project.title} — ${project.category}`}
            className={cn(
              "media-card group relative block h-full w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]",
              prefersReducedMotion && "media-card--static",
            )}
          >
            {cardMedia}
          </article>
        ) : (
          <a
            href={href}
            aria-label={`${project.title} — ${project.category}. View project`}
            className={cn(
              "media-card group relative block h-full w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)] outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-secondary)]",
              prefersReducedMotion && "media-card--static",
            )}
          >
            {cardMedia}
          </a>
        )}
      </CursorSpotlight>
    </div>
  );
}

export const ProjectCard = memo(ProjectCardComponent);
