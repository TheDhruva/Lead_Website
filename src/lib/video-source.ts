import type { VideoItem } from "@/types";

/** Video `<source>` entries ordered best-format-first for the current browser. */
export function getVideoSources(video: VideoItem): Array<{
  src: string;
  type: string;
}> {
  const sources: Array<{ src: string; type: string }> = [];

  if (video.hevcSrc && canPlayHevc()) {
    sources.push({
      src: video.hevcSrc,
      type: 'video/mp4; codecs="hvc1"',
    });
  }

  if (video.src) {
    sources.push({ src: video.src, type: "video/mp4" });
  }

  if (video.webmSrc) {
    sources.push({ src: video.webmSrc, type: "video/webm; codecs=vp9" });
  }

  return sources;
}

let hevcSupported: boolean | null = null;

function canPlayHevc(): boolean {
  if (typeof document === "undefined") return false;
  if (hevcSupported !== null) return hevcSupported;

  hevcSupported =
    document.createElement("video").canPlayType('video/mp4; codecs="hvc1"') !==
    "";

  return hevcSupported;
}
