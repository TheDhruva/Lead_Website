"use client";

import { useEffect, useRef } from "react";

import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface UseAutoplayVideoOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useAutoplayVideo(options: UseAutoplayVideoOptions = {}) {
  const { threshold = 0.08, rootMargin = "160px 0px" } = options;
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: containerRef, isInView } = useIntersectionObserver<HTMLElement>({
    threshold,
    rootMargin,
    triggerOnce: false,
  });
  const userPausedRef = useRef(false);

  useEffect(() => {
    if (!isInView) {
      userPausedRef.current = false;
    }
  }, [isInView]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isInView) {
      video.pause();
      return;
    }

    if (userPausedRef.current) return;

    let cancelled = false;
    let retryId: ReturnType<typeof setTimeout> | null = null;

    const tryPlay = () => {
      if (cancelled || userPausedRef.current || !isInView) return;

      video.muted = true;
      video.playsInline = true;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        void playPromise.catch(() => {
          if (cancelled) return;
          retryId = setTimeout(() => {
            if (cancelled || userPausedRef.current) return;
            void video.play().catch(() => {
              // Autoplay may still be blocked; poster + controls remain.
            });
          }, 280);
        });
      }
    };

    const onCanPlay = () => tryPlay();
    const onLoadedData = () => tryPlay();

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("loadeddata", onLoadedData);

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      tryPlay();
    } else if (video.networkState === HTMLMediaElement.NETWORK_IDLE) {
      video.load();
    }

    // Visibility / tab focus — resume muted autoplay when returning.
    const onVisibility = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (retryId) clearTimeout(retryId);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("loadeddata", onLoadedData);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isInView]);

  const markUserPaused = (paused: boolean) => {
    userPausedRef.current = paused;
  };

  return { containerRef, videoRef, isInView, markUserPaused };
}
