"use client";

import { Reveal } from "@/components/animations/reveal";
import { Container } from "@/components/ui/container";
import { ProjectCard } from "@/components/ui/project-card";
import { SectionTitle } from "@/components/ui/section-title";
import { projectRows } from "@/data";
import { cn } from "@/lib/utils";

export function Projects() {
  return (
    <div id="projects" className="section-tone-projects relative z-0">
      {projectRows.map((row, rowIndex) => {
        const reverse = rowIndex % 2 === 1;
        const isFirst = rowIndex === 0;

        return (
          <section
            key={row.id}
            data-snap-frame
            aria-labelledby={isFirst ? "projects-heading" : undefined}
            aria-label={
              isFirst ? undefined : `Web designs group ${rowIndex + 1}`
            }
            className={cn(
              "section-frame overflow-hidden max-md:overflow-visible",
              !isFirst && "section-frame--projects-follow",
            )}
          >
            <Container className="flex w-full max-w-none flex-col">
              {isFirst ? (
                <Reveal>
                  <SectionTitle
                    as="h2"
                    id="projects-heading"
                    className="mb-5 max-md:mb-4 md:mb-7 md:text-[34px] lg:text-[36px]"
                  >
                    Web Designs
                  </SectionTitle>
                </Reveal>
              ) : null}

              <Reveal index={isFirst ? 1 : 0}>
                <div
                  className={cn(
                    "grid min-h-0 grid-cols-1 gap-3.5 md:gap-5",
                    "md:grid-cols-2 lg:h-[min(26rem,calc(100svh-var(--nav-safe-top)-6rem))]",
                    reverse
                      ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-5"
                      : "lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-5",
                  )}
                >
                  <div
                    className={cn(
                      "relative z-0 min-h-0 min-w-0 overflow-hidden md:col-span-2 lg:col-span-1 lg:h-full",
                      reverse && "lg:order-2",
                    )}
                  >
                    <ProjectCard project={row.website} className="h-full" />
                  </div>

                  <div
                    className={cn(
                      "grid min-h-0 min-w-0 grid-cols-2 gap-2.5 md:col-span-2 md:gap-4 lg:col-span-1 lg:h-full lg:grid-cols-1 lg:gap-4",
                      reverse && "lg:order-1",
                    )}
                  >
                    {row.brands.map((brand) => (
                      <div
                        key={brand.id}
                        className="relative z-0 min-h-0 overflow-hidden"
                      >
                        <ProjectCard
                          project={brand}
                          className="h-full min-h-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </Container>
          </section>
        );
      })}
    </div>
  );
}
