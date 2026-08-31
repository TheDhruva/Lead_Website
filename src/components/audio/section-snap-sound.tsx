"use client";

import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useAudio } from "@/providers/audio-provider";

interface SectionSnapSoundProps {
  activeId: string;
}

export function SectionSnapSound({ activeId }: SectionSnapSoundProps) {
  const { play, unlocked } = useAudio();
  const prefersReducedMotion = useReducedMotion();
  const previousIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (prefersReducedMotion || !unlocked) return;

    if (previousIdRef.current !== null && previousIdRef.current !== activeId) {
      play("sectionSnap");
    }

    previousIdRef.current = activeId;
  }, [activeId, play, prefersReducedMotion, unlocked]);

  return null;
}
