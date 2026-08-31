"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import type Lenis from "lenis";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SCROLL_CONTAINER_ID, registerLenis } from "@/lib/scroll-container";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

const LenisContext = createContext<Lenis | null>(null);

export function useLenisContext() {
  return useContext(LenisContext);
}

interface SmoothScrollProviderProps {
  children: ReactNode;
}

const MAIN_CONTENT_ID = "main-content";

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const prefersReducedMotion = useReducedMotion();
  const { hasEntered } = useTheatreIntro();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion || !hasEntered) return;

    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarsePointer) return;

    let instance: Lenis | null = null;
    let cancelled = false;
    let retryId = 0;

    async function initLenis() {
      const wrapper = document.getElementById(SCROLL_CONTAINER_ID);
      const content = document.getElementById(MAIN_CONTENT_ID);

      if (!wrapper || !content) {
        if (!cancelled) {
          retryId = window.requestAnimationFrame(() => {
            void initLenis();
          });
        }
        return;
      }

      const LenisCtor = (await import("lenis")).default;
      if (cancelled) return;

      instance = new LenisCtor({
        wrapper,
        content,
        duration: 1.05,
        lerp: 0.085,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 0.82,
        touchMultiplier: 1.35,
        syncTouch: false,
      });

      registerLenis(instance);
      setLenis(instance);

      function raf(time: number) {
        instance?.raf(time);
        rafIdRef.current = requestAnimationFrame(raf);
      }

      rafIdRef.current = requestAnimationFrame(raf);
    }

    void initLenis();

    return () => {
      cancelled = true;
      if (retryId) window.cancelAnimationFrame(retryId);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      instance?.destroy();
      registerLenis(null);
      setLenis(null);
    };
  }, [prefersReducedMotion, hasEntered]);

  return (
    <LenisContext.Provider value={prefersReducedMotion ? null : lenis}>
      {children}
    </LenisContext.Provider>
  );
}
