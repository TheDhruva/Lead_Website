import { useCallback } from "react";

import type { SfxKey } from "@/constants/audio";
import { useAudio } from "@/providers/audio-provider";

export function useSfxHandlers() {
  const { play } = useAudio();

  // Clicks are meaningful confirmations — always allowed.
  const onClick = useCallback(() => play("ui-click"), [play]);
  // Hover/focus whisper — allowed ONLY through the guarded ui-hover
  // voice (fine-pointer gating happens at call sites, plus a 90ms
  // per-key cooldown and a 2-voice cap in the provider).
  const onHover = useCallback(() => play("ui-hover"), [play]);
  const onFocus = useCallback(() => play("ui-hover"), [play]);

  return { play, onHover, onClick, onFocus };
}

export type { SfxKey };
