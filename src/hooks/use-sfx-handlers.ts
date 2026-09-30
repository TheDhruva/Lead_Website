import { useCallback } from "react";

import type { SfxKey } from "@/constants/audio";
import { useAudio } from "@/providers/audio-provider";

export function useSfxHandlers() {
  const { play } = useAudio();

  // Clicks are meaningful confirmations — always allowed.
  const onClick = useCallback(() => play("ui-click"), [play]);
  // Hover/focus/cursor sounds are intentionally silent: the design
  // forbids hover spam, cursor noise and focus beeps. Kept as no-ops
  // so existing call sites need no changes.
  const noop = useCallback(() => {}, []);
  const onHover = noop;
  const onCursor = noop;
  const onFocus = noop;

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
