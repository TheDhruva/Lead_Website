"use client";

import { useCallback, useEffect, useRef } from "react";

import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

const PREVIEW_SECONDS = 1;

interface UseHoverPreviewVideoOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  /** Parent videos section is on screen */
  sectionActive?: boolean;
  /** Primary visible card — only this card loads/decodes media */
  mediaActive?: boolean;
  /** Load preview frames before the card scrolls into view */
  preload?: boolean;
}

export function useHoverPreviewVideo({
  threshold = 0.08,
  rootMargin = "0px",
  enabled = true,
  sectionActive = true,
  mediaActive = true,
  preload = false,
}: UseHoverPreviewVideoOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: containerRef, isInView } = useIntersectionObserver<HTMLElement>({
    threshold,
    rootMargin,
    triggerOnce: false,
    useScrollContainerRoot: true,
  });
  const isHoveredRef = useRef(false);
  const userPausedRef = useRef(false);
  const previewReadyRef = useRef(false);

  const canInteract = enabled && sectionActive && mediaActive && isInView;

  const seekPreview = useCallback((video: HTMLVideoElement) => {
    const duration = Number.isFinite(video.duration)
      ? video.duration
      : PREVIEW_SECONDS;
    const target = Math.min(PREVIEW_SECONDS, Math.max(0, duration - 0.05));
    try {
      video.currentTime = target;
    } catch {
      // ignore seek errors before metadata is ready
    }
  }, []);

  const pauseToPreview = useCallback(() => {
    const video = videoRef.current;
    if (!video || userPausedRef.current) return;
    seekPreview(video);
    video.pause();
  }, [seekPreview]);

  const pauseAndReset = useCallback(() => {
    isHoveredRef.current = false;
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    if (!userPausedRef.current) {
      seekPreview(video);
    }
  }, [seekPreview]);

  useEffect(() => {
    if (sectionActive) return;
    pauseAndReset();
  }, [sectionActive, pauseAndReset]);

  useEffect(() => {
    const video = videoRef.current;
    const shouldPrepare =
      enabled && sectionActive && mediaActive && (isInView || preload);

    if (!video || !shouldPrepare) {
      if (!preload) {
        previewReadyRef.current = false;
        video?.pause();
      }
      return;
    }

    let cancelled = false;

    const preparePreview = () => {
      if (
        cancelled ||
        isHoveredRef.current ||
        userPausedRef.current ||
        !sectionActive
      ) {
        return;
      }
      seekPreview(video);
      video.pause();
      previewReadyRef.current = true;
    };

    const onLoadedData = () => preparePreview();
    const onLoadedMetadata = () => preparePreview();
    const onSeeked = () => {
      if (!isHoveredRef.current && !userPausedRef.current) {
        video.pause();
      }
    };

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("seeked", onSeeked);

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      preparePreview();
    }

    return () => {
      cancelled = true;
      previewReadyRef.current = false;
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("seeked", onSeeked);
      video.pause();
    };
  }, [enabled, isInView, mediaActive, preload, sectionActive, seekPreview]);

  useEffect(() => {
    if (mediaActive) return;
    pauseAndReset();
  }, [mediaActive, pauseAndReset]);

  useEffect(() => {
    if (canInteract) return;
    pauseAndReset();
  }, [canInteract, pauseAndReset]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        pauseAndReset();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [pauseAndReset]);

  const playFromHover = useCallback(() => {
    const video = videoRef.current;
    if (!video || userPausedRef.current || !canInteract) return;

    void video.play().catch(() => {
      // Playback may be blocked until user gesture.
    });
  }, [canInteract]);

  const handlePointerEnter = useCallback(() => {
    if (!canInteract) return;
    isHoveredRef.current = true;
    userPausedRef.current = false;
    playFromHover();
  }, [canInteract, playFromHover]);

  const handlePointerLeave = useCallback(() => {
    isHoveredRef.current = false;
    if (userPausedRef.current) return;
    pauseToPreview();
  }, [pauseToPreview]);

  const markUserPaused = useCallback(
    (paused: boolean) => {
      userPausedRef.current = paused;
      const video = videoRef.current;
      if (!video) return;

      if (paused) {
        video.pause();
        return;
      }

      if (!canInteract) return;

      if (isHoveredRef.current) {
        playFromHover();
      } else {
        pauseToPreview();
      }
    },
    [canInteract, playFromHover, pauseToPreview],
  );

  return {
    containerRef,
    videoRef,
    isInView,
    sectionActive,
    canInteract,
    markUserPaused,
    handlePointerEnter,
    handlePointerLeave,
    pauseAndReset,
  };
}
