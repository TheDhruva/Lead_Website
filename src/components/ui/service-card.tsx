"use client";

import Image from "next/image";
import { type KeyboardEvent, forwardRef, memo } from "react";

import { m } from "framer-motion";
import { Code2, Film, type LucideIcon, PenTool } from "lucide-react";

import { MOTION } from "@/constants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { Service, ServiceIcon } from "@/types";

const SERVICE_ICONS: Record<ServiceIcon, LucideIcon> = {
  movie: Film,
  code: Code2,
  design_services: PenTool,
};

const LAYOUT_TRANSITION = {
  layout: MOTION.layout,
  opacity: { duration: 0.4, ease: MOTION.layout.ease },
};

function ServiceIconGlyph({
  icon,
  className,
}: {
  icon: ServiceIcon;
  className?: string;
}) {
  const Icon = SERVICE_ICONS[icon] ?? Film;
  return <Icon aria-hidden="true" strokeWidth={1.5} className={className} />;
}

interface ServiceCardProps {
  service: Service;
  isExpanded: boolean;
  isDimmed: boolean;
  onActivate: () => void;
  enableHoverExpand?: boolean;
  loadImage?: boolean;
  /** Mobile scroll spotlight — CSS vars updated on the element directly */
  useTouchSpotlight?: boolean;
  className?: string;
}

const cardShellClass =
  "service-card relative flex min-h-0 min-w-0 basis-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card inner-glow outline-none active:scale-[0.985] motion-reduce:active:scale-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-secondary)]";

function ServiceCardMedia({
  service,
  isExpanded,
  loadImage,
}: {
  service: Service;
  isExpanded: boolean;
  loadImage: boolean;
}) {
  return (
    <>
      <div
        className={cn(
          "service-card__media absolute inset-0",
          isExpanded && "service-card__media--expanded",
        )}
      >
        {loadImage ? (
          <Image
            src={service.image}
            alt={service.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 55vw"
            loading="lazy"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-muted" aria-hidden="true" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/25" />
    </>
  );
}

function CardBody({
  service,
  isExpanded,
  loadImage,
}: {
  service: Service;
  isExpanded: boolean;
  loadImage: boolean;
}) {
  return (
    <>
      <div className="absolute inset-0 z-0 overflow-hidden">
        <ServiceCardMedia
          service={service}
          isExpanded={isExpanded}
          loadImage={loadImage}
        />
      </div>

      <div className="relative z-10 flex h-full min-h-0 min-w-0 flex-col justify-end overflow-hidden p-5 sm:p-6 md:p-7 lg:p-8">
        <div className="min-w-0 shrink-0">
          <ServiceIconGlyph
            icon={service.icon}
            className="mb-3 block text-3xl text-white md:text-4xl"
          />
          <h3 className="truncate font-headline-lg text-[22px] leading-tight text-white md:text-[26px] lg:text-[28px]">
            {service.title}
          </h3>
        </div>

        <div
          aria-hidden={!isExpanded}
          className={cn(
            "grid min-w-0 overflow-hidden transition-[grid-template-rows,opacity,margin] duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            isExpanded
              ? "mt-4 grid-rows-[1fr] opacity-100"
              : "mt-0 grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 min-w-0 overflow-hidden">
            <p className="mb-3 line-clamp-4 min-w-0 break-words font-body-md text-sm leading-relaxed text-white/90 md:line-clamp-3 md:text-[15px]">
              {service.approach}
            </p>
            <ul className="min-w-0 space-y-2 border-t border-white/20 pt-3">
              {service.focus.map((item) => (
                <li
                  key={item}
                  className="flex min-w-0 items-start gap-2.5 text-[13px] text-white/85 md:text-sm"
                >
                  <span
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-white"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 break-words leading-snug">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p
          className={cn(
            "mt-2 line-clamp-2 min-w-0 break-words font-body-md text-sm leading-snug text-white/70 transition-opacity duration-300 motion-reduce:transition-none md:text-[15px]",
            isExpanded
              ? "pointer-events-none h-0 overflow-hidden opacity-0"
              : "opacity-100",
          )}
        >
          {service.description}
        </p>
      </div>
    </>
  );
}

const ServiceCardComponent = forwardRef<HTMLElement, ServiceCardProps>(
  function ServiceCardComponent(
    {
      service,
      isExpanded,
      isDimmed,
      onActivate,
      enableHoverExpand = true,
      loadImage = false,
      useTouchSpotlight = false,
      className,
    },
    ref,
  ) {
    const prefersReducedMotion = useReducedMotion();

    return (
      <m.article
        ref={ref}
        layout={!useTouchSpotlight && !prefersReducedMotion}
        transition={LAYOUT_TRANSITION}
        data-service-id={service.id}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${service.title}. ${isExpanded ? "Expanded details" : "Expand for approach details"}`}
        onMouseEnter={enableHoverExpand ? onActivate : undefined}
        onFocus={enableHoverExpand ? onActivate : undefined}
        onClick={onActivate}
        onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onActivate();
          }
        }}
        className={cn(
          cardShellClass,
          useTouchSpotlight && "service-card--touch",
          isExpanded && "service-card--expanded z-10 shadow-[var(--shadow-lg)]",
          isDimmed && "service-card--dimmed",
          className,
        )}
        style={
          useTouchSpotlight
            ? undefined
            : {
                flex: isExpanded ? 2.85 : 1,
                opacity: isDimmed ? 0.7 : 1,
              }
        }
      >
        <CardBody
          service={service}
          isExpanded={isExpanded}
          loadImage={loadImage}
        />
      </m.article>
    );
  },
);

export const ServiceCard = memo(ServiceCardComponent);
