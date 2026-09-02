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
import type Snap from "lenis/snap";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  LENIS_EASING,
  observeLenisSnapTargets,
  refreshLenisSnapElements,
  registerLenisSnap,
} from "@/lib/lenis-section-snap";
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

    let instance: Lenis | null = null;
    let snap: Snap | null = null;
    let unobserveSnap: (() => void) | null = null;
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

      const [{ default: LenisCtor }, { default: SnapCtor }] = await Promise.all(
        [import("lenis"), import("lenis/snap")],
      );

      if (cancelled) return;

      instance = new LenisCtor({
        wrapper,
        content,
        duration: 0.95,
        lerp: 0.1,
        easing: LENIS_EASING,
        orientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.15,
        syncTouch: isCoarsePointer,
      });

      snap = new SnapCtor(instance, {
        type: "lock",
        duration: prefersReducedMotion ? 0.28 : 0.82,
        easing: LENIS_EASING,
        debounce: 0,
      });

      registerLenis(instance);
      registerLenisSnap(snap);
      setLenis(instance);

      refreshLenisSnapElements();
      unobserveSnap = observeLenisSnapTargets(content);

      instance.scrollTo(wrapper.scrollTop, { immediate: true });

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
      unobserveSnap?.();
      snap?.destroy();
      instance?.destroy();
      registerLenisSnap(null);
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
