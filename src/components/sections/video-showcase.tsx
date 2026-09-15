"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { m } from "framer-motion";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

import { Container } from "@/components/ui/container";
import { VIDEO_PLAYBACK_VOLUME } from "@/constants/audio";
import { videoItems } from "@/data";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { getScrollContainer } from "@/lib/scroll-container";
import { cn } from "@/lib/utils";
import { getVideoSources } from "@/lib/video-source";
import { useAudio } from "@/providers/audio-provider";
import type { VideoItem } from "@/types";

const TRANSITION_MS = 520;
const PRELOAD_THRESHOLD = 0.75;

function formatIndex(n: number, total: number) {
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${pad(n)} / ${pad(total)}`;
}

export function VideoShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLVideoElement>(null);
  const nextRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const preloadStartedRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const { setVideoAudioActive } = useAudio();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const isMutedRef = useRef(true);
  const currentIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  // Explicit user stop (pause) — autoplay must not override it.
  const userPausedRef = useRef(false);

  const total = videoItems.length;
  const current: VideoItem = videoItems[currentIndex] ?? videoItems[0]!;
  const queue: VideoItem[] = (() => {
    const out: VideoItem[] = [];
    for (let i = 1; i < total; i++)
      out.push(videoItems[(currentIndex + i) % total]!);
    return out;
  })();
  // stable frame aspect: 16:9 for landscape showcase. Vertical videos use contain + blur.
  const isPortrait = current.aspect === "portrait";

  // keep refs in sync
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // lazy init — only when section approaches viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const root = getScrollContainer();
    const obs = new IntersectionObserver(
      ([entry]) => {
        const visible = !!entry?.isIntersecting;
        setIsSectionVisible(visible);
        if (visible) setInitialized(true);
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

  // pause when section leaves viewport
  useEffect(() => {
    if (!initialized) return;
    const v = activeRef.current;
    if (!v) return;
    if (!isSectionVisible) {
      v.pause();
      if (!isMutedRef.current) setVideoAudioActive(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    } else if (
      isSectionVisible &&
      !isPlayingRef.current &&
      !autoplayBlocked &&
      !userPausedRef.current
    ) {
      // resume autoplay when returning — unless the user explicitly stopped
      v.muted = isMutedRef.current;
      void v.play().catch(() => setAutoplayBlocked(true));
    }
  }, [isSectionVisible, initialized, autoplayBlocked, setVideoAudioActive]);

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

  // initialize / switch active video
  useEffect(() => {
    if (!initialized) return;
    const v = activeRef.current;
    if (!v) return;
    preloadStartedRef.current = false;
    if (progressRef.current)
      progressRef.current.style.setProperty("--progress", "0%");
    setAutoplayBlocked(false);

    setVideoSources(v, current);
    v.muted = isMutedRef.current;
    v.volume = VIDEO_PLAYBACK_VOLUME;
    v.currentTime = 0;

    // autoplay muted when visible
    if (isSectionVisible) {
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
    isSectionVisible,
    setVideoSources,
    setVideoAudioActive,
  ]);

  // progress loop — direct DOM, no React state per frame
  const startProgressLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const v = activeRef.current;
    const bar = progressRef.current;
    if (!v || !bar) return;
    const tick = () => {
      if (!v.duration || Number.isNaN(v.duration) || v.duration === 0) {
        bar.style.setProperty("--progress", "0%");
      } else {
        const pct = Math.min(100, (v.currentTime / v.duration) * 100);
        bar.style.setProperty("--progress", `${pct}%`);
        // two-window preload at ~75%
        if (!preloadStartedRef.current && pct >= PRELOAD_THRESHOLD * 100) {
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
  }, [setVideoSources, total]);

  const stopProgressLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // video events
  // NOTE: the active <video> remounts on every video change
  // (key={video-...}), so listeners must re-bind to each new element —
  // otherwise only the first video reports play/pause/ended.
  useEffect(() => {
    const v = activeRef.current;
    if (!v) return;
    const onPlay = () => {
      setIsPlaying(true);
      startProgressLoop();
    };
    const onPause = () => {
      setIsPlaying(false);
      stopProgressLoop();
    };
    const onTimeUpdate = () => {
      // rAF handles progress, but keep as fallback for preload trigger if rAF paused
      if (
        !preloadStartedRef.current &&
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
        progressRef.current.style.setProperty("--progress", "100%");
      // cyclic advance with crossfade
      if (prefersReducedMotion) {
        setCurrentIndex((i) => (i + 1) % total);
      } else {
        setIsTransitioning(true);
        window.setTimeout(() => {
          setCurrentIndex((i) => (i + 1) % total);
          window.setTimeout(() => setIsTransitioning(false), 60);
        }, TRANSITION_MS);
      }
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
    currentIndex,
    initialized,
    startProgressLoop,
    stopProgressLoop,
    prefersReducedMotion,
    total,
    setVideoSources,
  ]);

  // cleanup rAF on unmount
  useEffect(() => {
    return () => {
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
      // picking a video is an explicit intent to watch — resume the autoplay chain
      userPausedRef.current = false;
      if (prefersReducedMotion) {
        setCurrentIndex(idx);
      } else {
        setIsTransitioning(true);
        window.setTimeout(() => {
          setCurrentIndex(idx);
          window.setTimeout(() => setIsTransitioning(false), 60);
        }, TRANSITION_MS * 0.6);
      }
    },
    [prefersReducedMotion],
  );

  const togglePlay = useCallback(() => {
    const v = activeRef.current;
    if (!v) return;
    if (v.paused) {
      userPausedRef.current = false;
      v.muted = isMutedRef.current;
      void v
        .play()
        .then(() => {
          setIsPlaying(true);
          if (!isMutedRef.current) setVideoAudioActive(true);
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
  }, [setVideoAudioActive]);

  const toggleMute = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      const v = activeRef.current;
      if (!v) return;
      const next = !v.muted;
      v.muted = next;
      isMutedRef.current = next;
      setIsMuted(next);
      if (!next) {
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
      } else setVideoAudioActive(false);
    },
    [setVideoAudioActive],
  );

  return (
    <section
      ref={sectionRef}
      id="video"
      data-snap-frame
      data-scroll-anchor-ratio="0.47"
      className="section-frame section-tone-videos !h-auto !min-h-0 !max-h-none overflow-visible py-6 md:py-10 lg:py-10"
      aria-labelledby="video-heading"
    >
      <Container className="w-full max-w-none">
        {/* header */}
        <div className="mb-5 flex items-end justify-between gap-4 md:mb-7">
          <h2
            id="video-heading"
            className="font-headline-lg text-headline-lg tracking-[-0.03em] text-foreground"
          >
            Videos
          </h2>
          <span className="font-mono text-[11px] tracking-[0.18em] text-foreground-secondary tabular-nums">
            {formatIndex(currentIndex + 1, total)}
          </span>
        </div>

        {/* showcase */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(280px,0.72fr)] lg:gap-6 lg:items-start">
          {/* active */}
          <div className="relative overflow-hidden rounded-lg bg-black">
            {/* stable 16:9 frame */}
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              {/* blurred backdrop for portrait reels */}
              {isPortrait ? (
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${current.poster})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "blur(28px) brightness(0.55)",
                    transform: "scale(1.12)",
                  }}
                />
              ) : null}
              {/* poster until video can play */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={`poster-${current.id}`}
                src={current.poster}
                alt=""
                aria-hidden
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  prefersReducedMotion ? "transition-none" : "",
                  isPlaying && !isTransitioning ? "opacity-0" : "opacity-100",
                )}
                loading="eager"
                decoding="async"
              />
              <video
                ref={activeRef}
                key={`video-${current.id}`}
                className={cn(
                  "absolute inset-0 h-full w-full bg-black transition-opacity duration-[600ms]",
                  prefersReducedMotion
                    ? "transition-none"
                    : "ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isPortrait ? "object-contain p-0" : "object-cover",
                  isTransitioning ? "opacity-0" : "opacity-100",
                )}
                poster={current.poster}
                muted={isMuted}
                playsInline
                preload="metadata"
                aria-label={`${current.title}. ${current.meta}`}
                onClick={togglePlay}
              />

              {/* subtle bottom gradient + info */}
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-12">
                <m.div
                  key={`meta-${current.id}`}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-none flex items-end justify-between gap-4 p-4 md:p-5"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] tracking-[0.2em] text-white/80">
                      {String(currentIndex + 1).padStart(2, "0")} /{" "}
                      {current.title.toUpperCase()}
                    </div>
                    <div className="mt-1 max-w-[28rem] truncate font-label-md text-[11px] tracking-[0.12em] text-white/70">
                      {current.meta}
                    </div>
                  </div>
                  <div className="pointer-events-auto hidden shrink-0 items-center gap-2 md:flex">
                    <button
                      type="button"
                      onClick={toggleMute}
                      aria-label={isMuted ? "Unmute video" : "Mute video"}
                      className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-[6px] transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                      {isMuted ? (
                        <VolumeX className="h-3.5 w-3.5" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label={isPlaying ? "Pause video" : "Play video"}
                      className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-[6px] transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                      {isPlaying ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5 translate-x-px" />
                      )}
                    </button>
                  </div>
                </m.div>
                {/* thin progress */}
                <div
                  ref={progressRef}
                  className="pointer-events-none relative h-px w-full bg-white/15"
                  style={{ ["--progress" as string]: "0%" }}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-[var(--accent-cherry)] transition-none"
                    style={{ width: "var(--progress)" }}
                  />
                </div>
              </div>

              {/* mobile controls + play affordance */}
              <div className="pointer-events-auto absolute right-3 top-3 z-10 flex gap-2 md:hidden">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              </div>
              {!isPlaying && !isTransitioning ? (
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label="Play video"
                  className="absolute inset-0 z-[1] grid place-items-center bg-black/20"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white">
                    <Play className="h-5 w-5 translate-x-px" />
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause" : "Play"}
                  className="absolute inset-0 z-[1]"
                />
              )}
            </div>
          </div>

          {/* queue */}
          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-[0.2em] text-foreground-secondary">
                NEXT
              </span>
              <span className="hidden font-mono text-[11px] text-foreground-secondary lg:inline">
                {String(queue.length).padStart(2, "0")} queued
              </span>
            </div>

            {/* desktop vertical queue */}
            <div className="hidden flex-col gap-0 lg:flex">
              {queue.map((item, idx) => {
                const num = String(
                  videoItems.findIndex((v) => v.id === item.id) + 1,
                ).padStart(2, "0");
                return (
                  <m.button
                    key={item.id}
                    type="button"
                    initial={
                      prefersReducedMotion ? false : { opacity: 0, y: 8 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                      delay: idx * 0.04,
                    }}
                    onClick={() => goTo(item.id)}
                    className="group relative flex w-full items-center gap-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Play ${item.title}`}
                  >
                    <span className="font-mono text-[11px] text-foreground-secondary tabular-nums">
                      {num}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-label-md text-[12px] font-semibold tracking-[0.12em] text-foreground group-hover:text-foreground">
                        {item.title.toUpperCase()}
                      </span>
                      <span className="block truncate text-[11px] text-foreground-secondary">
                        {item.meta}
                      </span>
                    </span>
                    <span className="relative h-[62px] w-[108px] shrink-0 overflow-hidden rounded-md bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.poster}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02] group-hover:brightness-[1.06]"
                      />
                    </span>
                    {idx < queue.length - 1 ? (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-border"
                      />
                    ) : null}
                  </m.button>
                );
              })}
            </div>

            {/* mobile horizontal queue */}
            <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
              <div className="flex gap-3 pr-4">
                {queue.map((item) => {
                  const num = String(
                    videoItems.findIndex((v) => v.id === item.id) + 1,
                  ).padStart(2, "0");
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goTo(item.id)}
                      className="group flex w-[200px] shrink-0 flex-col gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Play ${item.title}`}
                    >
                      <span className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.poster}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
                          {num}
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] font-semibold tracking-[0.08em] text-foreground">
                          {item.title}
                        </span>
                        <span className="block truncate text-[11px] text-foreground-secondary">
                          {item.meta}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
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
