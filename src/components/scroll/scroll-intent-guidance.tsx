"use client";

import { useEffect } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { attachScrollIntentGuidance } from "@/lib/scroll-intent-guidance";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

/** Intent-aware section guidance — cinematic settle after meaningful scroll. */
export function ScrollIntentGuidance() {
  const prefersReducedMotion = useReducedMotion();
  const { hasEntered } = useTheatreIntro();

  useEffect(() => {
    if (prefersReducedMotion || !hasEntered) return;
    return attachScrollIntentGuidance();
  }, [prefersReducedMotion, hasEntered]);

  return null;
}
