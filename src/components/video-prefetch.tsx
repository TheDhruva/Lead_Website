"use client";

import { useEffect } from "react";

import { videoItems } from "@/data";
import { getVideoSources } from "@/lib/video-source";

/**
 * Warms HTTP cache for the featured video once the Videos section is near.
 * Mount inside VideoShowcase (or after lazy section loads) — not on initial page.
 */
export function VideoPrefetch() {
  useEffect(() => {
    const featured = videoItems.find((item) => item.featured) ?? videoItems[0];
    if (!featured?.src) return;

    // Defer to idle so initial hero/LCP isn't contended
    const idleId = (
      window as unknown as {
        requestIdleCallback?: (
          cb: () => void,
          opts?: { timeout: number },
        ) => number;
      }
    ).requestIdleCallback
      ? (
          window as unknown as {
            requestIdleCallback: (cb: () => void) => number;
          }
        ).requestIdleCallback(() => warm())
      : window.setTimeout(() => warm(), 1600);

    function warm() {
      if (!featured) return;
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";

      for (const source of getVideoSources(featured)) {
        const track = document.createElement("source");
        track.src = source.src;
        track.type = source.type;
        video.appendChild(track);
      }

      video.load();
      // Keep handle to cleanup if unmounted quickly
      (warm as unknown as { _v?: HTMLVideoElement })._v = video;
    }

    return () => {
      if (typeof idleId === "number") {
        try {
          (
            window as unknown as { cancelIdleCallback?: (id: number) => void }
          ).cancelIdleCallback?.(idleId);
        } catch {}
        clearTimeout(idleId);
      }
      const v = (warm as unknown as { _v?: HTMLVideoElement })._v;
      if (v) {
        v.pause();
        v.removeAttribute("src");
        while (v.firstChild) v.removeChild(v.firstChild);
        v.load();
      }
    };
  }, []);

  return null;
}
