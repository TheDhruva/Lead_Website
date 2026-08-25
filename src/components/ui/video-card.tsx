"use client";

import Image from "next/image";
import {
  type KeyboardEvent,
  type MouseEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useReducedMotion } from "framer-motion";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

import { CursorSpotlight } from "@/components/ui/cursor-spotlight";
import { useAutoplayVideo } from "@/hooks/use-autoplay-video";
import { useCanPointerReact } from "@/hooks/use-can-pointer-react";
import { cn } from "@/lib/utils";
import { getVideoSources } from "@/lib/video-source";
import type { VideoItem } from "@/types";

const PLAYBACK_FAR = 0.92;
const PLAYBACK_NEAR = 1;

interface VideoCardProps {
  video: VideoItem;
  className?: string;
  priority?: boolean;
  featured?: boolean;
}

function VideoCardComponent({
  video,
  className,
  priority,
  featured = false,
}: VideoCardProps) {
  const { containerRef, videoRef, isInView, markUserPaused } = useAutoplayVideo(
    {
      threshold: 0.08,
      rootMargin: "160px 0px",
    },
  );
  const [videoFailed, setVideoFailed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasLoadedSources, setHasLoadedSources] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const canPointerReact = useCanPointerReact();
  const showVideo = Boolean(video.src) && !videoFailed;

  if (isInView && !hasLoadedSources) {
    setHasLoadedSources(true);
  }

  const shouldLoadMedia = hasLoadedSources || isInView;
  const videoSources = useMemo(() => getVideoSources(video), [video]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !shouldLoadMedia) return;

    // Remounted <source> children need an explicit load to start fetching.
    videoEl.load();
  }, [shouldLoadMedia, videoRef, videoSources]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };
    const handleCanPlay = () => setIsBuffering(false);
    const handleStalled = () => setIsBuffering(true);

    videoEl.addEventListener("play", handlePlay);
    videoEl.addEventListener("pause", handlePause);
    videoEl.addEventListener("waiting", handleWaiting);
    videoEl.addEventListener("playing", handlePlaying);
    videoEl.addEventListener("canplay", handleCanPlay);
    videoEl.addEventListener("stalled", handleStalled);
    return () => {
      videoEl.removeEventListener("play", handlePlay);
      videoEl.removeEventListener("pause", handlePause);
      videoEl.removeEventListener("waiting", handleWaiting);
      videoEl.removeEventListener("playing", handlePlaying);
      videoEl.removeEventListener("canplay", handleCanPlay);
      videoEl.removeEventListener("stalled", handleStalled);
    };
  }, [videoRef]);

  // Soft playback nudge — nearer the frame center, closer to 1x
  useEffect(() => {
    if (!canPointerReact || !showVideo) return;
    const card = containerRef.current;
    const videoEl = videoRef.current;
    if (!card || !videoEl) return;

    let raf = 0;
    let running = true;
    const pointer = { x: 0, y: 0, inside: false };
    let currentRate = PLAYBACK_NEAR;

    const onMove = (event: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
    };

    const onLeave = () => {
      pointer.inside = false;
    };

    const tick = () => {
      if (!running) return;

      let target = PLAYBACK_NEAR;
      if (pointer.inside && !videoEl.paused) {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const maxDist = Math.hypot(rect.width, rect.height) * 0.5 || 1;
        const dist = Math.hypot(pointer.x - cx, pointer.y - cy);
        const t = Math.min(1, dist / maxDist);
        // Center = 1.0, edges = 0.92
        target = PLAYBACK_NEAR - t * (PLAYBACK_NEAR - PLAYBACK_FAR);
      } else if (!pointer.inside && !videoEl.paused) {
        target = PLAYBACK_FAR;
      }

      currentRate += (target - currentRate) * 0.12;
      const next = Math.round(currentRate * 1000) / 1000;
      if (Math.abs(videoEl.playbackRate - next) > 0.004) {
        videoEl.playbackRate = next;
      }

      raf = requestAnimationFrame(tick);
    };

    card.addEventListener("pointermove", onMove, { passive: true });
    card.addEventListener("pointerleave", onLeave, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
      videoEl.playbackRate = 1;
    };
  }, [canPointerReact, showVideo, containerRef, videoRef]);

  const handleVideoError = useCallback(() => {
    setVideoFailed(true);
    setIsBuffering(false);
  }, []);

  const handleTogglePlay = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (videoEl.paused) {
      markUserPaused(false);
      if (videoEl.readyState === HTMLMediaElement.HAVE_NOTHING) {
        videoEl.load();
      }
      if (videoEl.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
        setIsBuffering(true);
      }
      void videoEl.play();
    } else {
      markUserPaused(true);
      videoEl.pause();
    }
  }, [markUserPaused, videoRef]);

  const handleToggleMute = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      const videoEl = videoRef.current;
      if (!videoEl) return;
      const nextMuted = !videoEl.muted;
      videoEl.muted = nextMuted;
      setIsMuted(nextMuted);
    },
    [videoRef],
  );

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleTogglePlay();
      }
    },
    [handleTogglePlay],
  );

  const mediaMotionClassName = cn(
    "object-cover transition-transform duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
    !prefersReducedMotion &&
      "group-hover:scale-[1.02] group-focus-visible:scale-[1.02]",
  );

  const showBuffering = showVideo && isBuffering && shouldLoadMedia;

  return (
    <CursorSpotlight
      className={cn(
        "h-auto w-full overflow-hidden rounded-2xl",
        featured
          ? "aspect-[9/16] lg:aspect-auto lg:h-full"
          : "aspect-video lg:aspect-auto lg:h-full",
        className,
      )}
      size={featured ? 240 : 260}
      intensity={0.18}
    >
      <article
        ref={containerRef}
        tabIndex={0}
        onClick={showVideo ? handleTogglePlay : undefined}
        onKeyDown={showVideo ? handleCardKeyDown : undefined}
        aria-label={`${video.title}. ${video.meta}. ${
          showVideo ? (isPlaying ? "Pause video" : "Play video") : ""
        }`.trim()}
        aria-busy={showBuffering || undefined}
        className={cn(
          "group relative h-full w-full cursor-pointer overflow-hidden rounded-2xl bg-black outline-none",
          "ring-1 ring-inset ring-white/[0.08]",
          "transition-[box-shadow,transform] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
          "active:scale-[0.985] motion-reduce:active:scale-100",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        )}
      >
        {showVideo ? (
          <video
            ref={videoRef}
            className={cn(
              "absolute inset-0 h-full w-full",
              mediaMotionClassName,
            )}
            poster={video.poster}
            muted={isMuted}
            loop
            playsInline
            autoPlay={shouldLoadMedia}
            preload={shouldLoadMedia ? "auto" : "none"}
            aria-hidden="true"
            onError={handleVideoError}
          >
            {shouldLoadMedia
              ? videoSources.map((source) => (
                  <source
                    key={source.src}
                    src={source.src}
                    type={source.type}
                  />
                ))
              : null}
          </video>
        ) : (
          <Image
            src={video.poster}
            alt=""
            fill
            priority={priority}
            sizes={
              featured
                ? "(max-width: 1024px) 90vw, 46vw"
                : "(max-width: 1024px) 100vw, 54vw"
            }
            className={mediaMotionClassName}
          />
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:opacity-100 group-focus-visible:opacity-100 group-focus-within:opacity-100"
          aria-hidden="true"
        />

        {showBuffering ? (
          <div
            className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-black/25"
            aria-hidden="true"
          >
            <span className="relative flex h-11 w-11 items-center justify-center">
              <span
                className={cn(
                  "absolute inset-0 rounded-full border border-white/15",
                  "border-t-white/80",
                  !prefersReducedMotion && "animate-spin",
                )}
                style={{ animationDuration: "0.9s" }}
              />
              <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
            </span>
          </div>
        ) : null}

        {showVideo && !showBuffering ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center",
              "transition-opacity duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
              isPlaying ? "opacity-0" : "opacity-70",
              "[@media(hover:hover)]:opacity-0",
              "[@media(hover:hover)]:group-hover:opacity-100",
              "[@media(hover:hover)]:group-focus-visible:opacity-100",
              "[@media(hover:hover)]:group-focus-within:opacity-100",
            )}
            aria-hidden="true"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white md:h-12 md:w-12">
              {isPlaying ? (
                <Pause className="h-4 w-4 md:h-5 md:w-5" strokeWidth={1.75} />
              ) : (
                <Play
                  className="h-4 w-4 translate-x-px md:h-5 md:w-5"
                  strokeWidth={1.75}
                />
              )}
            </span>
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 md:p-5">
          <h3 className="font-label-md text-[13px] leading-tight font-semibold tracking-[0.12em] text-white uppercase md:text-sm">
            {video.title}
          </h3>
          <p className="mt-1 text-[11px] leading-snug tracking-wide text-white/70 md:text-xs">
            {video.meta}
          </p>
        </div>

        {showVideo ? (
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? "Unmute video" : "Mute video"}
            className={cn(
              "absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full",
              "border border-white/20 bg-black/40 text-white",
              "opacity-100 transition-all duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
              "hover:bg-black/55 active:scale-[0.985] motion-reduce:active:scale-100",
              "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
              "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100",
            )}
          >
            {isMuted ? (
              <VolumeX
                className="h-3.5 w-3.5"
                aria-hidden="true"
                strokeWidth={1.75}
              />
            ) : (
              <Volume2
                className="h-3.5 w-3.5"
                aria-hidden="true"
                strokeWidth={1.75}
              />
            )}
          </button>
        ) : null}
      </article>
    </CursorSpotlight>
  );
}

export const VideoCard = memo(VideoCardComponent);
