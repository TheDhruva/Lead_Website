"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  AnimatePresence,
  type MotionValue,
  m,
  useMotionValue,
  useTransform,
} from "framer-motion";

import { AnimatedText } from "@/components/motion/animated-text";
import { Container } from "@/components/ui/container";
import { EASING_OUT, PROJECT_INFO_FOLLOW_DELAY_S } from "@/constants";
import { projectRows } from "@/data";
import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { useCinematicSection } from "@/hooks/use-cinematic-section";
import { usePerformanceTier } from "@/hooks/use-performance-tier";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useSectionEnterSound } from "@/hooks/use-section-enter-sound";
import { clearDeckGeometry, setDeckGeometry } from "@/lib/deck-geometry";
import { BLUR_PLACEHOLDER_DATA_URL } from "@/lib/image-placeholder";
import {
  getOffsetInScrollContainer,
  getScrollContainer,
} from "@/lib/scroll-container";
import { subscribeScrollMotion } from "@/lib/scroll-motion-engine";
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
const CARD_BOUNDARY_EPSILON = 0.001;
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
  eagerFetch,
}: {
  project: GalleryItem;
  index: number;
  progress: MotionValue<number>;
  isActive: boolean;
  gentle: boolean;
  /** True for the takeover target: fetch its full image eagerly (with a
      framework preload hint for the exact optimized URL) well before the
      rise window, so the takeover decodes instead of stuttering. */
  eagerFetch: boolean;
}) {
  // Keyframe channels are pure functions of (index, gentle): build once
  // per sheet instead of reconstructing string arrays on every render
  // (renders happen at each takeover + midpoint; scroll frames never
  // re-render — they only push the shared MotionValue).
  const channels = useMemo(() => {
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
      // so text and visual dominance change as one card in both scroll
      // directions. Same window width and curve — only placement moved.
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
          : Number(
              Math.max(0.5, baseOpacity - stepOpacity * (d - 2)).toFixed(3),
            );
      opacities.push(prevO, deepO);
    }

    // Pin both ends of the range before handing the arrays to Framer
    // (accelerated WAAPI) — see extendKeyframesToFullRange.
    extendKeyframesToFullRange(keys, ys, scales, opacities);
    assertKeyframesCoherent(keys, [keys, ys, scales, opacities]);
    return { keys, ys, scales, opacities };
  }, [index, gentle]);

  const y = useTransform(progress, channels.keys, channels.ys);
  const scale = useTransform(progress, channels.keys, channels.scales);
  const opacity = useTransform(progress, channels.keys, channels.opacities);

  return (
    <m.div
      aria-hidden
      // Bounded promotion: at most two sheets ever mount (active +
      // partner), and both animate transform/opacity every scroll frame —
      // the only elements in the deck that earn a persistent layer.
      style={{
        y,
        scale,
        opacity,
        zIndex: index + 1,
        willChange: "transform, opacity",
      }}
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
            priority={index === 0 || eagerFetch}
            loading={index === 0 || eagerFetch ? "eager" : "lazy"}
            // Static per mount: eagerFetch is fixed for the lifetime of
            // this sheet instance (a new instance mounts when the role
            // changes), so this never re-prioritizes mid-scroll.
            fetchPriority={index === 0 || eagerFetch ? "high" : "low"}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER_DATA_URL}
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

/**
 * Idle-time neighbor warm — controlled JIT decode for the takeover
 * target only. The partner sheet mounts ~half a segment before its
 * window (fetch head start), but fetch ≠ decode: warming the original
 * bitmap off the scroll path via idle time means the takeover frame
 * finds bytes already in HTTP cache and the decode already attempted,
 * instead of bursting fetch + decode mid-gesture. Bounded to one URL
 * per target (module cache) — never a preload-all footprint.
 */
const warmedSources = new Set<string>();

function warmProjectImage(src: string): void {
  if (warmedSources.has(src)) return;
  warmedSources.add(src);
  const warm = () => {
    try {
      // window.Image: the module's `Image` binding is next/image, not
      // the DOM constructor.
      const img = new window.Image();
      (img as HTMLImageElement & { decoding?: string }).decoding = "async";
      img.src = src;
      // Decode off-path; a rejection (e.g. 404 in a preview env) is
      // non-fatal — the sheet's own <Image> still loads normally.
      const pending = (
        img as HTMLImageElement & { decode?: () => Promise<void> }
      ).decode?.();
      void pending?.catch(() => {});
    } catch {
      // Non-fatal: the sheet's own <Image> still loads normally.
    }
  };
  const ric = (
    window as Window & {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number },
      ) => number;
    }
  ).requestIdleCallback;
  if (typeof ric === "function") ric(warm, { timeout: 2000 });
  else window.setTimeout(warm, 120);
}

function StackDeck({ gentle }: { gentle: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  //
  // NOTE: no wheel interception — the browser owns scrolling. The deck
  // responds to scroll position (progress MotionValue → useTransforms →
  // compositor). A previous passive:false + preventDefault takeover fought
  // native snap and forced layout reads per wheel event; removed.
  //
  // Progress is derived from the app's already-published scroll frame, NOT
  // from framer's useScroll: useScroll re-measures the target (offsetParent
  // walk + client/scroll size reads) on every scroll event via its own
  // listener + frame loop. The deck's geometry only changes on mount /
  // resize / font settle, so it is measured there (rAF-coalesced) and
  // progress is computed arithmetically per frame — identical values for
  // offset ["start start", "end end"]:
  //   progress = clamp((scroll - deckStart) / deckTravel).
  // Manual scrolling spends ~480/600svh inside this track (a nav jump
  // lands on its top), so this removes the hottest layout-read source on
  // the manual-scroll path. Sheets keep consuming the same MotionValue.
  const scrollYProgress = useMotionValue(0);
  const geometryRef = useRef({ start: 0, travel: 1 });

  useEffect(() => {
    const track = trackRef.current;
    const container = getScrollContainer();
    if (!track || !container) return;
    let raf = 0;
    const measureDeck = () => {
      raf = 0;
      geometryRef.current = {
        start: getOffsetInScrollContainer(track),
        travel: Math.max(1, track.offsetHeight - container.clientHeight),
      };
      // Publish for the deck-card settle: same numbers the progress
      // subscriber consumes, so snap targets always agree with the
      // card boundaries the sheets animate to. Idle-time only.
      setDeckGeometry({ ...geometryRef.current, count: COUNT });
    };
    const scheduleMeasure = () => {
      if (raf) return;
      raf = requestAnimationFrame(measureDeck);
    };
    measureDeck();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(scheduleMeasure);
      ro.observe(track);
      ro.observe(container);
    }
    window.addEventListener("resize", scheduleMeasure);
    // Fonts settle without resize events but shift section geometry.
    try {
      const fonts = (
        document as Document & { fonts?: { ready?: Promise<unknown> } }
      ).fonts;
      void fonts?.ready?.then(() => scheduleMeasure());
    } catch {
      // Non-fatal: geometry still refreshes on scroll-limit changes below.
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      clearDeckGeometry();
    };
  }, []);

  const [deck, setDeck] = useState<{
    active: number;
    side: 1 | -1;
    /** Order-derived travel direction of the last takeover (+1 down
        the deck, -1 up). Drives metadata rise direction only — image
        keyframes, boundaries, and quantization are untouched. */
    dir: 1 | -1;
  }>({
    active: 0,
    side: 1,
    dir: 1,
  });
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
  const deckRef = useRef(deck);
  useEffect(() => {
    return subscribeScrollMotion((motion) => {
      const { start, travel } = geometryRef.current;
      const raw = Math.max(0, Math.min(1, (motion.scroll - start) / travel));
      // Quantize: sub-0.001 progress deltas are visually identical but
      // would each push a WAAPI update through every mounted sheet.
      const v = Math.round(raw * 1000) / 1000;
      // Skip identical values so idle frames never notify the sheets.
      if (v !== scrollYProgress.get()) scrollYProgress.set(v);
      // Boundaries sit exactly where each sheet's rise window completes
      // (index / COUNT), matching the ImageSheet takeover timing — text
      // and image change as one card in both scroll directions. round()
      // would shift every boundary half a card late and map v=1 to an
      // invalid index.
      const next = Math.min(
        COUNT - 1,
        Math.max(0, Math.floor(v * COUNT + CARD_BOUNDARY_EPSILON)),
      );
      // Two-sheet rule: the partner card follows the segment midpoint.
      // First half keeps the outgoing (settled pile) card; second half
      // mounts the incoming (rising) card half a segment BEFORE its
      // takeover window — fetch + decode head start with at most 2
      // large visual layers. Clamped at deck ends.
      const f = v * COUNT - next;
      let side: 1 | -1 = f < 0.5 ? -1 : 1;
      if (next === 0) side = 1;
      else if (next === COUNT - 1) side = -1;
      const prev = deckRef.current;
      if (next !== prev.active) {
        // Deterministic from canonical order (same rule as
        // reportActiveSection): reversible, no extra motion frame reads.
        const dir: 1 | -1 = next > prev.active ? 1 : -1;
        deckRef.current = { active: next, side, dir };
        playRef.current("service-expand");
        setDeck({ active: next, side, dir });
      } else if (side !== prev.side) {
        deckRef.current = { active: next, side, dir: prev.dir };
        setDeck({ active: next, side, dir: prev.dir });
      }
    });
  }, [scrollYProgress]);

  const { active, side, dir } = deck;
  const current = gallery[active] ?? gallery[0]!;
  // Partner index is valid by construction (side is clamped above).
  const partnerIndex = active + side;

  // Warm the takeover target off the scroll path: discrete (fires only
  // when active/partner roles change — never per frame), idle-scheduled.
  useEffect(() => {
    const partner = gallery[partnerIndex];
    if (partner) warmProjectImage(partner.image);
  }, [active, partnerIndex]);

  return (
    <div ref={trackRef} className="relative h-[480svh] md:h-[600svh]">
      {/* Clipped full-viewport stage: heading + viewer persist while
          the track scrolls. Overflow on the sticky element itself
          does not break its sticking. */}
      <div className="projects-stage sticky top-0 flex h-[100svh] flex-col overflow-hidden pt-[var(--nav-safe-top)]">
        <header className="projects-stage__header mx-auto mb-8 w-full max-w-[min(94vw,80rem)] shrink-0 text-center md:mb-10">
          <h2
            id="projects-heading"
            className="font-sans text-[min(clamp(3.5rem,7vw,6rem),calc((100vw-2.5rem)/5.2))] leading-[1.02] font-extrabold tracking-[-0.05em] text-balance text-foreground"
          >
            <AnimatedText segments="DESIGN WORK" level="word" />
          </h2>
        </header>

        <div className="mx-auto grid w-full max-w-[min(94vw,80rem)] flex-1 min-h-0 grid-cols-1 items-center gap-6 pb-4 md:gap-8 md:pb-[calc(var(--floating-nav-clearance)+1rem)] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-12">
          {/* LEFT — scroll-driven image stack. Sheets are
              aria-hidden and pointer-inert; all interaction lives
              in the single info viewport. Layout/style containment
              keeps the two mounted sheets' per-frame transform work
              from invalidating the sibling info subtree. */}
          <div className="relative flex h-[34svh] min-h-0 items-center justify-center [contain:layout_style] md:h-full max-[380px]:h-[30svh]">
            {gallery.map((project, i) => {
              // Two-sheet virtualization: the active sheet plus its
              // segment-midpoint partner (outgoing pile first half,
              // incoming riser second half). No other 1254px image
              // participates in the sticky stage — distant sheets rest
              // at opacity 0 far outside the clipped stage anyway, so
              // unmounting them is visually identical, while halving
              // image decode, layer memory, and per-frame MotionValue
              // work. The partner mounts half a segment before its
              // takeover with an eager fetch, so transitions never
              // show gaps or decode stalls.
              if (i !== active && i !== partnerIndex) return null;
              return (
                <ImageSheet
                  key={project.id}
                  project={project}
                  index={i}
                  progress={scrollYProgress}
                  isActive={i === active}
                  eagerFetch={i === partnerIndex}
                  gentle={gentle}
                />
              );
            })}
          </div>

          {/* RIGHT — ONE information viewport. Image and metadata move
              as one unit: the entering copy mounts the same frame the
              image takeover begins (popLayout pops the stale copy out of
              flow, so there is never a blank gap), fades in ~100ms
              behind the visual rise, and the old copy is already gone —
              stale title over new image is impossible by construction.
              min-height keeps the composition stable across varying
              description lengths. */}
          <div
            className="min-h-[200px] min-w-0 lg:min-h-[420px]"
            aria-live="polite"
            aria-atomic="true"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <m.div
                key={current.id}
                variants={{
                  // Directional rise: scrolling down the deck the new
                  // copy rises from below (+8→0); scrolling up it drops
                  // from above (−8→0). The old copy leaves toward the
                  // mirrored side. 8px max (6px gentle), compositor-only,
                  // same 140/120ms + 100ms follow timing as before.
                  hidden: { opacity: 0, y: dir * (gentle ? 6 : 8) },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.14,
                      ease: EASING_OUT,
                      delay: PROJECT_INFO_FOLLOW_DELAY_S,
                    },
                  },
                  exit: {
                    opacity: 0,
                    y: -dir * (gentle ? 6 : 8),
                    transition: {
                      duration: 0.12,
                      ease: EASING_OUT,
                    },
                  },
                }}
                initial="hidden"
                animate="show"
                exit="exit"
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
  // Mobile layout already resolves to tier "low", so the tier check at
  // the deck below owns the gentle path — no second media subscription
  // for the same signal.
  const tier = usePerformanceTier();

  return (
    <section
      ref={ref}
      id="projects"
      className="section-tone-projects relative z-0 overflow-visible scroll-mt-[var(--nav-safe-top)] px-4 pt-0 pb-10 sm:px-5 md:px-[var(--layout-nav-inset)] md:pb-14"
      aria-labelledby="projects-heading"
    >
      <Container className="w-full max-w-none">
        <div className="cinematic-layer cinematic-layer--media">
          {prefersReducedMotion ? (
            <div className="mx-auto flex max-w-[min(94vw,80rem)] flex-col gap-10 md:gap-14">
              <h2
                id="projects-heading"
                className="text-center font-sans text-[min(clamp(3.5rem,7vw,6rem),calc((100vw-2.5rem)/5.2))] leading-[1.02] font-extrabold tracking-[-0.05em] text-balance text-foreground"
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
                        placeholder="blur"
                        blurDataURL={BLUR_PLACEHOLDER_DATA_URL}
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
            <StackDeck gentle={tier !== "high"} />
          )}
        </div>
      </Container>
    </section>
  );
}
