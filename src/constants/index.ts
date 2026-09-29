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
  "Let's Discuss",
] as const;

export const CONTACT_TIMELINES = [
  "ASAP",
  "1–2 Weeks",
  "1 Month",
  "Flexible",
] as const;

/** Thin loading line duration before enter prompt / auto-advance (CSS-driven, no per-frame React state) */
export const THEATRE_INTRO_LOAD_MS = 1400;
/** Title split reveal before the loading line starts */
export const THEATRE_INTRO_REVEAL_MS = 900;
/** Idle time in "ready" state before the intro auto-advances without audio */
export const THEATRE_INTRO_AUTO_EXIT_MS = 1100;
/** Beat between paper-cutout expression swaps in the hero */
export const FACE_CYCLE_INTERVAL_MS = 2400;

/** Shared cinematic motion language — premium ease-out throughout */
export const EASING_OUT = [0.22, 1, 0.36, 1] as const;

export const MOTION = {
  /** Restrained section reveals — editorial, premium */
  reveal: { duration: 0.62, ease: EASING_OUT, y: 36, scale: 0.97 },
  stagger: 0.07,
  itemBaseDelay: 0.06,
  hover: { duration: 0.2, ease: EASING_OUT },
} as const;
