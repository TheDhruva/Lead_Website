/** Smooth exponential ease — cinematic Lenis default. */
export const LENIS_EASING = (t: number) =>
  Math.min(1, 1.001 - Math.pow(2, -10 * t));

/** Soft ease-out for intent-aware section settle — no overshoot. */
export const GUIDANCE_SETTLE_EASING = (t: number) => 1 - Math.pow(1 - t, 2.65);

export const GUIDANCE_VELOCITY_IDLE = 0.045;
export const GUIDANCE_VELOCITY_INTERRUPT = 0.14;

const DESKTOP_COMMIT_RATIO = 0.32;
const MOBILE_COMMIT_RATIO = 0.38;
const DESKTOP_SETTLE_DURATION = 0.62;
const MOBILE_SETTLE_DURATION = 0.55;
const NAV_SETTLE_DURATION_DESKTOP = 0.85;
const NAV_SETTLE_DURATION_MOBILE = 0.72;

/** Prevents wheel tail from triggering another section transition. */
export const POST_SETTLE_COOLDOWN_MS = 420;

/** Velocity must stay below idle for this long before a new gesture can start. */
export const GUIDANCE_IDLE_STREAK_MS = 140;

/** Minimum gesture drift before a programmatic settle is allowed. */
export const GUIDANCE_MIN_SETTLE_DRIFT_RATIO = 0.18;

export function getIntentCommitRatio(isCoarsePointer: boolean): number {
  return isCoarsePointer ? MOBILE_COMMIT_RATIO : DESKTOP_COMMIT_RATIO;
}

export function getGuidanceSettleDuration(isCoarsePointer: boolean): number {
  return isCoarsePointer ? MOBILE_SETTLE_DURATION : DESKTOP_SETTLE_DURATION;
}

export function getNavSettleDuration(isCoarsePointer: boolean): number {
  return isCoarsePointer
    ? NAV_SETTLE_DURATION_MOBILE
    : NAV_SETTLE_DURATION_DESKTOP;
}

export function getLenisOptions(isCoarsePointer: boolean) {
  return {
    duration: isCoarsePointer ? 0.85 : 0.8,
    lerp: isCoarsePointer ? 0.105 : 0.12,
    easing: LENIS_EASING,
    orientation: "vertical" as const,
    smoothWheel: true,
    wheelMultiplier: isCoarsePointer ? 0.92 : 0.96,
    touchMultiplier: isCoarsePointer ? 1.02 : 1,
    syncTouch: isCoarsePointer,
  };
}
