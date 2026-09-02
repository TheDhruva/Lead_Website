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
import { LENIS_EASING, getLenisOptions } from "@/lib/lenis-config";
import { SCROLL_CONTAINER_ID, registerLenis } from "@/lib/scroll-container";
import {
  type ScrollDirection,
  publishScrollMotion,
} from "@/lib/scroll-motion-engine";
import { useTheatreIntro } from "@/providers/theatre-intro-provider";

export { LENIS_EASING };

const LenisContext = createContext<Lenis | null>(null);

export function useLenisContext() {
  return useContext(LenisContext);
}

interface SmoothScrollProviderProps {
  children: ReactNode;
}

const MAIN_CONTENT_ID = "main-content";
const LENIS_IDLE_FRAMES = 90;

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const prefersReducedMotion = useReducedMotion();
  const { hasEntered } = useTheatreIntro();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const idleFramesRef = useRef(0);
  const instanceRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion || !hasEntered) return;

    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

    let cancelled = false;
    let retryId = 0;
    let wrapperEl: HTMLElement | null = null;

    function rafLoop(time: number) {
      const lenisInstance = instanceRef.current;
      if (!lenisInstance) {
        rafIdRef.current = null;
        return;
      }

      lenisInstance.raf(time);

      const velocity = Math.abs(lenisInstance.velocity ?? 0);
      if (velocity > 0.02) {
        idleFramesRef.current = 0;
      } else {
        idleFramesRef.current += 1;
      }

      if (idleFramesRef.current >= LENIS_IDLE_FRAMES) {
        rafIdRef.current = null;
        idleFramesRef.current = 0;
        return;
      }

      rafIdRef.current = requestAnimationFrame(rafLoop);
    }

    const resumeRaf = () => {
      if (rafIdRef.current !== null || !instanceRef.current) return;
      idleFramesRef.current = 0;
      rafIdRef.current = requestAnimationFrame(rafLoop);
    };

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

      const { default: LenisCtor } = await import("lenis");
      if (cancelled) return;

      const instance = new LenisCtor({
        wrapper,
        content,
        ...getLenisOptions(isCoarsePointer),
      });

      instanceRef.current = instance;

      instance.on(
        "scroll",
        (event: {
          scroll: number;
          velocity: number;
          direction: number;
          limit: number;
        }) => {
          publishScrollMotion({
            scroll: event.scroll,
            velocity: event.velocity,
            direction: (event.direction ?? 0) as ScrollDirection,
            limit: event.limit,
            progress: event.limit > 0 ? event.scroll / event.limit : 0,
          });
        },
      );

      registerLenis(instance);
      setLenis(instance);

      instance.scrollTo(wrapper.scrollTop, { immediate: true });
      publishScrollMotion({
        scroll: instance.scroll,
        velocity: 0,
        direction: 0,
        limit: instance.limit,
        progress: instance.limit > 0 ? instance.scroll / instance.limit : 0,
      });

      wrapperEl = wrapper;
      wrapper.addEventListener("wheel", resumeRaf, { passive: true });
      wrapper.addEventListener("touchstart", resumeRaf, { passive: true });
      wrapper.addEventListener("scroll", resumeRaf, { passive: true });

      rafIdRef.current = requestAnimationFrame(rafLoop);
    }

    void initLenis();

    return () => {
      cancelled = true;
      if (retryId) window.cancelAnimationFrame(retryId);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      const wrapper = wrapperEl ?? document.getElementById(SCROLL_CONTAINER_ID);
      if (wrapper) {
        wrapper.removeEventListener("wheel", resumeRaf);
        wrapper.removeEventListener("touchstart", resumeRaf);
        wrapper.removeEventListener("scroll", resumeRaf);
      }

      instanceRef.current?.destroy();
      instanceRef.current = null;
      registerLenis(null);
      setLenis(null);
      publishScrollMotion({
        scroll: 0,
        velocity: 0,
        direction: 0,
        limit: 0,
        progress: 0,
      });
    };
  }, [prefersReducedMotion, hasEntered]);

  useEffect(() => {
    if (lenis || prefersReducedMotion || !hasEntered) return;

    const container = document.getElementById(SCROLL_CONTAINER_ID);
    if (!container) return;

    const onNativeScroll = () => {
      const scroll = container.scrollTop;
      const limit = Math.max(
        0,
        container.scrollHeight - container.clientHeight,
      );
      publishScrollMotion({
        scroll,
        velocity: 0,
        direction: 0,
        limit,
        progress: limit > 0 ? scroll / limit : 0,
      });
    };

    container.addEventListener("scroll", onNativeScroll, { passive: true });
    onNativeScroll();

    return () => {
      container.removeEventListener("scroll", onNativeScroll);
    };
  }, [lenis, prefersReducedMotion, hasEntered]);

  return (
    <LenisContext.Provider value={prefersReducedMotion ? null : lenis}>
      {children}
    </LenisContext.Provider>
  );
}
