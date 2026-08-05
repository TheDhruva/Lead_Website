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
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

const LenisContext = createContext<Lenis | null>(null);

export function useLenisContext() {
  return useContext(LenisContext);
}

interface SmoothScrollProviderProps {
  children: ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const prefersReducedMotion = useReducedMotion();
  const { hasEntered } = useTheatreIntro();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarsePointer) return;

    let instance: Lenis | null = null;
    let cancelled = false;

    async function initLenis() {
      const LenisCtor = (await import("lenis")).default;
      if (cancelled) return;

      instance = new LenisCtor({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.4,
        syncTouch: false,
      });

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
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      instance?.destroy();
      setLenis(null);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      document.documentElement.style.overflow = hasEntered ? "" : "hidden";
      return () => {
        document.documentElement.style.overflow = "";
      };
    }

    if (!lenis) {
      document.documentElement.style.overflow = hasEntered ? "" : "hidden";
      return () => {
        document.documentElement.style.overflow = "";
      };
    }

    if (!hasEntered) {
      lenis.stop();
      document.documentElement.style.overflow = "hidden";
    } else {
      lenis.start();
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [hasEntered, lenis, prefersReducedMotion]);

  return (
    <LenisContext.Provider value={prefersReducedMotion ? null : lenis}>
      {children}
    </LenisContext.Provider>
  );
}
