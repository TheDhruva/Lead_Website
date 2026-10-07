"use client";

import { type RefObject, useEffect, useRef } from "react";

import type { SfxKey } from "@/constants/audio";
import { getScrollContainer } from "@/lib/scroll-container";
import { useAudio } from "@/providers/audio-provider";

/** Quiet period after a section-enter sound — absorbs boundary jitter. */
const ENTER_COOLDOWN_MS = 4000;
/**
 * Stagger after meaningful entry before the non-critical sound plays.
 * Section activation already triggers content mount, wash crossfade, and
 * entrance choreography on the same frame — the decorative tick waits
 * one beat so it never contends with them. Cancelled if the section
 * leaves before the beat (fast pass-through stays silent).
 */
const ENTER_STAGGER_MS = 350;

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
    let staggerTimer: number | null = null;

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
        if (!meaningful) {
          // Left before the stagger beat — a fast pass-through stays
          // silent instead of spending a voice on a section already gone.
          if (staggerTimer !== null) {
            window.clearTimeout(staggerTimer);
            staggerTimer = null;
          }
          return;
        }
        if (was || staggerTimer !== null) return;
        const now =
          typeof performance !== "undefined" ? performance.now() : Date.now();
        if (now - lastPlayedRef.current < ENTER_COOLDOWN_MS) return;
        staggerTimer = window.setTimeout(() => {
          staggerTimer = null;
          if (!wasVisibleRef.current) return;
          lastPlayedRef.current =
            typeof performance !== "undefined" ? performance.now() : Date.now();
          play(key);
        }, ENTER_STAGGER_MS);
      },
      { threshold: 0, root: root ?? null },
    );
    obs.observe(el);
    return () => {
      if (staggerTimer !== null) window.clearTimeout(staggerTimer);
      obs.disconnect();
    };
  }, [ref, key, play]);
}
