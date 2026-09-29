"use client";

export interface PointerFrame {
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  /** Normalized -1…1 from viewport center */
  nx: number;
  ny: number;
  active: boolean;
  velocityX: number;
  velocityY: number;
  dt: number;
  /** Last event target under the pointer (for cursor mode, etc.) */
  target: EventTarget | null;
}

export type PointerSubscriber = (frame: PointerFrame) => void;

const DEFAULT_EASE = 0.18;
/** Frame-rate-independent stiffness matching ~0.18/frame at 60Hz. */
const DEFAULT_STIFFNESS = 12;
/** Sleep the RAF after the pointer settles this many consecutive frames. */
const SETTLE_FRAMES = 20;
/** Considered settled when both axes are within this distance (px). */
const SETTLE_PX = 0.1;

class PointerEngine {
  private subscribers = new Set<PointerSubscriber>();
  private rafId: number | null = null;
  private bound = false;
  private enabled = false;
  private settledFrames = 0;

  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;
  private prevCurrentX = 0;
  private prevCurrentY = 0;
  private active = false;
  private lastTarget: EventTarget | null = null;
  private lastTime = 0;

  private onMove = (event: PointerEvent) => {
    this.targetX = event.clientX;
    this.targetY = event.clientY;
    this.lastTarget = event.target;
    this.active = true;
    this.settledFrames = 0;
    this.wake();
  };

  private onLeave = () => {
    this.active = false;
    this.lastTarget = null;
  };

  private scrollPaused = false;

  setScrollPaused(paused: boolean) {
    if (this.scrollPaused === paused) return;
    this.scrollPaused = paused;

    if (paused) {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      return;
    }

    if (this.enabled && this.subscribers.size > 0 && this.rafId === null) {
      this.wake();
    }
  }

  /** Start the RAF loop on demand (pointer moved, subscriber added, scroll resumed). */
  private wake(): void {
    if (!this.enabled || this.subscribers.size === 0 || this.bound === false) {
      // Listeners not bound yet — ensureRunning binds + starts.
      this.ensureRunning();
      return;
    }
    if (this.scrollPaused || this.rafId !== null) return;
    this.lastTime = performance.now();
    this.settledFrames = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  isScrollPaused(): boolean {
    return this.scrollPaused;
  }

  setEnabled(next: boolean) {
    if (this.enabled === next) return;
    this.enabled = next;
    if (next) {
      this.ensureRunning();
    } else {
      this.stop();
    }
  }

  subscribe(callback: PointerSubscriber): () => void {
    this.subscribers.add(callback);
    this.ensureRunning();
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.stop();
      }
    };
  }

  private ensureRunning() {
    if (!this.enabled || this.bound || this.subscribers.size === 0) return;

    this.bound = true;
    this.targetX = window.innerWidth / 2;
    this.targetY = window.innerHeight / 2;
    this.currentX = this.targetX;
    this.currentY = this.targetY;
    this.lastTime = performance.now();

    window.addEventListener("pointermove", this.onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onLeave);
    this.rafId = requestAnimationFrame(this.tick);
  }

  private stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.bound) {
      window.removeEventListener("pointermove", this.onMove);
      document.documentElement.removeEventListener(
        "pointerleave",
        this.onLeave,
      );
      this.bound = false;
    }
    this.active = false;
    this.lastTarget = null;
  }

  private tick = (time: number) => {
    if (!this.enabled || this.subscribers.size === 0) {
      this.stop();
      return;
    }

    if (this.scrollPaused) {
      this.rafId = null;
      return;
    }

    const dt = Math.min(50, Math.max(1, time - this.lastTime || 16));
    this.lastTime = time;

    // Delta-time-corrected smoothing — identical settle time at 60/120Hz.
    const alpha = dtAlpha(dt, DEFAULT_STIFFNESS);
    this.currentX += (this.targetX - this.currentX) * alpha;
    this.currentY += (this.targetY - this.currentY) * alpha;

    const frame = this.buildFrame(dt);
    this.subscribers.forEach((cb) => cb(frame));

    this.prevCurrentX = this.currentX;
    this.prevCurrentY = this.currentY;

    // Sleep when settled so no permanent RAF loop competes for frames.
    const dx = Math.abs(this.targetX - this.currentX);
    const dy = Math.abs(this.targetY - this.currentY);
    if (dx < SETTLE_PX && dy < SETTLE_PX) {
      this.settledFrames += 1;
      if (this.settledFrames >= SETTLE_FRAMES) {
        this.rafId = null;
        this.settledFrames = 0;
        return;
      }
    } else {
      this.settledFrames = 0;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  private buildFrame(dt: number): PointerFrame {
    const hw = window.innerWidth / 2 || 1;
    const hh = window.innerHeight / 2 || 1;
    const velocityX = (this.currentX - this.prevCurrentX) / (dt / 16);
    const velocityY = (this.currentY - this.prevCurrentY) / (dt / 16);

    return {
      targetX: this.targetX,
      targetY: this.targetY,
      currentX: this.currentX,
      currentY: this.currentY,
      nx: (this.currentX - hw) / hw,
      ny: (this.currentY - hh) / hh,
      active: this.active,
      velocityX,
      velocityY,
      dt,
      target: this.lastTarget,
    };
  }
}

/** Singleton pointer bus — one pointermove + one RAF for all subscribers. */
export const pointerEngine = new PointerEngine();

/**
 * Delta-time smoothing factor for a stiffness-based critically-damped approach.
 * stiffness ≈ 12 matches the legacy 0.18/frame feel at 60Hz, correctly at any Hz.
 */
export function dtAlpha(dtMs: number, stiffness = DEFAULT_STIFFNESS): number {
  const dtSeconds = Math.min(50, Math.max(1, dtMs)) / 1000;
  return 1 - Math.exp(-stiffness * dtSeconds);
}

/**
 * Convert a legacy per-frame ease (tuned at 60Hz) into a frame-rate-independent
 * alpha for the measured dt. Preserves the tuned 60Hz feel on 120Hz displays.
 */
export function frameAlpha(dtMs: number, baseEaseAt60 = DEFAULT_EASE): number {
  const clamped = Math.min(1, Math.max(0, baseEaseAt60));
  const dtRatio = Math.min(50, Math.max(1, dtMs)) / 16.667;
  return 1 - Math.pow(1 - clamped, dtRatio);
}
