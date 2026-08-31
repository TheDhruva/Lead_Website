"use client";

import Image from "next/image";
import { memo } from "react";

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
        <a
          href={href}
          aria-label={`${project.title} — ${project.category}. View project`}
          className={cn(
            "media-card group relative block h-full w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)] outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-secondary)]",
            prefersReducedMotion && "media-card--static",
          )}
        >
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

          <div className="media-card__caption pointer-events-none absolute inset-x-0 bottom-0 p-4 md:p-5">
            <p className="mb-0.5 truncate text-[11px] font-medium tracking-wide text-white/65 uppercase md:text-xs">
              {project.category}
            </p>
            <h3
              className={cn(
                "truncate font-semibold tracking-tight text-white drop-shadow-md",
                isWebsite ? "text-lg md:text-2xl" : "text-base md:text-lg",
              )}
            >
              {project.title}
            </h3>
          </div>
        </a>
      </CursorSpotlight>
    </div>
  );
}

export const ProjectCard = memo(ProjectCardComponent);
