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
  SFX,
  SFX_DUCKED_MASTER,
  SFX_MASTER,
  SFX_MAX_VOICES,
  SOUND_CONFIG,
  type SfxKey,
} from "@/constants/audio";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface AudioContextValue {
  play: (key: SfxKey) => void;
  muted: boolean;
  unlocked: boolean;
  videoAudioActive: boolean;
  toggleMute: () => void;
  /** Call from a user gesture (click / key) to start the audio engine */
  unlockAudio: () => void;
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
  setVideoAudioActive: noop,
});

export function useAudio() {
  return useContext(AudioContext);
}

interface AudioProviderProps {
  children: ReactNode;
}

interface EngineRefs {
  ctx: AudioContext | null;
  master: GainNode | null;
  buffers: Partial<Record<SfxKey, AudioBuffer>>;
  lastPlayed: Partial<Record<SfxKey, number>>;
  voices: Set<AudioBufferSourceNode>;
}

/**
 * Central cinematic sound manager (Web Audio API).
 *
 * - One lazy AudioContext, created on first user gesture (autoplay-safe).
 * - All SFX preloaded + decoded once at unlock; reused AudioBuffers.
 * - No `new Audio()` per interaction, no fetch-on-click — playback is
 *   an instant buffer-source start.
 * - Per-key cooldowns + a 2-voice cap prevent stacking on rapid input.
 * - Master gain gives instant global mute; preference persists.
 * - Reduced-motion disables the engine entirely (enhancement only).
 * - Every failure path degrades silently (dev-only warning).
 */
export function AudioProvider({ children }: AudioProviderProps) {
  const prefersReducedMotion = useReducedMotion();
  const disabled = prefersReducedMotion;

  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      // Sound is ON by default; only an explicit user mute persists.
      return localStorage.getItem("dhruva:muted") === "1";
    } catch {
      return false;
    }
  });
  const [unlocked, setUnlocked] = useState(false);
  const [videoAudioActive, setVideoAudioActiveState] = useState(false);

  const engine = useRef<EngineRefs>({
    ctx: null,
    master: null,
    buffers: {},
    lastPlayed: {},
    voices: new Set(),
  });
  const mutedRef = useRef(false);
  const unlockedRef = useRef(false);
  const videoAudioCountRef = useRef(0);

  useEffect(() => {
    mutedRef.current = muted;
    try {
      localStorage.setItem("dhruva:muted", muted ? "1" : "0");
    } catch {}
  }, [muted]);

  useEffect(() => {
    unlockedRef.current = unlocked;
  }, [unlocked]);

  useEffect(() => {
    const state = engine.current;
    return () => {
      state.voices.forEach((voice) => {
        try {
          voice.stop();
        } catch {}
      });
      state.voices.clear();
      state.buffers = {};
      if (state.ctx) {
        void state.ctx.close().catch(noop);
        state.ctx = null;
        state.master = null;
      }
    };
  }, []);

  const getSfxMultiplier = useCallback(() => {
    if (videoAudioCountRef.current > 0) return SFX_MASTER * SFX_DUCKED_MASTER;
    return SFX_MASTER;
  }, []);

  const decodeKey = useCallback(async (key: SfxKey) => {
    const state = engine.current;
    if (!state.ctx || state.buffers[key]) return;
    try {
      const response = await fetch(SFX[key]);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.arrayBuffer();
      state.buffers[key] = await state.ctx.decodeAudioData(data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[audio] failed to load "${key}":`, error);
      }
    }
  }, []);

  const unlockAudio = useCallback(async () => {
    if (disabled || typeof window === "undefined") return;
    const state = engine.current;

    if (!state.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      try {
        state.ctx = new Ctor();
      } catch {
        return;
      }
      state.master = state.ctx.createGain();
      state.master.gain.value = mutedRef.current ? 0 : 1;
      state.master.connect(state.ctx.destination);
    }

    // Wait for context to actually be running (mobile Safari can lag).
    if (state.ctx.state === "suspended") {
      try {
        await state.ctx.resume();
      } catch {}
    }
    // Extra tick for mobile: let the state transition settle.
    if (state.ctx.state !== "running") {
      await new Promise((r) => setTimeout(r, 50));
      if (state.ctx.state === "suspended") {
        try {
          await state.ctx.resume();
        } catch {}
      }
    }

    if (!unlockedRef.current) {
      unlockedRef.current = true;
      setUnlocked(true);
      try {
        localStorage.setItem("dhruva:unlocked", "1");
      } catch {}
      // Preload + decode every SFX once, up front — never on click.
      void Promise.all(
        (Object.keys(SFX) as SfxKey[]).map((key) => decodeKey(key)),
      );
    }
  }, [disabled, decodeKey]);

  const toggleMute = useCallback(() => {
    if (disabled || !unlockedRef.current) return;

    setMuted((previous) => {
      const next = !previous;
      const { ctx, master } = engine.current;
      if (ctx && master) {
        master.gain.setTargetAtTime(next ? 0 : 1, ctx.currentTime, 0.03);
      }
      try {
        localStorage.setItem("dhruva:muted", next ? "1" : "0");
      } catch {}
      return next;
    });
  }, [disabled]);

  const setVideoAudioActive = useCallback((active: boolean) => {
    const nextCount = Math.max(
      0,
      videoAudioCountRef.current + (active ? 1 : -1),
    );
    if (nextCount === videoAudioCountRef.current) return;

    videoAudioCountRef.current = nextCount;
    setVideoAudioActiveState(nextCount > 0);
  }, []);

  const play = useCallback(
    (key: SfxKey) => {
      if (disabled || mutedRef.current || !unlockedRef.current) return;
      const state = engine.current;
      const { ctx, master } = state;
      if (!ctx || !master) return;

      // Mobile safety: try to resume if somehow suspended.
      if (ctx.state === "suspended") {
        void ctx.resume().catch(noop);
        return;
      }
      if (ctx.state !== "running") return;

      const buffer = state.buffers[key];
      if (!buffer) {
        // Decode lazily as a fallback (normally preloaded at unlock).
        void decodeKey(key);
        return;
      }

      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const last = state.lastPlayed[key] ?? 0;
      if (now - last < SOUND_CONFIG[key].cooldownMs) return;
      // Cap simultaneous UI voices; latest meaningful interaction wins.
      if (state.voices.size >= SFX_MAX_VOICES) return;
      state.lastPlayed[key] = now;

      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = Math.min(
          1,
          SOUND_CONFIG[key].volume * getSfxMultiplier(),
        );
        source.connect(gain);
        gain.connect(master);
        state.voices.add(source);
        source.onended = () => {
          state.voices.delete(source);
          source.disconnect();
          gain.disconnect();
        };
        source.start();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[audio] failed to play "${key}":`, error);
        }
      }
    },
    [disabled, decodeKey, getSfxMultiplier],
  );

  const value = useMemo(
    () => ({
      play: disabled ? noop : play,
      muted: disabled ? true : muted,
      unlocked: disabled ? false : unlocked,
      videoAudioActive: disabled ? false : videoAudioActive,
      toggleMute: disabled ? noop : toggleMute,
      unlockAudio: disabled ? noop : unlockAudio,
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
      setVideoAudioActive,
    ],
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}
