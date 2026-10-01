/**
 * Central sound configuration — THE DHRUVA cinematic UI sound design.
 *
 * Six curated assets, restrained by design. Volumes are starting values
 * tuned for quiet playback: the site must feel premium when sound is
 * barely audible. Nothing here should read as a game UI, notification
 * or loud click.
 */
export const SFX = {
  /** Very soft low cinematic tonal swell (intro layer A) */
  "intro-swell": "/audio/sfx/intro-swell.mp3",
  /** Short soft cinematic air (hero transition layer B) */
  "hero-transition": "/audio/sfx/hero-transition.mp3",
  /** Tiny tactile click — buttons, toggles, submit confirmation */
  "ui-click": "/audio/sfx/ui-click.mp3",
  /** Whisper-soft tick — guarded hover/focus only, never bare */
  "ui-hover": "/audio/sfx/ui-hover.mp3",
  /** Softer tick — section navigation activation only */
  "nav-click": "/audio/sfx/nav-click.mp3",
  /** Very short soft air — service active-card change only */
  "service-expand": "/audio/sfx/service-expand.mp3",
  /** Tiny click variant — video play/pause/mute/select */
  "video-control": "/audio/sfx/video-control.mp3",
} as const;

export type SfxKey = keyof typeof SFX;

export const AMBIENT_TRACK = "/audio/ambient/heavenly-music.mp3";

/** Ambient bed — audible but not dominant */
export const AMBIENT_TARGET_VOLUME = 0.22;
/** Duck ambient while a showcase video plays with sound on */
export const AMBIENT_DUCKED_VOLUME = 0.07;

export const AMBIENT_FADE_MS = 420;
export const AMBIENT_DUCK_MS = 520;

export interface SfxConfig {
  /** Playback gain (0–1). All values deliberately quiet. */
  volume: number;
  /** Minimum ms between plays of this key (debounce). */
  cooldownMs: number;
}

export const SOUND_CONFIG: Record<SfxKey, SfxConfig> = {
  "intro-swell": { volume: 0.1, cooldownMs: 2000 },
  "hero-transition": { volume: 0.12, cooldownMs: 1500 },
  "ui-click": { volume: 0.1, cooldownMs: 60 },
  "ui-hover": { volume: 0.05, cooldownMs: 90 },
  "nav-click": { volume: 0.07, cooldownMs: 300 },
  "service-expand": { volume: 0.08, cooldownMs: 450 },
  "video-control": { volume: 0.09, cooldownMs: 120 },
};

/** Master trim so SFX sit quietly under everything without clipping. */
export const SFX_MASTER = 1;

/** Trim SFX further while a showcase video plays with sound on. */
export const SFX_DUCKED_MASTER = 0.55;

/** Maximum simultaneous UI voices — latest interaction wins. */
export const SFX_MAX_VOICES = 2;

/** Native video element level when user unmutes */
export const VIDEO_PLAYBACK_VOLUME = 0.82;
