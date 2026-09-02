"use client";

import { useEffect } from "react";

import { videoItems } from "@/data";
import { getVideoSources } from "@/lib/video-source";

/**
 * Warms the HTTP cache for showcase videos during the intro overlay
 * so hover playback starts without buffering delay.
 */
export function VideoPrefetch() {
  useEffect(() => {
    const elements: HTMLVideoElement[] = [];

    for (const item of videoItems) {
      if (!item.src) continue;

      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";

      for (const source of getVideoSources(item)) {
        const track = document.createElement("source");
        track.src = source.src;
        track.type = source.type;
        video.appendChild(track);
      }

      video.load();
      elements.push(video);
    }

    return () => {
      for (const video of elements) {
        video.pause();
        video.removeAttribute("src");
        while (video.firstChild) {
          video.removeChild(video.firstChild);
        }
        video.load();
      }
    };
  }, []);

  return null;
}
