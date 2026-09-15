"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/animations/reveal";
import { Container } from "@/components/ui/container";
import { SectionTitle } from "@/components/ui/section-title";
import { services } from "@/data";
import { useCinematicSection } from "@/hooks/use-cinematic-section";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { getScrollContainer } from "@/lib/scroll-container";
import { cn } from "@/lib/utils";

const INITIAL_ACTIVE = services[0]?.id ?? "video-editing";

type Service = (typeof services)[number];

function ServicePanel({
  service,
  number,
  isActive,
  onActivate,
  prefersReducedMotion,
}: {
  service: Service;
  number: string;
  isActive: boolean;
  onActivate: () => void;
  prefersReducedMotion: boolean;
}) {
  return (
    <article
      onMouseEnter={onActivate}
      className={cn(
        "group relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-[var(--background-secondary)]",
        prefersReducedMotion
          ? "transition-none"
          : "transition-[flex-grow,opacity,border-color,box-shadow] duration-[620ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        isActive && "z-[1] border-border-hover shadow-[var(--shadow-md)]",
      )}
      style={{
        flexGrow: isActive ? 4 : 1,
        flexBasis: 0,
        flexShrink: 1,
        opacity: 1,
      }}
    >
      {/* keyboard & pointer control — a real button over the whole panel */}
      <button
        type="button"
        aria-label={`${service.title}. ${isActive ? "Expanded" : "Expand"}`}
        aria-expanded={isActive}
        onClick={onActivate}
        onFocus={onActivate}
        className="absolute inset-0 z-20 h-full w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      />
      {/* image */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 transition-[transform,opacity] duration-[680ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            prefersReducedMotion && "transition-none",
            isActive
              ? "scale-[1.04] opacity-[0.9]"
              : "scale-[1.02] opacity-[0.48]",
          )}
        >
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
          className={cn(
            "absolute inset-0 bg-black/0 transition-opacity duration-500",
            !isActive && "bg-black/20",
          )}
          aria-hidden
        />
      </div>

      {/* inactive minimal */}
      <div
        className={cn(
          "relative z-10 flex h-full min-h-0 flex-col justify-between p-5 md:p-6 lg:p-7 transition-opacity duration-300",
          isActive
            ? "opacity-0 pointer-events-none absolute inset-0"
            : "opacity-100",
          prefersReducedMotion && "transition-none",
        )}
        aria-hidden={isActive}
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
        className={cn(
          "relative z-10 flex h-full min-h-0 flex-col justify-end p-5 md:p-6 lg:p-7",
          prefersReducedMotion
            ? "transition-none"
            : "transition-[opacity,transform] duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          isActive
            ? "opacity-100 translate-y-0 delay-[90ms]"
            : "pointer-events-none absolute inset-0 translate-y-2 opacity-0",
        )}
        aria-hidden={!isActive}
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

      {/* cherry accent when active */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 right-0 top-0 h-[2px] bg-[var(--accent-cherry)] transition-opacity duration-300",
          isActive ? "opacity-100" : "opacity-0",
        )}
      />
    </article>
  );
}

function MobileStage({
  activeId,
  setActiveId,
}: {
  activeId: string | null;
  setActiveId: (id: string) => void;
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const refs = useRef<Map<string, HTMLElement>>(new Map());
  const setRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) refs.current.set(id, el);
      else refs.current.delete(id);
    },
    [],
  );

  // Deterministic single controller — center-distance + hysteresis
  useEffect(() => {
    if (!isMobile) return;
    const root = getScrollContainer();
    if (!root) return;
    let raf = 0;
    let ticking = false;

    const getFocusCenter = () => {
      const navSafe =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--nav-safe-top",
          ),
        ) || 108;
      const usableTop = Math.min(navSafe, root.clientHeight * 0.22);
      const usableH = Math.max(
        root.clientHeight - usableTop,
        root.clientHeight * 0.55,
      );
      return usableTop + usableH * 0.5;
    };

    const evaluate = () => {
      ticking = false;
      const focusCenter = getFocusCenter();
      let bestId: string | null = null;
      let bestDist = Infinity;
      let bestVisibility = 0;
      const scores = new Map<string, number>();
      refs.current.forEach((el, id) => {
        const rect = el.getBoundingClientRect();
        // Convert to viewport-relative for distance calc
        const elCenter = rect.top + rect.height / 2;
        const dist = Math.abs(
          elCenter - (root.getBoundingClientRect().top + focusCenter),
        );
        const visibleH = Math.max(
          0,
          Math.min(rect.bottom, root.clientHeight) - Math.max(rect.top, 0),
        );
        const visibility = rect.height > 0 ? visibleH / rect.height : 0;
        scores.set(id, visibility);
        if (visibility < 0.35) return; // require meaningful visibility
        if (dist < bestDist) {
          bestDist = dist;
          bestId = id;
          bestVisibility = visibility;
        }
      });
      if (!bestId || bestVisibility < 0.35) return;
      const current = activeId;
      if (bestId === current) return;
      // hysteresis — don't flip unless clearly more central
      if (current) {
        const curEl = refs.current.get(current);
        if (curEl) {
          const curRect = curEl.getBoundingClientRect();
          const curCenter = curRect.top + curRect.height / 2;
          const curDist = Math.abs(
            curCenter - (root.getBoundingClientRect().top + getFocusCenter()),
          );
          if (bestDist + 32 > curDist) return; // need 32px advantage
          const curVis = scores.get(current) ?? 0;
          if (bestVisibility < curVis + 0.12) return;
        }
      }
      setActiveId(bestId);
    };

    const schedule = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(evaluate);
    };

    const onScroll = () => schedule();
    const onResize = () => schedule();
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    // also observe for layout changes
    const ro = new ResizeObserver(schedule);
    refs.current.forEach((el) => ro.observe(el));
    schedule();
    return () => {
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [setActiveId, isMobile, activeId]);

  return (
    <div className="flex flex-col gap-3">
      {services.map((service, idx) => {
        const number = String(idx + 1).padStart(2, "0");
        const isActive = activeId === service.id;
        return (
          <div
            key={service.id}
            ref={setRef(service.id)}
            data-service-trigger={service.id}
            className={cn(
              "relative overflow-hidden rounded-lg border border-border bg-card transition-[flex,opacity] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              isActive ? "flex-[2.6] opacity-100" : "flex-[1] opacity-95",
            )}
            style={{ minHeight: isActive ? "min(62svh, 420px)" : "86px" }}
          >
            <button
              type="button"
              onClick={() => setActiveId(service.id)}
              className="absolute inset-0 z-20 h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              aria-label={`${service.title} ${isActive ? "expanded" : "expand"}`}
              aria-expanded={isActive}
            />
            <div className="absolute inset-0">
              <Image
                src={service.image}
                alt={service.imageAlt}
                fill
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/15" />
            </div>
            {/* collapsed bar */}
            <div
              className={cn(
                "relative z-10 flex h-[86px] items-center justify-between p-4 transition-opacity duration-300",
                isActive
                  ? "pointer-events-none opacity-0 absolute"
                  : "opacity-100",
              )}
              aria-hidden={isActive}
            >
              <span className="font-mono text-[11px] tracking-[0.18em] text-white/70">
                {number}
              </span>
              <span className="font-headline-lg text-[16px] tracking-[-0.01em] text-white">
                {service.title.toUpperCase()}
              </span>
            </div>
            {/* expanded */}
            <div
              className={cn(
                "relative z-10 flex h-full min-h-[min(62svh,420px)] flex-col justify-end p-5 transition-[opacity,transform] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                isActive
                  ? "opacity-100 translate-y-0"
                  : "pointer-events-none absolute inset-0 translate-y-2 opacity-0",
              )}
              aria-hidden={!isActive}
            >
              <span className="font-mono text-[11px] tracking-[0.18em] text-white/70">
                {number} / {service.title.toUpperCase()}
              </span>
              <h3 className="mt-2 font-headline-lg text-[22px] leading-tight text-white">
                {service.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-white/85">
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
            <span
              className={cn(
                "absolute left-0 right-0 top-0 h-[2px] bg-[var(--accent-cherry)]",
                isActive ? "opacity-100" : "opacity-0",
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
  const [activeId, setActiveId] = useState<string | null>(INITIAL_ACTIVE);
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleActivate = useCallback((id: string) => {
    if (clearRef.current) {
      clearTimeout(clearRef.current);
      clearRef.current = null;
    }
    setActiveId(id);
  }, []);

  const handleLeave = useCallback(() => {
    if (clearRef.current) clearTimeout(clearRef.current);
    clearRef.current = setTimeout(() => setActiveId(null), 90);
  }, []);

  useEffect(() => {
    return () => {
      if (clearRef.current) clearTimeout(clearRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="services"
      data-snap-frame
      data-scroll-anchor-ratio="0.44"
      className="section-frame section-tone-services !h-auto !min-h-0 !max-h-none overflow-visible py-8 md:py-10 lg:py-12"
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

        {/* Desktop */}
        <div className="hidden md:block">
          <Reveal index={1}>
            <div
              className="cinematic-layer cinematic-layer--grid flex h-[min(520px,calc(100svh-var(--nav-safe-top)-6rem))] min-w-0 gap-4 lg:gap-5"
              onMouseLeave={handleLeave}
            >
              {services.map((service, idx) => {
                const number = String(idx + 1).padStart(2, "0");
                const isActive = activeId === service.id;
                return (
                  <ServicePanel
                    key={service.id}
                    service={service}
                    number={number}
                    isActive={isActive}
                    onActivate={() => handleActivate(service.id)}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                );
              })}
            </div>
          </Reveal>
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <Reveal index={1}>
            <div className="cinematic-layer cinematic-layer--grid">
              <MobileStage activeId={activeId} setActiveId={setActiveId} />
            </div>
          </Reveal>
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
