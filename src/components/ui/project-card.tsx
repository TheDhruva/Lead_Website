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
        className="object-cover"
      />

      {/* Quiet resting meta — keep hierarchy without crowding */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent p-4 pt-16 md:p-5">
        <p className="text-[11px] font-medium tracking-[0.08em] text-white/70 uppercase">
          {project.category}
        </p>
        <h3
          className={cn(
            "mt-1 truncate font-semibold tracking-tight text-white",
            isWebsite ? "text-lg md:text-xl" : "text-base md:text-lg",
          )}
        >
          {project.title}
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {project.tags.slice(0, isWebsite ? 3 : 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/15 bg-black/25 px-2 py-0.5 text-[10px] tracking-wide text-white/80 backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Premium hover reveal */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/45 to-black/10 p-5 md:p-6",
          "opacity-0 transition-opacity duration-300 ease-out",
          "group-hover:opacity-100 group-focus-within:opacity-100",
        )}
      >
        <h3
          className={cn(
            "font-semibold tracking-tight text-white",
            isWebsite ? "text-xl md:text-2xl" : "text-lg",
          )}
        >
          {project.title}
        </h3>
        <p className="mt-2 line-clamp-2 max-w-md text-sm leading-relaxed text-white/80">
          {project.description}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white">
          View Project
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </m.a>
  );
}

export const ProjectCard = memo(ProjectCardComponent);
