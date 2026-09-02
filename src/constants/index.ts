import type { NavItem } from "@/types";

export const SITE_NAME = "DHRUVA";

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

/** Thin loading line duration before enter prompt / auto-advance */
export const THEATRE_INTRO_LOAD_MS = 2500;
/** Title split reveal before the loading line starts */
export const THEATRE_INTRO_REVEAL_MS = 1200;
/** Beat between paper-cutout expression swaps in the hero */
export const FACE_CYCLE_INTERVAL_MS = 2400;

/** Shared cinematic motion language — premium ease-out throughout */
export const EASING_CINEMATIC = [0.22, 1, 0.36, 1] as const;
export const EASING_IN_OUT = [0.45, 0, 0.55, 1] as const;
export const EASING_OUT = [0.22, 1, 0.36, 1] as const;

export const MOTION = {
  theatreExit: { duration: 1.35, ease: EASING_IN_OUT },
  theatreExitReturn: { duration: 0.72, ease: EASING_IN_OUT },
  theatreEntrance: {
    chrome: { delay: 0.12, duration: 0.48 },
    title: { delay: 0.32, duration: 0.62 },
    subtitle: { delay: 0.52, duration: 0.48 },
    enter: { delay: 0.78, duration: 0.42 },
  },
  /** Quiet beat after intro curtain clears before interaction unlocks */
  theatreSettleMs: 140,
  pageEnter: { duration: 1.05, ease: EASING_IN_OUT, delay: 0.08 },
  /** Restrained section reveals — editorial, premium */
  reveal: { duration: 0.62, ease: EASING_OUT, y: 36, scale: 0.97 },
  stagger: 0.07,
  itemBaseDelay: 0.06,
  hover: { duration: 0.2, ease: EASING_OUT },
  press: { duration: 0.14, ease: EASING_CINEMATIC, scale: 0.985 },
  theme: { duration: 0.3 },
  imageFade: { duration: 0.5, ease: EASING_OUT },
  layout: { duration: 0.55, ease: EASING_OUT },
} as const;
