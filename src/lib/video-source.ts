import type { VideoItem } from "@/types";

export interface VideoSourceEntry {
  src: string;
  type: string;
}

/** Prefer mobile variants on narrow viewports and coarse pointers. */
export function prefersMobileVideo(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
}

function pickVariant(
  desktop: string | undefined,
  mobile: string | undefined,
  useMobile: boolean,
): string | undefined {
  if (!desktop && !mobile) return undefined;
  if (useMobile && mobile) return mobile;
  return desktop ?? mobile;
}

/** Video `<source>` entries ordered best-format-first for the current browser. */
export function getVideoSources(
  video: VideoItem,
  options?: { mobile?: boolean },
): VideoSourceEntry[] {
  const useMobile = options?.mobile ?? prefersMobileVideo();
  const sources: VideoSourceEntry[] = [];

  const hevc = pickVariant(video.hevcSrc, video.mobileHevcSrc, useMobile);
  const mp4 = pickVariant(video.src, video.mobileSrc, useMobile);
  const webm = pickVariant(video.webmSrc, video.mobileWebmSrc, useMobile);

  if (hevc && canPlayHevc()) {
    sources.push({
      src: hevc,
      type: 'video/mp4; codecs="hvc1"',
    });
  }

  if (mp4) {
    sources.push({ src: mp4, type: "video/mp4" });
  }

  // Only add VP9 if browser reports support — avoids wasted probe on Safari
  if (webm && canPlayVp9()) {
    sources.push({ src: webm, type: "video/webm; codecs=vp9" });
  }

  return sources;
}

let hevcSupported: boolean | null = null;
let vp9Supported: boolean | null = null;

function canPlayHevc(): boolean {
  if (typeof document === "undefined") return false;
  if (hevcSupported !== null) return hevcSupported;

  hevcSupported =
    document.createElement("video").canPlayType('video/mp4; codecs="hvc1"') !==
    "";

  return hevcSupported;
}

function canPlayVp9(): boolean {
  if (typeof document === "undefined") return false;
  if (vp9Supported !== null) return vp9Supported;
  vp9Supported =
    document.createElement("video").canPlayType('video/webm; codecs="vp9"') !==
    "";
  return vp9Supported;
}
