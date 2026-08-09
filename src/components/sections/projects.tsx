"use client";

import { m, useReducedMotion } from "framer-motion";

import { Container } from "@/components/ui/container";
import { ProjectCard } from "@/components/ui/project-card";
import { SectionTitle } from "@/components/ui/section-title";
import { EASING_CINEMATIC } from "@/constants";
import { projectRows } from "@/data";
import { cn } from "@/lib/utils";

export function Projects() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="projects"
      className="bg-background px-gutter py-16 md:py-20 lg:py-24"
      aria-labelledby="projects-heading"
    >
      <Container>
        <m.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: EASING_CINEMATIC }}
        >
          <SectionTitle
            as="h2"
            id="projects-heading"
            className="mb-10 md:mb-12"
          >
            Selected Work
          </SectionTitle>
        </m.div>

        <div className="flex flex-col gap-8 md:gap-10 lg:gap-12">
          {projectRows.map((row, rowIndex) => {
            const reverse = rowIndex % 2 === 1;

            return (
              <m.div
                key={row.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.6,
                  delay: prefersReducedMotion ? 0 : rowIndex * 0.1,
                  ease: EASING_CINEMATIC,
                }}
                className={cn(
                  "grid grid-cols-1 gap-6 md:gap-7",
                  // Desktop editorial: website hero + stacked brand pair
                  reverse
                    ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-8"
                    : "lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-8",
                )}
              >
                {/* Website hero */}
                <div className={cn("min-h-0 min-w-0", reverse && "lg:order-2")}>
                  <ProjectCard project={row.website} />
                </div>

                {/* Brand identity stack */}
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
              </m.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
