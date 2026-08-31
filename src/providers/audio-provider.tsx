"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AMBIENT_FADE_MS,
  AMBIENT_TARGET_VOLUME,
  AMBIENT_TRACK,
  SFX,
  SFX_VOLUME,
  type SfxKey,
} from "@/constants/audio";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface AudioContextValue {
  play: (key: SfxKey) => void;
  muted: boolean;
  unlocked: boolean;
  toggleMute: () => void;
  unlockAudio: () => void;
}

const noop = () => {};

const AudioContext = createContext<AudioContextValue>({
  play: noop,
  muted: false,
  unlocked: false,
  toggleMute: noop,
  unlockAudio: noop,
});

export function useAudio() {
  return useContext(AudioContext);
}

interface AudioProviderProps {
  children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const prefersReducedMotion = useReducedMotion();
  const disabled = prefersReducedMotion;

  const [muted, setMuted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const sfxRefs = useRef<Partial<Record<SfxKey, HTMLAudioElement>>>({});
  const mutedRef = useRef(false);
  const unlockedRef = useRef(false);
  const fadeFrameRef = useRef<number | null>(null);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    unlockedRef.current = unlocked;
  }, [unlocked]);

  useEffect(() => {
    if (disabled) return;

    (Object.keys(SFX) as SfxKey[]).forEach((key) => {
      const el = new Audio(SFX[key]);
      el.preload = "auto";
      el.volume = SFX_VOLUME[key];
      sfxRefs.current[key] = el;
    });

    const ambient = new Audio(AMBIENT_TRACK);
    ambient.loop = true;
    ambient.volume = 0;
    ambientRef.current = ambient;

    return () => {
      if (fadeFrameRef.current !== null) {
        cancelAnimationFrame(fadeFrameRef.current);
        fadeFrameRef.current = null;
      }
      ambientRef.current?.pause();
      ambientRef.current = null;
      sfxRefs.current = {};
    };
  }, [disabled]);

  const fadeAmbient = useCallback((toVolume: number, durationMs: number) => {
    const ambient = ambientRef.current;
    if (!ambient) return;

    if (fadeFrameRef.current !== null) {
      cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }

    const startVolume = ambient.volume;
    const startTs = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTs) / durationMs, 1);
      ambient.volume = Math.min(
        1,
        Math.max(0, startVolume + (toVolume - startVolume) * progress),
      );

      if (progress < 1) {
        fadeFrameRef.current = requestAnimationFrame(tick);
      } else {
        fadeFrameRef.current = null;
      }
    };

    fadeFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const unlockAudio = useCallback(() => {
    if (disabled || unlockedRef.current) return;

    const ambient = ambientRef.current;
    if (!ambient) return;

    void ambient
      .play()
      .then(() => {
        unlockedRef.current = true;
        setUnlocked(true);
        fadeAmbient(AMBIENT_TARGET_VOLUME, AMBIENT_FADE_MS);
      })
      .catch(noop);
  }, [disabled, fadeAmbient]);

  const toggleMute = useCallback(() => {
    if (disabled || !unlockedRef.current) return;

    setMuted((previous) => {
      const next = !previous;
      fadeAmbient(next ? 0 : AMBIENT_TARGET_VOLUME, AMBIENT_FADE_MS);
      return next;
    });
  }, [disabled, fadeAmbient]);

  const play = useCallback(
    (key: SfxKey) => {
      if (disabled || mutedRef.current || !unlockedRef.current) return;

      const el = sfxRefs.current[key];
      if (!el) return;

      el.currentTime = 0;
      void el.play().catch(noop);
    },
    [disabled],
  );

  const value = useMemo(
    () => ({
      play: disabled ? noop : play,
      muted: disabled ? true : muted,
      unlocked: disabled ? false : unlocked,
      toggleMute: disabled ? noop : toggleMute,
      unlockAudio: disabled ? noop : unlockAudio,
    }),
    [disabled, muted, unlocked, play, toggleMute, unlockAudio],
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}
