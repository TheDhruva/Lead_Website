import { useCallback } from "react";

import type { SfxKey } from "@/constants/audio";
import { useAudio } from "@/providers/audio-provider";

export function useSfxHandlers() {
  const { play } = useAudio();

  // Clicks are meaningful confirmations — always allowed.
  const onClick = useCallback(() => play("ui-click"), [play]);
  // Hover/focus whisper — allowed ONLY through the guarded ui-hover
  // voice (fine-pointer gating happens at call sites, plus a 90ms
  // per-key cooldown and a 2-voice cap in the provider). Raw cursor
  // noise stays forbidden: onCursor remains a no-op.
  const onHover = useCallback(() => play("ui-hover"), [play]);
  const noop = useCallback(() => {}, []);
  const onCursor = noop;
  const onFocus = useCallback(() => play("ui-hover"), [play]);

  const bindButton = useCallback(
    () => ({
      onMouseEnter: onHover,
      onFocus: onHover,
      onClick: onClick,
    }),
    [onHover, onClick],
  );

  const bindLink = useCallback(
    () => ({
      onMouseEnter: onCursor,
      onFocus: onCursor,
    }),
    [onCursor],
  );

  return { play, onHover, onClick, onCursor, onFocus, bindButton, bindLink };
}

export type { SfxKey };
