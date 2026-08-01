"use client";

import Image from "next/image";
import { memo, useCallback, useEffect, useState } from "react";

import { m, useReducedMotion } from "framer-motion";

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
    threshold: 0.35,
  });
  const [videoFailed, setVideoFailed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const showVideo = Boolean(video.src) && !videoFailed;

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
      void videoEl.play();
    } else {
      videoEl.pause();
    }
  }, [videoRef]);

  const handleToggleMute = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const nextMuted = !videoEl.muted;
    videoEl.muted = nextMuted;
    setIsMuted(nextMuted);
  }, [videoRef]);

  return (
    <m.article
      ref={containerRef}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      tabIndex={0}
      aria-label={`${video.title}, ${video.category}`}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)] outline-none",
        "transition-shadow duration-[250ms] hover:shadow-[var(--shadow-md)]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        featured
          ? "aspect-[9/16] h-auto w-full lg:h-full lg:w-auto lg:max-w-full"
          : "aspect-video h-auto w-full lg:h-full lg:aspect-auto",
        className,
      )}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          poster={video.poster}
          muted={isMuted}
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          onError={handleVideoError}
        >
          {isInView && video.src ? (
            <source src={video.src} type="video/mp4" />
          ) : null}
        </video>
      ) : (
        <Image
          src={video.poster}
          alt=""
          fill
          priority={priority}
          sizes={
            featured
              ? "(max-width: 1024px) 90vw, 36vw"
              : "(max-width: 1024px) 100vw, 55vw"
          }
          className="object-cover"
        />
      )}

      {showVideo ? (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3 md:p-4",
            "bg-gradient-to-t from-black/50 via-black/15 to-transparent",
            "opacity-0 transition-opacity duration-200 ease-out",
            "group-hover:opacity-100 group-focus-within:opacity-100",
          )}
        >
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? "Pause video" : "Play video"}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <span
              className="material-symbols-outlined text-2xl"
              aria-hidden="true"
            >
              {isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? "Unmute video" : "Mute video"}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <span
              className="material-symbols-outlined text-2xl"
              aria-hidden="true"
            >
              {isMuted ? "volume_off" : "volume_up"}
            </span>
          </button>
        </div>
      ) : null}
    </m.article>
  );
}

export const VideoCard = memo(VideoCardComponent);
