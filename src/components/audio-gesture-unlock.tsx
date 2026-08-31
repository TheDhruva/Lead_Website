"use client";

import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useAudio } from "@/providers/audio-provider";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

/**
 * Returning visitors skip the intro — unlock ambient audio on the first gesture.
 */
export function AudioGestureUnlock() {
  const { hasEntered } = useTheatreIntro();
  const { unlockAudio, unlocked } = useAudio();
  const prefersReducedMotion = useReducedMotion();
  const unlockedRef = useRef(unlocked);

  useEffect(() => {
    unlockedRef.current = unlocked;
  }, [unlocked]);

  useEffect(() => {
    if (!hasEntered || unlocked || prefersReducedMotion) return;

    const unlock = () => {
      if (!unlockedRef.current) {
        unlockAudio();
      }
    };

    window.addEventListener("pointerdown", unlock, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [hasEntered, unlocked, prefersReducedMotion, unlockAudio]);

  return null;
}
