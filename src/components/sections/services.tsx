"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { CssReveal } from "@/components/animations/css-reveal";
import { Container } from "@/components/ui/container";
import { SectionTitle } from "@/components/ui/section-title";
import { services } from "@/data";
import { useCinematicSection } from "@/hooks/use-cinematic-section";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type Service = (typeof services)[number];

/**
 * Desktop accordion panel — stateless.
 * Expansion is pure CSS (:hover / :focus-within on .services-accordion),
 * so hovering never triggers React renders, timeouts, or layout polling.
 */
function ServicePanel({
  service,
  number,
  prefersReducedMotion,
}: {
  service: Service;
  number: string;
  prefersReducedMotion: boolean;
}) {
  return (
    <article
      className={cn(
        "service-acc group relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-[var(--background-secondary)]",
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
            priority={number === "01"}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
        <div
          className="service-acc__dim absolute inset-0 bg-black/20 transition-opacity duration-500 group-hover:bg-black/0 group-focus-within:bg-black/0"
          aria-hidden
        />
      </div>

      {/* inactive minimal */}
      <div
        className="service-acc__inactive relative z-10 flex h-full min-h-0 flex-col justify-between p-5 md:p-6 lg:p-7"
        aria-hidden="true"
      >
        <span className="font-mono text-[11px] tracking-[0.18em] text-white/70">
          {number}
        </span>
        <h3 className="font-headline-lg text-[18px] leading-[1.15] tracking-[-0.02em] text-white md:text-[19px]">
          {service.title.toUpperCase()}
        </h3>
      </div>

      {/* active content */}
      <div
        className="service-acc__active relative z-10 flex h-full min-h-0 flex-col justify-end p-5 md:p-6 lg:p-7"
        aria-hidden="true"
      >
        <div className="min-w-0">
          <span className="font-mono text-[11px] tracking-[0.2em] text-white/70">
            {number} / {service.title.toUpperCase()}
          </span>
          <h3 className="mt-2 max-w-[18rem] font-headline-lg text-[22px] leading-tight tracking-[-0.02em] text-white md:text-[26px] lg:text-[28px]">
            {service.title}
          </h3>
          <p className="mt-3 max-w-[28rem] font-body-md text-[13px] leading-relaxed text-white/90 md:text-[14px]">
            {service.approach}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2 border-t border-white/15 pt-4">
            {service.focus.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-white/85"
              >
                {tag.toUpperCase()}
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
      {prefersReducedMotion ? <span className="sr-only">{number}</span> : null}
    </article>
  );
}

/**
 * Mobile — vertical stack, tap-to-expand.
 * Activation only (button press); no scroll spy, no RAF, no getBoundingClientRect.
 */
function MobileStack() {
  const [expandedId, setExpandedId] = useState<string | null>(
    services[0]?.id ?? null,
  );

  return (
    <div className="flex flex-col gap-3">
      {services.map((service, idx) => {
        const number = String(idx + 1).padStart(2, "0");
        const isExpanded = expandedId === service.id;
        const panelId = `service-panel-${service.id}`;
        const buttonId = `service-button-${service.id}`;
        return (
          <div
            key={service.id}
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
              className="relative z-10 flex min-h-[86px] w-full items-center justify-between gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span className="font-mono text-[11px] tracking-[0.18em] text-foreground-secondary">
                {number}
              </span>
              <span className="flex-1 font-headline-lg text-[16px] tracking-[-0.01em] text-foreground">
                {service.title.toUpperCase()}
              </span>
              <span
                aria-hidden
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-foreground-secondary transition-transform duration-300",
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
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isExpanded
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="relative min-h-[min(52svh,360px)]">
                  <Image
                    src={service.image}
                    alt={service.imageAlt}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
                  <div className="relative z-10 flex h-full min-h-[min(52svh,360px)] flex-col justify-end p-5">
                    <h3 className="font-headline-lg text-[22px] leading-tight text-white">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/85">
                      {service.approach}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {service.focus.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-white/15 bg-white/5 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-white/80"
                        >
                          {t.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
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
        );
      })}
    </div>
  );
}

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  useCinematicSection(sectionRef, "services");
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      ref={sectionRef}
      id="services"
      data-snap-frame
      className="section-frame section-tone-services !h-auto !min-h-0 !max-h-none overflow-visible py-8 md:py-10 lg:py-12"
      aria-labelledby="services-heading"
    >
      <Container className="w-full max-w-none">
        <CssReveal>
          <SectionTitle
            as="h2"
            id="services-heading"
            className="cinematic-layer cinematic-layer--title mb-5 md:mb-8"
          >
            Services
          </SectionTitle>
        </CssReveal>

        {/* Desktop — CSS-only accordion */}
        <div className="hidden md:block">
          <CssReveal delay={80}>
            <div className="services-accordion flex h-[min(520px,calc(100svh-var(--nav-safe-top)-6rem))] min-w-0 gap-4 lg:gap-5">
              {services.map((service, idx) => (
                <ServicePanel
                  key={service.id}
                  service={service}
                  number={String(idx + 1).padStart(2, "0")}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ))}
            </div>
          </CssReveal>
        </div>

        {/* Mobile — vertical tap-to-expand stack (no carousel, no spy) */}
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
