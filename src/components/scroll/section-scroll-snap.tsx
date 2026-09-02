"use client";

import { useSectionScrollSnap } from "@/hooks/use-section-scroll-snap";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

export function SectionScrollSnap() {
  const { hasEntered } = useTheatreIntro();

  useSectionScrollSnap({ enabled: hasEntered });

  return null;
}
