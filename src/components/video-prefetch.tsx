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

    return () => {
      video.pause();
      video.removeAttribute("src");
      while (video.firstChild) {
        video.removeChild(video.firstChild);
      }
      video.load();
    };
  }, []);

  return null;
}
