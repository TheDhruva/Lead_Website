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
  /** Call from a user gesture (click / key) to start ambient + SFX */
  unlockAudio: () => void;
  setVideoAudioActive: (active: boolean) => void;
}

const noop = () => {};

const MUSIC_PREFERENCE_KEY = "dhruva:background-music-preference";
const LEGACY_MUTED_KEY = "dhruva:muted";

type MusicPreference = "enabled" | "muted";

function readMusicPreference(): MusicPreference | null {
  try {
    const value = localStorage.getItem(MUSIC_PREFERENCE_KEY);
    return value === "enabled" || value === "muted" ? value : null;
  } catch {
    return null;
  }
}

function writeMusicPreference(value: MusicPreference): void {
  try {
    localStorage.setItem(MUSIC_PREFERENCE_KEY, value);
  } catch {}
}

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
 * Central cinematic sound manager (Web Audio SFX + looping ambient bed).
 *
 * - One lazy AudioContext, created on first user gesture (autoplay-safe).
 * - All SFX preloaded + decoded once at unlock; reused AudioBuffers.
 * - Ambient bed is a separate looping HTMLAudio element (4MB) that only
 *   downloads after the user opts into sound — never speculatively.
 * - No `new Audio()` per interaction, no fetch-on-click — SFX playback is
 *   an instant buffer-source start.
 * - Per-key cooldowns + a 2-voice cap prevent stacking on rapid input.
 * - Master gain gives instant global SFX mute; ambient fades separately.
 * - Music preference persists in `dhruva:background-music-preference`
 *   ("enabled" | "muted"): first gesture opts in, returning visitors get a
 *   single autoplay-restore attempt (one controlled retry per gesture if
 *   the browser blocks it), mute/unmute persists both directions.
 * - Reduced-motion disables the engine entirely (enhancement only).
 * - Every failure path degrades silently (dev-only warning).
 */
export function AudioProvider({ children }: AudioProviderProps) {
  const prefersReducedMotion = useReducedMotion();
  const disabled = prefersReducedMotion;

  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const preference = readMusicPreference();
      if (preference !== null) return preference === "muted";
      // Visitors predating the preference key: migrate the legacy mute flag.
      return localStorage.getItem(LEGACY_MUTED_KEY) === "1";
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
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const fadeFrameRef = useRef<number | null>(null);
  const ambientPlayPendingRef = useRef(false);
  const ambientRetryCleanupRef = useRef<(() => void) | null>(null);
  const startAmbientPlaybackRef = useRef<() => void>(noop);

  useEffect(() => {
    mutedRef.current = muted;
    try {
      localStorage.setItem(LEGACY_MUTED_KEY, muted ? "1" : "0");
    } catch {}
  }, [muted]);

  useEffect(() => {
    unlockedRef.current = unlocked;
  }, [unlocked]);

  useEffect(() => {
    const state = engine.current;
    return () => {
      const retryCleanup = ambientRetryCleanupRef.current;
      if (retryCleanup) {
        ambientRetryCleanupRef.current = null;
        retryCleanup();
      }
      if (fadeFrameRef.current !== null) {
        cancelAnimationFrame(fadeFrameRef.current);
        fadeFrameRef.current = null;
      }
      ambientRef.current?.pause();
      ambientRef.current = null;
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

  const getAmbientTarget = useCallback(() => {
    if (mutedRef.current) return 0;
    if (videoAudioCountRef.current > 0) return AMBIENT_DUCKED_VOLUME;
    return AMBIENT_TARGET_VOLUME;
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

  const ensureAmbient = useCallback((): HTMLAudioElement | null => {
    if (disabled || typeof window === "undefined") return null;
    if (ambientRef.current) return ambientRef.current;

    const ambient = new Audio(AMBIENT_TRACK);
    ambient.loop = true;
    // P2: keep the ~4MB ambient bed off the critical path — nothing
    // fetches until the unlock gesture actually starts playback.
    ambient.preload = "none";
    ambient.volume = 0;
    ambientRef.current = ambient;
    return ambient;
  }, [disabled]);

  const cancelAmbientRetry = useCallback(() => {
    const cleanup = ambientRetryCleanupRef.current;
    if (!cleanup) return;
    ambientRetryCleanupRef.current = null;
    cleanup();
  }, []);

  // Autoplay rejection recovery: bind exactly one retry per subsequent real
  // user gesture — never a loop, never a timer, never console noise.
  const scheduleAmbientRetry = useCallback(() => {
    if (ambientRetryCleanupRef.current) return;

    const retry = () => {
      cancelAmbientRetry();
      if (mutedRef.current) return;
      if (readMusicPreference() === "muted") return;
      startAmbientPlaybackRef.current();
    };

    window.addEventListener("pointerdown", retry, { passive: true });
    window.addEventListener("keydown", retry);
    ambientRetryCleanupRef.current = () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
    };
  }, [cancelAmbientRetry]);

  const startAmbientPlayback = useCallback(() => {
    const ambient = ensureAmbient();
    if (!ambient) return;
    if (mutedRef.current) return;

    // Already playing, or a start is still pending — just settle the level.
    if (ambientPlayPendingRef.current || !ambient.paused) {
      fadeAmbient(getAmbientTarget(), AMBIENT_FADE_MS);
      return;
    }

    ambientPlayPendingRef.current = true;
    void ambient
      .play()
      .then(() => {
        fadeAmbient(getAmbientTarget(), AMBIENT_FADE_MS);
      })
      .catch(() => {
        // Autoplay blocked: recover on the next real user gesture.
        scheduleAmbientRetry();
      })
      .finally(() => {
        ambientPlayPendingRef.current = false;
      });
  }, [ensureAmbient, fadeAmbient, getAmbientTarget, scheduleAmbientRetry]);

  useEffect(() => {
    startAmbientPlaybackRef.current = startAmbientPlayback;
  });

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

    // FIRST ACTIVATION — still inside the user-gesture stack (no awaits
    // above this line): persist the music opt-in and start the ambient bed
    // so the browser's autoplay approval covers this gesture. A muted
    // visitor gets no playback attempt at all.
    if (mutedRef.current) {
      cancelAmbientRetry();
    } else {
      if (readMusicPreference() === null) {
        writeMusicPreference("enabled");
      }
      startAmbientPlayback();
    }

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
      // Preload + decode every SFX once, up front — never on click.
      void Promise.all(
        (Object.keys(SFX) as SfxKey[]).map((key) => decodeKey(key)),
      );
      // The ambient bed is already started above (gesture-synchronous).
    }
  }, [disabled, decodeKey, cancelAmbientRetry, startAmbientPlayback]);

  const toggleMute = useCallback(() => {
    if (disabled || !unlockedRef.current) return;

    setMuted((previous) => {
      const next = !previous;
      // Updaters run before effects, so sync the ref here — downstream
      // reads (fade targets, start guards) must see the new value now.
      mutedRef.current = next;
      const { ctx, master } = engine.current;
      if (ctx && master) {
        master.gain.setTargetAtTime(next ? 0 : 1, ctx.currentTime, 0.03);
      }

      // One state transition writes both keys together so the dedicated
      // music preference and the legacy mute flag can never diverge.
      writeMusicPreference(next ? "muted" : "enabled");
      try {
        localStorage.setItem(LEGACY_MUTED_KEY, next ? "1" : "0");
      } catch {}

      if (next) {
        cancelAmbientRetry();
        fadeAmbient(0, AMBIENT_FADE_MS);
      } else if (ambientRef.current && !ambientRef.current.paused) {
        fadeAmbient(getAmbientTarget(), AMBIENT_FADE_MS);
      } else {
        // Element never started (muted before its first play) — start it
        // now, inside this click gesture.
        startAmbientPlayback();
      }
      return next;
    });
  }, [
    disabled,
    cancelAmbientRetry,
    fadeAmbient,
    getAmbientTarget,
    startAmbientPlayback,
  ]);

  // Returning visitor who left music enabled: attempt restore as soon as
  // the page is ready. If the browser rejects autoplay, the failure path
  // above binds a single controlled gesture-retry — no loops, no timers.
  useEffect(() => {
    if (disabled || readMusicPreference() !== "enabled") return;
    startAmbientPlayback();
  }, [disabled, startAmbientPlayback]);

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
