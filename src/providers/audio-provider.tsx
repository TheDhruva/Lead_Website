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
  AMBIENT_DUCKED_VOLUME,
  AMBIENT_DUCK_MS,
  AMBIENT_FADE_MS,
  AMBIENT_TARGET_VOLUME,
  AMBIENT_TRACK,
  SFX,
  SFX_DUCKED_MASTER,
  SFX_MASTER,
  SFX_VOLUME,
  type SfxKey,
} from "@/constants/audio";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface AudioContextValue {
  play: (key: SfxKey) => void;
  muted: boolean;
  unlocked: boolean;
  videoAudioActive: boolean;
  toggleMute: () => void;
  /** Call from a user gesture (click / key) to start ambient + SFX */
  unlockAudio: () => void;
  /** Best-effort autoplay — may be blocked until unlockAudio */
  tryAutoplayAmbient: () => void;
  setVideoAudioActive: (active: boolean) => void;
}

const noop = () => {};

const AudioContext = createContext<AudioContextValue>({
  play: noop,
  muted: false,
  unlocked: false,
  videoAudioActive: false,
  toggleMute: noop,
  unlockAudio: noop,
  tryAutoplayAmbient: noop,
  setVideoAudioActive: noop,
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
  const [videoAudioActive, setVideoAudioActiveState] = useState(false);

  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const sfxRefs = useRef<Partial<Record<SfxKey, HTMLAudioElement>>>({});
  const mutedRef = useRef(false);
  const unlockedRef = useRef(false);
  const videoAudioCountRef = useRef(0);
  const fadeFrameRef = useRef<number | null>(null);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    unlockedRef.current = unlocked;
  }, [unlocked]);

  const getAmbientTarget = useCallback(() => {
    if (mutedRef.current) return 0;
    if (videoAudioCountRef.current > 0) return AMBIENT_DUCKED_VOLUME;
    return AMBIENT_TARGET_VOLUME;
  }, []);

  const getSfxMultiplier = useCallback(() => {
    if (videoAudioCountRef.current > 0) return SFX_MASTER * SFX_DUCKED_MASTER;
    return SFX_MASTER;
  }, []);

  const ensureAmbient = useCallback((): HTMLAudioElement | null => {
    if (disabled) return null;
    if (ambientRef.current) return ambientRef.current;

    const ambient = new Audio(AMBIENT_TRACK);
    ambient.loop = true;
    ambient.preload = "auto";
    ambient.volume = 0;
    ambientRef.current = ambient;
    return ambient;
  }, [disabled]);

  const ensureSfx = useCallback(
    (key: SfxKey): HTMLAudioElement | null => {
      if (disabled) return null;

      const existing = sfxRefs.current[key];
      if (existing) return existing;

      const el = new Audio(SFX[key]);
      el.preload = "auto";
      el.volume = SFX_VOLUME[key] * SFX_MASTER;
      sfxRefs.current[key] = el;
      return el;
    },
    [disabled],
  );

  useEffect(() => {
    return () => {
      if (fadeFrameRef.current !== null) {
        cancelAnimationFrame(fadeFrameRef.current);
        fadeFrameRef.current = null;
      }
      ambientRef.current?.pause();
      ambientRef.current = null;
      sfxRefs.current = {};
    };
  }, []);

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

  const startAmbientPlayback = useCallback(() => {
    const ambient = ensureAmbient();
    if (!ambient) return Promise.reject(new Error("no ambient"));

    return ambient.play().then(() => {
      unlockedRef.current = true;
      setUnlocked(true);
      fadeAmbient(getAmbientTarget(), AMBIENT_FADE_MS);
    });
  }, [ensureAmbient, fadeAmbient, getAmbientTarget]);

  const unlockAudio = useCallback(() => {
    if (disabled || unlockedRef.current) {
      if (unlockedRef.current && !mutedRef.current) {
        fadeAmbient(getAmbientTarget(), AMBIENT_FADE_MS);
      }
      return;
    }

    void startAmbientPlayback().catch(noop);
  }, [disabled, fadeAmbient, getAmbientTarget, startAmbientPlayback]);

  const tryAutoplayAmbient = useCallback(() => {
    if (disabled || unlockedRef.current) return;
    void startAmbientPlayback().catch(noop);
  }, [disabled, startAmbientPlayback]);

  const toggleMute = useCallback(() => {
    if (disabled || !unlockedRef.current) return;

    setMuted((previous) => {
      const next = !previous;
      fadeAmbient(next ? 0 : getAmbientTarget(), AMBIENT_FADE_MS);
      return next;
    });
  }, [disabled, fadeAmbient, getAmbientTarget]);

  const setVideoAudioActive = useCallback(
    (active: boolean) => {
      const nextCount = Math.max(
        0,
        videoAudioCountRef.current + (active ? 1 : -1),
      );
      if (nextCount === videoAudioCountRef.current) return;

      videoAudioCountRef.current = nextCount;
      setVideoAudioActiveState(nextCount > 0);

      if (!unlockedRef.current || mutedRef.current) return;

      fadeAmbient(
        getAmbientTarget(),
        nextCount > 0 ? AMBIENT_DUCK_MS : AMBIENT_FADE_MS,
      );
    },
    [fadeAmbient, getAmbientTarget],
  );

  const play = useCallback(
    (key: SfxKey) => {
      if (disabled || mutedRef.current || !unlockedRef.current) return;

      const el = ensureSfx(key);
      if (!el) return;

      const multiplier = getSfxMultiplier();
      el.volume = Math.min(1, SFX_VOLUME[key] * multiplier);
      el.currentTime = 0;
      void el.play().catch(noop);
    },
    [disabled, ensureSfx, getSfxMultiplier],
  );

  const value = useMemo(
    () => ({
      play: disabled ? noop : play,
      muted: disabled ? true : muted,
      unlocked: disabled ? false : unlocked,
      videoAudioActive: disabled ? false : videoAudioActive,
      toggleMute: disabled ? noop : toggleMute,
      unlockAudio: disabled ? noop : unlockAudio,
      tryAutoplayAmbient: disabled ? noop : tryAutoplayAmbient,
      setVideoAudioActive: disabled ? noop : setVideoAudioActive,
    }),
    [
      disabled,
      muted,
      unlocked,
      videoAudioActive,
      play,
      toggleMute,
      unlockAudio,
      tryAutoplayAmbient,
      setVideoAudioActive,
    ],
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}
