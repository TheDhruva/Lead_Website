"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/animations/reveal";
import { Container } from "@/components/ui/container";
import { SectionTitle } from "@/components/ui/section-title";
import { ServiceCard } from "@/components/ui/service-card";
import { services } from "@/data";
import { useCinematicSection } from "@/hooks/use-cinematic-section";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { flushScrollBus } from "@/lib/scroll-bus";
import { getScrollContainer } from "@/lib/scroll-container";
import {
  registerServicesSpotlight,
  unregisterServicesSpotlight,
} from "@/lib/services-mobile-spotlight";
import { cn } from "@/lib/utils";

/** Tap briefly holds scroll-driven updates so the choice feels intentional */
const TAP_LOCK_MS = 650;

export function Services() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const prefersReducedMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadedImageIds, setLoadedImageIds] = useState(() => new Set<string>());
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const activeIdRef = useRef<string | null>(null);
  const lockUntilRef = useRef(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  useCinematicSection(sectionRef, "services");
  const primedRef = useRef(false);

  const registerCardRef = useCallback(
    (id: string, element: HTMLElement | null) => {
      if (element) cardRefs.current.set(id, element);
      else cardRefs.current.delete(id);
    },
    [],
  );

  const markImageLoaded = useCallback((id: string) => {
    setLoadedImageIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const setActiveCard = useCallback(
    (id: string | null) => {
      if (activeIdRef.current === id) return;
      activeIdRef.current = id;
      setActiveId(id);
      if (id) markImageLoaded(id);
    },
    [markImageLoaded],
  );

  useEffect(() => {
    if (!isMobile) {
      unregisterServicesSpotlight();
      primedRef.current = false;
      return;
    }

    registerServicesSpotlight({
      enabled: true,
      prefersReducedMotion,
      cardRefs: cardRefs.current,
      activeIdRef,
      lockUntilRef,
      setActiveCard,
      sectionElement: sectionRef.current,
    });

    const section = sectionRef.current;
    const scrollRoot = getScrollContainer();
    const sectionObserver = section
      ? new IntersectionObserver(
          ([entry]) => {
            if (!entry?.isIntersecting) return;
            if (!primedRef.current) {
              primedRef.current = true;
              const firstId = services[0]?.id ?? null;
              if (firstId) {
                setActiveCard(firstId);
                lockUntilRef.current = Date.now() + 180;
                markImageLoaded(firstId);
              }
            }
            flushScrollBus();
          },
          {
            threshold: 0.15,
            rootMargin: "0px 0px -10% 0px",
            root: scrollRoot ?? null,
          },
        )
      : null;

    if (section && sectionObserver) sectionObserver.observe(section);
    flushScrollBus();

    return () => {
      sectionObserver?.disconnect();
      unregisterServicesSpotlight();
    };
  }, [isMobile, prefersReducedMotion, setActiveCard, markImageLoaded]);

  const handleActivate = useCallback(
    (id: string) => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = null;
      }

      markImageLoaded(id);
      setActiveCard(id);

      if (isMobile) {
        lockUntilRef.current = Date.now() + TAP_LOCK_MS;
        cardRefs.current.forEach((element, cardId) => {
          if (cardId === id) {
            element.style.setProperty("--spot-grow", "2.85");
            element.style.setProperty("--spot-opacity", "1");
            element.style.setProperty("--spot-scale", "0.985");
            window.setTimeout(() => {
              element.style.setProperty("--spot-scale", "1");
            }, 200);
          } else {
            element.style.setProperty("--spot-grow", "1");
            element.style.setProperty("--spot-opacity", "0.58");
            element.style.setProperty("--spot-scale", "1");
          }
        });
        return;
      }
    },
    [isMobile, markImageLoaded, setActiveCard],
  );

  const handleClear = useCallback(() => {
    if (isMobile) return;

    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
    }
    clearTimeoutRef.current = setTimeout(() => {
      setActiveCard(null);
      clearTimeoutRef.current = null;
    }, 220);
  }, [isMobile, setActiveCard]);

  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="services"
      data-snap-frame
      data-scroll-anchor-ratio="0.44"
      className="section-frame section-tone-services section-grid-bg"
      aria-labelledby="services-heading"
    >
      <Container className="w-full max-w-none">
        <Reveal>
          <SectionTitle
            as="h2"
            id="services-heading"
            className="cinematic-layer cinematic-layer--title mb-5 md:mb-8"
          >
            Services
          </SectionTitle>
        </Reveal>
        <Reveal index={1}>
          <div
            data-scroll-anchor
            className={cn(
              "services-container cinematic-layer cinematic-layer--grid flex h-[min(520px,calc(100svh-var(--nav-safe-top)-6rem))] min-w-0 flex-col gap-3 md:h-[min(460px,calc(100svh-var(--nav-safe-top)-6.5rem))] md:flex-row md:gap-4 lg:gap-5",
              isMobile && "services-container--mobile",
            )}
            onMouseLeave={handleClear}
          >
            {services.map((service, index) => {
              const isExpanded = isMobile
                ? activeId === service.id
                : activeId === service.id;
              const isDimmed =
                !isMobile && activeId !== null && activeId !== service.id;

              return (
                <ServiceCard
                  key={service.id}
                  ref={(element) => registerCardRef(service.id, element)}
                  service={service}
                  isExpanded={isExpanded}
                  isDimmed={isDimmed}
                  useTouchSpotlight={isMobile}
                  enableHoverExpand={!isMobile}
                  loadImage={
                    loadedImageIds.has(service.id) ||
                    isExpanded ||
                    (!isMobile && index === 0)
                  }
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
