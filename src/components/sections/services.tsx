"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { CssReveal } from "@/components/animations/css-reveal";
import { Reveal } from "@/components/animations/reveal";
import { AnimatedText } from "@/components/motion/animated-text";
import { Container } from "@/components/ui/container";
import { services } from "@/data";
import { useCinematicSection } from "@/hooks/use-cinematic-section";
import { getScrollContainer } from "@/lib/scroll-container";
import { cn } from "@/lib/utils";
import { useAudio } from "@/providers/audio-provider";

type Service = (typeof services)[number];

/**
 * Desktop accordion panel — stateless.
 * Expansion is pure CSS (:hover / :focus-within on .services-accordion),
 * so hovering never triggers React renders, timeouts, or layout polling.
 * Closed: image + title only. Expanded: title, description, capabilities.
 */
function ServicePanel({
  service,
  isFirst,
  onActivate,
}: {
  service: Service;
  isFirst: boolean;
  /** Fired on hover/focus enter — parent plays only on real change. */
  onActivate: (id: string) => void;
}) {
  return (
    <article
      onMouseEnter={() => onActivate(service.id)}
      className={cn(
        "service-acc group relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card",
        "focus-within:ring-2 focus-within:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-secondary)]",
        "hover:z-[1] hover:border-border-hover hover:shadow-[var(--shadow-md)]",
        "focus-within:z-[1] focus-within:border-border-hover focus-within:shadow-[var(--shadow-md)]",
      )}
    >
      {/* keyboard control — focusing expands via :focus-within */}
      <button
        type="button"
        aria-label={`${service.title}. Focus to expand.`}
        className="absolute inset-0 z-20 h-full w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      />
      {/* image */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="service-acc__media absolute inset-0">
          <Image
            src={service.image}
            alt={service.imageAlt}
            fill
            sizes="(max-width: 1024px) 33vw, 55vw"
            className="object-cover"
            priority={isFirst}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
        <div
          className="service-acc__dim absolute inset-0 bg-black/20 transition-opacity duration-500 group-hover:bg-black/0 group-focus-within:bg-black/0"
          aria-hidden
        />
      </div>

      {/* closed minimal — title only over the image */}
      <div
        className="service-acc__inactive relative z-10 flex h-full min-h-0 flex-col justify-end p-5 md:p-6 lg:p-7"
        aria-hidden="true"
      >
        <h3 className="font-headline-lg text-[20px] leading-[1] font-extrabold tracking-[-0.02em] text-white md:text-[22px]">
          {service.title.toUpperCase()}
        </h3>
      </div>

      {/* expanded content */}
      <div
        className="service-acc__active relative z-10 flex h-full min-h-0 flex-col justify-end p-5 md:p-6 lg:p-7"
        aria-hidden="true"
      >
        <div className="min-w-0">
          <h3 className="max-w-[18rem] font-headline-lg text-[clamp(2.2rem,3.5vw,4rem)] leading-[0.95] font-extrabold tracking-[-0.02em] text-white">
            {service.title}
          </h3>
          <p className="mt-3 max-w-[28rem] font-body-md text-[16px] leading-[1.5] font-medium text-white/90">
            {service.approach}
          </p>
          <ul className="mt-4 border-t border-white/15">
            {service.focus.map((tag) => (
              <li
                key={tag}
                className="border-b border-white/15 py-2 font-sans text-[11px] font-medium tracking-[0.04em] text-white/80"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* cherry accent when expanded */}
      <span
        aria-hidden
        className="service-acc__accent absolute left-0 right-0 top-0 h-[2px] bg-[var(--accent-cherry)]"
      />
    </article>
  );
}

/**
 * Mobile — vertical stack with scroll-spy activation.
 * The card nearest the viewport center expands as the user scrolls —
 * no tap required. Tapping still toggles explicitly (keyboard/touch
 * control). One IntersectionObserver on the scroll container: no scroll
 * listeners, no RAF, no per-frame work.
 */
function MobileStack() {
  const { play } = useAudio();
  const [expandedId, setExpandedId] = useState<string | null>(
    services[0]?.id ?? null,
  );
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mountedRef = useRef(false);

  useEffect(() => {
    const root = getScrollContainer();
    const targets = cardRefs.current.filter(
      (el): el is HTMLDivElement => el !== null,
    );
    if (targets.length === 0) return;

    const mid = () => window.innerHeight / 2;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => {
            const rectA = a.boundingClientRect;
            const rectB = b.boundingClientRect;
            const distA = Math.abs((rectA.top + rectA.bottom) / 2 - mid());
            const distB = Math.abs((rectB.top + rectB.bottom) / 2 - mid());
            return distA - distB;
          });
        const nearest = visible[0];
        const id = nearest?.target.getAttribute("data-service-id");
        if (id) setExpandedId(id);
      },
      {
        root: root ?? null,
        rootMargin: "-38% 0px -38% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // One whisper when the scroll-spy focus actually changes cards —
  // never on mount, never repeatedly while scrolling.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (expandedId) play("service-expand");
  }, [expandedId, play]);

  return (
    <div className="flex flex-col gap-4">
      {services.map((service, idx) => {
        const isExpanded = expandedId === service.id;
        const panelId = `service-panel-${service.id}`;
        const buttonId = `service-button-${service.id}`;
        return (
          <Reveal key={service.id} index={idx} className="min-w-0">
            <div
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              data-service-id={service.id}
              className={cn(
                "relative overflow-hidden rounded-lg border border-border bg-card",
                isExpanded && "border-border-hover shadow-[var(--shadow-md)]",
              )}
            >
              <button
                type="button"
                id={buttonId}
                aria-expanded={isExpanded}
                aria-controls={panelId}
                onClick={() =>
                  setExpandedId((current) =>
                    current === service.id ? null : service.id,
                  )
                }
                className="relative block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="relative block min-h-[132px] w-full overflow-hidden">
                  <Image
                    src={service.image}
                    alt=""
                    aria-hidden
                    fill
                    sizes="100vw"
                    className={cn(
                      "object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
                      isExpanded ? "scale-[1.03]" : "scale-100",
                    )}
                    loading="lazy"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10"
                  />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                    <span className="font-headline-lg text-[24px] leading-[0.95] font-extrabold tracking-[-0.02em] text-white">
                      {service.title.toUpperCase()}
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition-transform duration-300 motion-reduce:transition-none",
                        isExpanded && "rotate-45",
                      )}
                    >
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.75}
                        strokeLinecap="round"
                      >
                        <path d="M8 3v10M3 8h10" />
                      </svg>
                    </span>
                  </span>
                </span>
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
                  isExpanded
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="px-5 pt-1 pb-5">
                    <p className="max-w-[26rem] text-[15px] leading-[1.5] font-medium text-foreground-secondary">
                      {service.approach}
                    </p>
                    <ul className="mt-4 border-t border-border">
                      {service.focus.map((t) => (
                        <li
                          key={t}
                          className="border-b border-border py-2 font-sans text-[11px] font-medium tracking-[0.04em] text-foreground"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <span
                className={cn(
                  "absolute left-0 right-0 top-0 h-[2px] bg-[var(--accent-cherry)] transition-opacity duration-300",
                  isExpanded ? "opacity-100" : "opacity-0",
                )}
                aria-hidden
              />
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  useCinematicSection(sectionRef, "services");
  const { play } = useAudio();
  const lastActiveRef = useRef<string | null>(null);

  // Desktop hover only makes a whisper when a DIFFERENT card takes
  // over — entering the same card repeatedly stays silent.
  const handleActivate = (id: string) => {
    if (lastActiveRef.current === id) return;
    lastActiveRef.current = id;
    play("service-expand");
  };

  return (
    <section
      ref={sectionRef}
      id="services"
      data-snap-frame
      className="section-frame section-tone-services !h-auto !min-h-0 !max-h-none overflow-visible py-8 md:py-10 lg:py-12"
      aria-labelledby="services-heading"
    >
      <Container className="w-full max-w-none">
        <h2
          id="services-heading"
          className="cinematic-layer cinematic-layer--title mb-5 text-center font-sans text-[min(clamp(3.5rem,7vw,6rem),calc((100vw-2.5rem)/5.2))] leading-[1.02] font-extrabold tracking-[-0.05em] text-foreground md:mb-8"
        >
          <AnimatedText segments="Services" />
        </h2>

        {/* Desktop — CSS-only accordion */}
        <div className="hidden md:block">
          <CssReveal delay={80}>
            <div
              className="cinematic-layer cinematic-layer--grid services-accordion flex h-[min(520px,calc(100svh-var(--nav-safe-top)-6rem))] min-w-0 gap-4 lg:gap-5"
              onMouseLeave={() => {
                lastActiveRef.current = null;
              }}
            >
              {services.map((service, idx) => (
                <ServicePanel
                  key={service.id}
                  service={service}
                  isFirst={idx === 0}
                  onActivate={handleActivate}
                />
              ))}
            </div>
          </CssReveal>
        </div>

        {/* Mobile — vertical scroll-spy stack (no carousel) */}
        <div className="md:hidden">
          <CssReveal delay={80}>
            <MobileStack />
          </CssReveal>
          {/* breathing room for floating navbar */}
          <div
            className="h-[max(1rem,calc(var(--nav-height)+env(safe-area-inset-bottom)+8px))]"
            aria-hidden
          />
        </div>
      </Container>
    </section>
  );
}
