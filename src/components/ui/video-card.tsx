"use client";

import Image from "next/image";
import {
  type KeyboardEvent,
  type MouseEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";

import { CursorSpotlight } from "@/components/ui/cursor-spotlight";
import { VIDEO_PLAYBACK_VOLUME } from "@/constants/audio";
import { useHoverPreviewVideo } from "@/hooks/use-hover-preview-video";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { getVideoSources } from "@/lib/video-source";
import { useAudio } from "@/providers/audio-provider";
import type { VideoItem } from "@/types";

interface VideoCardProps {
  video: VideoItem;
  className?: string;
  priority?: boolean;
  featured?: boolean;
  sectionActive?: boolean;
  /** Stagger media loading within a grid (ms) */
  loadDelay?: number;
}

function VideoCardComponent({
  video,
  className,
  priority,
  featured = false,
  sectionActive = true,
  loadDelay = 0,
}: VideoCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const { setVideoAudioActive } = useAudio();
  const [videoFailed, setVideoFailed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const isMutedRef = useRef(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [loadReady, setLoadReady] = useState(loadDelay <= 0);
  const {
    containerRef,
    videoRef,
    canInteract,
    markUserPaused,
    handlePointerEnter,
    handlePointerLeave,
    pauseAndReset,
  } = useHoverPreviewVideo({
    threshold: 0.12,
    rootMargin: "0px",
    enabled: !prefersReducedMotion,
    sectionActive,
    preload: loadReady && sectionActive,
  });
  const showVideo = Boolean(video.src) && !videoFailed;
  const isPortrait = featured || video.aspect === "portrait";

  const shouldLoadMedia = loadReady;
  const videoSources = useMemo(() => getVideoSources(video), [video]);

  useEffect(() => {
    if (loadDelay <= 0) return;
    const timer = window.setTimeout(() => setLoadReady(true), loadDelay);
    return () => window.clearTimeout(timer);
  }, [loadDelay]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !shouldLoadMedia) return;
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

  const handleVideoError = useCallback(() => {
    setVideoFailed(true);
    setIsBuffering(false);
  }, []);

  const handleTogglePlay = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !canInteract) return;
    if (videoEl.paused) {
      markUserPaused(false);
      if (videoEl.readyState === HTMLMediaElement.HAVE_NOTHING) {
        videoEl.load();
      }
      if (videoEl.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
        setIsBuffering(true);
      }
      void videoEl.play().then(() => {
        if (!isMutedRef.current) {
          setVideoAudioActive(true);
        }
      });
    } else {
      markUserPaused(true);
      videoEl.pause();
      if (!isMutedRef.current) {
        setVideoAudioActive(false);
      }
    }
  }, [canInteract, markUserPaused, setVideoAudioActive, videoRef]);

  useEffect(() => {
    if (sectionActive) return;

    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.pause();
    }

    if (!isMutedRef.current) {
      setVideoAudioActive(false);
    }

    pauseAndReset();
  }, [sectionActive, pauseAndReset, setVideoAudioActive, videoRef]);

  const handleToggleMute = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      const videoEl = videoRef.current;
      if (!videoEl) return;
      const nextMuted = !videoEl.muted;

      if (nextMuted) {
        setVideoAudioActive(false);
      } else {
        videoEl.volume = VIDEO_PLAYBACK_VOLUME;
        if (!videoEl.paused) {
          setVideoAudioActive(true);
        }
      }

      videoEl.muted = nextMuted;
      isMutedRef.current = nextMuted;
      setIsMuted(nextMuted);
    },
    [setVideoAudioActive, videoRef],
  );

  useEffect(() => {
    return () => {
      if (!isMutedRef.current) {
        setVideoAudioActive(false);
      }
    };
  }, [setVideoAudioActive]);

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleTogglePlay();
      }
    },
    [handleTogglePlay],
  );

  const showBuffering = showVideo && isBuffering && shouldLoadMedia;

  const playbackLabel = showVideo
    ? isPlaying
      ? "Pause video"
      : "Play video"
    : "";
  const muteLabel = showVideo ? (isMuted ? "Muted" : "Unmuted") : "";
  const ariaLabel = [video.title, video.meta, playbackLabel, muteLabel]
    .filter(Boolean)
    .join(". ");

  return (
    <div
      className={cn(
        "relative h-auto w-full",
        isPortrait
          ? "aspect-[9/16] max-h-[min(62svh,32rem)] md:max-h-[min(62svh,34rem)] lg:aspect-auto lg:max-h-none lg:h-full"
          : "aspect-video lg:aspect-auto lg:h-full",
        className,
      )}
    >
      <CursorSpotlight
        className="absolute inset-0 h-full w-full rounded-2xl"
        size={featured ? 240 : 260}
        intensity={0.18}
      >
        <article
          ref={containerRef}
          tabIndex={0}
          onPointerEnter={showVideo ? handlePointerEnter : undefined}
          onPointerLeave={showVideo ? handlePointerLeave : undefined}
          onClick={showVideo ? handleTogglePlay : undefined}
          onKeyDown={showVideo ? handleCardKeyDown : undefined}
          aria-label={ariaLabel}
          aria-busy={showBuffering || undefined}
          className={cn(
            "media-card group relative h-full w-full cursor-pointer overflow-hidden rounded-2xl bg-black outline-none",
            "ring-1 ring-inset ring-white/[0.08]",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
            prefersReducedMotion && "media-card--static",
          )}
        >
          {showVideo ? (
            <video
              ref={videoRef}
              className="media-card__media absolute inset-0 h-full w-full object-cover object-center"
              poster={video.poster}
              muted={isMuted}
              loop
              playsInline
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
              className="media-card__media object-cover object-center"
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

          <div className="media-card__caption pointer-events-none absolute inset-x-0 bottom-0 p-4 md:p-5">
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
    </div>
  );
}

export const VideoCard = memo(VideoCardComponent);
