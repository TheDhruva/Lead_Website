"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { AnimatePresence, m } from "framer-motion";
import { Check, Eraser, Undo2 } from "lucide-react";
import { useTheme } from "next-themes";

import { InkCatIcon } from "@/components/ui/ink-cat-icon";
import { MOTION } from "@/constants";
import { useIsMounted } from "@/hooks/use-lenis";
import {
  INK_BRUSH_SIZES,
  INK_COLORS,
  INK_EXIT_DISTANCE_PX,
  INK_LIFETIME_OPTIONS,
  INK_MIN_POINT_GAP_PX,
  INK_TAP_MOVE_PX,
  type InkPoint,
  type InkStroke,
  brushScale,
  lifetimeMs,
  paintStrokes,
  pointFromEvent,
  resolveInkColor,
  strokeLength,
  trimExpiredPoints,
} from "@/lib/ink";
import { cn } from "@/lib/utils";
import { useInk } from "@/providers/ink-provider";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

let nextStrokeId = 1;

function isToolTarget(target: EventTarget | null) {
  return (
    target instanceof Element && Boolean(target.closest("[data-ink-tools]"))
  );
}

export function InkOverlay() {
  const mounted = useIsMounted();
  const { resolvedTheme } = useTheme();
  const { hasEntered } = useTheatreIntro();
  const {
    isDrawMode,
    setDrawMode,
    hasMarks,
    canUndo,
    capturing,
    version,
    colorId,
    setColorId,
    brushSizeId,
    setBrushSizeId,
    lifetimeId,
    setLifetimeId,
    strokesRef,
    requestEnter,
    commitStroke,
    undo,
    clear,
  } = useInk();

  const isDark = resolvedTheme === "dark";
  const activeColor = resolveInkColor(colorId, isDark);
  const sizeScale = brushScale(brushSizeId);
  const strokeLife = lifetimeMs(lifetimeId);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef(activeColor);
  const sizeScaleRef = useRef(sizeScale);
  const lifetimeRef = useRef(strokeLife);
  const capturingRef = useRef(capturing);
  const hasEnteredRef = useRef(hasEntered);
  const committedLengthRef = useRef(0);
  const activeRef = useRef<{
    id: number;
    pointerId: number;
    points: InkPoint[];
    startedAt: number;
    origin: InkPoint;
    drawing: boolean;
    color: string;
  } | null>(null);
  const animatingRef = useRef(false);

  useLayoutEffect(() => {
    colorRef.current = activeColor;
    sizeScaleRef.current = sizeScale;
    lifetimeRef.current = strokeLife;
    capturingRef.current = capturing;
    hasEnteredRef.current = hasEntered;
  });

  const syncCanvas = useCallback(
    (now = performance.now()) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      const nextWidth = Math.max(1, Math.round(width * dpr));
      const nextHeight = Math.max(1, Math.round(height * dpr));

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const active = activeRef.current;
      const life = hasEnteredRef.current ? lifetimeRef.current : null;

      if (active?.drawing) {
        active.points = trimExpiredPoints(active.points, now, life);
      }

      paintStrokes(
        ctx,
        strokesRef.current,
        width,
        height,
        dpr,
        now,
        active?.drawing
          ? {
              id: active.id,
              points: active.points,
              color: active.color,
              lifetimeMs: life,
            }
          : null,
      );
    },
    [strokesRef],
  );

  const ensureAnimLoop = useCallback(() => {
    if (animatingRef.current) return;
    animatingRef.current = true;

    const loop = () => {
      const hasMarks = strokesRef.current.length > 0;
      const drawing = Boolean(activeRef.current?.drawing);
      if (!hasMarks && !drawing && !capturingRef.current) {
        animatingRef.current = false;
        syncCanvas();
        return;
      }
      syncCanvas();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }, [strokesRef, syncCanvas]);

  useEffect(() => {
    committedLengthRef.current = strokesRef.current.reduce(
      (sum, stroke) => sum + stroke.length,
      0,
    );
    syncCanvas();
    if (strokesRef.current.length > 0 || capturing) {
      ensureAnimLoop();
    }
  }, [version, syncCanvas, strokesRef, capturing, ensureAnimLoop]);

  useEffect(() => {
    const onResize = () => syncCanvas();
    syncCanvas();
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [syncCanvas]);

  const finishStroke = useCallback(
    (event: PointerEvent) => {
      const active = activeRef.current;
      if (!active || active.pointerId !== event.pointerId) return;
      activeRef.current = null;

      const canvas = canvasRef.current;
      if (canvas?.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }

      if (!active.drawing || active.points.length === 0) return;

      const now = performance.now();
      const life = hasEnteredRef.current ? lifetimeRef.current : null;
      const points = trimExpiredPoints(active.points, now, life);
      if (points.length === 0) {
        syncCanvas(now);
        return;
      }

      const length = strokeLength(points);
      const stroke: InkStroke = {
        id: active.id,
        points,
        length,
        color: active.color,
        createdAt: now,
        lifetimeMs: life,
      };
      committedLengthRef.current += length;
      commitStroke(stroke);
      ensureAnimLoop();

      if (
        !hasEnteredRef.current &&
        committedLengthRef.current >= INK_EXIT_DISTANCE_PX
      ) {
        requestEnter();
      }
    },
    [commitStroke, requestEnter, syncCanvas, ensureAnimLoop],
  );

  const appendPoint = useCallback(
    (event: PointerEvent) => {
      const active = activeRef.current;
      if (!active || active.pointerId !== event.pointerId) return;

      const coalesced =
        typeof event.getCoalescedEvents === "function"
          ? event.getCoalescedEvents()
          : [event];

      for (const coalescedEvent of coalesced) {
        const prev =
          active.points[active.points.length - 1] ??
          (active.drawing ? active.origin : null);
        const next = pointFromEvent(coalescedEvent, prev, sizeScaleRef.current);

        if (!active.drawing) {
          const traveled = Math.hypot(
            next.x - active.origin.x,
            next.y - active.origin.y,
          );
          if (traveled < INK_TAP_MOVE_PX) continue;
          active.drawing = true;
          // Fresh timestamp so the trail clock starts with the mark
          active.points.push({ ...active.origin, t: performance.now() });
          ensureAnimLoop();
        }

        const last = active.points[active.points.length - 1];
        if (
          last &&
          Math.hypot(next.x - last.x, next.y - last.y) < INK_MIN_POINT_GAP_PX
        ) {
          continue;
        }

        active.points.push(next);
      }

      if (
        active.drawing &&
        !hasEnteredRef.current &&
        committedLengthRef.current + strokeLength(active.points) >=
          INK_EXIT_DISTANCE_PX
      ) {
        requestEnter();
      }
    },
    [requestEnter, ensureAnimLoop],
  );

  // Intro: draw via window listeners so the title card stays clickable.
  useEffect(() => {
    if (hasEntered) return;

    const onPointerDown = (event: PointerEvent) => {
      if (event.isPrimary === false) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (activeRef.current) return;
      if (isToolTarget(event.target)) return;

      const origin = pointFromEvent(event, null, sizeScaleRef.current);
      activeRef.current = {
        id: nextStrokeId,
        pointerId: event.pointerId,
        points: [],
        startedAt: performance.now(),
        origin,
        drawing: false,
        color: colorRef.current,
      };
      nextStrokeId += 1;
    };

    const onPointerMove = (event: PointerEvent) => {
      appendPoint(event);
    };

    const onPointerUp = (event: PointerEvent) => {
      finishStroke(event);
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      activeRef.current = null;
    };
  }, [hasEntered, finishStroke, appendPoint]);

  // After enter: only capture while draw mode is on.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasEntered) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!capturingRef.current) return;
      if (event.isPrimary === false) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (activeRef.current) return;
      if (isToolTarget(event.target)) return;

      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);

      const origin = pointFromEvent(event, null, sizeScaleRef.current);
      activeRef.current = {
        id: nextStrokeId,
        pointerId: event.pointerId,
        points: [],
        startedAt: performance.now(),
        origin,
        drawing: false,
        color: colorRef.current,
      };
      nextStrokeId += 1;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!capturingRef.current) return;
      appendPoint(event);
      if (activeRef.current) event.preventDefault();
    };

    const onPointerUp = (event: PointerEvent) => {
      finishStroke(event);
    };

    canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
    canvas.addEventListener("pointermove", onPointerMove, { passive: false });
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("lostpointercapture", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("lostpointercapture", onPointerUp);
      activeRef.current = null;
    };
  }, [hasEntered, finishStroke, appendPoint]);

  if (!mounted) return null;

  const tipPreview =
    INK_COLORS.find((color) => color.id === colorId)?.[
      isDark ? "dark" : "light"
    ] ?? activeColor;

  return (
    <div className="ink-root">
      <canvas
        ref={canvasRef}
        className="ink-root__canvas"
        data-capturing={capturing ? "true" : "false"}
        aria-hidden="true"
        onContextMenu={(event) => event.preventDefault()}
      />

      <AnimatePresence>
        {hasEntered ? (
          <m.div
            data-ink-tools
            role="group"
            aria-label="Cinematic ink tools"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.28, ease: MOTION.hover.ease }}
            className="ink-root__tools pointer-events-auto"
          >
            <AnimatePresence initial={false}>
              {isDrawMode ? (
                <m.div
                  key="palette"
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.24, ease: MOTION.hover.ease }}
                  className="ink-palette mb-2 w-[min(18.5rem,calc(100vw-2rem))]"
                >
                  <div className="ink-palette__header">
                    <span>Ink bay</span>
                    <span>Vol. draw</span>
                  </div>

                  <div className="ink-palette__section">
                    <p className="ink-palette__label">Color</p>
                    <div className="flex flex-wrap gap-2">
                      {INK_COLORS.map((color) => {
                        const swatch = isDark ? color.dark : color.light;
                        const selected = colorId === color.id;
                        return (
                          <button
                            key={color.id}
                            type="button"
                            aria-label={color.label}
                            aria-pressed={selected}
                            title={color.label}
                            onClick={() => setColorId(color.id)}
                            className={cn(
                              "ink-swatch",
                              selected && "ink-swatch--active",
                            )}
                            style={{ backgroundColor: swatch }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="ink-palette__section">
                    <p className="ink-palette__label">Brush</p>
                    <div className="flex items-center gap-2">
                      {INK_BRUSH_SIZES.map((size) => {
                        const selected = brushSizeId === size.id;
                        return (
                          <button
                            key={size.id}
                            type="button"
                            aria-label={size.label}
                            aria-pressed={selected}
                            title={size.label}
                            onClick={() => setBrushSizeId(size.id)}
                            className={cn(
                              "ink-size",
                              selected && "ink-size--active",
                            )}
                          >
                            <span
                              className="ink-size__dot"
                              style={{
                                width: size.preview,
                                height: size.preview,
                                backgroundColor: activeColor,
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="ink-palette__section">
                    <p className="ink-palette__label">Hold</p>
                    <div className="flex flex-wrap gap-1.5">
                      {INK_LIFETIME_OPTIONS.map((option) => {
                        const selected = lifetimeId === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setLifetimeId(option.id)}
                            className={cn(
                              "ink-chip",
                              selected && "ink-chip--active",
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="ink-palette__hint">
                      {lifetimeId === "forever"
                        ? "Stays until you erase · soft drift"
                        : `Trail evaporates after ${lifetimeId} · even mid-stroke`}
                    </p>
                  </div>
                </m.div>
              ) : null}
            </AnimatePresence>

            <div className="ink-toolbar">
              <button
                type="button"
                aria-pressed={isDrawMode}
                aria-label={
                  isDrawMode ? "Done drawing" : "Open ink bay. Shortcut D"
                }
                onClick={() => setDrawMode(!isDrawMode)}
                className={cn(
                  "ink-toolbar__toggle",
                  isDrawMode && "ink-toolbar__toggle--active",
                )}
              >
                {isDrawMode ? (
                  <>
                    <Check className="h-5 w-5" strokeWidth={2} />
                    <span>Done</span>
                  </>
                ) : (
                  <InkCatIcon tipColor={tipPreview} />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isDrawMode ? (
                  <m.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: MOTION.hover.ease }}
                    className="flex overflow-hidden"
                  >
                    <button
                      type="button"
                      aria-label="Undo last stroke"
                      disabled={!canUndo}
                      onClick={undo}
                      className="ink-toolbar__icon"
                    >
                      <Undo2 className="h-5 w-5" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      aria-label="Clear all marks"
                      disabled={!hasMarks}
                      onClick={clear}
                      className="ink-toolbar__icon"
                    >
                      <Eraser className="h-5 w-5" strokeWidth={2} />
                    </button>
                  </m.div>
                ) : null}
              </AnimatePresence>
            </div>

            <p
              className={cn(
                "pointer-events-none text-right font-label-md text-[0.58rem] tracking-[0.28em] text-muted-foreground uppercase transition-opacity duration-200",
                isDrawMode ? "opacity-100" : "opacity-0",
              )}
              aria-live="polite"
            >
              {isDrawMode ? "Director’s mark · Esc exits" : "Ink"}
            </p>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
