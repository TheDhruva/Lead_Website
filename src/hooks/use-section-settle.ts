"use client";

import { useEffect } from "react";

import { startSectionSettle } from "@/lib/section-settle";

/**
 * Binds the post-gesture section settle once the scroll container
 * exists. The settle performs no work while scrolling — it only
 * corrects (≤280ms) after motion fully stops near a section start.
 */
export function useSectionSettle(): void {
  useEffect(() => startSectionSettle(), []);
}
