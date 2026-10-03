"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { CssReveal } from "@/components/animations/css-reveal";
import { Reveal } from "@/components/animations/reveal";
import { AnimatedText } from "@/components/motion/animated-text";
import { Container } from "@/components/ui/container";
import { services } from "@/data";
import { useCinematicSection } from "@/hooks/use-cinematic-section";
import { useMediaQuery } from "@/hooks/use-media-query";
import { BLUR_PLACEHOLDER_DATA_URL } from "@/lib/image-placeholder";
import { getScrollContainer } from "@/lib/scroll-container";
import { cn } from "@/lib/utils";
import { useAudio } from "@/providers/audio-provider";

type Service = (typeof services)[number];

/**
 * Desktop accordion panel — ONE semantic active state drives geometry
 * (flex-grow) and content (opacity/translate) together, so text can
 * never float apart from its card. CSS owns the transitions; React
 * owns the state. Fully reversible in every direction.
 */
function ServicePanel({
  service,
  isActive,
  onActivate,
}: {
  service: Service;
  isActive: boolean;
  /** Fired on hover/focus/click — parent holds the canonical state. */
  onActivate: (id: string) => void;
}) {
  return (
    <article
      onMouseEnter={() => onActivate(service.id)}
      style={{ flexGrow: isActive ? 3.2 : 1 }}
      className={cn(
        "service-acc group relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card will-change-[flex-grow]",
        "focus-within:ring-2 focus-within:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-secondary)]",
        "hover:z-[1] hover:border-border-hover hover:shadow-[var(--shadow-md)]",
        "focus-within:z-[1] focus-within:border-border-hover focus-within:shadow-[var(--shadow-md)]",
        isActive && "z-[1] border-border-hover shadow-[var(--shadow-md)]",
      )}
    >
      {/* keyboard + touch control — focusing/selecting joins the same
          active-service path as hover (visual + sound unified) */}
      <button
        type="button"
        aria-label={`${service.title}. Select to expand.`}
        aria-expanded={isActive}
        onFocus={() => onActivate(service.id)}
        onClick={() => onActivate(service.id)}
        className="absolute inset-0 z-20 h-full w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      />
      {/* image — dimmer and quieter when inactive */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "service-acc__media absolute inset-0 transition-opacity duration-500 ease-out motion-reduce:transition-none",
            isActive ? "opacity-90" : "opacity-35",
          )}
        >
          <Image
            src={service.image}
            alt={service.imageAlt}
            fill
            sizes="(max-width: 1024px) 33vw, 55vw"
            className="object-cover"
            // Below-fold and never LCP (the hero portrait owns LCP with its
            // own preload). No `priority`: the desktop subtree is hidden
            // on mobile, where a priority image would still download.
            loading="lazy"
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER_DATA_URL}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
        <div
          className={cn(
            "absolute inset-0 bg-black/20 transition-opacity duration-500 motion-reduce:transition-none",
            isActive ? "opacity-0" : "opacity-100",
          )}
          aria-hidden
        />
      </div>

      {/* quiet state — centered title only, clearly secondary */}
      <div
        className={cn(
          "relative z-10 flex h-full min-h-0 flex-col items-center justify-center p-5 text-center transition-opacity duration-300 ease-out motion-reduce:transition-none",
          isActive ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        aria-hidden="true"
      >
        <h3 className="font-headline-lg text-[18px] leading-[1.05] font-extrabold tracking-[-0.02em] text-white/90 md:text-[19px]">
          {service.title.toUpperCase()}
        </h3>
      </div>

      {/* focal state — title, description, capabilities */}
      <div
        className={cn(
          "relative z-10 flex h-full min-h-0 flex-col justify-end p-5 transition-opacity duration-500 ease-out motion-reduce:transition-none md:p-6 lg:p-7",
          isActive ? "opacity-100" : "pointer-events-none opacity-0",
        )}
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
        className={cn(
          "absolute left-0 right-0 top-0 h-[2px] bg-[var(--accent-cherry)] transition-opacity duration-300 motion-reduce:transition-none",
          isActive ? "opacity-100" : "opacity-0",
        )}
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
function MobileStack({
  activeId,
  onActiveChange,
}: {
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
}) {
  const stackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stack = stackRef.current;
    const scrollContainer = getScrollContainer();
    if (!stack || !scrollContainer) return;

    const visibility = new Map<Element, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target, entry.isIntersecting);
        }

        const rootRect = scrollContainer.getBoundingClientRect();
        const rootCenter = rootRect.top + rootRect.height / 2;
        let nearestId: string | null = null;
        let nearestDistance = Number.POSITIVE_INFINITY;

        stack
          .querySelectorAll<HTMLElement>("[data-service-id]")
          .forEach((card) => {
            if (!visibility.get(card)) return;
            const rect = card.getBoundingClientRect();
            const distance = Math.abs(rect.top + rect.height / 2 - rootCenter);
            if (distance < nearestDistance) {
              nearestId = card.dataset.serviceId ?? null;
              nearestDistance = distance;
            }
          });

        onActiveChange(nearestId);
      },
      {
        root: scrollContainer,
        rootMargin: "-35% 0px -35% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    stack.querySelectorAll<HTMLElement>("[data-service-id]").forEach((card) => {
      visibility.set(card, false);
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, [onActiveChange]);

  return (
    <div ref={stackRef} className="flex flex-col gap-4">
      {services.map((service) => {
        const isExpanded = activeId === service.id;
        const panelId = `service-panel-${service.id}`;
        const buttonId = `service-button-${service.id}`;
        return (
          <Reveal key={service.id} className="min-w-0">
            <div
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
                  onActiveChange(activeId === service.id ? null : service.id)
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
                    className="object-cover"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER_DATA_URL}
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
  // Canonical active service — desktop hover/focus/click and the
  // mobile scroll-spy/tap all read and write this ONE state, so both
  // breakpoints (and sound) can never disagree.
  const [activeId, setActiveId] = useState<string | null>(null);
  // Breakpoint-gated subtrees (matches md:): only the visible layout
  // mounts, so the hidden breakpoint's next/image set never requests.
  // Client-only section (ssr:false), so matchMedia is correct on first
  // paint — no SSR mismatch. Same pattern as Hero's desktop/mobile split.
  const isDesktopLayout = useMediaQuery("(min-width: 768px)");
  const mountedRef = useRef(false);

  // The single change whisper for both breakpoints — never on mount,
  // never on repeat selection (state bails out when unchanged).
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (activeId) play("service-expand");
  }, [activeId, play]);

  return (
    <section
      ref={sectionRef}
      id="services"
      className="section-frame section-tone-services !h-auto !min-h-0 !max-h-none overflow-visible py-8 md:py-10 lg:py-12"
      aria-labelledby="services-heading"
    >
      <Container className="w-full max-w-none">
        <h2
          id="services-heading"
          className="cinematic-layer cinematic-layer--title mb-5 text-center font-sans text-[min(clamp(3.5rem,7vw,6rem),calc((100vw-2.5rem)/5.2))] leading-[1.02] font-extrabold tracking-[-0.05em] text-foreground md:mb-8"
        >
          <AnimatedText segments="Services" level="word" />
        </h2>

        {/* Desktop — state-driven accordion. Card height derives
            from viewport minus heading, navbar safe zone and
            breathing room, so cards always finish above the pill. */}
        {isDesktopLayout ? (
          <div className="hidden md:block">
            <CssReveal>
              <div
                className="cinematic-layer cinematic-layer--grid services-accordion flex h-[clamp(300px,calc(100svh-var(--nav-safe-top)-var(--floating-nav-clearance)-11rem),560px)] min-w-0 gap-4 lg:gap-5"
                onMouseLeave={() => setActiveId(null)}
              >
                {services.map((service) => (
                  <ServicePanel
                    key={service.id}
                    service={service}
                    isActive={activeId === service.id}
                    onActivate={setActiveId}
                  />
                ))}
              </div>
            </CssReveal>
          </div>
        ) : (
          /* Mobile — vertical scroll-spy stack (no carousel) */
          <div className="md:hidden">
            <CssReveal>
              <MobileStack activeId={activeId} onActiveChange={setActiveId} />
            </CssReveal>
            {/* breathing room for floating navbar */}
            <div
              className="h-[max(1rem,calc(var(--nav-height)+env(safe-area-inset-bottom)+8px))]"
              aria-hidden
            />
          </div>
        )}
      </Container>
    </section>
  );
}
