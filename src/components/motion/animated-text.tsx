"use client";

import { Fragment, memo, useMemo } from "react";

import { type Variants, m } from "framer-motion";

import { EASING_SIGNATURE, MOTION } from "@/constants";
import { useEnterExit } from "@/hooks/use-enter-exit";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

export interface AnimatedTextSegment {
  text: string;
  /** Render this segment in Instrument Serif italic (editorial voice) */
  serif?: boolean;
  className?: string;
}

interface AnimatedTextProps {
  /** One string or styled segments (stagger runs continuously across all) */
  segments: string | AnimatedTextSegment[];
  className?: string;
  /** Base delay before the first character (seconds) */
  delay?: number;
  /** "mount" plays on render (hero); "inview" plays on viewport entry */
  mode?: "mount" | "inview";
  /**
   * Assembly gate for the intro → hero handoff. When false the text
   * holds its pre-entrance state; flipping to true starts the normal
   * entrance (mount plays, inview arms). Defaults true.
   */
  start?: boolean;
  /** Gentler mobile budgets: smaller displacement, tighter stagger */
  gentle?: boolean;
  /** "char" assembles letters; "word" reveals whole words (supporting copy) */
  level?: "char" | "word";
  /**
   * Exit style — "deassemble" separates every character outward (legacy),
   * "block" fades the whole text as one quiet block (opacity + tiny lift,
   * no per-character stagger). Signature headlines keep expressive
   * character entrances but should exit with "block": enter with
   * personality, leave with restraint.
   */
  exit?: "deassemble" | "block";
}

/**
 * Deterministic per-character displacement — composed, never random.
 * Cycles small directional nudges (left / down / right / up) with
 * alternating ±2deg rotation so every reload resolves identically.
 */
const CHAR_DIRS = [
  { x: -10, y: 6 },
  { x: 5, y: 14 },
  { x: 11, y: -5 },
  { x: -6, y: -11 },
] as const;

const CHAR_ROTS = [-1.5, 1, 1.75, -1.75] as const;

interface BuiltWord {
  key: string;
  chars: {
    ch: string;
    x: number;
    y: number;
    rot: number;
    /** -1 (word start) … 1 (word end); drives exit separation */
    cx: number;
    delay: number;
    exitDelay: number;
  }[];
  serif: boolean;
  className?: string;
}

function buildWords(
  segments: AnimatedTextSegment[],
  gentle: boolean,
  level: "char" | "word",
  baseDelay: number,
): BuiltWord[] {
  const scale = gentle ? 0.65 : 1;
  const stagger =
    level === "word"
      ? MOTION.word.stagger
      : gentle
        ? MOTION.char.gentleStagger
        : MOTION.char.stagger;
  // Exit runs slightly faster with tighter stagger than the entrance.
  const exitStagger = stagger * MOTION.exit.staggerScale;
  let charIndex = 0;
  let wordOrdinal = 0;
  const words: BuiltWord[] = [];

  segments.forEach((segment, segmentIndex) => {
    // Split on spaces; spaces render as plain text nodes between words
    // so wrapping still breaks between words, never mid-word.
    const parts = segment.text.split(" ");
    parts.forEach((part, partIndex) => {
      if (part.length === 0) return;
      // Word-level motion shares one delay per word; character motion
      // steps every character. Both deterministic — never random.
      const wordDelay =
        level === "word" ? baseDelay + wordOrdinal * stagger : baseDelay;
      const chars = part.split("").map((ch, posInPart) => {
        const slot = charIndex % CHAR_DIRS.length;
        const dir = CHAR_DIRS[slot]!;
        const cx =
          part.length > 1
            ? (posInPart - (part.length - 1) / 2) / ((part.length - 1) / 2)
            : 0;
        const entry = {
          ch,
          x: level === "word" ? 0 : Math.round(dir.x * scale),
          y: level === "word" ? 0 : Math.round(dir.y * scale),
          rot: level === "word" ? 0 : CHAR_ROTS[slot]!,
          cx: level === "word" ? 0 : cx,
          delay: level === "word" ? wordDelay : baseDelay + charIndex * stagger,
          exitDelay:
            level === "word"
              ? wordOrdinal * exitStagger
              : charIndex * exitStagger,
        };
        charIndex += 1;
        return entry;
      });
      wordOrdinal += 1;
      words.push({
        key: `${segmentIndex}-${partIndex}`,
        chars,
        serif: segment.serif ?? false,
        className: segment.className,
      });
    });
  });

  return words;
}

/**
 * AnimatedText — lightweight word reveals for supporting sections. Hero
 * mount animations retain the richer character assembly.
 *
 * ENTER (micro-assembly): characters start with a small deterministic
 * displacement (±2deg, 0.985 scale, 10–14px offset) and lock into the
 * exact original typography via opacity + transform only (compositor).
 *
 * EXIT (de-assembly, not a reversed replay): characters separate
 * outward from their settled positions with halved mirrored offsets,
 * a slight lift, half rotation and opacity falloff — faster and more
 * restrained than the entrance. Re-entering replays assembly. Pass
 * exit="block" for a quiet whole-block fade instead (hero headlines).
 *
 * Deliberately no filter:blur() — per-character blur is paint per frame
 * × N nodes; opacity + translate + scale is visually cleaner and free.
 *
 * Accessibility: the full text lives on one aria-label; animated
 * characters are hidden from assistive technology.
 */
function AnimatedTextComponent({
  segments,
  className,
  delay = 0,
  mode = "inview",
  start = true,
  gentle = false,
  level = "char",
  exit = "deassemble",
}: AnimatedTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const simpleReveal = mode === "inview";
  // Viewport presence drives both directions: entrance on arrival,
  // de-assembly on departure, re-assembly on return.
  const { ref: presenceRef, state: presenceState } =
    useEnterExit<HTMLSpanElement>(mode === "mount" ? 0.3 : 0.6);

  const normalized: AnimatedTextSegment[] = useMemo(
    () => (typeof segments === "string" ? [{ text: segments }] : segments),
    [segments],
  );

  const fullText = useMemo(
    () => normalized.map((segment) => segment.text).join(" "),
    [normalized],
  );

  const words = useMemo(
    () =>
      buildWords(
        normalized,
        simpleReveal ? true : gentle,
        simpleReveal ? "word" : level,
        delay,
      ),
    [normalized, gentle, level, delay, simpleReveal],
  );

  if (prefersReducedMotion) {
    return (
      <span className={cn(className)} aria-label={fullText}>
        {normalized.map((segment, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={cn(segment.serif && "font-display italic")}
          >
            {segment.text}
            {index < normalized.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    );
  }

  const isWord = simpleReveal || level === "word";
  const duration = isWord ? MOTION.word.duration : MOTION.char.duration;
  const exitDuration = duration * MOTION.exit.durationScale;
  // Block exits ignore per-character stagger entirely: one shared delay
  // (the base) so ~100 nodes never burst at once on scroll-away.
  const quietBlockExit = exit === "block";
  // Slightly deeper rest scale compensates for the removed blur: the
  // assembly still reads as depth (0.985 → 1 + rise) without any paint.
  const restScale = isWord ? 1 : 0.985;

  // State labels propagate parent → characters; values come from each
  // character's custom prop and timing from its explicit transition,
  // so choreography never depends on tree depth. The transition is
  // direction-aware: entrance keeps its stagger, exit runs tighter.
  const container: Variants = { hidden: {}, show: {}, exit: {} };

  interface CharCustom {
    x: number;
    y: number;
    rot: number;
    cx: number;
    s: number;
  }

  const charVariants: Variants = {
    hidden: (custom: CharCustom) => ({
      opacity: 0,
      x: simpleReveal ? 0 : custom.x,
      y: simpleReveal ? 6 : isWord ? MOTION.word.y : custom.y,
      scale: restScale,
      rotate: simpleReveal ? 0 : custom.rot,
    }),
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotate: 0,
    },
    exit: (custom: CharCustom) => ({
      opacity: 0,
      x:
        quietBlockExit || simpleReveal
          ? 0
          : Math.round(custom.x * -0.5 + custom.cx * 6),
      y: quietBlockExit
        ? MOTION.blockExit.y
        : simpleReveal
          ? -4
          : Math.round(custom.y * -0.5 - 7 * custom.s),
      scale: quietBlockExit ? 1 : isWord ? 1 : 0.985,
      rotate: quietBlockExit || simpleReveal ? 0 : custom.rot * -0.5,
    }),
  };

  const target = !start ? "hidden" : presenceState;

  return (
    <m.span
      ref={presenceRef}
      className={cn("inline", className)}
      aria-label={fullText}
      variants={container}
      initial="hidden"
      animate={target}
    >
      <span aria-hidden="true">
        {words.map((word, wordIndex) => (
          <Fragment key={word.key}>
            {wordIndex > 0 ? "\u2009" : null}
            <span className="inline-block whitespace-nowrap">
              {word.chars.map((entry, charIndex) => {
                // Explicit initial object (not the variant label): guarantees
                // the pre-entrance state is painted even when animate already
                // equals "hidden" on mount. Direction labels drive transitions.
                const resting = {
                  opacity: 0,
                  x: simpleReveal ? 0 : entry.x,
                  y: simpleReveal ? 6 : isWord ? MOTION.word.y : entry.y,
                  scale: restScale,
                  rotate: simpleReveal ? 0 : entry.rot,
                };
                return (
                  <m.span
                    key={charIndex}
                    className={cn(
                      "inline-block",
                      word.serif && "font-display italic",
                      word.className,
                    )}
                    variants={charVariants}
                    custom={{
                      x: entry.x,
                      y: entry.y,
                      rot: entry.rot,
                      cx: entry.cx,
                      s: gentle ? 0.65 : 1,
                    }}
                    initial={resting}
                    animate={target}
                    transition={
                      target === "exit"
                        ? {
                            duration: exitDuration,
                            ease: EASING_SIGNATURE,
                            delay: quietBlockExit ? delay : entry.exitDelay,
                          }
                        : {
                            duration,
                            ease: EASING_SIGNATURE,
                            delay: entry.delay,
                          }
                    }
                  >
                    {entry.ch}
                  </m.span>
                );
              })}
            </span>
          </Fragment>
        ))}
      </span>
    </m.span>
  );
}

export const AnimatedText = memo(AnimatedTextComponent);
