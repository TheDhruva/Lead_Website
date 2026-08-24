"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/animations/reveal";
import { Container } from "@/components/ui/container";
import { SectionTitle } from "@/components/ui/section-title";
import { ServiceCard } from "@/components/ui/service-card";
import { services } from "@/data";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** How strongly a new card must beat the current one before switching */
const HYSTERESIS = 0.14;
/** Minimum centrality before a card can become active */
const ACTIVATE_FLOOR = 0.32;
/** Content / media treat card as expanded above this spotlight */
const EXPAND_CONTENT_AT = 0.48;
/** Tap briefly holds scroll-driven updates so the choice feels intentional */
const TAP_LOCK_MS = 650;

function centralityScore(rect: DOMRect, viewportHeight: number) {
  if (rect.bottom <= 0 || rect.top >= viewportHeight) return 0;

  const cardCenter = rect.top + rect.height / 2;
  const viewCenter = viewportHeight * 0.48;
  const distance = Math.abs(cardCenter - viewCenter);
  // Wider focus band (~ middle 50% of the screen)
  const maxDistance = viewportHeight * 0.32;
  const linear = 1 - Math.min(distance / maxDistance, 1);
  return linear * linear;
}

export function Services() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const prefersReducedMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [spotlight, setSpotlight] = useState<Record<string, number>>({});
  const [loadedImageIds, setLoadedImageIds] = useState(() => new Set<string>());
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const activeIdRef = useRef<string | null>(null);
  const lockUntilRef = useRef(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const primedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

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

  const updateMobileSpotlight = useCallback(() => {
    if (!isMobile) return;

    const viewportHeight = window.innerHeight || 1;
    const nextSpotlight: Record<string, number> = {};
    let bestId: string | null = null;
    let bestScore = 0;

    cardRefs.current.forEach((element, id) => {
      const score = centralityScore(
        element.getBoundingClientRect(),
        viewportHeight,
      );
      nextSpotlight[id] = prefersReducedMotion
        ? score >= EXPAND_CONTENT_AT
          ? 1
          : 0
        : score;

      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    });

    setSpotlight(nextSpotlight);

    if (Date.now() < lockUntilRef.current) return;

    const currentId = activeIdRef.current;
    const currentScore = currentId ? (nextSpotlight[currentId] ?? 0) : 0;

    if (!bestId || bestScore < ACTIVATE_FLOOR) {
      if (currentId && currentScore < 0.18) {
        setActiveCard(null);
      }
      return;
    }

    if (bestId === currentId) return;

    // Hysteresis: only switch when the new card clearly wins
    if (
      currentId &&
      currentScore > 0.22 &&
      bestScore < currentScore + HYSTERESIS
    ) {
      return;
    }

    setActiveCard(bestId);
  }, [isMobile, prefersReducedMotion, setActiveCard]);

  const scheduleSpotlightUpdate = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updateMobileSpotlight();
    });
  }, [updateMobileSpotlight]);

  // Mobile: scroll-linked spotlight with priming when the section enters
  useEffect(() => {
    if (!isMobile) {
      primedRef.current = false;
      return;
    }

    const section = sectionRef.current;
    const onScrollOrResize = () => scheduleSpotlightUpdate();

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    const sectionObserver = section
      ? new IntersectionObserver(
          ([entry]) => {
            if (!entry?.isIntersecting) return;
            if (!primedRef.current) {
              primedRef.current = true;
              const firstId = services[0]?.id ?? null;
              if (firstId) {
                setActiveCard(firstId);
                // Defer spotlight paint to the next frame (scroll system), not sync setState in effect body beyond activation
                lockUntilRef.current = Date.now() + 180;
                markImageLoaded(firstId);
              }
            }
            scheduleSpotlightUpdate();
          },
          { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
        )
      : null;

    if (section && sectionObserver) sectionObserver.observe(section);

    scheduleSpotlightUpdate();

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      sectionObserver?.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isMobile, scheduleSpotlightUpdate, setActiveCard, markImageLoaded]);

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
        setSpotlight((prev) => {
          const next: Record<string, number> = {};
          for (const service of services) {
            next[service.id] =
              service.id === id ? 1 : Math.min(prev[service.id] ?? 0, 0.2);
          }
          return next;
        });
        // No scrollIntoView — scroll already drives focus; tapping shouldn't fight it
        return;
      }

      // Desktop hover path unchanged
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
    }, 120);
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
      className="bg-background px-gutter py-16 md:py-20 lg:py-24"
      aria-labelledby="services-heading"
    >
      <Container>
        <Reveal>
          <SectionTitle as="h2" id="services-heading">
            Core Disciplines
          </SectionTitle>
        </Reveal>
        <Reveal index={1}>
          <div
            className="services-container flex h-[min(760px,78svh)] flex-col gap-3 md:h-[min(560px,68svh)] md:flex-row md:gap-4 lg:gap-5"
            onMouseLeave={handleClear}
          >
            {services.map((service, index) => {
              const amount = isMobile
                ? (spotlight[service.id] ?? 0)
                : undefined;
              const isExpanded = isMobile
                ? (amount ?? 0) >= EXPAND_CONTENT_AT
                : activeId === service.id;
              const isDimmed = isMobile
                ? activeId !== null &&
                  activeId !== service.id &&
                  (amount ?? 0) < 0.35
                : activeId !== null && activeId !== service.id;

              return (
                <ServiceCard
                  key={service.id}
                  ref={(element) => registerCardRef(service.id, element)}
                  service={service}
                  isExpanded={isExpanded}
                  isDimmed={isDimmed}
                  expandAmount={amount}
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
