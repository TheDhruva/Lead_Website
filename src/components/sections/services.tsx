"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/animations/reveal";
import { Container } from "@/components/ui/container";
import { SectionTitle } from "@/components/ui/section-title";
import { ServiceCard } from "@/components/ui/service-card";
import { services } from "@/data";
import { useMediaQuery } from "@/hooks/use-media-query";

const MOBILE_TAP_LOCK_MS = 900;
const MOBILE_ANIMATION_LOCK_MS = 700;
const SCROLL_SETTLE_MS = 200;
/** Ignore tiny center shifts while a card is expanding */
const CENTER_SWITCH_BUFFER_PX = 48;

export function Services() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [activeId, setActiveId] = useState<string | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const activeIdRef = useRef<string | null>(null);
  const userLockUntilRef = useRef(0);

  const registerCardRef = useCallback(
    (id: string, element: HTMLElement | null) => {
      if (element) cardRefs.current.set(id, element);
      else cardRefs.current.delete(id);
    },
    [],
  );

  const setActiveCard = useCallback(
    (id: string | null, { lockMs = 0 }: { lockMs?: number } = {}) => {
      if (activeIdRef.current === id) return;

      activeIdRef.current = id;
      setActiveId(id);

      if (isMobile && lockMs > 0) {
        userLockUntilRef.current = Date.now() + lockMs;
      }
    },
    [isMobile],
  );

  const pickCenteredCard = useCallback(() => {
    if (!isMobile || Date.now() < userLockUntilRef.current) return;

    const viewportCenter = window.innerHeight / 2;
    let closestId: string | null = null;
    let closestDistance = Infinity;

    cardRefs.current.forEach((element, id) => {
      const rect = element.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const distance = Math.abs(cardCenter - viewportCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestId = id;
      }
    });

    if (!closestId || closestDistance >= window.innerHeight * 0.45) return;

    const currentId = activeIdRef.current;
    if (currentId && currentId !== closestId) {
      const currentEl = cardRefs.current.get(currentId);
      if (currentEl) {
        const currentRect = currentEl.getBoundingClientRect();
        const currentDistance = Math.abs(
          currentRect.top + currentRect.height / 2 - viewportCenter,
        );
        if (closestDistance > currentDistance - CENTER_SWITCH_BUFFER_PX) return;
      }
    }

    setActiveCard(closestId, { lockMs: MOBILE_ANIMATION_LOCK_MS });
  }, [isMobile, setActiveCard]);

  useEffect(() => {
    if (!isMobile) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;

    const schedulePick = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        rafId = requestAnimationFrame(pickCenteredCard);
      }, SCROLL_SETTLE_MS);
    };

    window.addEventListener("scroll", schedulePick, { passive: true });
    schedulePick();

    return () => {
      window.removeEventListener("scroll", schedulePick);
      if (debounceTimer) clearTimeout(debounceTimer);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isMobile, pickCenteredCard]);

  const handleActivate = useCallback(
    (id: string) => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = null;
      }

      setActiveCard(id, { lockMs: MOBILE_TAP_LOCK_MS });

      if (isMobile) {
        cardRefs.current.get(id)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    },
    [isMobile, setActiveCard],
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
