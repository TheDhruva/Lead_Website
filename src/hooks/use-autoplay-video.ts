"use client";

import { useEffect, useRef } from "react";

import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface UseAutoplayVideoOptions {
  threshold?: number;
}

export function useAutoplayVideo(options: UseAutoplayVideoOptions = {}) {
  const { threshold = 0.4 } = options;
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: containerRef, isInView } =
    useIntersectionObserver<HTMLDivElement>({
      threshold,
      triggerOnce: false,
    });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView) {
      void video.play().catch(() => {
        // Autoplay may be blocked; poster remains visible.
      });
    } else {
      video.pause();
    }
  }, [isInView]);

  return { containerRef, videoRef, isInView };
}
