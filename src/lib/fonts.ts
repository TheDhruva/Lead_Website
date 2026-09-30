import { Instrument_Serif, Manrope } from "next/font/google";

/**
 * Phase 1 design system — exactly two families:
 * - Instrument Serif = editorial display personality
 * - Manrope = functional UI precision
 *
 * Loaded via next/font (no Google Fonts CSS requests).
 */
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  preload: true,
  fallback: ["Georgia", "serif"],
});

export const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

/** @deprecated Use `manrope` — kept for incremental migration safety. */
export const inter = manrope;
