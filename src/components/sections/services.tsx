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
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());

  const registerCardRef = useCallback(
    (id: string, element: HTMLElement | null) => {
      if (element) cardRefs.current.set(id, element);
      else cardRefs.current.delete(id);
    },
    [],
  );

  useEffect(() => {
    if (!isMobile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestId: string | null = null;
        let bestRatio = 0;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.getAttribute("data-service-id");
          if (id && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestId = id;
          }
        }

        if (bestId) setActiveId(bestId);
      },
      {
        rootMargin: "-32% 0px -32% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    cardRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [isMobile]);

  const handleActivate = useCallback(
    (id: string) => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = null;
      }

      setActiveId(id);

      if (isMobile) {
        cardRefs.current.get(id)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    },
    [isMobile],
  );

  const handleClear = useCallback(() => {
    if (isMobile) return;

    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
    }
    clearTimeoutRef.current = setTimeout(() => {
      setActiveId(null);
      clearTimeoutRef.current = null;
    }, 120);
  }, [isMobile]);

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
                  ref={(element) => registerCardRef(service.id, element)}
                  service={service}
                  isExpanded={isExpanded}
                  isDimmed={isDimmed}
                  enableHoverExpand={!isMobile}
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
