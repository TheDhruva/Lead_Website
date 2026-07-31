"use client";

import Image from "next/image";
import { memo, useCallback, useState } from "react";

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
  const prefersReducedMotion = useReducedMotion();
  const showVideo = Boolean(video.src) && !videoFailed;

  const handleVideoError = useCallback(() => {
    setVideoFailed(true);
  }, []);

  return (
    <m.article
      ref={containerRef}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      tabIndex={0}
      aria-label={`${video.title}, ${video.category}, duration ${video.duration}`}
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
          muted
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

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent opacity-70"
        aria-hidden="true"
      />

      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-black/40 to-black/15 p-5 md:p-6",
          "opacity-0 transition-opacity duration-300 ease-out",
          "group-hover:opacity-100 group-focus-within:opacity-100",
        )}
      >
        <div className="flex justify-end">
          <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-xs font-medium tracking-wide text-white/90 backdrop-blur-sm">
            {video.duration}
          </span>
        </div>

        <div className="flex flex-col items-start gap-3">
          <span
            className="material-symbols-outlined text-4xl text-white md:text-5xl"
            aria-hidden="true"
          >
            play_circle
          </span>
          <div className="min-w-0 max-w-full">
            <h3
              className={cn(
                "truncate font-semibold tracking-tight text-white",
                featured ? "text-lg md:text-xl" : "text-base md:text-lg",
              )}
            >
              {video.title}
            </h3>
            <p className="mt-1 truncate text-sm text-white/75">
              {video.category}
            </p>
          </div>
        </div>
      </div>
    </m.article>
  );
}

export const VideoCard = memo(VideoCardComponent);
