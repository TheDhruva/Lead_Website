export const AMBIENT_TRACK = "/audio/ambient/Heavenly Music.MP3";

export const SFX = {
  buttonClick: "/audio/sfx/button-click.MP3",
  buttonHover: "/audio/sfx/button-hover.MP3",
  cursorHover: "/audio/sfx/cursor-hover.mp3",
  elementAppear: "/audio/sfx/element-appear.mp3",
  inputFocus: "/audio/sfx/input-focus.mp3",
  sectionSnap: "/audio/sfx/section-snap.mp3",
  submitSuccess: "/audio/sfx/submit-success.mp3",
} as const;

export type SfxKey = keyof typeof SFX;

/** Master trim so SFX sit under ambient without clipping */
export const SFX_MASTER = 0.72;

export const SFX_VOLUME: Record<SfxKey, number> = {
  buttonClick: 0.32,
  buttonHover: 0.24,
  cursorHover: 0.14,
  elementAppear: 0.3,
  inputFocus: 0.16,
  sectionSnap: 0.16,
  submitSuccess: 0.26,
};

/** Ambient bed — audible but not dominant */
export const AMBIENT_TARGET_VOLUME = 0.22;
/** Duck ambient while a showcase video plays with sound on */
export const AMBIENT_DUCKED_VOLUME = 0.07;
/** Trim SFX slightly while video audio is active */
export const SFX_DUCKED_MASTER = 0.55;

export const AMBIENT_FADE_MS = 420;
export const AMBIENT_DUCK_MS = 520;

/** Native video element level when user unmutes */
export const VIDEO_PLAYBACK_VOLUME = 0.82;
