"use client";

import { Reveal } from "@/components/animations/reveal";
import { Container } from "@/components/ui/container";
import { ProjectCard } from "@/components/ui/project-card";
import { SectionTitle } from "@/components/ui/section-title";
import { projectRows } from "@/data";
import { cn } from "@/lib/utils";

export function Projects() {
  return (
    <section
      id="projects"
      className="bg-background px-gutter py-16 md:py-20 lg:py-24"
      aria-labelledby="projects-heading"
    >
      <Container>
        <Reveal>
          <SectionTitle
            as="h2"
            id="projects-heading"
            className="mb-10 md:mb-12"
          >
            Selected Work
          </SectionTitle>
        </Reveal>

        <div className="flex flex-col gap-8 md:gap-10 lg:gap-12">
          {projectRows.map((row, rowIndex) => {
            const reverse = rowIndex % 2 === 1;

            return (
              <Reveal key={row.id} index={rowIndex + 1}>
                <div
                  className={cn(
                    "grid grid-cols-1 gap-6 md:gap-7",
                    reverse
                      ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-8"
                      : "lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-8",
                  )}
                >
                  <div
                    className={cn("min-h-0 min-w-0", reverse && "lg:order-2")}
                  >
                    <ProjectCard project={row.website} />
                  </div>

                  <div
                    className={cn(
                      "grid min-h-0 min-w-0 grid-cols-2 gap-4 md:gap-5 lg:grid-cols-1 lg:gap-6",
                      reverse && "lg:order-1",
                    )}
                  >
                    {row.brands.map((brand) => (
                      <ProjectCard key={brand.id} project={brand} />
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
