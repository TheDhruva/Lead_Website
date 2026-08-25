export interface InkPoint {
  x: number;
  y: number;
  t: number;
  width: number;
}

export interface InkStroke {
  id: number;
  points: InkPoint[];
  length: number;
  color: string;
  createdAt: number;
  /** null = permanent until erased */
  lifetimeMs: number | null;
}

export type InkLifetimeId = "1s" | "5s" | "25s" | "60s" | "forever";
export type InkBrushSizeId = "fine" | "medium" | "bold" | "wide";

export const INK_LIFETIME_OPTIONS: ReadonlyArray<{
  id: InkLifetimeId;
  label: string;
  ms: number | null;
}> = [
  { id: "1s", label: "1s", ms: 1_000 },
  { id: "5s", label: "5s", ms: 5_000 },
  { id: "25s", label: "25s", ms: 25_000 },
  { id: "60s", label: "60s", ms: 60_000 },
  { id: "forever", label: "∞", ms: null },
];

export const INK_BRUSH_SIZES: ReadonlyArray<{
  id: InkBrushSizeId;
  label: string;
  scale: number;
  preview: number;
}> = [
  { id: "fine", label: "Fine", scale: 0.55, preview: 4 },
  { id: "medium", label: "Medium", scale: 1, preview: 7 },
  { id: "bold", label: "Bold", scale: 1.75, preview: 11 },
  { id: "wide", label: "Wide", scale: 2.85, preview: 16 },
];

/** Film-stock palette — works on light paper and dark stage */
export const INK_COLORS = [
  {
    id: "ink",
    label: "Ink",
    light: "rgba(26, 26, 27, 0.88)",
    dark: "rgba(243, 243, 242, 0.92)",
  },
  {
    id: "crimson",
    label: "Crimson",
    light: "rgba(168, 42, 48, 0.9)",
    dark: "rgba(232, 92, 98, 0.9)",
  },
  {
    id: "amber",
    label: "Amber",
    light: "rgba(176, 112, 28, 0.9)",
    dark: "rgba(232, 176, 72, 0.9)",
  },
  {
    id: "teal",
    label: "Teal",
    light: "rgba(28, 110, 108, 0.9)",
    dark: "rgba(96, 196, 188, 0.88)",
  },
  {
    id: "slate",
    label: "Slate",
    light: "rgba(72, 84, 96, 0.88)",
    dark: "rgba(164, 176, 188, 0.9)",
  },
  {
    id: "bone",
    label: "Bone",
    light: "rgba(214, 204, 184, 0.95)",
    dark: "rgba(236, 228, 212, 0.85)",
  },
] as const;

export type InkColorId = (typeof INK_COLORS)[number]["id"];

/** Ink travel (px) on the title card before the intro opens */
export const INK_EXIT_DISTANCE_PX = 320;
export const INK_TAP_MOVE_PX = 12;
export const INK_TAP_MS = 240;
export const INK_MIN_POINT_GAP_PX = 0.65;

export function resolveInkColor(colorId: InkColorId, isDark: boolean): string {
  const swatch =
    INK_COLORS.find((color) => color.id === colorId) ?? INK_COLORS[0];
  return isDark ? swatch.dark : swatch.light;
}

export function brushScale(sizeId: InkBrushSizeId): number {
  return INK_BRUSH_SIZES.find((size) => size.id === sizeId)?.scale ?? 1;
}

export function lifetimeMs(id: InkLifetimeId): number | null {
  return INK_LIFETIME_OPTIONS.find((option) => option.id === id)?.ms ?? 1_000;
}

export function pointerWidth(
  pointerType: string,
  pressure: number,
  speed: number,
  sizeScale = 1,
): number {
  const isPen = pointerType === "pen";
  const isTouch = pointerType === "touch";
  const min = (isTouch ? 2.5 : isPen ? 1.05 : 1.35) * sizeScale;
  const max = (isTouch ? 7.4 : isPen ? 6 : 4.5) * sizeScale;

  if (isPen && pressure > 0) {
    return min + (max - min) * Math.min(1, Math.max(0.1, pressure));
  }

  const t = Math.min(1, speed / 1.35);
  return max - (max - min) * t;
}

export function pointFromEvent(
  event: PointerEvent,
  prev: InkPoint | null,
  sizeScale = 1,
): InkPoint {
  const x = event.clientX;
  const y = event.clientY;
  const t = performance.now();
  let speed = 0.25;

  if (prev) {
    const dist = Math.hypot(x - prev.x, y - prev.y);
    const dt = Math.max(8, t - prev.t);
    speed = dist / dt;
  }

  const raw = pointerWidth(event.pointerType, event.pressure, speed, sizeScale);
  const width = prev ? prev.width * 0.58 + raw * 0.42 : raw;

  return { x, y, t, width };
}

export function strokeLength(points: InkPoint[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]!;
    const next = points[i]!;
    length += Math.hypot(next.x - prev.x, next.y - prev.y);
  }
  return length;
}

function fract(n: number) {
  return n - Math.floor(n);
}

function hash(n: number) {
  return fract(Math.sin(n * 127.1) * 43758.5453);
}

/** Point fades by its own age so the trail evaporates from behind while drawing. */
export function pointOpacity(
  pointT: number,
  now: number,
  life: number | null,
): number {
  if (life === null) return 1;
  const age = now - pointT;
  if (age <= 0) return 1;
  if (age >= life) return 0;
  const t = age / life;
  // Soft hold, then dissolve — head stays bright, tail vanishes
  if (t < 0.22) return 1;
  const fade = (t - 0.22) / 0.78;
  return Math.max(0, 1 - fade * fade);
}

export function trimExpiredPoints(
  points: InkPoint[],
  now: number,
  life: number | null,
): InkPoint[] {
  if (life === null) return points;
  return points.filter((point) => now - point.t < life);
}

export function strokeStillVisible(
  stroke: InkStroke,
  now = performance.now(),
): boolean {
  if (stroke.lifetimeMs === null) return stroke.points.length > 0;
  if (stroke.points.length === 0) return false;
  const newest = stroke.points[stroke.points.length - 1]!;
  return now - newest.t < stroke.lifetimeMs;
}

interface LivePoint {
  x: number;
  y: number;
  width: number;
  opacity: number;
}

/** Soft space drift + path-perpendicular wiggle + breath on width. */
function livingPoint(
  point: InkPoint,
  index: number,
  strokeId: number,
  now: number,
  life: number | null,
  prev: InkPoint | null,
  next: InkPoint | null,
): LivePoint {
  const time = now * 0.001;
  const seed = strokeId * 19.17 + index * 2.31;
  const phase = hash(seed) * Math.PI * 2;
  // Shorter holds feel more energetic in space
  const energy =
    life === null ? 1 : life <= 1000 ? 1.55 : life <= 5000 ? 1.25 : 1;

  const amp = (1.15 + hash(seed + 4.2) * 2.1) * energy;
  const driftX =
    Math.sin(time * 1.65 + phase) * amp +
    Math.sin(time * 0.48 + phase * 1.4) * amp * 0.55;
  const driftY =
    Math.cos(time * 1.35 + phase * 0.85) * amp +
    Math.sin(time * 0.62 + phase * 1.1) * amp * 0.5;

  let nx = 0;
  let ny = 0;
  if (prev || next) {
    const a = prev ?? point;
    const b = next ?? point;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    nx = -dy / len;
    ny = dx / len;
  }

  const wiggle =
    Math.sin(time * 2.35 + phase * 1.2 + index * 0.08) * amp * 0.85;
  const expand = 1 + Math.sin(time * 1.55 + phase) * 0.14 * energy;
  const opacity = pointOpacity(point.t, now, life);

  return {
    x: point.x + driftX * 0.42 + nx * wiggle,
    y: point.y + driftY * 0.42 + ny * wiggle,
    width: point.width * expand,
    opacity,
  };
}

export function drawLivingStroke(
  ctx: CanvasRenderingContext2D,
  points: InkPoint[],
  color: string,
  strokeId: number,
  life: number | null,
  now: number,
): void {
  if (points.length === 0) return;

  const live = points.map((point, index) =>
    livingPoint(
      point,
      index,
      strokeId,
      now,
      life,
      points[index - 1] ?? null,
      points[index + 1] ?? null,
    ),
  );

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (live.length === 1) {
    const point = live[0]!;
    if (point.opacity <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = point.opacity;
    ctx.beginPath();
    ctx.arc(point.x, point.y, Math.max(0.7, point.width / 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  for (let i = 1; i < live.length; i += 1) {
    const from = live[i - 1]!;
    const to = live[i]!;
    const via = live[i - 2];
    const opacity = Math.min(from.opacity, to.opacity);
    if (opacity <= 0.01) continue;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.lineWidth = (from.width + to.width) / 2;

    if (!via) {
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
    } else {
      ctx.moveTo((via.x + from.x) / 2, (via.y + from.y) / 2);
      ctx.quadraticCurveTo(
        from.x,
        from.y,
        (from.x + to.x) / 2,
        (from.y + to.y) / 2,
      );
    }

    ctx.stroke();
    ctx.restore();
  }

  const last = live[live.length - 1]!;
  const prev = live[live.length - 2]!;
  if (last.opacity > 0.01) {
    ctx.save();
    ctx.globalAlpha = last.opacity;
    ctx.beginPath();
    ctx.lineWidth = last.width;
    ctx.moveTo((prev.x + last.x) / 2, (prev.y + last.y) / 2);
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  }
}

export function paintStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: InkStroke[],
  cssWidth: number,
  cssHeight: number,
  dpr: number,
  now = performance.now(),
  active?: {
    id: number;
    points: InkPoint[];
    color: string;
    lifetimeMs: number | null;
  } | null,
): void {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  for (const stroke of strokes) {
    const points = trimExpiredPoints(stroke.points, now, stroke.lifetimeMs);
    if (points.length === 0) continue;
    drawLivingStroke(
      ctx,
      points,
      stroke.color,
      stroke.id,
      stroke.lifetimeMs,
      now,
    );
  }

  if (active && active.points.length > 0) {
    const points = trimExpiredPoints(active.points, now, active.lifetimeMs);
    if (points.length > 0) {
      drawLivingStroke(
        ctx,
        points,
        active.color,
        active.id,
        active.lifetimeMs,
        now,
      );
    }
  }
}

export function pruneExpiredStrokes(
  strokes: InkStroke[],
  now = performance.now(),
): InkStroke[] {
  return strokes
    .map((stroke) => ({
      ...stroke,
      points: trimExpiredPoints(stroke.points, now, stroke.lifetimeMs),
    }))
    .filter((stroke) => strokeStillVisible(stroke, now));
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
