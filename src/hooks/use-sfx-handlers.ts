import { useCallback } from "react";

import type { SfxKey } from "@/constants/audio";
import { useAudio } from "@/providers/audio-provider";

export function useSfxHandlers() {
  const { play } = useAudio();

  const onHover = useCallback(() => play("buttonHover"), [play]);
  const onClick = useCallback(() => play("buttonClick"), [play]);
  const onCursor = useCallback(() => play("cursorHover"), [play]);
  const onFocus = useCallback(() => play("inputFocus"), [play]);

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
