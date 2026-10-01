"use client";

import { type RefObject, useEffect, useRef } from "react";

import type { SfxKey } from "@/constants/audio";
import { getScrollContainer } from "@/lib/scroll-container";
import { useAudio } from "@/providers/audio-provider";

/** Quiet period after a section-enter sound — absorbs boundary jitter. */
const ENTER_COOLDOWN_MS = 4000;

/**
 * Plays one sound when its section becomes meaningfully visible.
 *
 * - Fires only on false → visible transitions (never on mount alone,
 *   never continuously from scroll progress).
 * - A 4s cooldown suppresses tiny scroll-reversal reflutters.
 * - Global mute, reduced-motion and locked-audio degradations are
 *   handled inside the provider's play() — this hook adds no policy.
 */
export function useSectionEnterSound(
  ref: RefObject<HTMLElement | null>,
  key: SfxKey,
): void {
  const { play } = useAudio();
  const lastPlayedRef = useRef(0);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = getScrollContainer();

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const rect = entry.boundingClientRect;
        const rootH = entry.rootBounds?.height ?? rect.height;
        // Short sections: substantially visible. Tall scroll tracks
        // (ratio can never reach 0.55): top arrived in the upper
        // viewport while the body extends below = genuine entry.
        const meaningful =
          entry.isIntersecting &&
          (entry.intersectionRatio >= 0.55 ||
            (rect.height > rootH &&
              rect.top <= rootH * 0.6 &&
              rect.bottom > rootH * 0.3));
        const was = wasVisibleRef.current;
        wasVisibleRef.current = meaningful;
        if (!meaningful || was) return;
        const now =
          typeof performance !== "undefined" ? performance.now() : Date.now();
        if (now - lastPlayedRef.current < ENTER_COOLDOWN_MS) return;
        lastPlayedRef.current = now;
        play(key);
      },
      { threshold: 0, root: root ?? null },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, key, play]);
}
