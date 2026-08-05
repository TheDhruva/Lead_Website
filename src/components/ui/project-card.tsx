"use client";

import Image from "next/image";
import { memo } from "react";

import { m, useReducedMotion } from "framer-motion";

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
    <m.a
      href={href}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      aria-label={`${project.title} — ${project.category}. View project`}
      className={cn(
        "group relative block cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)] outline-none",
        "transition-shadow duration-[250ms] hover:shadow-[var(--shadow-md)]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-secondary)]",
        isWebsite
          ? "aspect-video h-full w-full"
          : "aspect-square h-full w-full",
        className,
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
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />

      {/* Readability scrim — light enough to keep the poster visible */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
        aria-hidden="true"
      />

      {/* Title — single source of truth, no hover duplicate */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 md:p-5">
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
    </m.a>
  );
}

export const ProjectCard = memo(ProjectCardComponent);
