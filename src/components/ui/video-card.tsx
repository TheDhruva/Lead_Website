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

import { useAutoplayVideo } from "@/hooks/use-autoplay-video";
import { cn } from "@/lib/utils";
import type { VideoItem } from "@/types";

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
  const { containerRef, videoRef, isInView } = useAutoplayVideo({
    threshold: 0.12,
    rootMargin: "120px 0px",
  });
  const [videoFailed, setVideoFailed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const showVideo = Boolean(video.src) && !videoFailed;
  const resolvedSrc = useMemo(() => {
    if (typeof window === "undefined" || !video.hevcSrc) return video.src;
    return document
      .createElement("video")
      .canPlayType('video/mp4; codecs="hvc1"')
      ? video.hevcSrc
      : video.src;
  }, [video.hevcSrc, video.src]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    videoEl.addEventListener("play", handlePlay);
    videoEl.addEventListener("pause", handlePause);
    return () => {
      videoEl.removeEventListener("play", handlePlay);
      videoEl.removeEventListener("pause", handlePause);
    };
  }, [videoRef]);

  const handleVideoError = useCallback(() => {
    setVideoFailed(true);
  }, []);

  const handleTogglePlay = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (videoEl.paused) {
      if (videoEl.readyState === HTMLMediaElement.HAVE_NOTHING) {
        videoEl.load();
      }
      void videoEl.play();
    } else {
      videoEl.pause();
    }
  }, [videoRef]);

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

  return (
    <article
      ref={containerRef}
      tabIndex={0}
      onClick={showVideo ? handleTogglePlay : undefined}
      onKeyDown={showVideo ? handleCardKeyDown : undefined}
      aria-label={`${video.title}. ${video.meta}. ${
        showVideo ? (isPlaying ? "Pause video" : "Play video") : ""
      }`.trim()}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl bg-black outline-none",
        "ring-1 ring-inset ring-white/[0.08]",
        "transition-[box-shadow] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        featured
          ? "aspect-[9/16] h-auto w-full lg:aspect-auto lg:h-full"
          : "aspect-video h-auto w-full lg:aspect-auto lg:h-full",
        className,
      )}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          className={cn("absolute inset-0 h-full w-full", mediaMotionClassName)}
          src={featured || isInView ? resolvedSrc : undefined}
          poster={video.poster}
          muted={isMuted}
          loop
          playsInline
          preload={featured ? "metadata" : "none"}
          aria-hidden="true"
          onError={handleVideoError}
        />
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

      {showVideo ? (
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
            "opacity-100 transition-opacity duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
            "hover:bg-black/55 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
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
  );
}

export const VideoCard = memo(VideoCardComponent);
