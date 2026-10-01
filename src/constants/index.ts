import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Work", href: "#work" },
  { label: "Services", href: "#services" },
  { label: "Videos", href: "#video" },
  { label: "Web Designs", href: "#projects" },
  { label: "Contact", href: "#contact" },
];

export const SECTION_IDS = {
  theatreIntro: "theatre-intro",
  work: "work",
  services: "services",
  video: "video",
  projects: "projects",
  contact: "contact",
} as const;

/** Legacy hashes map to current section ids. */
const SECTION_ALIASES: Record<string, string> = {
  hero: SECTION_IDS.work,
  top: SECTION_IDS.work,
  home: SECTION_IDS.work,
};

export function resolveSectionId(id: string): string {
  return SECTION_ALIASES[id] ?? id;
}

export const CONTACT_SERVICES = [
  "Website",
  "Video Editing",
  "Graphic Design",
  "Full Brand Package",
  "Other",
] as const;

export const CONTACT_BUDGETS = [
  "Under $500",
  "$500 – $1.5k",
  "$1.5k – $5k",
  "$5k+",
] as const;

export const CONTACT_TIMELINES = [
  "ASAP",
  "1–2 Weeks",
  "1 Month",
  "Flexible",
] as const;

/** Shared active-section observation language.
 *
 * The navbar, services scroll-spy, and video visibility observers each
 * keep purpose-specific bands, but they all resolve against the same
 * canonical `#scroll-container` root. These navbar values are the
 * reference: a wide center band with fine thresholds so the active pill
 * follows the visually dominant section without flutter at boundaries.
 */
export const ACTIVE_SECTION_ROOT_MARGIN = "-35% 0px -45% 0px" as const;
export const ACTIVE_SECTION_THRESHOLDS = [0, 0.2, 0.4, 0.6, 0.8, 1] as const;

/** Thin loading line duration before enter prompt / auto-advance (CSS-driven, no per-frame React state) */
export const THEATRE_INTRO_LOAD_MS = 1400;
/** Title split reveal before the loading line starts */
export const THEATRE_INTRO_REVEAL_MS = 900;
/** Idle time in "ready" state before the intro auto-advances without audio */
export const THEATRE_INTRO_AUTO_EXIT_MS = 450;
/** Beat between paper-cutout expression swaps in the hero */
export const FACE_CYCLE_INTERVAL_MS = 2400;

/** Shared cinematic motion language — premium ease-out throughout */
export const EASING_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * Signature lock-in ease — settles decisively without overshoot,
 * bounce or elastic feel. Mutable tuple so it satisfies
 * framer-motion's Easing type in every position.
 */
export const EASING_SIGNATURE: [number, number, number, number] = [
  0.16, 1, 0.3, 1,
];

export const MOTION = {
  /** Restrained section reveals — editorial, premium */
  reveal: { duration: 0.62, ease: EASING_OUT, y: 36, scale: 0.97 },
  stagger: 0.07,
  itemBaseDelay: 0.06,
  hover: { duration: 0.2, ease: EASING_OUT },
  /**
   * Character assembly (AnimatedText) — small deterministic displacement,
   * ±2deg rotation, 0.96 scale, 3px blur; 15–30ms stagger, 500–750ms.
   * Letters "lock into place", never fly.
   */
  char: {
    duration: 0.65,
    stagger: 0.022,
    gentleStagger: 0.018,
    blur: 3,
    scale: 0.96,
  },
  /** Word/line reveals — y 8–12px, ~40ms stagger, 400–600ms */
  word: { duration: 0.5, stagger: 0.04, y: 10, blur: 2 },
  /** Section-title assembly — 8–18px, ±1–2deg, 500–700ms */
  title: { duration: 0.6, stagger: 0.02 },
  /** Exit de-assembly scales relative to the matching entrance values */
  exit: { durationScale: 0.7, staggerScale: 0.8 },
} as const;
