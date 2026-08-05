"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/animations/reveal";
import { Container } from "@/components/ui/container";
import { SectionTitle } from "@/components/ui/section-title";
import { ServiceCard } from "@/components/ui/service-card";
import { services } from "@/data";
import { useMediaQuery } from "@/hooks/use-media-query";

export function Services() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [activeId, setActiveId] = useState<string | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileDefaultSet = useRef(false);

  useEffect(() => {
    if (isMobile && !mobileDefaultSet.current && services[0]) {
      mobileDefaultSet.current = true;
      setActiveId(services[0].id);
    }
  }, [isMobile]);

  const handleActivate = useCallback((id: string) => {
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }
    setActiveId(id);
  }, []);

  const handleClear = useCallback(() => {
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
    }
    clearTimeoutRef.current = setTimeout(() => {
      setActiveId(null);
      clearTimeoutRef.current = null;
    }, 120);
  }, []);

  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section
      id="services"
      className="bg-background px-gutter py-16 md:py-20 lg:py-24"
      aria-labelledby="services-heading"
    >
      <Container>
        <Reveal>
          <SectionTitle as="h2" id="services-heading">
            Core Disciplines
          </SectionTitle>
        </Reveal>
        <Reveal delay={0.1}>
          <div
            className="services-container flex h-[min(680px,72svh)] flex-col gap-3 md:h-[min(560px,68svh)] md:flex-row md:gap-4 lg:gap-5"
            onMouseLeave={handleClear}
          >
            {services.map((service) => {
              const isExpanded = activeId === service.id;
              const isDimmed = activeId !== null && !isExpanded;

              return (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isExpanded={isExpanded}
                  isDimmed={isDimmed}
                  onActivate={() => handleActivate(service.id)}
                />
              );
            })}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
