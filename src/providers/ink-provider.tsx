"use client";

import {
  type MutableRefObject,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLenis } from "@/hooks/use-lenis";
import {
  type InkBrushSizeId,
  type InkColorId,
  type InkLifetimeId,
  type InkStroke,
  isTypingTarget,
  pruneExpiredStrokes,
} from "@/lib/ink";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

interface InkContextValue {
  isDrawMode: boolean;
  setDrawMode: (value: boolean) => void;
  hasMarks: boolean;
  canUndo: boolean;
  capturing: boolean;
  version: number;
  colorId: InkColorId;
  setColorId: (value: InkColorId) => void;
  brushSizeId: InkBrushSizeId;
  setBrushSizeId: (value: InkBrushSizeId) => void;
  lifetimeId: InkLifetimeId;
  setLifetimeId: (value: InkLifetimeId) => void;
  strokesRef: MutableRefObject<InkStroke[]>;
  onEnterReady: (handler: () => void) => () => void;
  requestEnter: () => void;
  commitStroke: (stroke: InkStroke) => void;
  undo: () => void;
  clear: () => void;
}

const InkContext = createContext<InkContextValue | null>(null);

export function useInk() {
  const ctx = useContext(InkContext);
  if (!ctx) {
    throw new Error("useInk must be used within InkProvider");
  }
  return ctx;
}

interface InkProviderProps {
  children: ReactNode;
}

export function InkProvider({ children }: InkProviderProps) {
  const { hasEntered } = useTheatreIntro();
  const lenis = useLenis();
  const strokesRef = useRef<InkStroke[]>([]);
  const enterLockRef = useRef(false);
  const enterHandlerRef = useRef<(() => void) | null>(null);
  const [isDrawMode, setDrawModeState] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [version, setVersion] = useState(0);
  const [colorId, setColorId] = useState<InkColorId>("ink");
  const [brushSizeId, setBrushSizeId] = useState<InkBrushSizeId>("medium");
  const [lifetimeId, setLifetimeId] = useState<InkLifetimeId>("1s");

  const capturing = hasEntered && isDrawMode;

  const setDrawMode = useCallback((value: boolean) => {
    setDrawModeState(value);
  }, []);

  const onEnterReady = useCallback((handler: () => void) => {
    enterHandlerRef.current = handler;
    return () => {
      if (enterHandlerRef.current === handler) {
        enterHandlerRef.current = null;
      }
    };
  }, []);

  const requestEnter = useCallback(() => {
    if (enterLockRef.current) return;
    const handler = enterHandlerRef.current;
    if (!handler) return;
    enterLockRef.current = true;
    handler();
  }, []);

  const commitStroke = useCallback((stroke: InkStroke) => {
    if (stroke.points.length === 0) return;
    strokesRef.current = [...strokesRef.current, stroke];
    setStrokeCount(strokesRef.current.length);
    setVersion((current) => current + 1);
  }, []);

  const undo = useCallback(() => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokeCount(strokesRef.current.length);
    setVersion((current) => current + 1);
  }, []);

  const clear = useCallback(() => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current = [];
    setStrokeCount(0);
    setVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("ink-drawing", capturing);
    return () => document.documentElement.classList.remove("ink-drawing");
  }, [capturing]);

  useEffect(() => {
    if (!lenis) return;
    if (capturing) {
      lenis.stop();
      return;
    }
    if (hasEntered) {
      lenis.start();
    }
  }, [capturing, hasEntered, lenis]);

  useEffect(() => {
    let frame = 0;
    let running = true;

    const tick = () => {
      if (!running) return;
      const before = strokesRef.current.length;
      const next = pruneExpiredStrokes(strokesRef.current);
      if (next.length !== before) {
        strokesRef.current = next;
        setStrokeCount(next.length);
        setVersion((current) => current + 1);
      }
      frame = window.setTimeout(() => {
        requestAnimationFrame(tick);
      }, 120);
    };

    if (strokeCount > 0) {
      requestAnimationFrame(tick);
    }

    return () => {
      running = false;
      window.clearTimeout(frame);
    };
  }, [strokeCount]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isDrawMode) {
        event.preventDefault();
        setDrawModeState(false);
        return;
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "z" &&
        capturing
      ) {
        event.preventDefault();
        undo();
        return;
      }

      if (
        event.key.toLowerCase() === "d" &&
        hasEntered &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault();
        setDrawModeState((current) => !current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [capturing, hasEntered, isDrawMode, undo]);

  const value = useMemo(
    () => ({
      isDrawMode,
      setDrawMode,
      hasMarks: strokeCount > 0,
      canUndo: strokeCount > 0,
      capturing,
      version,
      colorId,
      setColorId,
      brushSizeId,
      setBrushSizeId,
      lifetimeId,
      setLifetimeId,
      strokesRef,
      onEnterReady,
      requestEnter,
      commitStroke,
      undo,
      clear,
    }),
    [
      isDrawMode,
      setDrawMode,
      strokeCount,
      capturing,
      version,
      colorId,
      brushSizeId,
      lifetimeId,
      onEnterReady,
      requestEnter,
      commitStroke,
      undo,
      clear,
    ],
  );

  return <InkContext.Provider value={value}>{children}</InkContext.Provider>;
}
