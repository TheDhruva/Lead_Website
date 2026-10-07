"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { m } from "framer-motion";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";

import { AnimatedText } from "@/components/motion/animated-text";
import { Container } from "@/components/ui/container";
import { VIDEO_PLAYBACK_VOLUME } from "@/constants/audio";
import { videoItems } from "@/data";
import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { useCinematicSection } from "@/hooks/use-cinematic-section";
import { usePerformanceTier } from "@/hooks/use-performance-tier";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useSectionEnterSound } from "@/hooks/use-section-enter-sound";
import { isScrollActive } from "@/lib/scroll-bus";
import { getScrollContainer } from "@/lib/scroll-container";
import { subscribeScrollMotion } from "@/lib/scroll-motion-engine";
import { cn } from "@/lib/utils";
import { getVideoSources } from "@/lib/video-source";
import { useAudio } from "@/providers/audio-provider";
import type { VideoItem } from "@/types";

/* ─────────────────────────────────────────────────────────────
   Centralized video transition timing — tune here, never inline.
   The switch is a fast editorial CUT (300–500ms total):
   push → cut → settle. No bounce, no elastic easing.
   ───────────────────────────────────────────────────────────── */
const VIDEO_SWITCH_MS = 360;
/** Bounded wait for the swapped source to become playable — never hangs. */
const VIDEO_READY_TIMEOUT_MS = 900;
const VIDEO_CUT_OFFSET_PX = 26;
const VIDEO_EXIT_SCALE = 1.022;
const VIDEO_ENTRY_SCALE = 0.985;

const VIDEO_ENTRANCE_HEADING_MS = 520;
const VIDEO_ENTRANCE_PLAYER_MS = 560;
const VIDEO_ENTRANCE_ROW_MS = 440;
const PRELOAD_THRESHOLD = 0.75;
const EASE_CINEMATIC = "cubic-bezier(0.22, 1, 0.36, 1)";

function formatNum(n: number) {
  return String(n).padStart(2, "0");
}

/** Forward (01→02) vs backward (04→03), wrap-aware. Drives cut direction. */
function resolveDirection(from: number, to: number, total: number): 1 | -1 {
  if (to === 0 && from === total - 1) return 1;
  if (to === total - 1 && from === 0) return -1;
  return to > from ? 1 : -1;
}

/* ─────────────────────────────────────────────────────────────
   VideoProjectRow — editorial index row, never a card.
   Separators + typography + one lacquer micro-indicator carry
   the active state. Hover only touches transform/opacity.
   ───────────────────────────────────────────────────────────── */
function VideoProjectRow({
  item,
  num,
  isActive,
  entered,
  entranceDelayMs,
  reduceMotion,
  onSelect,
  onHoverItem,
}: {
  item: VideoItem;
  num: string;
  isActive: boolean;
  entered: boolean;
  entranceDelayMs: number;
  reduceMotion: boolean;
  onSelect: (id: string) => void;
  onHoverItem?: (id: string) => void;
}) {
  return (
    <m.button
      type="button"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={entered ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: VIDEO_ENTRANCE_ROW_MS / 1000,
        ease: [0.22, 1, 0.36, 1],
        delay: reduceMotion ? 0 : entranceDelayMs / 1000,
      }}
      onClick={() => onSelect(item.id)}
      onMouseEnter={() => onHoverItem?.(item.id)}
      aria-label={`Play ${item.title}`}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-3 py-3 text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
      )}
    >
      {/* lacquer micro-indicator — active row only */}
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 left-0 h-6 w-[2px] -translate-y-1/2 rounded-full bg-[var(--accent-cherry)] transition-opacity duration-300",
          isActive ? "opacity-100" : "opacity-0",
        )}
      />
      <span
        className={cn(
          "w-7 shrink-0 pl-3 font-sans text-[11px] tabular-nums",
          isActive ? "text-foreground" : "text-foreground-secondary",
        )}
      >
        {num}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate font-sans text-[12px] tracking-[0.12em] transition-[transform,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            isActive
              ? "font-bold text-foreground"
              : "font-semibold text-foreground/75 group-hover:text-foreground",
            "group-hover:translate-x-[6px] motion-reduce:group-hover:translate-x-0",
            isActive && "translate-x-[4px]",
          )}
        >
          {item.title.toUpperCase()}
        </span>
        <span className="block truncate text-[11px] text-foreground-secondary">
          {item.meta}
        </span>
      </span>
      <span className="relative h-[54px] w-[96px] shrink-0 overflow-hidden rounded-md bg-black sm:h-[62px] sm:w-[108px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.poster}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100",
          )}
        />
      </span>
    </m.button>
  );
}

/* ─────────────────────────────────────────────────────────────
   VideoProjectList — "SELECTED WORK" index with live counter.
   One shared component for desktop rail and mobile stack.
   ───────────────────────────────────────────────────────────── */
function VideoProjectList({
  currentIndex,
  entered,
  reduceMotion,
  onSelect,
  onHoverItem,
}: {
  currentIndex: number;
  entered: boolean;
  reduceMotion: boolean;
  onSelect: (id: string) => void;
  onHoverItem?: (id: string) => void;
}) {
  return (
    // Mobile (<lg): natural height — all rows participate in page flow and
    // #scroll-container stays the ONLY vertical scroller. No nested
    // scrollport, no gesture capture, no overscroll containment.
    // Desktop (lg+): bounded docked rail co-visible with the player.
    <div className="min-w-0 lg:min-h-0 lg:max-h-[calc(100svh-var(--nav-safe-top)-var(--floating-nav-clearance)-10rem)] lg:overflow-y-auto lg:overscroll-x-none lg:overscroll-y-contain lg:[scrollbar-width:thin] lg:[scrollbar-color:var(--scrollbar-thumb)_transparent]">
      <div className="flex flex-col divide-y divide-[var(--border)]">
        {videoItems.map((item, idx) => (
          <VideoProjectRow
            key={item.id}
            item={item}
            num={formatNum(idx + 1)}
            isActive={idx === currentIndex}
            entered={entered}
            entranceDelayMs={60 + idx * 40}
            reduceMotion={reduceMotion}
            onSelect={onSelect}
            onHoverItem={onHoverItem}
          />
        ))}
      </div>
    </div>
  );
}

export function VideoShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  useCinematicSection(sectionRef, "videos");
  // One soft cinematic breath on meaningful section entry.
  useSectionEnterSound(sectionRef, "hero-transition");
  const canHoverTick = useCanPointerReact();
  const lastHoverRef = useRef<string | null>(null);
  const activeRef = useRef<HTMLVideoElement>(null);
  const nextRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const playerWrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const cutAnimRef = useRef<Animation | null>(null);
  const switchTimeoutRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  /** Set when the swapped source fires canplay/playing; gates the transition flag. */
  const mediaReadyRef = useRef(false);
  const swapTimeRef = useRef(0);
  const preloadStartedRef = useRef(false);
  /** Id of the item whose sources are currently loaded on activeRef. */
  const sourcesLoadedRef = useRef<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const tier = usePerformanceTier();
  const { play, setVideoAudioActive, muted: globalMuted } = useAudio();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  /**
   * Settle-debounced visibility — drives ONLY the play/pause media-pipeline
   * toggle below. Slow/precise manual scrolling can straddle the -6%
   * observation band, flipping the raw signal repeatedly; each flip would
   * otherwise flap v.play()/v.pause() + the global audio broadcast +
   * progress-loop churn mid-gesture. A navbar flight crosses decisively
   * once, which is why nav feels smooth and manual doesn't. Committing
   * after ~150ms of stability absorbs straddles; genuine crossings are
   * delayed imperceptibly (the poster bridge covers the picture).
   * Init/entrance still use the raw signal so nothing mounts late.
   */
  const [isSectionVisibleSettled, setIsSectionVisibleSettled] = useState(false);
  const [enteredOnce, setEnteredOnce] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  /**
   * Scroll-settle video state (SCROLLING_PAUSED). While the user actively
   * scrolls, decoding + texture upload + progress writes would compete
   * with scroll compositing — so the showcase holds its currentTime and
   * stays paused, resuming ~350ms after motion truly ends (not per
   * velocity dip: every motion frame resets the timer, so slow continuous
   * scrolling never flaps play/pause). Toggles at most twice per
   * gesture — never per frame.
   */
  const [scrollPaused, setScrollPaused] = useState(false);

  const isMutedRef = useRef(true);
  const currentIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const reducedMotionRef = useRef(false);
  // True while SCROLLING_PAUSED owns the pause (distinct from the user's
  // explicit pause and from visibility gating).
  const scrollPausedRef = useRef(false);
  // Explicit user stop (pause) — autoplay must not override it.
  const userPausedRef = useRef(false);

  const total = videoItems.length;
  const current: VideoItem = videoItems[currentIndex] ?? videoItems[0]!;

  // keep refs in sync
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);
  // Global mute is authoritative over every website-controlled sound,
  // including <video> audio: while globally muted the element stays
  // muted regardless of per-video intent; unmuting globally restores
  // the user's stored per-video choice without resetting it.
  useEffect(() => {
    const v = activeRef.current;
    if (!v) return;
    v.muted = globalMuted || isMutedRef.current;
  }, [globalMuted]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    reducedMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  // lazy init — only when section approaches viewport; entrance fires once
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const root = getScrollContainer();
    const obs = new IntersectionObserver(
      ([entry]) => {
        const visible = !!entry?.isIntersecting;
        setIsSectionVisible(visible);
        if (visible) {
          setInitialized(true);
          setEnteredOnce(true);
        }
      },
      {
        threshold: [0, 0.15, 0.35],
        rootMargin: "-6% 0px -6% 0px",
        root: root ?? null,
      },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Prepare shortly before entry without downloading the full film.
  // Metadata arrives early enough for a clean handoff; video bytes begin
  // when the section becomes visible.
  // Visibility gating is unchanged: play/pause still follows the -6%
  // observer above, and the entrance still fires on actual entry.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const root = getScrollContainer();
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setInitialized(true);
        obs.disconnect();
      },
      {
        threshold: 0,
        rootMargin: "0px 0px 70% 0px",
        root: root ?? null,
      },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Settle the raw visibility signal before it may touch the media
  // pipeline (see state declaration for rationale).
  useEffect(() => {
    const id = window.setTimeout(
      () => setIsSectionVisibleSettled(isSectionVisible),
      150,
    );
    return () => window.clearTimeout(id);
  }, [isSectionVisible]);

  // pause when section leaves viewport — or while the user is actively
  // scrolling through it (SCROLLING_PAUSED: hold currentTime, decode
  // nothing, resume after settle via the scroll effect below).
  useEffect(() => {
    if (!initialized) return;
    const v = activeRef.current;
    if (!v) return;
    if (!isSectionVisibleSettled || scrollPaused) {
      v.pause();
      if (!isMutedRef.current) setVideoAudioActive(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    } else if (
      isSectionVisibleSettled &&
      !scrollPaused &&
      !isScrollActive() &&
      !isPlayingRef.current &&
      !autoplayBlocked &&
      !userPausedRef.current
    ) {
      // resume autoplay when returning — unless the user explicitly stopped
      v.muted = globalMuted || isMutedRef.current;
      void v.play().catch(() => setAutoplayBlocked(true));
    }
  }, [
    isSectionVisibleSettled,
    scrollPaused,
    initialized,
    autoplayBlocked,
    globalMuted,
    setVideoAudioActive,
  ]);

  // Scroll-settle state machine: OUTSIDE / VISIBLE_IDLE / VISIBLE_PLAYING
  // transitions stay in the visibility effect above; this effect only
  // owns SCROLLING_PAUSED. Motion frames arrive only while scroll offset
  // changes, so "no frames for 350ms" reliably means the gesture (and
  // its momentum tail) ended — every frame resets the timer, which is
  // what prevents play/pause flapping during slow continuous scrolls.
  // currentTime is preserved: pause/resume never seeks.
  useEffect(() => {
    if (!initialized) return;
    let resumeTimer: number | null = null;
    const clearResume = () => {
      if (resumeTimer !== null) {
        window.clearTimeout(resumeTimer);
        resumeTimer = null;
      }
    };
    const unsubscribe = subscribeScrollMotion((motion) => {
      const v = activeRef.current;
      if (!v) return;
      if (Math.abs(motion.velocity) > 0.05) {
        clearResume();
        if (!v.paused && !userPausedRef.current && !scrollPausedRef.current) {
          scrollPausedRef.current = true;
          setScrollPaused(true);
        }
      } else if (scrollPausedRef.current && resumeTimer === null) {
        resumeTimer = window.setTimeout(() => {
          resumeTimer = null;
          scrollPausedRef.current = false;
          setScrollPaused(false);
        }, 350);
      }
    });
    return () => {
      clearResume();
      unsubscribe();
    };
  }, [initialized]);

  // helper to set sources on a video element
  const setVideoSources = useCallback(
    (videoEl: HTMLVideoElement | null, item: VideoItem) => {
      if (!videoEl) return;
      // clear
      videoEl.pause();
      videoEl.removeAttribute("src");
      while (videoEl.firstChild) videoEl.removeChild(videoEl.firstChild);
      const sources = getVideoSources(item);
      sources.forEach((s) => {
        const srcEl = document.createElement("source");
        srcEl.src = s.src;
        srcEl.type = s.type;
        videoEl.appendChild(srcEl);
      });
      videoEl.load();
    },
    [],
  );

  // Fast cinematic cut on the player frame — transform/opacity only
  // (compositor), cancellable so rapid switching never stacks animations.
  // Single stable <video> element: no remount, no ref races. Deliberately
  // no filter:blur() — fullscreen blur over a decoding video is paint per
  // frame; the directional push + settle carries the cut instead.
  const playCut = useCallback((dir: 1 | -1) => {
    const frame = frameRef.current;
    if (!frame || typeof frame.animate !== "function") return;
    try {
      cutAnimRef.current?.cancel();
      if (reducedMotionRef.current) {
        cutAnimRef.current =
          frame.animate([{ opacity: 0.35 }, { opacity: 1 }], {
            duration: 140,
            easing: "ease-out",
          }) ?? null;
        return;
      }
      const x = dir * VIDEO_CUT_OFFSET_PX;
      cutAnimRef.current =
        frame.animate(
          [
            {
              opacity: 1,
              transform: "translate3d(0, 0, 0) scale(1)",
              offset: 0,
            },
            {
              opacity: 0.55,
              transform: `translate3d(${(-x * 0.5).toFixed(1)}px, 0, 0) scale(${VIDEO_EXIT_SCALE})`,
              offset: 0.28,
            },
            {
              opacity: 0,
              transform: `translate3d(${x.toFixed(1)}px, 0, 0) scale(${VIDEO_ENTRY_SCALE})`,
              offset: 0.7,
            },
            {
              opacity: 1,
              transform: "translate3d(0, 0, 0) scale(1)",
              offset: 1,
            },
          ],
          { duration: VIDEO_SWITCH_MS, easing: EASE_CINEMATIC },
        ) ?? null;
    } catch {
      // WAAPI unavailable — state still updates, UI stays functional.
    }
  }, []);

  // Single commit path for every index change (tap, keyboard, auto).
  // Generation-guarded: rapid 01 → 03 → 05 always settles on 05
  // with matching metadata — no stale timeouts win. The visual floor
  // is VIDEO_SWITCH_MS; if the swapped source is not yet playable by
  // then, the transitioning state persists until canplay or the bounded
  // VIDEO_READY_TIMEOUT_MS ceiling — never indefinitely.
  const commitIndex = useCallback(
    (target: number) => {
      const cur = currentIndexRef.current;
      if (target === cur || target < 0 || target >= total) return;
      const dir = resolveDirection(cur, target, total);
      generationRef.current += 1;
      const gen = generationRef.current;
      mediaReadyRef.current = false;
      swapTimeRef.current =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      playCut(dir);
      setCurrentIndex(target);
      setIsTransitioning(true);
      if (switchTimeoutRef.current !== null) {
        window.clearTimeout(switchTimeoutRef.current);
      }
      const settle = () => {
        if (generationRef.current !== gen) return;
        const now =
          typeof performance !== "undefined" ? performance.now() : Date.now();
        if (mediaReadyRef.current) {
          setIsTransitioning(false);
          return;
        }
        // Media still pending: re-check until the bounded ceiling, so the
        // poster bridge never flashes black and metadata never outruns
        // the picture. Rapid superseding commits cancel via generation.
        if (now - swapTimeRef.current < VIDEO_READY_TIMEOUT_MS) {
          switchTimeoutRef.current = window.setTimeout(settle, 120);
        } else {
          setIsTransitioning(false);
        }
      };
      switchTimeoutRef.current = window.setTimeout(settle, VIDEO_SWITCH_MS);
    },
    [playCut, total],
  );

  // initialize / switch active video (stable element, sources swapped)
  useEffect(() => {
    if (!initialized) return;
    const v = activeRef.current;
    if (!v) return;
    setAutoplayBlocked(false);
    v.muted = globalMuted || isMutedRef.current;
    v.volume = VIDEO_PLAYBACK_VOLUME;

    // Source swaps only when the item actually changes: visibility flips,
    // mute toggles, and the early-init → entry handoff must not tear down
    // and reload already-prepared media on the entry frame.
    if (sourcesLoadedRef.current !== current.id) {
      preloadStartedRef.current = false;
      if (progressRef.current)
        progressRef.current.style.setProperty("--progress", "0");
      setVideoSources(v, current);
      v.currentTime = 0;
      sourcesLoadedRef.current = current.id;
    }

    // Readiness signals for the bounded transition gate above. Cached or
    // fast sources may already be playable — HAVE_ENOUGH_DATA covers it.
    const markReady = () => {
      mediaReadyRef.current = true;
    };
    if (v.readyState >= 3) {
      markReady();
    } else {
      v.addEventListener("canplay", markReady, { once: true });
      v.addEventListener("playing", markReady, { once: true });
    }

    // autoplay muted when visible (settled signal — see declaration)
    if (isSectionVisibleSettled) {
      const p = v.play();
      if (p) {
        p.then(() => {
          setIsPlaying(true);
          if (!isMutedRef.current) setVideoAudioActive(true);
        }).catch(() => {
          setIsPlaying(false);
          setAutoplayBlocked(true);
        });
      }
    } else {
      // Defer to avoid react-hooks/set-state-in-effect cascading render warning.
      // Syncing isPlaying with visibility is intentional.
      queueMicrotask(() => setIsPlaying(false));
    }

    // cleanup preload
    const nv = nextRef.current;
    if (nv) {
      nv.pause();
      nv.removeAttribute("src");
      while (nv.firstChild) nv.removeChild(nv.firstChild);
      try {
        nv.load();
      } catch {}
    }
  }, [
    current,
    initialized,
    isSectionVisibleSettled,
    globalMuted,
    setVideoSources,
    setVideoAudioActive,
  ]);

  // progress loop — direct DOM, no React state per frame.
  // P2: writes only on meaningful change (0.001 steps); the bar is a
  // scaleX transform so updates never dirty layout.
  const startProgressLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const v = activeRef.current;
    const bar = progressRef.current;
    if (!v || !bar) return;
    let lastWritten = "";
    const tick = () => {
      if (!v.duration || Number.isNaN(v.duration) || v.duration === 0) {
        if (lastWritten !== "0") {
          bar.style.setProperty("--progress", "0");
          lastWritten = "0";
        }
      } else {
        const pct = Math.min(100, (v.currentTime / v.duration) * 100);
        // Unitless 0–1: drives the bar via scaleX (transform) instead of
        // width, so the per-frame progress update never dirties layout.
        const next = (pct / 100).toFixed(3);
        if (next !== lastWritten) {
          bar.style.setProperty("--progress", next);
          lastWritten = next;
        }
        // two-window preload at ~75% — deferred while actively
        // scrolling so fetch + source-swap work never lands on the most
        // demanding scroll frames; the next progress tick retries.
        // Constrained tiers skip speculative preload: the poster bridge
        // + bounded ready-wait cover explicit selection without
        // background decode contention.
        if (
          !preloadStartedRef.current &&
          pct >= PRELOAD_THRESHOLD * 100 &&
          !isScrollActive() &&
          tier !== "low"
        ) {
          preloadStartedRef.current = true;
          const nextItem = videoItems[(currentIndexRef.current + 1) % total];
          if (nextItem && nextRef.current) {
            setVideoSources(nextRef.current, nextItem);
            nextRef.current.preload = "auto";
            // don't play, just prepare
          }
        }
      }
      if (!v.paused && !v.ended) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [setVideoSources, total, tier]);

  const stopProgressLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // video events — stable element, bound once per init cycle
  useEffect(() => {
    const v = activeRef.current;
    if (!v || !initialized) return;
    const onPlay = () => {
      setIsPlaying(true);
      startProgressLoop();
    };
    const onPause = () => {
      setIsPlaying(false);
      stopProgressLoop();
    };
    const onTimeUpdate = () => {
      // rAF handles progress, but keep as fallback for preload trigger if rAF paused.
      // Same guards as the rAF path: never preload mid-scroll, and never
      // speculatively on constrained tiers.
      if (
        !preloadStartedRef.current &&
        tier !== "low" &&
        !isScrollActive() &&
        v.duration &&
        v.currentTime / v.duration >= PRELOAD_THRESHOLD
      ) {
        preloadStartedRef.current = true;
        const nextItem = videoItems[(currentIndexRef.current + 1) % total];
        if (nextItem && nextRef.current)
          setVideoSources(nextRef.current, nextItem);
      }
    };
    const onEnded = () => {
      stopProgressLoop();
      if (progressRef.current)
        progressRef.current.style.setProperty("--progress", "1");
      // cyclic advance — silent (no UI sound on automatic advance)
      userPausedRef.current = false;
      commitIndex((currentIndexRef.current + 1) % total);
    };
    const onError = () => {
      setIsPlaying(false);
    };
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("ended", onEnded);
    v.addEventListener("error", onError);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("error", onError);
    };
  }, [
    initialized,
    startProgressLoop,
    stopProgressLoop,
    total,
    tier,
    setVideoSources,
    commitIndex,
  ]);

  // track native fullscreen for the icon + aria state
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // cleanup on unmount — cancel cut, timers, rAF, release video resources
  useEffect(() => {
    return () => {
      cutAnimRef.current?.cancel();
      if (switchTimeoutRef.current !== null) {
        window.clearTimeout(switchTimeoutRef.current);
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Refs are intentionally read at cleanup time (unmount) to release video resources.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const a = activeRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const n = nextRef.current;
      [a, n].forEach((el) => {
        if (!el) return;
        el.pause();
        el.removeAttribute("src");
        while (el.firstChild) el.removeChild(el.firstChild);
        try {
          el.load();
        } catch {}
      });
    };
  }, []);

  const goTo = useCallback(
    (targetId: string) => {
      const idx = videoItems.findIndex((v) => v.id === targetId);
      if (idx === -1 || idx === currentIndexRef.current) return;
      play("video-control");
      // picking a video is an explicit intent to watch — resume the autoplay chain
      userPausedRef.current = false;
      commitIndex(idx);
    },
    [play, commitIndex],
  );

  // Desktop-only hover whisper — one tick per newly entered row,
  // never a stream while resting on or sweeping across items.
  const handleHoverItem = useCallback(
    (id: string) => {
      if (!canHoverTick || lastHoverRef.current === id) return;
      lastHoverRef.current = id;
      play("ui-hover");
    },
    [canHoverTick, play],
  );

  const togglePlay = useCallback(() => {
    const v = activeRef.current;
    if (!v) return;
    play("video-control");
    if (v.paused) {
      userPausedRef.current = false;
      v.muted = globalMuted || isMutedRef.current;
      void v
        .play()
        .then(() => {
          setIsPlaying(true);
          if (!isMutedRef.current && !globalMuted) setVideoAudioActive(true);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    } else {
      // explicit user stop — autoplay must stay off until the user resumes
      userPausedRef.current = true;
      v.pause();
      if (!isMutedRef.current) setVideoAudioActive(false);
    }
  }, [play, setVideoAudioActive, globalMuted]);

  const toggleMute = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      const v = activeRef.current;
      if (!v) return;
      play("video-control");
      // Intent toggles from stored per-video choice (the element may be
      // force-muted by global mute); the element obeys global OR intent.
      const next = !isMutedRef.current;
      v.muted = globalMuted || next;
      isMutedRef.current = next;
      setIsMuted(next);
      if (!next && !globalMuted) {
        v.volume = VIDEO_PLAYBACK_VOLUME;
        if (v.paused) {
          // unmuting while paused starts playback so the tap does something audible
          userPausedRef.current = false;
          void v
            .play()
            .then(() => {
              setIsPlaying(true);
              setVideoAudioActive(true);
            })
            .catch(() => {
              setIsPlaying(false);
            });
        } else setVideoAudioActive(true);
      } else if (next) {
        setVideoAudioActive(false);
      }
    },
    [play, setVideoAudioActive, globalMuted],
  );

  const toggleFullscreen = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      play("video-control");
      const wrap = playerWrapRef.current;
      if (!wrap) return;
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
      } else if (wrap.requestFullscreen) {
        void wrap.requestFullscreen().catch(() => {});
      }
    },
    [play],
  );

  // Poster bridges the source-swap gap: visible until the new video
  // is actually playing, so a cut never flashes black.
  const showPoster = !isPlaying || isTransitioning;

  return (
    <section
      ref={sectionRef}
      id="video"
      className="section-frame section-tone-videos !h-auto !min-h-0 !max-h-none relative overflow-visible py-6 md:pt-10 md:pb-[calc(var(--floating-nav-clearance)+1.25rem)] [@media(min-width:64rem)_and_(max-height:52rem)]:pt-6"
      aria-labelledby="video-heading"
    >
      {/* subtle cinematic atmosphere — warm/desaturated wash, felt not seen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 30% 30%, rgb(201 21 36 / 0.045), transparent 70%), radial-gradient(55% 50% at 75% 75%, rgb(23 21 21 / 0.06), transparent 70%)",
        }}
      />
      <Container className="relative w-full max-w-none">
        {/* ── editorial heading ──
            Ownership split: cinematic scroll owns the outer wrapper,
            Framer Motion owns the inner entrance wrapper. */}
        <div className="cinematic-layer cinematic-layer--header mb-5 md:mb-8">
          <m.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={enteredOnce ? { opacity: 1 } : {}}
            transition={{
              duration: VIDEO_ENTRANCE_HEADING_MS / 1000,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <h2
              id="video-heading"
              className="text-center font-sans text-[min(clamp(3.5rem,7vw,6rem),calc((100vw-2.5rem)/5.2))] leading-[1.02] font-extrabold tracking-[-0.05em] text-foreground"
            >
              <AnimatedText segments="MOTION" level="word" />
            </h2>
          </m.div>
        </div>

        {/* ── showcase composition ──
            Height-driven sizing: the grid caps at the largest width whose
            16:9 player (+280px rail) still fits between the heading and
            the floating-nav safe area — as large as possible, never
            parked underneath the navigation. Below lg the player is
            naturally full-width 16:9. */}
        <div className="cinematic-layer cinematic-layer--media grid grid-cols-1 gap-6 lg:mx-auto lg:grid-cols-[minmax(0,1.75fr)_minmax(280px,0.72fr)] lg:items-start lg:max-w-[min(100%,calc((100svh-22rem)*16/9+19rem))]">
          {/* ── cinematic player ── */}
          <m.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={enteredOnce ? { opacity: 1 } : {}}
            transition={{
              duration: VIDEO_ENTRANCE_PLAYER_MS / 1000,
              ease: [0.22, 1, 0.36, 1],
              delay: prefersReducedMotion ? 0 : 0.06,
            }}
          >
            <div
              ref={playerWrapRef}
              className="relative overflow-hidden rounded-lg bg-black shadow-[var(--shadow-lg)] ring-1 ring-black/10 dark:ring-white/10"
            >
              {/* PLAYER VIEWPORT — always 16:9. The media inside is
                    contained (never cropped); unused area is plain ink. */}
              <div
                ref={frameRef}
                className="relative aspect-video w-full overflow-hidden bg-black"
              >
                {/* poster bridge — keyed so each film resolves its own frame */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={`poster-${current.id}`}
                  src={current.poster}
                  alt=""
                  aria-hidden
                  loading="eager"
                  decoding="async"
                  className={cn(
                    "absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-out motion-reduce:transition-none",
                    showPoster ? "opacity-100" : "opacity-0",
                  )}
                />
                <video
                  ref={activeRef}
                  className="absolute inset-0 h-full w-full bg-transparent object-contain"
                  poster={current.poster}
                  // Effective mute: global preference OR per-video intent.
                  // React applies this on prop change; imperative paths
                  // above enforce it synchronously between renders.
                  muted={globalMuted || isMuted}
                  playsInline
                  disablePictureInPicture
                  // "auto" once initialized: the early-init observer above
                  // arms this off-screen, so first video bytes arrive before
                  // entry instead of on the visible frame (same pattern the
                  // two-window next-video preload already uses).
                  preload={initialized ? "metadata" : "none"}
                  aria-label={`${current.title}. ${current.meta}`}
                />

                {/* restrained metadata gradient — legibility only */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
                />

                {/* bottom info + controls */}
                <div className="absolute inset-x-0 bottom-0 z-10">
                  <m.div
                    key={`meta-${current.id}`}
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-end justify-between gap-4 p-4 md:p-5"
                  >
                    <div className="min-w-0">
                      <div className="font-sans text-[10px] font-semibold tracking-[0.2em] text-white/85">
                        {formatNum(currentIndex + 1)} /{" "}
                        {current.title.toUpperCase()}
                      </div>
                      <div className="mt-1 max-w-[28rem] truncate font-sans text-[11px] tracking-[0.08em] text-white/70">
                        {current.meta}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleMute}
                        aria-label={isMuted ? "Unmute video" : "Mute video"}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:h-8 md:w-8"
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4 md:h-3.5 md:w-3.5" />
                        ) : (
                          <Volume2 className="h-4 w-4 md:h-3.5 md:w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        aria-label={
                          isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                        }
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:h-8 md:w-8"
                      >
                        {isFullscreen ? (
                          <Minimize className="h-4 w-4 md:h-3.5 md:w-3.5" />
                        ) : (
                          <Maximize className="h-4 w-4 md:h-3.5 md:w-3.5" />
                        )}
                      </button>
                    </div>
                  </m.div>
                  {/* extremely thin progress — lacquer for played portion */}
                  <div
                    ref={progressRef}
                    aria-hidden="true"
                    className="pointer-events-none relative h-[2px] w-full bg-white/15"
                    style={{ ["--progress" as string]: "0" }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 w-full bg-[var(--accent-cherry)]"
                      style={{ transform: "scaleX(var(--progress, 0))" }}
                    />
                  </div>
                </div>

                {/* cinematic play / pause — restrained circle, never huge.
                    Idle: play is discoverable. Playing: the frame stays
                    clean, pause reveals on hover/focus. */}
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={
                    isPlaying
                      ? `Pause ${current.title}`
                      : `Play ${current.title}`
                  }
                  className={cn(
                    "group absolute inset-0 z-[1] grid place-items-center transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60",
                    isPlaying ? "bg-transparent" : "bg-black/20",
                  )}
                >
                  <span className="flex flex-col items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex h-[60px] w-[60px] items-center justify-center rounded-full border border-white/30 bg-black/55 text-white transition-[background-color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:h-[72px] md:w-[72px]",
                        isPlaying &&
                          "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                      )}
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5 md:h-6 md:w-6" />
                      ) : (
                        <Play className="h-5 w-5 translate-x-px md:h-6 md:w-6" />
                      )}
                    </span>
                    {!isPlaying ? (
                      <span className="font-sans text-[10px] font-semibold tracking-[0.24em] text-white/0 transition-colors duration-300 group-hover:text-white/85 group-focus-visible:text-white/85 motion-reduce:transition-none">
                        PLAY FILM
                      </span>
                    ) : null}
                  </span>
                </button>
              </div>
            </div>
          </m.div>

          {/* ── project index — rail on desktop, vertical stack on mobile ── */}
          <VideoProjectList
            currentIndex={currentIndex}
            entered={enteredOnce}
            reduceMotion={prefersReducedMotion}
            onSelect={goTo}
            onHoverItem={handleHoverItem}
          />
        </div>

        {/* hidden next preload */}
        <video
          ref={nextRef}
          aria-hidden
          muted
          playsInline
          preload="none"
          className="hidden"
        />

        {/* compact bottom — mobile navbar already has its own safe area */}
        <div className="h-2" aria-hidden />
      </Container>
    </section>
  );
}
