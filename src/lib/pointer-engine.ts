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

class PointerEngine {
  private subscribers = new Set<PointerSubscriber>();
  private rafId: number | null = null;
  private bound = false;
  private enabled = false;

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
  };

  private onLeave = () => {
    this.active = false;
    this.lastTarget = null;
  };

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

  getFrame(): PointerFrame {
    return this.buildFrame(16);
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

    const dt = Math.min(32, time - this.lastTime || 16);
    this.lastTime = time;

    this.currentX += (this.targetX - this.currentX) * DEFAULT_EASE;
    this.currentY += (this.targetY - this.currentY) * DEFAULT_EASE;

    const frame = this.buildFrame(dt);
    this.subscribers.forEach((cb) => cb(frame));

    this.prevCurrentX = this.currentX;
    this.prevCurrentY = this.currentY;

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

export function pointerLocalToElement(
  el: HTMLElement,
  x: number,
  y: number,
): { x: number; y: number; nx: number; ny: number; inside: boolean } {
  const rect = el.getBoundingClientRect();
  const lx = x - rect.left;
  const ly = y - rect.top;
  const inside = lx >= 0 && ly >= 0 && lx <= rect.width && ly <= rect.height;
  const nx = rect.width ? (lx / rect.width) * 2 - 1 : 0;
  const ny = rect.height ? (ly / rect.height) * 2 - 1 : 0;
  return { x: lx, y: ly, nx, ny, inside };
}

export function lerp(current: number, target: number, ease: number): number {
  return current + (target - current) * ease;
}
