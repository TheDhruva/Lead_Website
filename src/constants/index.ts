import type { NavItem } from "@/types";

export const SITE_NAME = "DHRUVA";

export const NAV_ITEMS: NavItem[] = [
  { label: "Work", href: "#work" },
  { label: "Services", href: "#services" },
  { label: "Videos", href: "#video" },
  { label: "Projects", href: "#projects" },
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

export const THEATRE_INTRO_TIMEOUT_MS = 2400;
/** Faster auto-enter on return visits (intro still plays every time) */
export const THEATRE_INTRO_RETURN_TIMEOUT_MS = 780;
/** Beat between paper-cutout expression swaps in the hero */
export const FACE_CYCLE_INTERVAL_MS = 2400;

/** Navbar clearance so section headings aren't hidden */
export const NAV_SCROLL_OFFSET = -112;

/** Shared cinematic motion language */
export const EASING_CINEMATIC = [0.4, 0, 0.2, 1] as const;
export const EASING_IN_OUT = [0.45, 0, 0.55, 1] as const;
export const EASING_OUT = [0.16, 1, 0.3, 1] as const;

export const MOTION = {
  theatreExit: { duration: 1.35, ease: EASING_IN_OUT },
  theatreExitReturn: { duration: 0.72, ease: EASING_IN_OUT },
  /** Quiet beat after intro curtain clears before interaction unlocks */
  theatreSettleMs: 140,
  pageEnter: { duration: 1.05, ease: EASING_IN_OUT, delay: 0.08 },
  /** Shared film rhythm for Services → Video → Projects */
  reveal: { duration: 0.65, ease: EASING_CINEMATIC, y: 22 },
  stagger: 0.09,
  itemBaseDelay: 0.1,
  hover: { duration: 0.18, ease: EASING_OUT },
  press: { duration: 0.14, ease: EASING_CINEMATIC, scale: 0.985 },
  theme: { duration: 0.3 },
  imageFade: { duration: 0.45, ease: EASING_CINEMATIC },
} as const;
