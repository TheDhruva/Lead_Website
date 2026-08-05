"use client";

import { useEffect, useRef } from "react";

import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface UseAutoplayVideoOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useAutoplayVideo(options: UseAutoplayVideoOptions = {}) {
  const { threshold = 0.15, rootMargin = "80px 0px" } = options;
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: containerRef, isInView } =
    useIntersectionObserver<HTMLDivElement>({
      threshold,
      rootMargin,
      triggerOnce: false,
    });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isInView) {
      video.pause();
      return;
    }

    const tryPlay = () => {
      void video.play().catch(() => {
        // Autoplay may be blocked; poster + controls remain visible.
      });
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      tryPlay();
      return;
    }

    video.load();
    video.addEventListener("canplay", tryPlay, { once: true });

    return () => {
      video.removeEventListener("canplay", tryPlay);
    };
  }, [isInView]);

  return { containerRef, videoRef, isInView };
}
