"use client";

import { AnimatePresence, m } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { useAudio } from "@/providers/audio-provider";

const EASE = [0.16, 1, 0.3, 1] as const;

interface MuteButtonProps {
  className?: string;
}

export function MuteButton({ className }: MuteButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const { muted, toggleMute, play, unlockAudio, unlocked } = useAudio();

  if (prefersReducedMotion) return null;

  return (
    <m.button
      type="button"
      aria-label={
        !unlocked
          ? "Enable ambient audio"
          : muted
            ? "Unmute ambient audio"
            : "Mute ambient audio"
      }
      aria-pressed={unlocked ? muted : undefined}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.2, ease: EASE }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
      onClick={() => {
        if (!unlocked) {
          unlockAudio();
          return;
        }

        play("buttonClick");
        toggleMute();
      }}
      onMouseEnter={() => play("buttonHover")}
      className={cn(
        "fixed right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[55] flex items-center gap-2 rounded-full border border-border",
        "bg-background/92 px-3 py-2 shadow-[var(--shadow-sm)] backdrop-blur-md",
        "transition-colors duration-200 hover:bg-card-hover sm:right-8 sm:bottom-8 sm:px-4 sm:py-2.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {!unlocked || muted ? (
          <m.span
            key="off"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.18 }}
          >
            <VolumeX
              className="h-3.5 w-3.5 text-foreground-secondary"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </m.span>
        ) : (
          <m.span
            key="on"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.18 }}
          >
            <Volume2
              className="h-3.5 w-3.5 text-foreground-secondary"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </m.span>
        )}
      </AnimatePresence>
      <span className="font-label-md text-[9px] tracking-[0.22em] text-foreground-secondary uppercase max-md:sr-only">
        {!unlocked || muted ? "Off" : "On"}
      </span>
    </m.button>
  );
}
