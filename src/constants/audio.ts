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

export const SFX_VOLUME: Record<SfxKey, number> = {
  buttonClick: 0.45,
  buttonHover: 0.45,
  cursorHover: 0.15,
  elementAppear: 0.45,
  inputFocus: 0.09,
  sectionSnap: 0.09,
  submitSuccess: 0.25,
};

export const AMBIENT_TARGET_VOLUME = 0.4;
export const AMBIENT_FADE_MS = 200;
