"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  AnimatePresence,
  m,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";

import { AnimatedText } from "@/components/motion/animated-text";
import { Container } from "@/components/ui/container";
import { projectRows } from "@/data";
import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { useCinematicSection } from "@/hooks/use-cinematic-section";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useSectionEnterSound } from "@/hooks/use-section-enter-sound";
import { getScrollContainer } from "@/lib/scroll-container";
import { cn } from "@/lib/utils";
import { useAudio } from "@/providers/audio-provider";
import type { Project } from "@/types";

interface GalleryItem extends Project {
  number: string;
  /**
   * Explicit presentation ratio, probed from the shipped asset —
   * all six artworks are square 1254×1254 canvases, so every well
   * is honestly 1/1. Future wide/portrait assets change only this
   * pair and the frame follows (never cropped, never stretched).
   */
  mediaRatio: string;
  /** Numeric w/h — the well width is height × ratioNum. */
  ratioNum: number;
}

/* Six curated works, deck order: websites anchor, identities interleave. */
const gallery: GalleryItem[] = (() => {
  const flat: Project[] = [
    projectRows[0]!.website,
    projectRows[0]!.brands[1]!, // Product Brand Identity
    projectRows[1]!.brands[0]!, // Apparel Typography
    projectRows[1]!.brands[1]!, // Event Poster
    projectRows[1]!.website,
    projectRows[0]!.brands[0]!, // Local Restaurant
  ];
  const ordered = [
    flat[0],
    flat[2],
    flat[3],
    flat[4],
    flat[1],
    flat[5],
  ] as Project[];
  // Ratios probed from shipped assets (all 1254×1254): every entry
  // is honestly square.
  return ordered.map((p, i) => ({
    ...p,
    number: String(i + 1).padStart(2, "0"),
    mediaRatio: "1 / 1",
    ratioNum: 1,
  }));
})();

const COUNT = gallery.length;
/**
 * Scroll-progress half-window (in 0–1 track units) each takeover
 * occupies. MUST stay below half a segment (1/6 ÷ 2 ≈ 0.083) or the
 * enter/exit keyframes overlap and WAAPI throws non-monotonic offsets.
 */
const WINDOW = 0.07;

/**
 * Extend parallel keyframe channels to span the full [0, 1] progress
 * range with flat holds at both ends. Framer's accelerated opacity
 * path hands these arrays straight to WAAPI, and Web Animations'
 * implicit-keyframe generation (L1) synthesises a missing offset-1
 * keyframe from the element's UNDERLYING mounted style — without this,
 * the deck's final stretch interpolates back toward the mounted
 * opacity (card 1 flashing at the end of the deck). The JS
 * interpolation path already clamps at both ends, so the flat holds
 * are pixel-identical there.
 */
function extendKeyframesToFullRange(
  keys: number[],
  ...channels: unknown[][]
): void {
  if (keys.length === 0) return;
  if (keys[0]! > 0) {
    keys.unshift(0);
    for (const channel of channels) channel.unshift(channel[0]!);
  }
  if (keys[keys.length - 1]! < 1) {
    keys.push(1);
    for (const channel of channels) {
      channel.push(channel[channel.length - 1]!);
    }
  }
}

/**
 * Dev-only regression guard for the deck keyframe contract: every
 * channel stays aligned (equal length), offsets are strictly
 * increasing, and the range is pinned to exactly [0, 1]. Breaks loudly
 * in development if a future edit reintroduces the implicit-keyframe
 * tail or non-monotonic offsets (WAAPI throws on those).
 */
function assertKeyframesCoherent(
  keys: number[],
  channels: Array<{ length: number }>,
): void {
  if (process.env.NODE_ENV === "production") return;
  const fail = (reason: string): never => {
    throw new Error(`ImageSheet keyframes: ${reason}`);
  };
  if (keys.length === 0) fail("empty offset list");
  for (const channel of channels) {
    if (channel.length !== keys.length) {
      fail(`channel length ${channel.length} != ${keys.length} offsets`);
    }
  }
  if (keys[0] !== 0) fail(`first offset ${keys[0]} !== 0`);
  if (keys[keys.length - 1] !== 1)
    fail(`last offset ${keys[keys.length - 1]} !== 1`);
  for (let i = 1; i < keys.length; i++) {
    if (!(keys[i]! > keys[i - 1]!)) {
      fail(
        `offsets not strictly increasing at ${i} (${keys[i - 1]} → ${keys[i]})`,
      );
    }
  }
}

/* ─────────────────────────────────────────────────────────────
   Deck mechanics, adapted from Componentry's sticky-scroll-cards:
   a tall track holds ONE sticky full-viewport stage. The media
   cell layers all six images (scroll-driven rise/recede, later
   sheets above earlier ones); the info cell holds a SINGLE
   viewport whose content crossfades on the active index. No
   Lenis — progress is measured against the native #scroll-container.
   ───────────────────────────────────────────────────────────── */

/**
 * ImageSheet — one print in the media stack. Media only: no text
 * ever lives inside a sheet, so text can never pile up. Idle sheets
 * park far outside the clipped stage; only the active takeover is
 * ever visible.
 */
function ImageSheet({
  project,
  index,
  progress,
  isActive,
  gentle,
}: {
  project: GalleryItem;
  index: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  isActive: boolean;
  gentle: boolean;
}) {
  const b0 = index / COUNT;

  // Rise window, then one settle window per takeover above this
  // sheet: it recedes, then deepens a step for every further card
  // that stacks on top. Replaced sheets REMAIN beneath as a visible
  // pile instead of flying out of the stage. Monotonic inputs;
  // interpolation clamps at both ends.
  const riseY = gentle ? "40svh" : "60svh";
  const nearY = gentle ? "10svh" : "14svh";
  const stepScale = gentle ? 0.008 : 0.012;
  const stepY = gentle ? 1 : 1.5;
  const stepOpacity = gentle ? 0.03 : 0.05;
  const baseScale = gentle ? 0.985 : 0.97;
  const baseY = gentle ? -2 : -3;
  const baseOpacity = gentle ? 0.88 : 0.82;

  const keys: number[] = [];
  const ys: string[] = [];
  const scales: number[] = [];
  const opacities: number[] = [];

  if (index === 0) {
    // Card 0 starts primary — no entrance travel.
    keys.push(0);
    ys.push("0svh");
    scales.push(1);
    opacities.push(1);
  } else {
    // Takeover window translated one WINDOW earlier so the rise
    // COMPLETES exactly at the index boundary b0: the incoming card
    // reaches full opacity the moment the active index flips to it,
    // so text and visual dominance change as one card. Same window
    // width and curve — only the placement moved.
    keys.push(b0 - WINDOW * 2, b0 - WINDOW * 1.3, b0);
    ys.push(riseY, nearY, "0svh");
    scales.push(baseScale, 0.985, 1);
    opacities.push(0, 0.3, 1);
  }
  // Settle windows: one per takeover above this sheet. Depth d =
  // cards resting above after boundary j. Flat holds between
  // windows come free from duplicate consecutive values.
  for (let j = index + 1; j < COUNT; j++) {
    const d = j - index;
    keys.push(j / COUNT - WINDOW, j / COUNT + WINDOW);
    const deepY = `${(baseY - stepY * (d - 1)).toFixed(2)}svh`;
    const prevY =
      d === 1 ? "0svh" : `${(baseY - stepY * (d - 2)).toFixed(2)}svh`;
    ys.push(prevY, deepY);
    const deepS = Number((baseScale - stepScale * (d - 1)).toFixed(4));
    const prevS =
      d === 1 ? 1 : Number((baseScale - stepScale * (d - 2)).toFixed(4));
    scales.push(prevS, deepS);
    const deepO = Number(
      Math.max(0.5, baseOpacity - stepOpacity * (d - 1)).toFixed(3),
    );
    const prevO =
      d === 1
        ? 1
        : Number(Math.max(0.5, baseOpacity - stepOpacity * (d - 2)).toFixed(3));
    opacities.push(prevO, deepO);
  }

  // Pin both ends of the range before handing the arrays to Framer
  // (accelerated WAAPI) — see extendKeyframesToFullRange.
  extendKeyframesToFullRange(keys, ys, scales, opacities);
  assertKeyframesCoherent(keys, [keys, ys, scales, opacities]);

  const y = useTransform(progress, keys, ys);
  const scale = useTransform(progress, keys, scales);
  const opacity = useTransform(progress, keys, opacities);

  return (
    <m.div
      aria-hidden
      style={{ y, scale, opacity, zIndex: index + 1 }}
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div className="relative overflow-hidden rounded-lg border border-border bg-muted shadow-[var(--shadow-sm)]">
        <div
          className="relative mx-auto h-[var(--wh)] max-w-full [width:min(100%,92vw,calc(var(--wh)*var(--rw)))] [--wh:34svh] md:[--wh:52svh] lg:[--wh:58svh] max-[380px]:[--wh:30svh]"
          style={{
            aspectRatio: project.mediaRatio,
            ["--rw" as string]: project.ratioNum,
          }}
        >
          <Image
            src={project.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 48vw, 94vw"
            priority={index < 2}
            loading={index < 2 ? "eager" : "lazy"}
            className="object-contain object-center"
          />
        </div>
        <span
          aria-hidden
          className={cn(
            "absolute inset-x-0 top-0 h-[2px] bg-[var(--accent-cherry)] transition-opacity duration-300",
            isActive ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </m.div>
  );
}

/**
 * InfoBlock — the single information viewport's content for one
 * project. Rendered either inside the crossfade (deck mode) or
 * inline per project (reduced-motion static list).
 */
function InfoBlock({ project }: { project: GalleryItem }) {
  const href = project.href ?? "#contact";
  const isExternal = href.startsWith("http");
  const { play } = useAudio();
  const canHoverTick = useCanPointerReact();

  return (
    <div className="min-w-0">
      <p className="font-sans text-[11px] font-semibold tracking-[0.2em] text-foreground-secondary">
        {project.category.toUpperCase()}
      </p>
      <h3 className="mt-2 font-sans text-[clamp(1.9rem,8vw,2.4rem)] leading-[1.05] font-extrabold tracking-[-0.02em] text-balance text-foreground md:mt-3 lg:text-[clamp(3rem,4.5vw,3.5rem)] max-[380px]:text-[1.7rem]">
        {project.title}
      </h3>
      <p className="mt-3 max-w-[34rem] font-sans text-[14px] leading-relaxed text-foreground-secondary line-clamp-2 md:mt-3 md:text-[15px] md:line-clamp-none lg:mt-4 lg:text-[16px]">
        {project.description}
      </p>
      <p className="mt-5 font-sans text-[10px] font-semibold tracking-[0.2em] text-foreground-secondary md:mt-8">
        CAPABILITIES
      </p>
      {/* Desktop: editorial rows. Mobile: one compact inline line. */}
      <ul className="mt-3 hidden border-t border-border md:block">
        {project.tags.map((tag) => (
          <li
            key={tag}
            className="border-b border-border py-2 font-sans text-[13px] font-medium tracking-[0.04em] text-foreground"
          >
            {tag}
          </li>
        ))}
      </ul>
      <p className="mt-3 font-sans text-[13px] font-medium tracking-[0.04em] text-foreground md:hidden">
        {project.tags.join(" · ")}
      </p>
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        aria-label={`View project: ${project.title}`}
        onMouseEnter={() => {
          if (canHoverTick) play("ui-hover");
        }}
        onClick={() => play("ui-click")}
        className="group/link mt-5 inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold tracking-[0.16em] text-foreground transition-colors duration-200 hover:text-[var(--accent-cherry)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:mt-6"
      >
        VIEW PROJECT
        <span
          aria-hidden
          className="inline-block transition-transform duration-200 ease-out group-hover/link:-translate-y-[3px] group-hover/link:translate-x-[3px] motion-reduce:transition-none"
        >
          ↗
        </span>
      </a>
    </div>
  );
}

function StackDeck({ gentle }: { gentle: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Canonical scrollport via subscription (no effect-setState cascade):
  // getElementById returns a stable node identity, so the snapshot is
  // cached by reference. Until it resolves, useScroll holds instead of
  // silently subscribing to window scrolling (which never moves here).
  const scrollRoot = useSyncExternalStore(
    () => () => {},
    () => getScrollContainer(),
    () => null,
  );
  const containerRef = useMemo(() => ({ current: scrollRoot }), [scrollRoot]);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    container: containerRef,
    offset: ["start start", "end end"],
  });

  const [active, setActive] = useState(0);
  // THE single source of truth: image emphasis + info content +
  // hairline all follow this index. Sheet motion stays on
  // MotionValues with zero re-renders per scroll frame.
  // A soft air tick marks genuine takeovers only — direction-free,
  // change-guarded, provider-cooled down so rapid scrolling never
  // machine-guns.
  const { play } = useAudio();
  const playRef = useRef(play);
  // Sync-only effect (no state) — keeps the motion callback pointed
  // at the live play without re-subscribing it.
  useEffect(() => {
    playRef.current = play;
  });
  const activeRef = useRef(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // Boundaries sit exactly where each sheet's rise window completes
    // (index / COUNT), matching the ImageSheet takeover timing — text
    // and image change as one card in both scroll directions. round()
    // would shift every boundary half a card late and map v=1 to an
    // invalid index.
    const next = Math.min(
      COUNT - 1,
      Math.max(0, Math.floor(v * COUNT + Number.EPSILON)),
    );
    if (next !== activeRef.current) {
      activeRef.current = next;
      playRef.current("service-expand");
    }
    setActive(next);
  });
  const current = gallery[active] ?? gallery[0]!;

  return (
    <div ref={trackRef} className="relative h-[480svh] md:h-[600svh]">
      {/* Clipped full-viewport stage: heading + viewer persist while
          the track scrolls. Overflow on the sticky element itself
          does not break its sticking. */}
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden pt-12 md:pt-6">
        <header className="mx-auto mb-8 w-full max-w-[min(94vw,80rem)] shrink-0 text-center md:mb-10">
          <h2
            id="projects-heading"
            className="font-sans text-[clamp(2rem,12vw,4rem)] leading-[1.0] font-extrabold tracking-[-0.03em] text-foreground lg:text-[clamp(2.5rem,7vw,4.5rem)]"
          >
            <AnimatedText segments="DESIGN WORK" />
          </h2>
        </header>

        <div className="mx-auto grid w-full max-w-[min(94vw,80rem)] flex-1 min-h-0 grid-cols-1 items-center gap-6 pb-4 md:gap-8 md:pb-[calc(var(--floating-nav-clearance)+1rem)] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-12">
          {/* LEFT — scroll-driven image stack. Sheets are
              aria-hidden and pointer-inert; all interaction lives
              in the single info viewport. */}
          <div className="relative flex h-[34svh] min-h-0 items-center justify-center md:h-full max-[380px]:h-[30svh]">
            {gallery.map((project, i) => (
              <ImageSheet
                key={project.id}
                project={project}
                index={i}
                progress={scrollYProgress}
                isActive={i === active}
                gentle={gentle}
              />
            ))}
          </div>

          {/* RIGHT — ONE information viewport. Content crossfades
              (wait mode: exit completes before enter, never
              overlapping); min-height keeps the composition stable
              across varying description lengths. */}
          <div
            className="min-h-[200px] min-w-0 lg:min-h-[420px]"
            aria-live="polite"
            aria-atomic="true"
          >
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={current.id}
                initial={{ opacity: 0, y: gentle ? 8 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: gentle ? -8 : -10 }}
                transition={{ duration: gentle ? 0.15 : 0.2, ease: "easeOut" }}
              >
                <InfoBlock project={current} />
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      {/* settle room — final viewer rests clear of floating nav */}
      <div className="h-[8svh]" aria-hidden />
    </div>
  );
}

export function Projects() {
  const ref = useRef<HTMLElement>(null);
  useCinematicSection(ref, "projects");
  // One soft paper-air breath on meaningful section entry.
  useSectionEnterSound(ref, "service-expand");
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <section
      ref={ref}
      id="projects"
      className="section-tone-projects relative z-0 overflow-visible scroll-mt-[var(--nav-safe-top)] px-4 pt-[calc(var(--nav-safe-top)+0.75rem)] pb-10 sm:px-5 md:px-[var(--layout-nav-inset)] md:pb-14"
      aria-labelledby="projects-heading"
    >
      <Container className="w-full max-w-none">
        <div className="cinematic-layer cinematic-layer--media">
          {prefersReducedMotion ? (
            /* Reduced motion: honest document flow, no sticky, no
               scroll-linked transforms, no crossfade motion.
               Content fully preserved. */
            <div className="mx-auto flex max-w-[min(94vw,80rem)] flex-col gap-10 md:gap-14">
              <h2
                id="projects-heading"
                className="text-center font-sans text-[clamp(2rem,12vw,4rem)] leading-[1.0] font-extrabold tracking-[-0.03em] text-foreground lg:text-[clamp(2.5rem,7vw,4.5rem)]"
              >
                DESIGN WORK
              </h2>
              {gallery.map((project, i) => (
                <div
                  key={project.id}
                  className="grid grid-cols-1 items-center gap-5 md:gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-12"
                >
                  <div className="relative min-w-0 overflow-hidden rounded-lg border border-border bg-muted shadow-[var(--shadow-sm)]">
                    <div
                      className="relative mx-auto h-[var(--wh)] max-w-full [width:min(100%,calc(var(--wh)*var(--rw)))] [--wh:38svh] md:[--wh:52svh] lg:[--wh:58svh]"
                      style={{
                        aspectRatio: project.mediaRatio,
                        ["--rw" as string]: project.ratioNum,
                      }}
                    >
                      <Image
                        src={project.image}
                        alt={project.imageAlt}
                        fill
                        sizes="(min-width: 1024px) 48vw, 94vw"
                        loading={i === 0 ? "eager" : "lazy"}
                        priority={i === 0}
                        className="object-contain object-center"
                      />
                    </div>
                  </div>
                  <InfoBlock project={project} />
                </div>
              ))}
              <div className="h-[8svh]" aria-hidden />
            </div>
          ) : (
            /* Heading lives inside the sticky stage (id for a11y). */
            <StackDeck gentle={isMobile} />
          )}
        </div>
      </Container>
    </section>
  );
}
